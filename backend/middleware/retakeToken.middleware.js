import jwt from 'jsonwebtoken'
export const retakeToken = (req,res,next) =>{
    try{
        const authHeader = req.headers.authorization; // "Bearer xxx"
        const RTtoken = authHeader?.split(' ')[1];

        if (!RTtoken) {
            return res.status(401).json({ message: 'Refresh token is required', code: 'TOKEN_MISSING' });
        }

        const decoded = jwt.verify(RTtoken, process.env.JWT_SECRET_REFRESH);
        const { iat, exp, ...userData } = decoded;
        req.user = decoded;
        const ATtoken = jwt.sign({ ...userData, type: 'AT' }, process.env.JWT_SECRET_ACCESS,{ expiresIn: '2h' });
        
        res.status(200).json({ newATtoken: ATtoken,data: decoded, message: 'Token refreshed successfully', success: true });
    }
    catch(error){
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Invalid token', code: 'TOKEN_INVALID' });
        }
        next(error)
    }
}