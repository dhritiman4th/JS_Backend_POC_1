import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {User} from "../models/user.models.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);
        const refreshToken = user.generateRefreshToken();
        const accessToken = user.generateAccessToken();
        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave: false}); // Not validating other fields

        return {accessToken, refreshToken};
    } catch (error) {
        throw ApiError(500, "Something went wrong while generating refresh and access tokens");
    }
}

const registerUser = asyncHandler(async (req, res) => {
    // - Get user details from front end
    // - Validate user details
    // - Check if user already exist: username and email
    // - Check for images
    // - Check for avatar
    // - Upload them to cloudinary and get the url once it is uploaded
    // - Create user object - Create entry in DB
    // - Remove password and refresh token field from response
    // - Check for user creation
    // - Return response
    console.log("body : ", req.body);
    const {username, fullName, email, password} = req.body;

    // if (fullName === "") {
    //     throw new ApiError(400, "Fullname is required");
    // }
    if ([username, fullName, email, password].some((field) => {
        return field?.trim() === ""
    })) {
        throw new ApiError(400, "All fields are required");
    }

    const existingUser = await User.findOne({
        $or: [{username},{email}]
    })

    if (existingUser) {
        throw new ApiError(409, "User with email or username already exists")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;// ASSIGNMENT: Console log req.files
    // console.log("req.files : ",req.files);
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar is required");
    }

    let coverImagePath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImagePath = req.files.coverImage[0].path;
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    if (!avatar) {
        throw new ApiError(400, "Avatar file is required");
    }
    // console.log("avatar : ",avatar);
    // console.log("avatar : ",avatar.url);

    let coverImage = await uploadOnCloudinary(coverImagePath);

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    });

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );
    if(!createdUser) {
        throw new ApiError(500, "Something went wrong while registering user");
    }

    return res.status(201).json(new ApiResponse(
        200,
        createdUser,
        "User successfully registered"
    ));
});

const loginUser = asyncHandler(async (req, res) => {
    // - Get user details from front end
    // - check wheather user exists or not
    // - validate the password
    // - Generate a acces and refresh token
    // - send cookie

    const {email, username, password} = req.body;

    if (!username && !email) {
        throw new ApiError(400, "username or email is required.");
    }

    const user = await User.findOne({ // NOTE:- '$or', '$nor' etc these are mongodb operators.
        $or: [{username}, {email}]
    })

    if (!user) {
        throw new ApiError(404, "User doesn't exists");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials");
    }

    const {accessToken,refreshToken} = await generateAccessAndRefreshToken(user._id);

    // If db service is not expensive then
    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );
    // If db service is expensive then do below line
    // user.refreshToken = refreshToken;

    // Cookie creation
    const option = {
        httpOnly: true,
        secure: true
    }; 
    /* NOTE:- By doing this we are making cookie inaccessible from front end. 
    Only at server end it can be modified. Front end only can see. */
    return res
    .status(200)
    .cookie("accessToken" , accessToken, option)
    .cookie("refreshToken", refreshToken, option)
    .json(new ApiResponse(200, { user: loggedInUser, accessToken, refreshToken }, "User logged in successfully"))
});

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true 
            /*
            NOTE: - This we are setting because when setting refreshToken to undefined will be done, then we will
            get and new response where the refreshoken will be undefined, because in old reponse the 
            refreshToken will be there.
            */
        }
    )

    // Cookie creation
    const option = {
        httpOnly: true,
        secure: true
    };

    return res
    .status(200)
    .clearCookie("accessToken", option)
    .clearCookie("refreshToken", option)
    .json( new ApiResponse(200, {}, "User logged out successfully"))
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingrefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingrefreshToken) {
        throw new ApiError(401, "Unauthorized request");
    }

    try {
        const decodedRefreshToken = jwt.verify(incomingrefreshToken, process.env.REFRESH_TOKEN_SECRET);
    
        if (!decodedRefreshToken) {
            throw new ApiError(401, "Invalid refresh token");
        }
    
        const user = await User.findById(decodedRefreshToken?._id);
        if (!user) {
            throw new ApiError(401, "Invalid refresh token");
        }
    
        if (incomingrefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is already used or expired");
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const {newAccessToken, newRefreshToken} = await generateAccessAndRefreshToken(user._id);
    
        return res
        .status(200)
        .cookie("accessToken", newAccessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(new ApiResponse(
            200,
            {
                newAccessToken, 
                newRefreshToken
            }, 
            "Access token refreshed")
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token");
    }
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken
};