const service = require("../services/user.service");
const { validataUserRegisteration, validateUpdate } = require("../validations/user.validation");

exports.register = async (req, res) => {
    try {
        validataUserRegisteration(req.body);
        const user = await service.createUser(
            req.body,
            req.ip
        );
        res.status(201).json(user);
    } catch (error) {
        res.status(400)
        res.status(400).json({
            message: error.message
        });
    }
};

exports.updateUser = async (req, res) => {
    try {
        validateUpdate(req.body)

        const usersupdat = await service.updateUser(req.params.id,
            req.body,
            req.ip
        )
        res.status(200).json(usersupdat)
    } catch (error) {
        res.status(400)
        res.status(400).json({
            message: error.message
        });
    }
}

exports.getProfile = async (req, res) => {
    try {
        const userDetails = await service.getUserById(
            req.params.id
        )

        res.status(200).json(userDetails)
    } catch (error) {
        res.status(400)
        res.status(400).json({
            message: error.message
        });
    }
}


exports.getAllUser = async (req, res) => {
    try {
        const userData = await service.getAllUser()
        res.status(200).json(userData)
    } catch (error) {
        res.status(400)
        res.status(400).json({
            message: error.message
        });
    }
}


exports.login = async (req, res) => {
    console.log(req.body)
    try {
        const result = await service.login(req.body, req.ip);
        res.status(200).json(result)
    } catch (error) {
        res.status(401).json({
            message: error.message
        });

    }
}