import jwt from 'jsonwebtoken';
import AccountModel from '../model/account.js';
import { checkAndDistributeEndedEvents } from '../src/jobs/lazyEventRewardTrigger.js';

export const verifyToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({
                message: 'Access token is required',
                code: 'TOKEN_MISSING',
                success: false,
            });
        }

        const [scheme, token] = authHeader.split(' ');
        if (scheme !== 'Bearer' || !token) {
            return res.status(401).json({
                message: 'Invalid authorization header',
                code: 'TOKEN_INVALID',
                success: false,
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET_ACCESS);
        const account = await AccountModel.findById(decoded._id).select('isActive');
        if (!account) {
            return res.status(401).json({ message: 'Account not found', code: 'ACCOUNT_NOT_FOUND' });
        }
        if (account.isActive === false) {
            return res.status(403).json({ message: 'Account is suspended', code: 'ACCOUNT_SUSPENDED' });
        }
        req.user = decoded;

        // Lazy trigger cho event reward — chạy ngầm trên MỌI request đã xác thực
        // thành công, thay thế node-cron trên Render. Fire-and-forget: không
        // await, không được làm chậm hay làm fail request gốc dù job lỗi.
        checkAndDistributeEndedEvents().catch((err) =>
            console.error('[lazyTrigger] unexpected error from verifyToken:', err)
        );

        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Invalid token', code: 'TOKEN_INVALID' });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token has expired', code: 'TOKEN_EXPIRED' });
        }
        next(error);
    }
};