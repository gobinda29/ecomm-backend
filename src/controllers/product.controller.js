import { Product } from "../models/product.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import formidable from "formidable";
import { s3FileUpload, s3FileDeleted } from "../utils/imageUpload.js";
import config from "../config/index.js";
import { Mongoose } from "mongoose";
import fs from "fs";



/**********************************************************
 * @ADD_PRODUCT
 * @route https://localhost:5000/api/v1/product
 * @description Controller used for creating a new product
 * @description Only admin can create the product
 * @descriptio Uses AWS S3 Bucket for image upload
 * @returns Product Object with success message "Product Is Created"
 *********************************************************/

export const createProduct = asyncHandler(async (req, res) => {

    const form = formidable({ multiples: true, keepExtensions: true})

    form.parse(req, async function(err, fields, files) {

        if (err) {
            throw new ApiError(500, err.message || "Something went wrong")
        }


        let productId = new Mongoose.Types.ObjectId().toHexString()

        if(
            fields.name ||
            fields.price ||
            fields.description ||
            fields.collectionId
        ) {
            throw new ApiError(400, "all fields are required")
        }


        let imgArrayResp = Promise.all(
            Object.keys(files).map(async (file, index) => {
                const element = file[fileKey]
                const data = fs.readFileSync(element.filepath)

                const upload = await s3FileUpload({
                    bucketName: config.S3_BUCKET_NAME,
                    key: `products/${productId}/photo_${index + 1}.png`,
                    body: data,
                    contentType: element.mimetype
                })


                return {
                    secure_url: upload.Location
                }
            })
        )

        let imgArray = await imgArrayResp


        const product = await Product.create({
            _id: productId,
            photos: imgArray,
            ...fields
        })

        if (!product) {
            throw new ApiError(400, "Product failed to be created in DB")
        }


        return res.status(200).json(
            new ApiResponse(200, product, "Product is created")
        )
    })
})



/**********************************************************
 * @GET_ALL_PRODUCT
 * @route https://localhost:5000/api/v1/product/all-products
 * @description Controller used for retrieving all products
 * @returns Product Object with success message "Get All Products"
 *********************************************************/

export const getAllProduct = asyncHandler(async (req, res) => {

    const allProducts = await Product.find({})

    if (!allProducts) {
        throw new ApiError(404, "No product found")
    }


    return res.status(200).json(
        new ApiResponse(200, allProducts, "get all products")
    )
})



/**********************************************************
 * @GET_PRODUCT_BY_ID
 * @route https://localhost:5000/api/v1/product/:productId
 * @description Controller used for retrieving a product by its ID
 * @returns Product Object with success message "Get Product By ID"
 *********************************************************/

export const getProductById = asyncHandler(async (req, res) => {

    const { id: productId } = req.params


    const product = await Product.findById(productId)

    if (!product) {
        throw new ApiError(404, "No product found")
    }


    return res.status(200).json(
        new ApiResponse(200, product, "get all products")
    )
})



/**********************************************************
 * @GET_PRODUCT_BY_COLLECTION_ID
 * @route https://localhost:5000/api/v1/product/collection/:collectionId
 * @description Controller used for retrieving products by collection ID
 * @returns Product Object with success message  "Get Products By Collection ID"
 *********************************************************/

export const getProductByCollectionId = asyncHandler(async (req, res) => {

    const { id: collectionId } = req.params


    const products = await Product.findById({collectionId})

    if (!products) {
        throw new ApiError(404, "No products found")
    }


    return res.status(200).json(
        new ApiResponse(200, products, "get all products")
    )
})



/**********************************************************
 * @DELETE_PRODUCT
 * @route https://localhost:5000/api/v1/product/:productId
 * @description Controller used for deleting a product by its ID
 * @description Only admin can create the coupon
 * @descriptio Uses AWS S3 Bucket for deleting image
 * @returns Product Object with success message "Product Has Been Deleted Successfully"
 *********************************************************/

export const deleteProduct = asyncHandler(async (req, res) => {

    const { id: productId } = req.params


    const product = await Product.findById(productId)

    if (!product) {
        throw new ApiError(404, "No products found")
    }


    const deletePhotos = Promise.all(
        product.photos.map(async (elem, index) => {
            await s3FileDeleted({
                bucketName: config.S3_BUCKET_NAME,
                key: `products/${product._id.toString()}/photo_${index + 1}.png`
            })
        })
    )

    await deletePhotos;

    await product.remove()


    return res.status(200).json(
        new ApiResponse(200, {}, "product has been deleted successfully")
    )
})