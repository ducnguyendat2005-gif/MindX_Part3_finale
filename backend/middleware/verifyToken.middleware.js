import jwt from 'jsonwebtoken';

export const verifyToken = (req, res, next) => {
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

        req.user = jwt.verify(token, process.env.JWT_SECRET_ACCESS);
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
