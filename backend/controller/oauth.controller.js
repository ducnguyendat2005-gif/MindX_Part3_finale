import axios from 'axios';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import AccountModel from '../model/account.js';

const HANDOFF_TTL_MS = 60 * 1000;
const oauthStates = new Map();
const oauthHandoffs = new Map();

const getBackendUrl = () => process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`;
const getFrontendUrl = () => process.env.FRONTEND_URL || 'http://localhost:5173';
const getRedirectUri = (provider) => `${getBackendUrl()}/auth/${provider}/callback`;

const providerConfig = (provider) => {
    const configs = {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
            tokenUrl: 'https://oauth2.googleapis.com/token',
            scope: 'openid email profile',
        },
        facebook: {
            clientId: process.env.FACEBOOK_APP_ID,
            clientSecret: process.env.FACEBOOK_APP_SECRET,
            graphVersion: process.env.FACEBOOK_GRAPH_VERSION || 'v23.0',
            authorizationUrl: `https://www.facebook.com/${process.env.FACEBOOK_GRAPH_VERSION || 'v23.0'}/dialog/oauth`,
            scope: 'email,public_profile',
        },
        microsoft: {
            clientId: process.env.MICROSOFT_CLIENT_ID,
            clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
            tenant: process.env.MICROSOFT_TENANT || 'common',
            authorizationUrl: `https://login.microsoftonline.com/${process.env.MICROSOFT_TENANT || 'common'}/oauth2/v2.0/authorize`,
            tokenUrl: `https://login.microsoftonline.com/${process.env.MICROSOFT_TENANT || 'common'}/oauth2/v2.0/token`,
            scope: 'openid profile email User.Read',
        },
    };

    return configs[provider];
};

const redirectWithError = (res, message) => {
    const url = new URL('/signin', getFrontendUrl());
    url.searchParams.set('oauthError', message);
    return res.redirect(url.toString());
};

const isConfigured = (config) => Boolean(config?.clientId && config?.clientSecret);

const cleanupExpired = (store) => {
    const now = Date.now();
    for (const [key, value] of store.entries()) {
        if (value.expiresAt <= now) store.delete(key);
    }
};

const exchangeAuthorizationCode = async (provider, code) => {
    const config = providerConfig(provider);
    const redirectUri = getRedirectUri(provider);
    const body = new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
    });

    if (provider === 'facebook') {
        const response = await axios.get(
            `https://graph.facebook.com/${config.graphVersion}/oauth/access_token`,
            { params: Object.fromEntries(body.entries()) },
        );
        return response.data.access_token;
    }

    const response = await axios.post(config.tokenUrl, body.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return response.data.access_token;
};

const fetchProviderProfile = async (provider, accessToken) => {
    const config = providerConfig(provider);

    if (provider === 'google') {
        const response = await axios.get('https://openidconnect.googleapis.com/v1/userinfo', {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        return {
            providerId: response.data.sub,
            email: response.data.email,
            firstName: response.data.given_name,
            lastName: response.data.family_name,
            displayName: response.data.name,
            avatar: response.data.picture,
        };
    }

    if (provider === 'facebook') {
        const response = await axios.get(`https://graph.facebook.com/${config.graphVersion}/me`, {
            params: {
                fields: 'id,name,first_name,last_name,email,picture.type(large)',
                access_token: accessToken,
            },
        });
        return {
            providerId: response.data.id,
            email: response.data.email,
            firstName: response.data.first_name,
            lastName: response.data.last_name,
            displayName: response.data.name,
            avatar: response.data.picture?.data?.url,
        };
    }

    const response = await axios.get('https://graph.microsoft.com/v1.0/me', {
        params: { '$select': 'id,displayName,givenName,surname,mail,userPrincipalName' },
        headers: { Authorization: `Bearer ${accessToken}` },
    });
    return {
        providerId: response.data.id,
        email: response.data.mail || response.data.userPrincipalName,
        firstName: response.data.givenName,
        lastName: response.data.surname,
        displayName: response.data.displayName,
    };
};

const splitDisplayName = (displayName = '') => {
    const parts = displayName.trim().split(/\s+/).filter(Boolean);
    return {
        firstName: parts.shift() || 'User',
        lastName: parts.join(' ') || 'Byway',
    };
};

const createUniqueUsername = async (email, provider, providerId) => {
    const baseSource = email?.split('@')[0] || `${provider}_${providerId.slice(-8)}`;
    const base = baseSource.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 40) || `${provider}user`;
    let username = base;
    let suffix = 1;

    while (await AccountModel.exists({ Username: { $regex: `^${username}$`, $options: 'i' } })) {
        username = `${base.slice(0, 45 - String(suffix).length)}${suffix}`;
        suffix += 1;
    }

    return username;
};

const issueTokens = (account) => {
    const userData = {
        Email: account.Email,
        role: account.role,
        _id: account._id,
        Username: account.Username,
        Fname: account.Fname,
        Lname: account.Lname,
        avatar: account.avatar,
    };

    const ATtoken = jwt.sign(
        { ...userData, type: 'AT' },
        process.env.JWT_SECRET_ACCESS,
        { expiresIn: '1d' },
    );
    const RTtoken = jwt.sign(
        { ...userData, type: 'RT' },
        process.env.JWT_SECRET_REFRESH,
        { expiresIn: '7d' },
    );

    return { ATtoken, RTtoken };
};

const findOrCreateAccount = async (provider, profile) => {
    const email = String(profile.email || '').trim().toLowerCase();
    if (!email) {
        throw new Error('This provider did not return an email address.');
    }

    let account = await AccountModel.findOne({ authProvider: provider, providerId: profile.providerId });
    if (!account) account = await AccountModel.findOne({ Email: email });

    const displayNameParts = splitDisplayName(profile.displayName);
    const firstName = profile.firstName || displayNameParts.firstName;
    const lastName = profile.lastName || displayNameParts.lastName;

    if (!account) {
        const username = await createUniqueUsername(email, provider, String(profile.providerId));
        const randomPassword = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10);
        account = await AccountModel.create({
            Fname: firstName,
            Lname: lastName,
            Username: username,
            Email: email,
            pass: randomPassword,
            authProvider: provider,
            providerId: String(profile.providerId),
            role: 'user',
            ...(profile.avatar ? { avatar: profile.avatar } : {}),
        });
    } else {
        account.authProvider = provider;
        account.providerId = String(profile.providerId);
        if (!account.Fname) account.Fname = firstName;
        if (!account.Lname) account.Lname = lastName;
        if (profile.avatar && !account.avatar) account.avatar = profile.avatar;
        await account.save();
    }

    return account;
};

export const startOAuth = (req, res) => {
    const provider = String(req.params.provider || '').toLowerCase();
    const config = providerConfig(provider);
    if (!config) return res.status(404).json({ success: false, message: 'Unsupported OAuth provider' });
    if (!isConfigured(config)) return redirectWithError(res, `${provider} OAuth is not configured`);

    cleanupExpired(oauthStates);
    const state = crypto.randomBytes(24).toString('hex');
    oauthStates.set(state, { provider, expiresAt: Date.now() + HANDOFF_TTL_MS });

    const authorizationUrl = new URL(config.authorizationUrl);
    authorizationUrl.search = new URLSearchParams({
        client_id: config.clientId,
        redirect_uri: getRedirectUri(provider),
        response_type: 'code',
        scope: config.scope,
        state,
        ...(provider === 'google' ? { access_type: 'online', prompt: 'select_account' } : {}),
    }).toString();

    return res.redirect(authorizationUrl.toString());
};

export const oauthCallback = async (req, res) => {
    const provider = String(req.params.provider || '').toLowerCase();
    const stateData = oauthStates.get(req.query.state);
    oauthStates.delete(req.query.state);

    if (!stateData || stateData.provider !== provider || stateData.expiresAt <= Date.now()) {
        return redirectWithError(res, 'OAuth session expired. Please try again.');
    }
    if (req.query.error) return redirectWithError(res, 'OAuth sign-in was cancelled.');

    try {
        const accessToken = await exchangeAuthorizationCode(provider, req.query.code);
        const profile = await fetchProviderProfile(provider, accessToken);
        const account = await findOrCreateAccount(provider, profile);
        const tokens = issueTokens(account);

        cleanupExpired(oauthHandoffs);
        const handoffCode = crypto.randomBytes(32).toString('hex');
        oauthHandoffs.set(handoffCode, {
            ...tokens,
            expiresAt: Date.now() + HANDOFF_TTL_MS,
        });

        const callbackUrl = new URL('/oauth/callback', getFrontendUrl());
        callbackUrl.searchParams.set('code', handoffCode);
        return res.redirect(callbackUrl.toString());
    } catch (error) {
        console.error(`OAuth ${provider} callback failed:`, error.response?.data || error.message);
        return redirectWithError(res, 'Could not complete social sign-in.');
    }
};

export const exchangeOAuthHandoff = (req, res) => {
    cleanupExpired(oauthHandoffs);
    const code = String(req.body?.code || '');
    const handoff = oauthHandoffs.get(code);
    if (!handoff) return res.status(401).json({ success: false, message: 'OAuth code is invalid or expired' });

    oauthHandoffs.delete(code);
    return res.status(200).json({
        success: true,
        data: { ATtoken: handoff.ATtoken, RTtoken: handoff.RTtoken },
    });
};
