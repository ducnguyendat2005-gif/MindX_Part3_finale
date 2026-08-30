import AccountModel from "../model/account.js";
import bcrypt from 'bcrypt';

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const duplicateUsernameMessage = 'User \u0111\u00e3 nh\u1eadp tr\u00f9ng';
const duplicateEmailMessage = 'Email \u0111\u00e3 nh\u1eadp tr\u00f9ng';

const duplicateResponse = (duplicateUsername, duplicateEmail) => ({
    success: false,
    duplicateUsername: Boolean(duplicateUsername),
    duplicateEmail: Boolean(duplicateEmail),
    errors: {
        ...(duplicateUsername ? { Username: duplicateUsernameMessage } : {}),
        ...(duplicateEmail ? { Email: duplicateEmailMessage } : {}),
    },
    message: [
        duplicateUsername ? duplicateUsernameMessage : '',
        duplicateEmail ? duplicateEmailMessage : '',
    ].filter(Boolean).join(' v\u00e0 '),
});

const findDuplicateAccounts = async (username, email) => Promise.all([
    username
        ? AccountModel.exists({ Username: { $regex: `^${escapeRegex(username)}$`, $options: 'i' } })
        : null,
    email
        ? AccountModel.exists({ Email: { $regex: `^${escapeRegex(email)}$`, $options: 'i' } })
        : null,
]);

export const validateReg = async (req, res, next) => {
    try {
        const { Fname, Lname, Username, Email, pass } = req.body;
        const normalizedUsername = String(Username || '').trim();
        const normalizedEmail = String(Email || '').trim();

        switch (true) {
            case !Fname:
                throw new Error('Missing first name');
            case !Lname:
                throw new Error('Missing last name');
            case !normalizedUsername:
                throw new Error('Missing Username');
            case !normalizedEmail:
                throw new Error('Missing Email');
            case !pass:
                throw new Error('Missing password');
        }

        const [duplicateUsername, duplicateEmail] = await findDuplicateAccounts(
            normalizedUsername,
            normalizedEmail,
        );

        if (duplicateUsername || duplicateEmail) {
            return res.status(409).json(
                duplicateResponse(duplicateUsername, duplicateEmail),
            );
        }

        req.body.Username = normalizedUsername;
        req.body.Email = normalizedEmail;
        next();
    } catch (error) {
        next(error);
    }
};

export const validateLogin = async (req, res, next) => {
    try {
        const { identifier, email, password } = req.body;
        const loginIdentifier = (identifier ?? email)?.trim();
        if (!loginIdentifier || !password) throw new Error('khong co username/email hay mk');

        const customer = await AccountModel.findOne({
            $or: [{ Email: loginIdentifier }, { Username: loginIdentifier }],
        }).select('pass isActive');
        if (!customer) {
            const error = new Error('email or username or password is incorrect');
            error.status = 401;
            throw error;
        }

        if (customer.isActive === false) {
            const error = new Error('T\u00e0i kho\u1ea3n \u0111ang t\u1ea1m kh\u00f3a');
            error.status = 403;
            error.code = 'ACCOUNT_SUSPENDED';
            throw error;
        }

        const isMatch = await bcrypt.compare(password, customer.pass);
        if (!isMatch) {
            const error = new Error('email or username or password is incorrect');
            error.status = 401;
            throw error;
        }

        next();
    } catch (error) {
        next(error);
    }
};

export const isAdmin = async (req, res, next) => {
    try {
        const user = req.user;
        if (user.role === 'admin') {
            next();
        } else {
            return res.send('CUT RA NGOAI');
        }
    } catch (error) {
        next(error);
    }
};

export const isTeacher = (req, res, next) => {
    if (req.user?.role !== 'teacher') {
        return res.status(403).json({
            message: 'Ch\u1ec9 gi\u00e1o vi\u00ean m\u1edbi \u0111\u01b0\u1ee3c th\u1ef1c hi\u1ec7n thao t\u00e1c n\u00e0y',
            success: false,
        });
    }
    next();
};

export const checkDuplicateEmail = async (req, res, next) => {
    try {
        const username = String(req.body.Username ?? req.body.username ?? '').trim();
        const email = String(req.body.Email ?? req.body.email ?? '').trim();
        const [duplicateUsername, duplicateEmail] = await findDuplicateAccounts(username, email);

        if (duplicateUsername || duplicateEmail) {
            return res.status(409).json(
                duplicateResponse(duplicateUsername, duplicateEmail),
            );
        }

        res.send({ message: 'notduplicate!', success: true });
    } catch (error) {
        next(error);
    }
};
