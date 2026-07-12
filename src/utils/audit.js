const {AuditLog} = require("../models")

const createAudit = async(data)=>{
    
    await AuditLog.create({
        userId:data.userId,
        action:data.action,
        entity:data.entity,
        entityId:data.entityId,
        oldValue:data.oldValue,
        newValue:data.newValue,
        ipAddress:data.ipAddress
    }, {
        transaction:data.transaction
    })
};

module.exports={
    createAudit
};
