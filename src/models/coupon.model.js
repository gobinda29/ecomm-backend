import mongoose, { Schema } from "mongoose";


const couponSchema = new Schema(
    {
        code: {
            type: String,
            required: [true, "please provide a coupon code"]
        },
        discount: {
            type: Number,
            default: 0
        },
        active: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
)


export const Coupon = mongoose.model("Coupon", couponSchema)