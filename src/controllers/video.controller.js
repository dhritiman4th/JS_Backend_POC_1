import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { deleteFromCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";
import { Video } from "../models/video.models.js";

const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video

    if (!title || !description) {
        throw new ApiError(400, "'title' and 'description' both are required");
    }

    // Get the video
    let localVideoPath;
    if (Array.isArray(req.files?.videoToPublish)) {
        localVideoPath = req.files?.videoToPublish[0].path;
    } else {
        localVideoPath = req.files?.videoToPublish.path;
    }

    if (!localVideoPath) {
        throw new ApiError(400, "Please upload a video");
    }

    const videoUploadresponse = await uploadOnCloudinary(localVideoPath);
    if (!videoUploadresponse) {
        throw new ApiError(500, "Something went wrong while uploading video to cloud");
    }
    console.log(videoUploadresponse);

    const duration = videoUploadresponse.duration;
    const uploadedVideoUrl = videoUploadresponse.playback_url;

    // Get the thumbnail
    let localThumbnailPath;
    if (Array.isArray(req.files?.thumbnail)) {
        localThumbnailPath = req.files?.thumbnail[0].path;
    } else {
        localThumbnailPath = req.files?.thumbnail.path;
    }

    if (!localThumbnailPath) {
        throw new ApiError(400, "Please upload a thumbnail");
    }

    const thumbnailUploadresponse = await uploadOnCloudinary(localThumbnailPath);
    if (!thumbnailUploadresponse) {
        throw new ApiError(500, "Something went wrong while uploading thumbnail to cloud");
    }
    console.log(thumbnailUploadresponse);
    const uploadedThumbnailUrl = thumbnailUploadresponse.url;

    // Upload video
    const response = await Video.create({
        videoFile: uploadedVideoUrl,
        thumbnail: uploadedThumbnailUrl,
        title,
        description,
        duration,
        owner: req.user._id,
        isPublished: false,
        views: 0
    });

    const createdVideo = await Video.findById(response._id);
    if (!createdVideo) {
        throw new ApiError(500, "Something went wrong while uploading video");
    }

    return res
    .status(200)
    .json(new ApiResponse(200, createdVideo, "Video published successfully"));
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id

    if (!videoId) {
        throw new ApiError(400, "video id is required");
    }

    const requestedVideo = await Video.findById(videoId);
    if (!requestedVideo) {
        throw new ApiError(400, "Requested video is not available");
    }

    return res
    .status(200)
    .json(new ApiResponse(200, requestedVideo, "Video fetched successfully"))
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    if (!videoId) {
        throw new ApiError(400, "video id is required");
    }
    //TODO: update video details like title, description, thumbnail

    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(400, "No sunch video is available")
    }

    if (!requestedVideo.owner.equals(req.user._id)) {
        throw new ApiError(400, "You are not authorized to update details of this video");
    }

    const {title, description} = req.body;
    if (!title || !description) {
        throw new ApiError(400, "title and description are mandatory");
    }
    video.title = title;
    video.description = description;
    
    let localThumbnailPath;
    if (Array.isArray(req.files?.thumbnail)) {
        localThumbnailPath = req.files?.thumbnail[0].path;
    } else {
        localThumbnailPath = req.file?.path;
    }

    if (localThumbnailPath) {
        const uploadedThumbnail = await uploadOnCloudinary(localThumbnailPath);
        if (!uploadedThumbnail) {
            throw new ApiError(500, "Something went wrong while uploading thumbnail to cloud");
        }
        const oldThumbnailUrl = video.thumbnail;
        await deleteFromCloudinary(oldThumbnailUrl);
        video.thumbnail = uploadedThumbnail.url;
    }

    const response = await video.save({validateBeforeSave: false});
    
    if (!response) {
        throw new ApiError(500, "Something went wrong while updating vuideo details");
    }

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Video details have been updated"));
})

const deleteVideo = asyncHandler(async (req, res) => {
    //TODO: delete video
    const { videoId } = req.params
    const requestedVideo = await Video.findById(videoId);
    if (!requestedVideo) {
        throw new ApiError(400, "No sunch video is available")
    }

    if (!requestedVideo.owner.equals(req.user._id)) {
        throw new ApiError(400, "You are not authorized to delete this video");
    }
    
    if (!videoId) {
        throw new ApiError(400, "video id is required");
    }
    await requestedVideo.deleteOne()

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Video has been deleted successfully"));
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    
    const requestedVideo = await Video.findById(videoId);
    if (!requestedVideo) {
        throw new ApiError(400, "No sunch video is available")
    }

    console.log(requestedVideo.owner);
    console.log(req.user._id);
    if (!requestedVideo.owner.equals(req.user._id)) {
        throw new ApiError(400, "You are not authorized to publish this video");
    }

    requestedVideo.isPublished = !requestedVideo.isPublished;

    await requestedVideo.save({validateBeforeSave: false});

    return res
    .status(200)
    .json(new ApiResponse(200, {}, requestedVideo.isPublished ? "Video has been published successfully" : "Video has been unpublished successfully"));
});

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}