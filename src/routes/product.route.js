import { Router } from "express";
import {
    createProduct,
    getAllProduct,
    getProductById,
    getProductByCollectionId,
    deleteProduct
} from "../controllers/product.controller.js";
import { isLoggedIn, authorize } from "../middlewares/auth.middleware.js";
import authRoles from "../utils/authRoles.js";


const router = Router()


router.post('/', isLoggedIn, authorize(authRoles.ADMIN, authRoles.MODERATOR), createProduct);
router.get('/all-products', getAllProduct);
router.get('/:id', getProductById);
router.get('/collection/:id', getProductByCollectionId);
router.delete('/:id', isLoggedIn, authorize(authRoles.ADMIN, authRoles.MODERATOR), deleteProduct);


export default router