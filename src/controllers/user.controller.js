import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {User} from "../models/user.models.js";
import {uploadOnCloudinary, deleteFromCloudinary} from "../utils/cloudinary.js";
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

    console.log("req.files : ",req.files);
    console.log("req.files : ",req.files?.avatar);
    const avatarLocalPath = req.files?.avatar[0]?.path;// ASSIGNMENT: Console log req.files
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
});

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
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const {oldPassword, newPassword} = req.body;

    const user = await User.findById(req.user._id);

    const isPasswordCorrect = user.isPasswordCorrect(oldPassword);

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password");
    }

    user.password = newPassword;
    await user.save({validateBeforeSave: true});

    return res
    .status(200)
    .json( new ApiResponse(200, {}, "Password changed successfully") );
});

const getCurrentUser = asyncHandler(async (req, res) => {
    return res
    .status(200)
    .json( new ApiResponse(200, req.user, "Current user fetched successfully."));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
    const {fullName, email} = req.body;

    if (!fullName || !email) {
        throw new ApiError(400, "Atlest Fullname or Email is required");
    }

    const user = await User.findByIdAndUpdate(
        req.user._id, 
        {
            $set: {
                fullName,
                email
            }
        },
        {
            new: true
        }
    ).select("-password");

    return res
    .status(200)
    .json(new ApiResponse(200, user, "User details updated successfully"));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    const oldAvatarImage = user.avatar;

    const avatarLocalPath = req.file?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar is missing");
    }

    const updatedAvatar = await uploadOnCloudinary(avatarLocalPath);
    if (!updatedAvatar.url) {
        throw new ApiError(400, "Error while uploading avatar to cloud");
    }

    const updatedUserDetails = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                avatar: updatedAvatar.url
            }
        },
        {
        new: true
        }
    ).select("-password");

    await deleteFromCloudinary(oldAvatarImage);

    return res
    .status(200)
    .json(new ApiResponse(200, updatedUserDetails, "Avatar is updated successfully"));
});

const updateUserCoverImage = asyncHandler( async (req, res) => {
    const coverImagePath = req.file?.path;

    if(!coverImagePath) {
        throw new ApiError(400, "Cover image is missing");
    }

    const updatedCoverImage = await uploadOnCloudinary(coverImagePath);
    if (!updatedCoverImage.url) {
        throw new ApiError(400, "Error while uploading cover image to cloud");
    }

    const updatedUserDetails = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                coverImage: updatedCoverImage.url
            }
        },
        {
            new: true
        }
    );

    return res
    .status(200)
    .json(new ApiResponse(200, updatedUserDetails, "Cover image is updated successfully"));
});

const getUserChannelProfile = asyncHandler( async(req, res) => {
    const {username} = req.params;

    if (!username?.trim()) {
        throw new ApiError(400, "username is missing");
    }

    const channel = User.aggregate(
        [
            {
                $match: {
                    username: username?.toLowerCase()
                }
            },
            {
                $lookup: {
                    from: "subscriptions",
                    localField: "_id",
                    foreignField: "subscriber",
                    as: "subscribers"
                }
            },
            {
                $lookup: {
                    from: "subscriptions",
                    localField: "_id",
                    foreignField: "channel",
                    as: "subscribedTo"
                }
            },
            {
                $addFields: {
                    subscribersCount: {
                        $size: "$subscribers"
                    },
                    channelSubscribedToCount: {
                        $size: "$subscribedTo"
                    },
                    isSubscribed: {
                        $cond: {
                            if: {
                                $in: [req.user?._id, "$subscribers.subscriber"]
                            },
                            then: true,
                            else: false
                        }
                    }
                }
            },
            {
                $project: {
                    username: 1,
                    fullName: 1,
                    email: 1,
                    avatar: 1,
                    coverImage: 1,
                    subscribersCount: 1,
                    channelSubscribedToCount: 1, 
                    isSubscribed: 1
                }
            }
        ]
    );

    if (!channel?.length) {
        throw new ApiError(400, "Channel doesn't exist");
    }

    return res
    .status(200)
    .json( new ApiResponse(200, channel[0], "User channel fetched successfully"));
});

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile
};