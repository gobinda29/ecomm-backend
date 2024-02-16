import config from "../config/index.js"
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";




const isLoggedIn = asyncHandler(async (req, _res, next) => {

    try {

        let token;

        if (req.cookie?.accessToken 
            || (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) 
            || req.header("Authorization") ) {
                
                token = req.cookie?.accessToken || req.headers.authorization.split(" ")[1] || req.header("Authorization")?.replace("Bearer ", "")
        }

            

        if (!token) {
            throw new ApiError(401, "Unauthorized request")
        }


        const decodedToken = jwt.verify(token, config.ACCESS_TOKEN_SECRET)


        const user = await User.findById(decodedToken._id, "name email role")

        if (!user) {
            throw new ApiError(401, "Invalid access token")
        }


        req.user = user
        next()

    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid access token")
    }
    
})


const authorize = (...requiredRoles) => asyncHandler (async (req, res, next) => {

    if (!requiredRoles.includes(req.user.role)) {
        throw new ApiError(401, "you are not authorize to access this resource")
    }

    next()
})


export { isLoggedIn, authorize }