import jwt from 'jsonwebtoken'
export const retakeToken = (req,res,next) =>{
    try{
        const RTheader = req.headers.rtauthorization;
        const decoded = jwt.verify(RTheader, process.env.JWT_SECRET_REFRESH);
        const { iat, exp, ...userData } = decoded;
        req.user = decoded;
        const ATtoken = jwt.sign({ ...userData, type: 'AT' }, process.env.JWT_SECRET_ACCESS,{ expiresIn: '2h' });
        
        res.status(200).json({ newATtoken: ATtoken,data: decoded, message: 'Lấy token mới thành công!', success: true });
    }
    catch(error){
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Token không hợp lệ!', code: 'TOKEN_INVALID' });
        }
        next(error)
    }
}