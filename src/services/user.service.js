const bcrypt = require("bcrypt")

const {User} = require("../models")


const {createAudit} = require("../utils/audit")


exports.createUser = async(data,ip)=>{

    const existingUser = await User.findOne({
        where:{
            email:data.email
        }
    });

    if(existingUser){
        throw new Error("Email already exists");
    }

    const password = await bcrypt.hash(data.password,10);

    const user = await User.create({
        name:data.name,
        email:data.email,
        password,
        defaultCurrency : data.defaultCurrency || "USD"
    })

    await createAudit({
        userId:user.id,
        action:"CREATE",
        entity:"USER",
        entityId:user.id,
        newValue:{
        name:user.name,
        email:user.email
        },
        ipAddress:ip
        });

        return user;
}