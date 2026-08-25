import jwt from 'jsonwebtoken';
import AccountModel from '../model/account.js';

export const verifyToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({
                message: 'Thiếu access token',
                code: 'TOKEN_MISSING',
                success: false,
            });
        }

        const [scheme, token] = authHeader.split(' ');
        if (scheme !== 'Bearer' || !token) {
            return res.status(401).json({
                message: 'Authorization header không hợp lệ',
                code: 'TOKEN_INVALID',
                success: false,
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET_ACCESS);
        const account = await AccountModel.findById(decoded._id).select('isActive');
        if (!account) {
            return res.status(401).json({ message: 'Tài khoản không tồn tại!', code: 'ACCOUNT_NOT_FOUND' });
        }
        if (account.isActive === false) {
            return res.status(403).json({ message: 'Tài khoản đang tạm khóa', code: 'ACCOUNT_SUSPENDED' });
        }
        req.user = decoded;
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Token không hợp lệ!', code: 'TOKEN_INVALID' });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token hết hạn!', code: 'TOKEN_EXPIRED' });
        }
        next(error);
    }
};
