//express
const express = require("express");
const route = express.Router();

//require client's route.js
const user = require("./user.route");
const report = require("./report.route");
const userVideoList = require("./userVideoList.route");
const setting = require("./setting.route");
const adRewardCoin = require("./adRewardCoin.route");
const dailyCoinReward = require("./dailyRewardCoin.route");
const history = require("./history.route");
const category = require("./category.route");
const movieSeries = require("./movieSeries.route");
const shortVideo = require("./shortVideo.route");
const watchHistory = require("./watchHistory.route");
const coinplan = require("./coinplan.route");
const vipPlan = require("./vipPlan.route");
const contentpage = require("./contentPage.route");

//exports client's route.js
route.use("/user", user);
route.use("/report", report);
route.use("/userVideoList", userVideoList);
route.use("/setting", setting);
route.use("/adRewardCoin", adRewardCoin);
route.use("/dailyCoinReward", dailyCoinReward);
route.use("/history", history);
route.use("/category", category);
route.use("/movieSeries", movieSeries);
route.use("/shortVideo", shortVideo);
route.use("/watchHistory", watchHistory);
route.use("/coinplan", coinplan);
route.use("/vipPlan", vipPlan);
route.use("/contentpage", contentpage);

module.exports = route;
