import { Coupon } from "../models/coupon.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";



/**********************************************************
 * @CREATE_COUPON
 * @route https://localhost:5000/api/v1/coupon
 * @description Controller used for creating a new coupon
 * @description Only admin and Moderator can create the coupon
 * @returns Coupon Object with success message "Coupon Created SuccessFully"
 *********************************************************/

export const createCoupon = asyncHandler(async (req, res) => {

    const { code, discount } = req.body

    if (!code || !discount) {
        throw new ApiError(400, "code & discount are required!")
    }


    const existedCoupon = await Coupon.find({
        code,
        discount
    })

    if (existedCoupon) {
        throw new ApiError(400, "coupon already exists")
    }


    const coupon = await Coupon.create({
        code, 
        discount
    })

    if (!coupon) {
        throw new ApiError(401, "Failed to create coupon")
    }


    return res.status(200).json(
        new ApiResponse(200, coupon, "coupon created successfully")
    )
})



/**********************************************************
 * @UPDATE_COUPON
 * @route https://localhost:5000/api/v1/coupon/action/:couponId
 * @description Controller used for updating the status of a coupon
 * @description Only admin and Moderator can update the coupon
 * @returns Coupon Object with success message "Coupon Updated SuccessFully"
 *********************************************************/
export const updateCoupon = asyncHandler(async (req, res) => {

    const { id: couponId } = req.params
    const { action } = req.body


    if (!couponId) {
        throw new ApiError(400, "Coupon ID is required")
    }


    const updatedCoupon = await Coupon.findByIdAndUpdate(
        couponId,
        {
            active: action
        },
        {
            new: true,
            runValidators: true
        }
    )

    if (!updatedCoupon) {
        throw new ApiError(404, "coupon not found")
    }


    res.status(200).json(
        new ApiResponse(200, updatedCoupon, "coupon updated")
    )

})



/**********************************************************
 * @DELETE_COUPON
 * @route https://localhost:5000/api/v1/coupon/:couponId
 * @description Controller used for deleting a coupon
 * @description Only admin and Moderator can delete the coupon
 * @returns Coupon Object with success message "Coupon Deleted successfully"
 *********************************************************/

export const deleteCoupon = asyncHandler(async (req, res) => {

    const { id: couponId } = req.params

    if (!couponId) {
        throw new ApiError(400, "Coupon ID is required")
    }


    const deleteCoupon = await Coupon.findByIdAndDelete(couponId)

    if (!deleteCoupon) {
        throw new ApiResponse(404, "coupon not found")
    }


    return res.status(200).json(
        new ApiResponse(200, {}, "coupon deleted")
    )
})



/**********************************************************
 * @GET_ALL_COUPON
 * @route https://localhost:5000/api/v1/coupon
 * @description Controller used for retrieving all coupons
 * @description Only admin and Moderator can retrieve all coupons
 * @returns Coupon Object with success message "Get All Coupons"
 *********************************************************/

export const getAllCoupon = asyncHandler(async (req, res) => {

    const allCoupons = await Coupon.find({})

    if (!allCoupons) {
        throw new ApiError(400, "No coupons found")
    }


    return res.status(200).json(
        new ApiResponse(200, allCoupons, "get all coupons")
    )
})