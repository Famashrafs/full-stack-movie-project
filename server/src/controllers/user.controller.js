import userModel from "../models/user.model.js"
import jsonwebtoken from "jsonwebtoken"
import responseHandler from "../handlers/response.handler.js"

const signup = async (req, res) => {
    try {
        const {Username, password, displayName} = req.body;

        const checkUser = await userModel.findOne({Username});

        if(checkUser) return responseHandler.badrequest(res, "username already used");

        const user = new userModel()

        user.displayName = displayName;
        user.Username = Username;
        user.setPassword(password);

        await user.save();

        const token = jsonwebtoken.sign(
            {data: user.id},
            process.env.TOKEN_SECRET,
            {expiresIn: "24"}
        );

        responseHandler.created(res, {
            token,
            ...user._doc,
            id: user.id
        });
    } catch {
        responseHandler.error(res)
    }
};

const signin = async (req, res) => {
    try {
        const {Username, password} = req.body

        const user = await userModel.findOne({Username}).select("username password salt id displayName")


        if(!user) return responseHandler.badrequest(res, "User not exist")

        if(!user.validPassword(password)) return responseHandler.badrequest(res," Wrong password")

        const token = jsonwebtoken.sign(
            {data: user.id},
            process.env.TOKEN_SECRET,
            {expiresIn: "24"}
        );

            user.password = undefined;
            user.salt = undefined;

        responseHandler.created(res, {
            token,
            ...user._doc,
            id: user.id
        });
    }   catch {
        responseHandler.error(res)
    }
}
const updatePassword = async (req, res) => {
    try {
    const { password, newPassword } = req.body

    const user = await userModel.findById(req.user.id).select("password id salt");

    if (!user) return responseHandler.unauthorize(res);

    if (!user.validPassword(password)) return responseHandler.badrequest(res,"Wrong password");

    user.setPassword(newPassword);

    await user.save();

    responseHandler.ok(res) ;

    } catch {
        responseHandler.error(res);
    }
};

const getInfo = async (req, res) => {
    try {
        const user = await userModel.findById(req.user.id);

        if (!user) return responseHandler.notfound(res);

        responseHandler.ok(res, user);
    }   catch {
        responseHandler.error(res);
    }
};

export default {
    signup,
    signin,
    getInfo,
    updatePassword
};