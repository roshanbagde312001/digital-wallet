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

     if(data.password.length < 6){
        throw new Error("Password must be at least 6 characters");
    }
}


const validateUpdate = (data)=>{
    if(data.email){
        if(!validator.isEmail(data.email)){
            throw new Error("Please provide a valid email address");
        }
    }

    if(data.password){
        if(data.password.length < 6){
            throw new Error("Password must be at least 6 characters");
        }
    }

    if(!data.name && !data.email && !data.defaultCurrency){
        throw new Error(
            "At least one field is required for update"
        );

    }
}
module.exports={
    validataUserRegisteration,
    validateUpdate
};