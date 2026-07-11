const validator = require('validator');

const validataUserRegisteration= (data)=>{

    if(!data.name){
        throw new Error("Name is required");
    }

    if(!data.email){
        throw new Error("Email is required");
    }

    if(!data.password){
        throw new Error("Password is required");
    }

    if(!validator.isEmail(data.email)){
        throw new Error("Please provide a valid email address");
    }
}

module.exports={
    validateRegister,
};