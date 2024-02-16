import { Collection } from "../models/collection.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";



/**********************************************************
 * @CREATE_COLLECTION
 * @route https://localhost:5000/api/v1/collection/
 * @description Controller used for creating a new collection
 * @description Only admin can create the collection
 * @returns ApiResponse with status 200 and the newly created collection object
 *********************************************************/

export const createCollection = asyncHandler(async (req, res) => {

    const { name } = req.body

    if (!name) {
        throw new ApiError(400, "collection name is required")
    }


    const collection = await Collection.create({name})


    return res
    .status(200)
    .json(
        new ApiResponse(200, collection, "Collection created sucessfully")
    )
})



/**********************************************************
 * @UPDATE_COLLECTION
 * @route http://localhost:5000/api/v1/collection/:collectionId
 * @description Controller for updating the collection details
 * @description Only admin can update the collection
 * @returns ApiResponse with status 200 and the updated collection object
 *********************************************************/

export const updateCollection = asyncHandler(async (req, res) => {

    const { name } = req.body
    const { id: collectionId } = req.params


    if (!name || !id) {
        throw new ApiError(400, "all fields are required")
    }


    const updateCollection = await Collection.findByIdAndUpdate(
        collectionId,
        {
            name,
        },
        {
            new: true,
            runValidators: true
        }
    )

    if (!updateCollection) {
        throw new ApiError(404, "collection not found")
    }


    return res.status(200).json(
        new ApiResponse(200, updateCollection, "collection updated sucesfully")
    )
})



/**********************************************************
 * @DELETE_COLLECTION
 * @route http://localhost:5000/api/v1/collection/:collectionId
 * @description Controller for deleting the collection
 * @description Only admin can delete the collection
 * @returns ApiResponse with status 200 and an empty object as the collection has been deleted successfully
 *********************************************************/

export const deleteCollection = asyncHandler(async (req, res) => {

    const { id: collectionId } = req.params


    const collectionToDelete = await Collection.findById(collectionId)

    if (!collectionToDelete) {
        throw new ApiError(404, "collection not found")
    }

    collectionToDelete.remove();


    return res.status(200).json(
        new ApiResponse(200, {}, "collection delete sucessfully")
    )
})



/**********************************************************
 * @GET_ALL_COLLECTION
 * @route http://localhost:5000/api/v1/collection/
 * @description Controller for getting all collection list
 * @returns Collection Object with available collection in DB
 *********************************************************/

export const getAllCollection = asyncHandler(async (req, res) => {

    const collections = await Collection.find()

    if (!collections) {
        throw new ApiError(404, "No collection found")
    }


    return res.status(200).json(
        new ApiResponse(200, collections, "Get all collections")
    )
})
