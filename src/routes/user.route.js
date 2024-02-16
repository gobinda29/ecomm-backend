import { Router } from "express";
import { 
    signup, 
    login, 
    logout, 
    refreshAccessToken, 
    getProfile, 
    forgotPassword, 
    resetPassword 
} from "../controllers/user.controller.js";
import { isLoggedIn } from "../middlewares/auth.middleware.js";



const router = Router()

router.post("/signup", signup)
router.post("/login", login)
router.get("/logout", logout)

router.post("/refresh-token", refreshAccessToken)

router.post("/password/forgot-password/", forgotPassword)
router.post("/password/reset/:token", resetPassword)

router.get("/profile", isLoggedIn, getProfile)



export default router