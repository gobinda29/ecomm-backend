import { Product } from "../models/product.model.js";
import { Order } from "../models/order.model.js";
import { Coupon } from "../models/coupon.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import razorpay from "../config/razorpay.config.js";



const updateProductStock = async (products, couponCode) => {
    try {
        
        let totalAmount = 0
        let discountAmount = 0
    
    
        await Promise.all(
            products.map(async (product) => {

                const { productId, count } = product
                const productFromDB = await Product.findById(productId)
    
                if (!productFromDB) {
                    throw new ApiError(404, "product does not found")
                }
    
                if (productFromDB.stock < count) {
                    throw new ApiError(400, "Product quantity not in stock")
                }
    
                totalAmount += productFromDB.price * count


                productFromDB.stock -= count;
                await productFromDB.save();
            })
        )
    
    
        // check for coupon discount, if applicable
        if (couponCode) {
    
            try {
                const coupon = await Coupon.findOne({couponCode})
    
                if (!coupon) {
                    throw new ApiError(404, "No coupon found");
                }
    
                if(!coupon.active){
                    throw new ApiError(401, "Coupon is not active")
                }
    
    
                discountAmount = totalAmount * (coupon.discount / 100)
    
            } catch (error) {
                throw new ApiError(400, "Invalid coupon code");
            }
        }
    
        totalAmount -= discountAmount
    
        return totalAmount

    } catch (error) {
        throw new ApiError(401, error.messsage || "Something went wrong")
    }
}




/**********************************************************
 * @GENERATE_RAZORPAY_ORDER_ID
 * @route https://localhost:5000/api/v1/order/generate-razorpay-order-id
 * @description Controller used for generating a Razorpay order ID for payment processing
 * @description Only authenticated users can access this endpoint
 * @returns Order Object with success message "Razorpay Order ID Generated Successfully"
 *********************************************************/

export const generateRazorpayOrderId = asyncHandler(async (req, res) => {

    const { products, couponCode } = req.body

    if (!products || products.length === 0) {
        throw new ApiError(400, "No products are found")
    }


    let totalAmount = 0
    let discountAmount = 0

    // TODO: DO product calculation based on DB calls

    let productPriceCalc = Promise.all(
        products.map(async (product) => {
            const { productId, count } = product
            const productFromDB = await Product.findById(productId)

            if (!productFromDB) {
                throw new ApiError(404, "product does not found")
            }

            if (productFromDB.stock < count) {
                throw new ApiError(400, "Product quantity not in stock")
            }

            totalAmount += productFromDB.price * count
        })
    )

    await productPriceCalc;



    // check for coupon discount, if applicable
    if (couponCode) {

        try {
            const coupon = await Coupon.findOne({couponCode})

            if (!coupon) {
                throw new ApiError(404, "No coupon found");
            }

            if(!coupon.active){
                throw new ApiError(401, "Coupon is not active")
            }


            discountAmount = totalAmount * (coupon.discount / 100)

        } catch (error) {
            throw new ApiError(400, "Invalid coupon code");
        }
    }


    totalAmount -= discountAmount


    const options = {
        amount: Math.round(totalAmount * 100),
        currency: "INR",
        receipt: `receipt_${new Date().getTime()}`
    }

    const order = await razorpay.orders.create(options)

    if (!order) {
        throw new ApiError(400, "unable to generate order")
    }


    return res.status(200).json(
        new ApiResponse(200, order, "razorpay order id generated successfully")
    )
})




/**********************************************************
 * @GENERATE_ORDER
 * @route https://localhost:5000/api/v1/order/generate-order
 * @description Controller used for generating a new order
 * @description Required fields: transactionId, products, coupon, user, address, phoneNumber
 * @returns Order Object with success message "Order Placed Successfully"
 *********************************************************/

export const generateOrder = asyncHandler(async(req, res) => {

    const { transactionId, products, coupon, user, address, phoneNumber } = req.body

    if (!transactionId || !products || !coupon || !user || !address || !phoneNumber) {
        throw new ApiError(400, "All fileds are required")
    }

    const existsedCoupon = await Coupon.findOne({coupon})

    if (!existsedCoupon || !existsedCoupon.active) {
        throw new ApiError(401, "no coupon found or coupon is expired")
    }

    
    const totalAmount = await updateProductStock(products, coupon)

    const newOrder = Order.create({
        products: products,
        user: user,
        address: address,
        phoneNumber: phoneNumber,
        amount: totalAmount,
        coupon: coupon,
        transactionId: transactionId,
    });


    return res.status(200).json(
        new ApiResponse(200, newOrder, "Order placed successfully")
    )

})




/**********************************************************
 * @GET_MY_ORDERS
 * @route https://localhost:5000/api/v1/order/my-orders
 * @description retrieving orders belonging to the current user
 * @description Only authenticated users can access this endpoint
 * @returns Order Object with success message "Get My Orders"
 *********************************************************/

export const getMyOrders = asyncHandler(async(req, res) => {

    const userId = req.user._id;

    const orders = await Order.find({ _id: userId }).sort({ createdAt: -1 });

    if (!orders) {
        throw new ApiError(404, "No order found")
    }

    return res.status(200).json(
        new ApiResponse(200, orders, "Get my orders")
    );
})




/**********************************************************
 * @GET_all_ORDERS
 * @route https://localhost:5000/api/v1/order/all-orders
 * @description Controller used for retrieving all orders
 * @description Only admin and Moderator can access this endpoint
 * @returns Order Object with success message "Get All Orders"
 *********************************************************/

export const getAllOrders = asyncHandler(async(req, res) => {
    
    const orders = await Order.find().sort({ createdAt: -1 });


    return res.status(200).json(
        new ApiResponse(200, orders, "Get all orders")
    );
})




/**********************************************************
 * @UPDATE_ORDER_STATUS
 * @route https://localhost:5000/api/v1/order/update-order-status
 * @description Controller used for updating the status of an order
 * @description Required fields: orderId, newStatus
 * @returns Order Object with success message "Order Status Updated Successfully"
 *********************************************************/

export const updateOrderStatus = asyncHandler(async(req, res) => {
    
    const { orderId, newStatus } = req.body;


    const order = await Order.findById(orderId);

    if (!order) {
        throw new ApiError(404, "Order not found")
    }


    order.status = newStatus;
    await order.save();


    return res.status(200).json(
        new ApiResponse(200, order, "Order status updated successfully")
    )
})