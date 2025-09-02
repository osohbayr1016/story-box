const ShortVideo = require("../../models/shortVideo.model");

//mongoose
const mongoose = require("mongoose");

//import model
const User = require("../../models/user.model");
const LikeHistoryOfVideo = require("../../models/likeHistoryOfVideo.model");
const MovieSeries = require("../../models/movieSeries.model");
const History = require("../../models/history.model");
const UserVideoStatus = require("../../models/userVideoStatus.model");

//generate History UniqueId
const { generateHistoryUniqueId } = require("../../util/generateHistoryUniqueId");

//retrieves all videos from a specific movie series for a user
exports.retrieveMovieSeriesVideosForUser = async (req, res) => {
  try {
    const start = req.query.start ? parseInt(req.query.start) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 50;

    if (!req.query.userId || !req.query.movieSeriesId) {
      return res.status(200).json({ status: false, message: "Oops! Invalid details." });
    }

    const userId = new mongoose.Types.ObjectId(req.query.userId);
    const movieSeriesId = new mongoose.Types.ObjectId(req.query.movieSeriesId);

    const [user, totalVideosCount, videos] = await Promise.all([
      User.findOne({ _id: userId }).select("_id isBlock coin episodeUnlockAds").lean(),
      ShortVideo.countDocuments({ movieSeries: movieSeriesId }),
      ShortVideo.aggregate([
        {
          $match: {
            movieSeries: new mongoose.Types.ObjectId(movieSeriesId),
          },
        },
        {
          $lookup: {
            from: "movieseries",
            localField: "movieSeries",
            foreignField: "_id",
            as: "movieSeriesDetails",
          },
        },
        {
          $unwind: "$movieSeriesDetails",
        },
        {
          $match: {
            "movieSeriesDetails.isActive": true,
          },
        },
        {
          $lookup: {
            from: "likehistoryofvideos",
            localField: "_id",
            foreignField: "videoId",
            as: "likes",
          },
        },
        {
          $lookup: {
            from: "uservideostatuses",
            let: { videoId: "$_id", userId: userId },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [{ $eq: ["$shortVideoId", "$$videoId"] }, { $eq: ["$userId", "$$userId"] }],
                  },
                },
              },
            ],
            as: "userVideoStatus",
          },
        },
        {
          $lookup: {
            from: "uservideolists",
            let: { userId, movieSeriesId },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [{ $eq: ["$userId", "$$userId"] }, { $in: ["$$movieSeriesId", "$videos.movieSeries"] }],
                  },
                },
              },
            ],
            as: "isAddedList",
          },
        },
        {
          $project: {
            _id: 1,
            episodeNumber: 1,
            videoImage: 1,
            videoUrl: 1,
            coin: 1,
            isLocked: {
              $cond: {
                if: { $gt: [{ $size: "$userVideoStatus" }, 0] },
                then: { $arrayElemAt: ["$userVideoStatus.isLocked", 0] },
                else: "$isLocked",
              },
            },
            "movieSeriesDetails._id": 1,
            "movieSeriesDetails.name": 1,
            "movieSeriesDetails.description": 1,
            "movieSeriesDetails.thumbnail": 1,
            "movieSeriesDetails.maxAdsForFreeView": 1,
            isLike: { $in: [userId, "$likes.userId"] },
            totalLikes: { $size: "$likes" },
            isAddedList: {
              $cond: [{ $eq: [{ $size: "$isAddedList" }, 0] }, false, true],
            },
            totalAddedToList: {
              $size: {
                $filter: {
                  input: "$isAddedList",
                  as: "addedList",
                  cond: { $eq: ["$$addedList.userId", userId] },
                },
              },
            },
          },
        },
        {
          $group: {
            _id: "$movieSeriesDetails._id",
            movieSeriesName: { $first: "$movieSeriesDetails.name" },
            movieSeriesDescription: { $first: "$movieSeriesDetails.description" },
            movieSeriesThumbnail: { $first: "$movieSeriesDetails.thumbnail" },
            movieSeriesMaxAdsForFreeView: { $first: "$movieSeriesDetails.maxAdsForFreeView" },
            isAddedList: { $first: "$isAddedList" },
            totalAddedToList: { $first: "$totalAddedToList" },
            videos: {
              $push: {
                _id: "$_id",
                episodeNumber: "$episodeNumber",
                videoImage: "$videoImage",
                videoUrl: "$videoUrl",
                isLocked: "$isLocked",
                coin: "$coin",
                isLike: "$isLike",
                totalLikes: "$totalLikes",
              },
            },
          },
        },
        { $sort: { _id: 1 } },
        { $skip: (start - 1) * limit },
        { $limit: limit },
      ]),
    ]);

    if (!user) {
      return res.status(200).json({ status: false, message: "User not found." });
    }

    if (user.isBlock) {
      return res.status(200).json({ status: false, message: "You are blocked by admin." });
    }

    const episodeUnlockAds = user.episodeUnlockAds.find((ads) => ads?.movieWebseriesId?.toString() === movieSeriesId?.toString());

    const userInfo = {
      coin: user.coin || 0,
      episodeUnlockAds: episodeUnlockAds ? episodeUnlockAds.count : 0,
    };

    return res.status(200).json({
      status: true,
      message: "Retrieved videos from a specific movie series for the user.",
      userInfo: userInfo,
      totalVideosCount: totalVideosCount,
      data: videos[0] || null,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

//retrieve only trailer with total counts short videos grouped by their associated movie series (for you)
exports.getVideosGroupedByMovieSeries = async (req, res) => {
  try {
    const start = req.query.start ? parseInt(req.query.start) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 50;

    if (!req.query.userId) {
      return res.status(200).json({ status: false, message: "Oops! Invalid details." });
    }

    const userId = new mongoose.Types.ObjectId(req.query.userId);

    const [user, groupedVideos] = await Promise.all([
      User.findOne({ _id: userId }).select("_id isBlock").lean(),
      ShortVideo.aggregate([
        {
          $lookup: {
            from: "movieseries",
            localField: "movieSeries",
            foreignField: "_id",
            as: "movieSeriesDetails",
          },
        },
        {
          $unwind: "$movieSeriesDetails",
        },
        {
          $match: {
            "movieSeriesDetails.isActive": true,
          },
        },
        {
          $lookup: {
            from: "uservideostatuses",
            let: { videoId: "$_id", userId: userId },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [{ $eq: ["$shortVideoId", "$$videoId"] }, { $eq: ["$userId", "$$userId"] }],
                  },
                },
              },
            ],
            as: "userVideoStatus",
          },
        },
        {
          $lookup: {
            from: "uservideolists",
            let: { userId, movieSeriesId: "$movieSeriesDetails._id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [{ $eq: ["$userId", "$$userId"] }, { $in: ["$$movieSeriesId", "$videos.movieSeries"] }],
                  },
                },
              },
            ],
            as: "isAddedList",
          },
        },
        {
          $lookup: {
            from: "likehistoryofvideos",
            localField: "_id",
            foreignField: "videoId",
            as: "likes",
          },
        },
        {
          $project: {
            _id: 1,
            episodeNumber: 1,
            videoImage: 1,
            videoUrl: 1,
            isLocked: {
              $cond: {
                if: { $gt: [{ $size: "$userVideoStatus" }, 0] },
                then: { $arrayElemAt: ["$userVideoStatus.isLocked", 0] },
                else: "$isLocked",
              },
            },
            "movieSeriesDetails._id": 1,
            "movieSeriesDetails.name": 1,
            "movieSeriesDetails.description": 1,
            "movieSeriesDetails.thumbnail": 1,
            isLike: { $in: [userId, "$likes.userId"] },
            totalLikes: { $size: "$likes" },
            isAddedList: {
              $cond: [{ $eq: [{ $size: "$isAddedList" }, 0] }, false, true],
            },
            totalAddedToList: {
              $size: {
                $filter: {
                  input: "$isAddedList",
                  as: "addedList",
                  cond: { $eq: ["$$addedList.userId", userId] },
                },
              },
            },
          },
        },
        {
          $match: { episodeNumber: 0 },
        },
        {
          $group: {
            _id: "$movieSeriesDetails._id",
            movieSeriesName: { $first: "$movieSeriesDetails.name" },
            movieSeriesDescription: { $first: "$movieSeriesDetails.description" },
            movieSeriesThumbnail: { $first: "$movieSeriesDetails.thumbnail" },
            isAddedList: { $first: "$isAddedList" },
            totalAddedToList: { $first: "$totalAddedToList" },
            videos: {
              $first: {
                _id: "$_id",
                episodeNumber: "$episodeNumber",
                videoImage: "$videoImage",
                videoUrl: "$videoUrl",
                isLocked: "$isLocked",
                isLike: "$isLike",
                totalLikes: "$totalLikes", // Include total likes in the videos field
              },
            },
            totalLockedVideos: {
              $sum: { $cond: [{ $eq: ["$isLocked", true] }, 1, 0] },
            },
          },
        },
        {
          $lookup: {
            from: "shortvideos",
            let: { movieSeriesId: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ["$movieSeries", "$$movieSeriesId"],
                  },
                },
              },
              {
                $count: "totalCount",
              },
            ],
            as: "totalVideosInfo",
          },
        },
        {
          $project: {
            _id: 1,
            movieSeriesName: 1,
            movieSeriesDescription: 1,
            movieSeriesThumbnail: 1,
            isAddedList: 1,
            totalAddedToList: 1,
            videos: 1,
            totalLockedVideos: 1,
            totalVideos: {
              $ifNull: [{ $arrayElemAt: ["$totalVideosInfo.totalCount", 0] }, 0],
            },
          },
        },
        { $sort: { _id: 1 } },
        { $skip: (start - 1) * limit },
        { $limit: limit },
      ]),
    ]);

    if (!user) {
      return res.status(200).json({ status: false, message: "User not found." });
    }

    if (user.isBlock) {
      return res.status(200).json({ status: false, message: "You are blocked by admin." });
    }

    return res.status(200).json({ status: true, message: "Retrieved grouped videos by movie series.", data: groupedVideos });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

//create like or dislike for video
exports.likeOrDislikeOfVideo = async (req, res) => {
  try {
    if (!req.query.userId || !req.query.videoId) {
      return res.status(200).json({ status: false, message: "Oops ! Invalid details." });
    }

    const userId = new mongoose.Types.ObjectId(req.query.userId);
    const videoId = new mongoose.Types.ObjectId(req.query.videoId);

    const [user, video, alreadylikedVideo] = await Promise.all([
      User.findOne({ _id: userId }).select("_id isBlock").lean(),
      ShortVideo.findById(videoId).select("_id").lean(),
      LikeHistoryOfVideo.findOne({
        userId: userId,
        videoId: videoId,
      }).lean(),
    ]);

    if (!user) {
      return res.status(200).json({ status: false, message: "user does not found." });
    }

    if (user.isBlock) {
      return res.status(200).json({ status: false, message: "you are blocked by the admin." });
    }

    if (!video) {
      return res.status(200).json({ status: false, message: "video does not found." });
    }

    if (alreadylikedVideo) {
      await LikeHistoryOfVideo.deleteOne({
        userId: user._id,
        videoId: video._id,
      });

      return res.status(200).json({
        status: true,
        message: "The Video was marked with a dislike by the user.",
        isLike: false,
      });
    } else {
      console.log("else");

      const likeHistory = new LikeHistoryOfVideo();
      likeHistory.userId = user._id;
      likeHistory.videoId = video._id;
      await likeHistory.save();

      return res.status(200).json({
        status: true,
        message: "The Video was marked with a like by the user.",
        isLike: true,
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

//watch Ad for unlock video
exports.viewAdToUnlockVideo = async (req, res) => {
  try {
    const { userId, movieWebseriesId, shortVideoId } = req.query;

    if (!userId || !movieWebseriesId || !shortVideoId) {
      return res.status(200).json({ status: false, message: "Invalid request parameters. Please provide all required details." });
    }

    const [user, movieWebseries, shortVideo, userVideoStatus] = await Promise.all([
      User.findOne({ _id: userId }).select("_id isBlock episodeUnlockAds").lean(),
      MovieSeries.findById(movieWebseriesId).select("_id maxAdsForFreeView").lean(),
      ShortVideo.findById(shortVideoId).select("_id").lean(),
      UserVideoStatus.findOne({ userId, shortVideoId }).select("_id isLocked").lean(),
    ]);

    if (!user) {
      return res.status(200).json({ status: false, message: "User not found!" });
    }

    if (user.isBlock) {
      return res.status(403).json({ status: false, message: "Access denied. Your account has been blocked by the administrator." });
    }

    if (!movieWebseries) {
      return res.status(200).json({ status: false, message: "MovieSeries not found." });
    }

    if (!shortVideo) {
      return res.status(200).json({ status: false, message: "ShortVideo not found." });
    }

    if (userVideoStatus && !userVideoStatus.isLocked) {
      return res.status(200).json({ status: true, message: "Video is already unlocked for this user." });
    }

    const today = new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD' format
    console.log("Today's date for viewAd To UnlockVideo: ", today);

    const movieAdData = user?.episodeUnlockAds?.find((ad) => ad?.movieWebseriesId?.toString() === movieWebseriesId.toString());

    if (movieAdData) {
      console.log("If today's date matches and ad limit reached");

      if (movieAdData.date !== null && new Date(movieAdData.date).toISOString().slice(0, 10) === today && movieAdData.count >= movieWebseries.maxAdsForFreeView) {
        return res.status(200).json({ status: false, message: "Daily ad viewing limit reached for this movie. Please try again tomorrow." });
      }
    }

    res.status(200).json({
      status: true,
      message: "Ad successfully watched. The content has been unlocked.",
    });

    await Promise.all([
      User.findOneAndUpdate(
        { _id: user._id, "episodeUnlockAds.movieWebseriesId": movieWebseriesId },
        {
          $inc: { "episodeUnlockAds.$.count": 1 },
          $set: { "episodeUnlockAds.$.date": today },
        },
        {
          upsert: false,
          new: true,
        }
      ).then(async (result) => {
        console.log("If no matching entry found, add a new one", result);

        if (!result) {
          await User.updateOne(
            { _id: user._id },
            {
              $push: {
                episodeUnlockAds: {
                  movieWebseriesId,
                  count: 1,
                  date: today,
                },
              },
            }
          );
        }
      }),
      userVideoStatus ? UserVideoStatus.updateOne({ _id: userVideoStatus._id }, { $set: { isLocked: false } }) : UserVideoStatus.create({ userId, shortVideoId, isLocked: false }),
    ]);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

//deducting coins when a video is viewed
exports.deductCoinForVideoView = async (req, res) => {
  try {
    const { userId, shortVideoId } = req.query;

    if (!userId || !shortVideoId) {
      return res.status(200).json({
        status: false,
        message: "Invalid request parameters. Please provide all required details.",
      });
    }

    const [uniqueId, user, shortVideo, userVideoStatus] = await Promise.all([
      generateHistoryUniqueId(),
      User.findOne({ _id: userId }).select("_id isBlock coin").lean(),
      ShortVideo.findById(shortVideoId).select("_id coin movieSeries").lean(),
      UserVideoStatus.findOne({ userId, shortVideoId }).select("_id isLocked").lean(),
    ]);

    if (!user) {
      return res.status(200).json({ status: false, message: "User not found!" });
    }

    if (user.isBlock) {
      return res.status(403).json({ status: false, message: "Access denied. You are blocked by the admin." });
    }

    if (!shortVideo) {
      return res.status(200).json({ status: false, message: "ShortVideo not found." });
    }

    if (user.coin < shortVideo.coin) {
      return res.status(400).json({ status: false, message: "Insufficient coins to unlock this video." });
    }

    if (userVideoStatus && !userVideoStatus.isLocked) {
      return res.status(200).json({ status: true, message: "Video is already unlocked for this user." });
    }

    if (shortVideo.coin > 0) {
      const updatedUser = await User.findOneAndUpdate({ _id: user._id, coin: { $gte: shortVideo.coin } }, { $inc: { coin: -shortVideo.coin } }, { new: true }).select("_id coin");

      if (!updatedUser) {
        return res.status(200).json({ status: false, message: "Failed to deduct coins. Please try again." });
      }

      res.status(200).json({
        status: true,
        message: "Coins have been successfully deducted. Video unlocked.",
        userCoin: updatedUser.coin || 0,
      });

      await Promise.all([
        userVideoStatus ? UserVideoStatus.updateOne({ _id: userVideoStatus._id }, { $set: { isLocked: false } }) : UserVideoStatus.create({ userId, shortVideoId, isLocked: false }),
        History.create({
          userId: user._id,
          videoId: shortVideo._id,
          movieSeries: shortVideo.movieSeries,
          uniqueId: uniqueId,
          coin: shortVideo.coin,
          type: 6,
          date: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
        }),
      ]);
    } else {
      console.log("For free videos (coin = 0), just unlock the video");

      res.status(200).json({
        status: true,
        message: "Video unlocked successfully (free content).",
        userCoin: user.coin || 0,
      });

      await Promise.all([userVideoStatus ? UserVideoStatus.updateOne({ _id: userVideoStatus._id }, { $set: { isLocked: false } }) : UserVideoStatus.create({ userId, shortVideoId, isLocked: false })]);
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: false,
      error: error.message || "Internal Server Error",
    });
  }
};

//episodes auto-unlock (particular movieSeries wise)
exports.unlockEpisodesAutomatically = async (req, res) => {
  try {
    const { userId, movieWebseriesId, type } = req.query;

    if (!userId || !movieWebseriesId || !type) {
      return res.status(200).json({ status: false, message: "Invalid request parameters. Please provide all required details." });
    }

    const [uniqueId, user, movieWebseries] = await Promise.all([generateHistoryUniqueId(), User.findOne({ _id: userId }), MovieSeries.findById(movieWebseriesId)]);

    if (!user) {
      return res.status(200).json({ status: false, message: "User does not found!" });
    }

    if (user.isBlock) {
      return res.status(200).json({ status: false, message: "you are blocked by the admin." });
    }

    if (!movieWebseries) {
      return res.status(200).json({ status: false, message: "MovieSeries does not found." });
    }

    if (type === "true") {
      if (!movieWebseries.isAutoUnlockEpisodes) {
        movieWebseries.isAutoUnlockEpisodes = true;
        await movieWebseries.save();
      }

      res.status(200).json({ status: true, message: "Episodes successfully auto locked and history recorded." });

      await History({
        userId: user._id,
        movieSeries: movieWebseries,
        uniqueId: uniqueId,
        type: 7,
        date: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
      }).save();
    } else if (type === "false") {
      if (movieWebseries.isAutoUnlockEpisodes) {
        movieWebseries.isAutoUnlockEpisodes = false;
        await movieWebseries.save();
      }

      res.status(200).json({ status: true, message: "Episodes successfully auto unlocked." });

      await History.deleteOne({
        userId: user._id,
        movieSeries: movieWebseries,
        type: 7,
      });
    } else {
      return res.status(200).json({ status: false, message: "type must be passed valid for auto unlock." });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

//retrieves all videos from a specific movie series for a user (web)
exports.loadMovieSeriesVideosForUser = async (req, res) => {
  try {
    if (!req.query.movieSeriesId) {
      return res.status(200).json({ status: false, message: "Oops! Invalid details." });
    }

    if (!mongoose.Types.ObjectId.isValid(req.query.movieSeriesId)) {
      return res.status(200).json({
        status: false,
        message: "Invalid movieSeriesId format. It must be a valid ObjectId.",
      });
    }

    const start = req.query.start ? parseInt(req.query.start) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 50;

    const movieSeriesId = new mongoose.Types.ObjectId(req.query.movieSeriesId);

    if (req.query.userId) {
      const userId = new mongoose.Types.ObjectId(req.query.userId);

      const [user, totalVideosCount, videos] = await Promise.all([
        User.findOne({ _id: userId }).select("_id isBlock coin episodeUnlockAds").lean(),
        ShortVideo.countDocuments({ movieSeries: movieSeriesId }),
        ShortVideo.aggregate([
          {
            $match: {
              movieSeries: new mongoose.Types.ObjectId(movieSeriesId),
            },
          },
          {
            $lookup: {
              from: "movieseries",
              localField: "movieSeries",
              foreignField: "_id",
              as: "movieSeriesDetails",
            },
          },
          {
            $unwind: "$movieSeriesDetails",
          },
          {
            $match: {
              "movieSeriesDetails.isActive": true,
            },
          },
          {
            $lookup: {
              from: "likehistoryofvideos",
              localField: "_id",
              foreignField: "videoId",
              as: "likes",
            },
          },
          {
            $lookup: {
              from: "uservideostatuses",
              let: { videoId: "$_id", userId: userId },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [{ $eq: ["$shortVideoId", "$$videoId"] }, { $eq: ["$userId", "$$userId"] }],
                    },
                  },
                },
              ],
              as: "userVideoStatus",
            },
          },
          {
            $lookup: {
              from: "uservideolists",
              let: { userId, movieSeriesId },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [{ $eq: ["$userId", "$$userId"] }, { $in: ["$$movieSeriesId", "$videos.movieSeries"] }],
                    },
                  },
                },
              ],
              as: "isAddedList",
            },
          },
          {
            $project: {
              _id: 1,
              title: 1,
              description: 1,
              episodeNumber: 1,
              videoImage: 1,
              videoUrl: 1,
              isLocked: {
                $cond: {
                  if: { $gt: [{ $size: "$userVideoStatus" }, 0] },
                  then: { $arrayElemAt: ["$userVideoStatus.isLocked", 0] },
                  else: "$isLocked",
                },
              },
              coin: 1,
              "movieSeriesDetails._id": 1,
              "movieSeriesDetails.name": 1,
              "movieSeriesDetails.description": 1,
              "movieSeriesDetails.thumbnail": 1,
              "movieSeriesDetails.maxAdsForFreeView": 1,
              isLike: { $in: [userId, "$likes.userId"] },
              totalLikes: { $size: "$likes" },
              isAddedList: {
                $cond: [{ $eq: [{ $size: "$isAddedList" }, 0] }, false, true],
              },
              totalAddedToList: {
                $size: {
                  $filter: {
                    input: "$isAddedList",
                    as: "addedList",
                    cond: { $eq: ["$$addedList.userId", userId] },
                  },
                },
              },
            },
          },
          {
            $group: {
              _id: "$movieSeriesDetails._id",
              movieSeriesName: { $first: "$movieSeriesDetails.name" },
              movieSeriesDescription: { $first: "$movieSeriesDetails.description" },
              movieSeriesThumbnail: { $first: "$movieSeriesDetails.thumbnail" },
              movieSeriesMaxAdsForFreeView: { $first: "$movieSeriesDetails.maxAdsForFreeView" },
              isAddedList: { $first: "$isAddedList" },
              totalAddedToList: { $first: "$totalAddedToList" },
              videos: {
                $push: {
                  _id: "$_id",
                  episodeNumber: "$episodeNumber",
                  videoImage: "$videoImage",
                  videoUrl: "$videoUrl",
                  isLocked: "$isLocked",
                  coin: "$coin",
                  isLike: "$isLike",
                  totalLikes: "$totalLikes",
                },
              },
            },
          },
          { $sort: { _id: 1 } },
          { $skip: (start - 1) * limit },
          { $limit: limit },
        ]),
      ]);

      if (!user) {
        return res.status(200).json({ status: false, message: "User not found." });
      }

      if (user.isBlock) {
        return res.status(200).json({ status: false, message: "You are blocked by admin." });
      }

      const episodeUnlockAds = user.episodeUnlockAds.find((ads) => ads?.movieWebseriesId?.toString() === movieSeriesId?.toString());

      const userInfo = {
        coin: user.coin || 0,
        episodeUnlockAds: episodeUnlockAds ? episodeUnlockAds.count : 0,
      };

      return res.status(200).json({
        status: true,
        message: "Retrieved videos from a specific movie series for the user.",
        userInfo: userInfo,
        totalVideosCount: totalVideosCount || 0,
        data: videos[0] || null,
      });
    } else {
      const [totalVideosCount, videos] = await Promise.all([
        ShortVideo.countDocuments({ movieSeries: movieSeriesId }),
        ShortVideo.aggregate([
          {
            $match: {
              movieSeries: new mongoose.Types.ObjectId(movieSeriesId),
            },
          },
          {
            $lookup: {
              from: "movieseries",
              localField: "movieSeries",
              foreignField: "_id",
              as: "movieSeriesDetails",
            },
          },
          {
            $unwind: "$movieSeriesDetails",
          },
          {
            $match: {
              "movieSeriesDetails.isActive": true,
            },
          },
          {
            $lookup: {
              from: "likehistoryofvideos",
              localField: "_id",
              foreignField: "videoId",
              as: "likes",
            },
          },
          {
            $project: {
              _id: 1,
              title: 1,
              description: 1,
              episodeNumber: 1,
              videoImage: 1,
              videoUrl: 1,
              isLocked: 1,
              coin: 1,
              "movieSeriesDetails._id": 1,
              "movieSeriesDetails.name": 1,
              "movieSeriesDetails.description": 1,
              "movieSeriesDetails.thumbnail": 1,
              "movieSeriesDetails.maxAdsForFreeView": 1,
              totalLikes: { $size: "$likes" },
            },
          },
          {
            $group: {
              _id: "$movieSeriesDetails._id",
              movieSeriesName: { $first: "$movieSeriesDetails.name" },
              movieSeriesDescription: { $first: "$movieSeriesDetails.description" },
              movieSeriesThumbnail: { $first: "$movieSeriesDetails.thumbnail" },
              movieSeriesMaxAdsForFreeView: { $first: "$movieSeriesDetails.maxAdsForFreeView" },
              videos: {
                $push: {
                  _id: "$_id",
                  episodeNumber: "$episodeNumber",
                  videoImage: "$videoImage",
                  videoUrl: "$videoUrl",
                  isLocked: "$isLocked",
                  coin: "$coin",
                  isLike: "$isLike",
                  totalLikes: "$totalLikes",
                },
              },
            },
          },
          { $sort: { _id: 1 } },
          { $skip: (start - 1) * limit },
          { $limit: limit },
        ]),
      ]);

      return res.status(200).json({
        status: true,
        message: "Retrieved videos from a specific movie series for the user.",
        totalVideosCount: totalVideosCount || 0,
        data: videos[0] || null,
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};
