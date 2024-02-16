import { Router } from "express";
import userRoutes from "./user.route.js";
import collectionRoutes from "./collection.route.js";
import productRoutes from "./product.route.js";
import couponRoutes from "./coupon.route.js";
import orderRoutes from "./order.route.js";


const router = Router()



router.use("/user", userRoutes)
router.use("/product", productRoutes)
router.use("/collection", collectionRoutes)
router.use("/coupon", couponRoutes)
router.use("/order", orderRoutes)




export default router