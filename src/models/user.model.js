import mongoose, { Schema } from "mongoose";
import authRoles from "../utils/authRoles.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import config from "../config/index.js";
import crypto from "crypto";


const userSchema = new Schema(
    {
        name: {
            type: String,
            required: [true, "Name is reuired"],
            trim: true,
            maxLength: [50, "name must be less than 50 chars"]
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            trim: true
        },
        password: {
            type: String,
            required: [true, "password is required"],
            minLength: [8, "password must be at least 8 chars"],
            select: false
        },
        role: {
            type: String,
            enum: Object.values(authRoles),
            default: authRoles.USER
        },
        refreshToken: String,
        forgotPasswordToken: String,
        forgotPasswordTokenExpiry: Date
    },
    {
        timestamps: true
    }
)


//Encrypt the password before saving: use pre HOOKS
userSchema.pre('save', async function(next) {

    if (!this.isModified("password")) return next()

    this.password = await bcrypt.hash(this.password, 10)
    next()
})



userSchema.methods = {

    //compare password
    isPasswordCorrect: async function(enteredPassword) {
        return await bcrypt.compare(enteredPassword, this.password)
    },
    
    //generate access Token
    generateAccessToken: async function() {
        return await jwt.sign(
            {
                _id: this._id,
                role: this.role
            },
            config.ACCESS_TOKEN_SECRET,
            {
                expiresIn: config.ACCESS_TOKEN_EXPIRY
            }
    
        )
    },
    
    //generate refresh Token
    generateRefreshToken: async function() {
        return await jwt.sign(
            {
                _id: this._id,
            },
            config.REFRESH_TOKEN_SECRET,
            {
                expiresIn: config.REFRESH_TOKEN_EXPIRY
            }
    
        )
    },
    
    //generate forgot password token
    generateForgotPasswordToken: async function() {
        
        const forgotToken = await crypto.randomBytes(20).toString("hex")
    
    
        this.forgotPasswordToken = await crypto
        .createHash("sha256")
        .update(forgotToken)
        .digest("hex")
    
        this.forgotPasswordTokenExpiry = Date.now() + 20 * 60 * 1000
    
    
        return forgotToken
    }
}






export const User = mongoose.model("User", userSchema)