import AccountModel from "../model/account.js"
import bcrypt from 'bcrypt'

export const validateReg = async (req,res,next) =>{
    try{
        const {Fname,Lname,Username,Email,pass} = req.body;

        switch (true) {
            case !Fname:
                throw new Error("Missing first name");
            case !Lname:
                throw new Error("Missing last name");
            case !Username:
                throw new Error("Missing Username");
            case !Email:
                throw new Error("Missing Email");
            case !pass:
                throw new Error("Missing password");
            }
        
        const checkDuplicateEmail = await AccountModel.findOne({Email:Email})
        if (checkDuplicateEmail) throw new Error ("Email existed please try others")
        next();
        }
        catch(error){
            next(error)
        }
}

export const validateLogin = async (req, res, next) => {
    try {
        // `identifier` is the value entered at login. It can be either the
        // account username or email; keep `email` as a fallback for old clients.
        const { identifier, email, password } = req.body;
        const loginIdentifier = (identifier ?? email)?.trim();
        if (!loginIdentifier || !password) throw new Error("khong co username/email hay mk");

        const customer = await AccountModel.findOne({
            $or: [{ Email: loginIdentifier }, { Username: loginIdentifier }],
        }).select("pass isActive");
        if (!customer) {
            const error = new Error("email or username or password is incorrect");
            error.status = 401;
            throw error;
        }
        if (!customer) throw new Error ("email hoac password sai,from middleware with ❤️")

        if (customer.isActive === false) {
            const error = new Error("Tài khoản đang tạm khóa");
            error.status = 403;
            error.code = 'ACCOUNT_SUSPENDED';
            throw error;
        }

        const isMatch = await bcrypt.compare(password, customer.pass);
        if (!isMatch) {
            const error = new Error("email or username or password is incorrect");
            error.status = 401;
            throw error;
        }
        if (!isMatch) throw new Error ("email hoac password sai,from middleware with ❤️")

        next();
    } catch (error) {
        next(error);
    }
};

export const isAdmin = async (req,res,next) =>{
    try{
        const user = req.user;
        if (user.role === 'admin'){
            next();
        }
        else {
            return res.send("CUT RA NGOAI")
        }
    }
    catch(error){
        next(error)
    }
}

export const isTeacher = (req, res, next) => {
    if (req.user?.role !== 'teacher') {
        return res.status(403).json({
            message: 'Chỉ giáo viên mới được thực hiện thao tác này',
            success: false,
        });
    }
    next();
};

export const checkDuplicateEmail = async (req,res,next) => {
    try {
        const {email} = req.body;
        const checkDuplicateEmail = await AccountModel.findOne({Email:email})
        if (checkDuplicateEmail) throw new Error ("Email existed please try others")
        res.send({ message: 'notduplicate!', success: true });
    }
    catch(error){
        next(error)
    }
}
