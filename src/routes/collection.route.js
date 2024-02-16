import { Router } from "express";
import { 
    createCollection,
    updateCollection,
    getAllCollection,
    deleteCollection
} from "../controllers/collection.controller.js";
import { isLoggedIn, authorize } from "../middlewares/auth.middleware.js";
import authRoles from "../utils/authRoles.js";



const router = Router()


router.post("/", isLoggedIn, authorize(authRoles.ADMIN), createCollection)
router.put("/:id", isLoggedIn, authorize(authRoles.ADMIN), updateCollection)

// delete a single collection
router.delete("/:id", isLoggedIn, authorize(authRoles.ADMIN), deleteCollection)

//get all collection
router.get("/",  getAllCollection)



export default router