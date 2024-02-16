import { Router } from "express";
import {
    generateRazorpayOrderId,
    generateOrder,
    getMyOrders,
    getAllOrders,
    updateOrderStatus
} from "../controllers/order.controller.js";
import { isLoggedIn, authorize } from "../middlewares/auth.middleware.js";
import authRoles from "../utils/authRoles.js";


const router = Router()

router.post('/generate-razorpay-order-id', isLoggedIn, generateRazorpayOrderId);
router.post('/generate-order', isLoggedIn, generateOrder);
router.get('/my-orders', isLoggedIn, getMyOrders);
router.get('/all-orders', isLoggedIn, authorize(authRoles.ADMIN), getAllOrders);
router.put('/update-order-status', isLoggedIn, updateOrderStatus);



export default router;