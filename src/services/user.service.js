const bcrypt = require("bcrypt")

const { User } = require("../models")


const { createAudit } = require("../utils/audit")


exports.createUser = async (data, ip) => {
    const existingUser = await User.findOne({
        where: {
            email: data.email
        }
    });

    if (existingUser) {
        throw new Error("Email already exists");
    }

    const password = await bcrypt.hash(data.password, 10);

    const user = await User.create({
        name: data.name,
        email: data.email,
        password,
        defaultCurrency: data.defaultCurrency || "USD"
    })

    await createAudit({
        userId: user.id,
        action: "CREATE",
        entity: "USER",
        entityId: user.id,
        newValue: user.toJSON(),
        ipAddress: ip
    });

    return user;
}

exports.updateUser = async (id, data, ip) => {

    const user = await User.findByPk(id);
    if (!user) {
        throw new Error("User not found")
    }

    const oldData = user.toJSON();
    
   let newdata =  await user.update(data)

    await createAudit({
        userId: user.id,
        action: "UPDATE",
        entity: "USER",
        entityId: user.id,
        oldValue: oldData,
        newValue: newdata.toJSON(),
        ipAddress: ip
    })

    return newdata;
}