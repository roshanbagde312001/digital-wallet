const service = require("../services/user.service");

exports.register = async(req,res)=>{
    try{
        const user = await service.createUser(
            req.body,
            req.ip
        );
        res.status(201).json(user);
    }catch(error){
        res.status(400)
        res.status(400).json({
            message:error.message
        });
    }
};