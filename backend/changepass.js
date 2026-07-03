import bcrypt from 'bcrypt'
const saltRounds = 10;

const pass = "ducdat"
const salt = bcrypt.genSaltSync(saltRounds);
const hash = bcrypt.hashSync(pass, salt);

console.log(hash);