const {Wallet}  = require("../models")
const { createAudit } = require("../utils/audit")

exports.creatWallet = async(user,options)=>{
    console.log("rosns",user.dataValues.id)
    const wallet = await Wallet.findOne({
        where:{
            userId:user.id
        }
    });

    if(wallet){
        return wallet;
    }

    const newWallet = await Wallet.create({
        userId:user.id,
        balance:0.0,
        currency: user.defaultCurrency || "USD"
    },options)

return newWallet;
}