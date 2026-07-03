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
        if (checkDuplicateEmail) throw new Error ("email existed please try others")
        next();
        }
        catch(error){
            next(error)
        }
}

export const validateLogin = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) throw new Error("khong co email hay mk");

        const customer = await AccountModel.findOne({ Email:email }).select("pass");
        if (!customer) throw new Error ("email hoac password sai,from middleware with ❤️")

        const isMatch = await bcrypt.compare(password, customer.pass);
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

