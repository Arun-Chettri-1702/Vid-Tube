import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js"

/* const healthCheck = async (req, res) => {
    try {
        res.status(200).json
    } catch (error) {
        
    }
} */

// instead of above use a async handler
    
const healthCheck = asyncHandler(async (req, res) => {
    return res.status(200).json(new ApiResponse(200,"OK","Health Check passed"))
})

export {healthCheck}