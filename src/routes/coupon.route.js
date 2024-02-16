import { Router } from "express";
import { 
    createCoupon,
    updateCoupon,
    deleteCoupon,
    getAllCoupon
} from "../controllers/coupon.controller.js";
import { isLoggedIn, authorize } from "../middlewares/auth.middleware.js";
import authRoles from "../utils/authRoles.js";


const router = Router()


router.post("/", isLoggedIn, authorize(authRoles.ADMIN), createCoupon)

router.delete("/:id", isLoggedIn, authorize(authRoles.ADMIN, authRoles.MODERATOR), deleteCoupon)

router.put("/action/:id", isLoggedIn, authorize(authRoles.ADMIN, authRoles.MODERATOR), updateCoupon)

router.get("/", isLoggedIn, authorize(authRoles.ADMIN, authRoles.MODERATOR), getAllCoupon)



export default router;