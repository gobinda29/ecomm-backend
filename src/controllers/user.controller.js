import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { cookieOptions } from "../constants.js";
import jwt from "jsonwebtoken";
import config from "../config/index.js";
import mailHelper from "../utils/mailHelper.js";
import crypto from "crypto";



const generateAccessAndRefreshToken = async (userId) => {

    try {
        const user = await User.findById(userId)

        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false})


        return { accessToken, refreshToken }

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating referesh and access token")
    }
}



/******************************************************
 * @SIGNUP
 * @route http://localhost:5000/api/v1/user/signup
 * @description User signUp Controller for creating new user
 * @returns User Object
 ******************************************************/

export const signup = asyncHandler(async (req, res) => {

    const { name, email, password } = req.body

    if (!name || !email || !password) {
        throw new ApiError(400, "All fields are required ")
    }


    const existingUser = await User.findOne({email})

    if (existingUser) {
        throw new ApiError(400, "user already exists")
    }


    const user = await User.create({
        name,
        email,
        password
    })

    user.password = undefined


    return res.status(200).json(
        new ApiResponse(200, user, "user registered sucessfully")
    )
    
})



/*********************************************************
 * @LOGIN
 * @route http://localhost:5000/api/v1/user/login
 * @description User Login Controller for signing in the user
 * @returns User Object
 *********************************************************/

export const login = asyncHandler(async (req, res) => {

    const { email, password } = req.body

    if (!email || !password) {
        throw new ApiError(400, "All fields are required ")
    }


    const user = await User.findOne({email}).select("+password")

    if (!user) {
        throw new ApiError(404, "User does not exist")
    }


    const isPasswordCorrect = await user.isPasswordCorrect(password)

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid user credentials")
    }


    const { accessToken, refreshToken } = generateAccessAndRefreshToken(user._id)

    user.password = undefined


    return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
        new ApiResponse(
            200,
            {
                user,
                accessToken,
                refreshToken
            },
            "user logged in sucessfully"
        )
    )

})



/**********************************************************
 * @LOGOUT
 * @route http://localhost:5000/api/v1/user/logout
 * @description User Logout Controller for logging out the user
 * @description Removes token from cookies
 * @returns Success Message with "Logged Out"
 **********************************************************/

export const logout = asyncHandler(async (req, res) => {

    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )


    return res
    .status(200)
    .cookie("accessToken", null, {
        expires: new Date(Date.now()),
        httpOnly: true
    })
    .cookie("refreshToken", null, {
        expires: new Date(Date.now()),
        httpOnly: true
    })
    .json(
        new ApiResponse(200, {}, "user logged out sucessfully")
    )
})



/**********************************************************
 * @REFRESH_ACCESS_TOKEN
 * @route http://localhost:5000/api/v1/user/refresh-access-token
 * @description Controller used for refreshing the access token
 * @description Retrieves the refresh token from cookies or request body, verifies it, and generates a new access token
 * @returns Refreshed access token
 **********************************************************/

export const refreshAccessToken = asyncHandler(async (req, res) => {

    try {

        const incomingrefreshToken = req.cookies.refreshToken || req.body.refreshToken
    
        if (!incomingrefreshToken) {
            throw new ApiError(401, "unauthorized request")
        }
    

        const decodedToken = await jwt.verify(incomingrefreshToken, config.REFRESH_TOKEN_SECRET)


        const user = await User.findById(decodedToken?._id)

        if (!user) {
            throw new ApiError(401, "invalid refresh token")
        }


        if (user?.refreshToken !== incomingrefreshToken) {
            throw new ApiError(401, "refresh token is expired or used")
        }


        const { newAccessToken, newRefreshToken } = await generateAccessAndRefreshToken(user._id)

        user.password = undefined

        return res
        .status(200)
        .cookie("accessToken", newAccessToken, cookieOptions)
        .cookie("refreshToken", newRefreshToken, cookieOptions)
        .json(
            new ApiResponse(
                200,
                {
                    user,
                    accessToken: newAccessToken,
                    refreshToken: newRefreshToken
                },
                "Access token refreshed"
            )
        )

    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }
})



/**********************************************************
 * @GET_PROFILE
 * @route http://localhost:5000/api/v1/user/profile
 * @description check token in cookies, if present then returns user details
 * @returns Logged In User Details
 **********************************************************/

export const getProfile = asyncHandler(async (req, res) => {

    const { user } = req.user

    if (!user) {
        throw new ApiError(401, "User not found")
    }


    return res.status(200).json(
        new ApiResponse(200, user, "getting pofile")
    )
})



/**********************************************************
 * @FORGOT_PASSWORD
 * @route http://localhost:5000/api/v1/user/password/forgot-password
 * @description Controller used for initiating the forgot password process
 * @description Sends an email to the user with a password reset link if the provided email exists
 * @returns ApiResponse with status 200 upon successful initiation of the forgot password process
 **********************************************************/

export const forgotPassword = asyncHandler(async (req, res) => {

    const { email } = req.body

    if (!email) {
        throw new ApiError(401, "Email is required!")
    }


    const user = await User.findOne({email})

    if (!user) {
        throw(404, "user not found")
    }


    const resetForgotPasswordToken = user.generateForgotPasswordToken()

    user.save({validateBeforeSave: false})


    const resetPasswordUrl = `${req.protocol}://${req.get("host")}/api/v1/user/password/reset/${resetForgotPasswordToken}`

    const message = `Your password reset token is as follows \n\n ${resetPasswordUrl} \n\n if this was not requested by you, please ignore.`

    try {
        
        await mailHelper({
        email: user.email,
        subject: "passwword reset mail",
        message
        })

    } catch (error) {
        
        user.forgotPasswordToken = undefined
        user.forgotPasswordTokenExpiry = undefined

        await user.save({validateBeforeSave: false})


        throw new ApiError(500, error?.message || "Email could not be sent")
    }
})



/**********************************************************
 * @RESET_PASSWORD
 * @route http://localhost:5000/api/v1/user/password/reset/:resetToken
 * @description Controller used for resetting the user's password
 * @description Validates the reset token, updates the user's password, and generates new access and refresh tokens
 * @returns ApiResponse with status 200 and the updated user object upon successful password reset
 **********************************************************/

export const resetPassword = asyncHandler(async (req, res) => {

    const { token: resetToken } = req.params
    const { password, confirmPassword } = req.body

    const resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex")


    const user = await User.findOne({
        forgotPasswordToken: resetPasswordToken,
        forgotPasswordTokenExpiry: { $gt: Date.now() }
    })


    if(!user){
        throw new ApiError(400, "password reset token in invalid or expired")
    }


    if (password !== confirmPassword) {
        throw new ApiError(400, "password does not match")
    }


    user.password = password
    user.forgotPasswordToken = undefined
    user.forgotPasswordTokenExpiry = undefined

    await user.save()


    const { accessToken, refreshToken } = generateAccessAndRefreshToken()

    return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
        new ApiResponse(200, user, "Reset password successfully")
    )
})
