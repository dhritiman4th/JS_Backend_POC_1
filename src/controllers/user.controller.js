import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {User} from "../models/user.models.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import {ApiResponse} from "../utils/ApiResponse.js";

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

    const {username, fullName, email, password} = req.body;
    console.log("email : ", email);

    // if (fullName === "") {
    //     throw new ApiError(400, "Fullname is required");
    // }
    if ([username, fullName, email, password].some((field) => {
        return field?.trim() === ""
    })) {
        throw new ApiError(400, "All fields are required");
    }

    const existingUser = User.findOne({
        $or: [{username},{email}]
    })

    if (existingUser) {
        throw new ApiError(409, "User with email or username already exists")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;// ASSIGNMENT: Console log req.files
    const coverImagePath = req.files?.coverImage[0]?.path;
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar is required");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImagePath);
    if (avatar) {
        throw new ApiError(400, "Avatar file is required");
    }

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

export {registerUser};