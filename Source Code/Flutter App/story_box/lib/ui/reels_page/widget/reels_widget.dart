import 'dart:async';
import 'dart:developer';

import 'package:chewie/chewie.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:lottie/lottie.dart';
import 'package:readmore/readmore.dart';
import 'package:share_plus/share_plus.dart';
import 'package:story_box/custom_widget/create_repprt/report_bottom_sheet_ui.dart';
import 'package:story_box/custom_widget/custom_icon_button.dart';
import 'package:story_box/main.dart';
import 'package:story_box/routes/app_routes.dart';
import 'package:story_box/ui/reels_page/api/create_favorite_video_api.dart';
import 'package:story_box/ui/reels_page/api/create_like_dislike_of_video_api.dart';
import 'package:story_box/ui/reels_page/controller/reels_controller.dart';
import 'package:story_box/utils/asset.dart';
import 'package:story_box/utils/branch_io_services.dart';
import 'package:story_box/utils/color.dart';
import 'package:story_box/utils/constant.dart';
import 'package:story_box/utils/enums.dart';
import 'package:story_box/utils/font_style.dart';
import 'package:story_box/utils/preference.dart';
import 'package:story_box/utils/utils.dart';
import 'package:vibration/vibration.dart';
import 'package:video_player/video_player.dart';

class PreviewReelsView extends StatefulWidget {
  const PreviewReelsView({super.key, required this.index, required this.currentPageIndex});

  final int index;
  final int currentPageIndex;

  @override
  State<PreviewReelsView> createState() => _PreviewReelsViewState();
}

class _PreviewReelsViewState extends State<PreviewReelsView> with SingleTickerProviderStateMixin, WidgetsBindingObserver {
  final controller = Get.find<ReelsController>();

  ChewieController? chewieController;
  VideoPlayerController? videoPlayerController;

  RxBool isPlaying = true.obs;
  RxBool isShowIcon = false.obs;

  RxBool isBuffering = false.obs;
  RxBool isVideoLoading = true.obs;

  RxBool isShowLikeAnimation = false.obs;
  RxBool isShowLikeIconAnimation = false.obs;

  RxBool isReelsPage = true.obs; // This is Use to Stop Auto Playing..

  RxBool isLike = false.obs;
  RxBool isFavorite = false.obs;

  RxMap customChanges = {"like": 0, "favorite": 0}.obs;

  RxBool isReadMore = false.obs;
  int? startTime; // Track when CustomTabAdWebView was opened
  double dragDeltaX = 0;
  RxInt seekAmount = 0.obs;
  RxBool showSeekOverlay = false.obs;
  @override
  void initState() {
    initializeVideoPlayer();
    customSetting();
    200.milliseconds.delay();
    log('ISFAVOUTITE :: ${controller.mainReels[widget.index].isAddedList} ==== ${controller.mainReels[widget.index].movieSeriesName}');
    WidgetsBinding.instance.addObserver(this);
    super.initState();
  }

  @override
  void dispose() {
    onDisposeVideoPlayer();
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  Set<int> processedIndices = {}; // Add this at class level
  RxBool isAdLoading = false.obs;
  RxDouble sliderValue = 0.0.obs;
  RxBool isAutoScrollEnabled = Preference.isAutoScrollEnabled.obs;

  Future<void> initializeVideoPlayer() async {
    try {
      String videoPath = controller.mainReels[widget.index].videos?.videoUrl ?? "";
      videoPlayerController = VideoPlayerController.networkUrl(Uri.parse(videoPath));
      await videoPlayerController?.initialize();

      if (videoPlayerController != null && (videoPlayerController?.value.isInitialized ?? false)) {
        chewieController = ChewieController(
          videoPlayerController: videoPlayerController!,
          looping: true,
          allowedScreenSleep: false,
          allowMuting: false,
          showControlsOnInitialize: false,
          showControls: false,
          maxScale: 1,
        );
        isVideoLoading.value = false;
        if (widget.index == widget.currentPageIndex && isReelsPage.value) {
          log("play reels");
          log("Video Completed !!! ${widget.index}");
          onPlayVideo();
        }
      } else {
        isVideoLoading.value = true;
      }

      videoPlayerController?.addListener(
        () {
          log("Video Player Listener Called");
          // Use => If Video Buffering then show loading....
          (videoPlayerController?.value.isBuffering ?? false) ? isBuffering.value = true : isBuffering.value = false;
          if (videoPlayerController?.value.isInitialized ?? false) {
            final position = videoPlayerController?.value.position ?? Duration.zero;
            final duration = videoPlayerController?.value.duration ?? Duration.zero;

            // Update slider value
            if (duration.inMilliseconds > 0) {
              sliderValue.value = position.inMilliseconds / duration.inMilliseconds;
            }
          }
          if (isReelsPage.value == false) {
            onStopVideo(); // Use => On Change Routes...
          }
          if (videoPlayerController!.value.position.inSeconds >= videoPlayerController!.value.duration.inSeconds) {
            videoPlayerController?.seekTo(Duration.zero);
            onPlayVideo();
            onVideoCompleted(widget.index);
            log("Video Completed !!! ${widget.index}");
          }
        },
      );
    } catch (e) {
      onDisposeVideoPlayer();
      Utils.showLog(
        "Reels Video Initialization Failed !!! ${widget.index} => $e",
      );
    }
  }

  void onVideoCompleted(int index) {
    // Delay to ensure video is marked watched before changing page
    if (isAutoScrollEnabled.value == true) {
      Future.delayed(const Duration(milliseconds: 600), () {
        controller.preloadPageController.animateToPage(
          index + 1,
          duration: const Duration(milliseconds: 500),
          curve: Curves.easeInOut,
        );
      });
    }
  }

  void onStopVideo() {
    isPlaying.value = false;
    videoPlayerController?.pause();
  }

  void onPlayVideo() {
    isPlaying.value = true;
    videoPlayerController?.play();
  }

  void onDisposeVideoPlayer() {
    try {
      onStopVideo();
      videoPlayerController?.dispose();
      chewieController?.dispose();
      chewieController = null;
      videoPlayerController = null;
      isVideoLoading.value = true;
    } catch (e) {
      Utils.showLog(">>>> On Dispose VideoPlayer Error => $e", level: LogLevels.error);
    }
  }

  void customSetting() {
    isLike.value = controller.mainReels[widget.index].videos?.isLike ?? false;
    isFavorite.value = controller.mainReels[widget.index].isAddedList ?? false;
    customChanges["like"] = int.parse("${controller.mainReels[widget.index].videos?.totalLikes ?? 0}");
    customChanges["favorite"] = int.parse("${controller.mainReels[widget.index].totalAddedToList ?? 0}");
    controller.update();
  }

  void onClickVideo() async {
    if (isVideoLoading.value == false) {
      videoPlayerController!.value.isPlaying ? onStopVideo() : onPlayVideo();
      isShowIcon.value = true;
      await 2.seconds.delay();
      isShowIcon.value = false;
    }
    if (isReelsPage.value == false) {
      isReelsPage.value = true; // Use => On Back Reels Page...
    }
  }

  void onClickPlayPause() async {
    videoPlayerController!.value.isPlaying ? onStopVideo() : onPlayVideo();
    if (isReelsPage.value == false) {
      isReelsPage.value = true; // Use => On Back Reels Page...
    }
  }

  Future<void> onClickLike() async {
    if (isLike.value) {
      isLike.value = false;
      customChanges["like"]--;
      controller.update(["onGetLikeCount"]);
    } else {
      isLike.value = true;
      customChanges["like"]++;
      controller.update(["onGetLikeCount"]);
    }

    Vibration.vibrate(duration: 50, amplitude: 128);

    isShowLikeIconAnimation.value = true;
    await 500.milliseconds.delay();
    isShowLikeIconAnimation.value = false;

    await CreateLikeDislikeOfVideoApi.callApi(
      loginUserId: Preference.userId,
      videoId: controller.mainReels[widget.index].videos?.id ?? "",
    );
  }

  // Future<void> onClickFavorite() async {
  //   await CreateFavoriteVideoApi.callApi(
  //     loginUserId: Preference.userId,
  //     movieSeriesId: controller.mainReels[widget.index].id ?? "",
  //   );
  //   if (isFavorite.value) {
  //     isFavorite.value = false;
  //     customChanges["favorite"]--;
  //     controller.update(["onGetFavCount"]);
  //   } else {
  //     isFavorite.value = true;
  //     customChanges["favorite"]++;
  //     controller.update(["onGetFavCount"]);
  //   }
  //   Vibration.vibrate(duration: 50, amplitude: 128);
  // }
  Future<void> onClickFavorite() async {
    await CreateFavoriteVideoApi.callApi(
      loginUserId: Preference.userId,
      movieSeriesId: controller.mainReels[widget.index].id ?? "",
    );
    if (isFavorite.value) {
      isFavorite.value = false;
      customChanges["favorite"]--;
      controller.mainReels[widget.index].isAddedList = isFavorite.value;
      controller.update(["onGetFavCount"]);
    } else {
      isFavorite.value = true;
      customChanges["favorite"]++;
      controller.mainReels[widget.index].isAddedList = isFavorite.value;
      controller.update(["onGetFavCount"]);
    }

    Vibration.vibrate(duration: 50, amplitude: 128);
  }

  Future<void> onDoubleClick() async {
    if (isLike.value) {
      isLike.value = false;
      customChanges["like"]--;
    } else {
      isLike.value = true;
      customChanges["like"]++;

      isShowLikeAnimation.value = true;
      Vibration.vibrate(duration: 50, amplitude: 128);
      await 1200.milliseconds.delay();
      isShowLikeAnimation.value = false;
    }

    await CreateLikeDislikeOfVideoApi.callApi(
      loginUserId: Preference.userId,
      videoId: controller.mainReels[widget.index].videos?.id ?? "",
    );
  }

  Future<void> seekBy(int seconds) async {
    final current = videoPlayerController?.value.position ?? Duration.zero;
    final total = videoPlayerController?.value.duration ?? Duration.zero;

    final newPosition = current + Duration(seconds: seconds);

    final clamped = Duration(
      seconds: newPosition.inSeconds.clamp(0, total.inSeconds),
    );

    await videoPlayerController?.seekTo(clamped);
  }

  @override
  Widget build(BuildContext context) {
    if (widget.index == widget.currentPageIndex) {
      // Use => Play Current Video On Scrolling...
      isReadMore.value = false;
      (isVideoLoading.value == false && isReelsPage.value) ? onPlayVideo() : null;
    } else {
      // Restart Previous Video On Scrolling...
      isVideoLoading.value == false ? videoPlayerController?.seekTo(Duration.zero) : null;
      onStopVideo(); // Stop Previous Video On Scrolling...
    }
    return Scaffold(
      body: SizedBox(
        height: Get.height,
        width: Get.width,
        child: Stack(
          children: [
            GestureDetector(
              onTap: onClickVideo,
              onHorizontalDragStart: (_) {
                dragDeltaX = 0;
                showSeekOverlay.value = true;
              },
              onHorizontalDragUpdate: (details) {
                dragDeltaX += details.delta.dx;

                // Every 10px → 1 second
                int seconds = (dragDeltaX / 10).round();

                // Clamp between -20 and +20 seconds
                seconds = seconds.clamp(-20, 20);
                seekAmount.value = seconds;
              },
              onHorizontalDragEnd: (_) async {
                if (seekAmount.value != 0) {
                  await seekBy(seekAmount.value);
                }

                showSeekOverlay.value = false;
                seekAmount.value = 0;
              },
              // onDoubleTap: onDoubleClick,
              child: Container(
                color: AppColor.colorBlack,
                height: (Get.height - Constant.bottomBarSize),
                width: Get.width,
                child: Obx(
                  () => isVideoLoading.value
                      ? const Align(alignment: Alignment.bottomCenter, child: LinearProgressIndicator(color: AppColor.colorPrimary))
                      : SizedBox.expand(
                          child: FittedBox(
                            fit: BoxFit.cover,
                            child: SizedBox(
                              width: videoPlayerController?.value.size.width ?? 0,
                              height: videoPlayerController?.value.size.height ?? 0,
                              child: Chewie(controller: chewieController!),
                            ),
                          ),
                        ),
                ),
              ),
            ),
            Obx(
              () => Visibility(
                visible: isShowLikeAnimation.value,
                child: Align(
                  alignment: Alignment.center,
                  child: Lottie.asset(
                    AppAsset.lottieGift,
                    fit: BoxFit.cover,
                    height: 300,
                    width: 300,
                  ),
                ),
              ),
            ),
            Obx(() => Align(
                  alignment: Alignment.center,
                  child: isPlaying.value
                      ? const SizedBox()
                      : GestureDetector(
                          onTap: onClickPlayPause,
                          child: SizedBox(
                            height: 50,
                            width: 50,
                            child: Center(
                              child: Image.asset(
                                AppAsset.icPlay,
                                // width: 30,
                                // height: 30,
                                color: AppColor.colorWhite.withOpacity(0.8),
                              ),
                            ),
                          ),
                        ),
                )),
            Positioned(
              bottom: 0,
              child: Obx(
                () => Visibility(
                  visible: (isVideoLoading.value == false),
                  child: Container(
                    height: Get.height / 4,
                    width: Get.width,
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [AppColor.transparent, AppColor.colorBlack.withOpacity(0.7)],
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                      ),
                    ),
                  ),
                ),
              ),
            ),
            Positioned(
              right: 10,
              child: Container(
                padding: const EdgeInsets.only(top: 30, bottom: 85),
                height: Get.height,
                width: 50,
                child: Column(
                  children: [
                    const Spacer(),
                    10.height,
                    Obx(
                      () => SizedBox(
                        height: 40,
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 300),
                          height: isShowLikeIconAnimation.value ? 15 : 50,
                          width: isShowLikeIconAnimation.value ? 15 : 50,
                          alignment: Alignment.center,
                          child: CustomIconButton(
                            icon: isLike.value ? AppAsset.icSelectedLike : AppAsset.icLike,
                            callback: onClickLike,
                            iconSize: 34,
                            // iconColor: isLike.value ? AppColor.colorRedContainer : AppColor.colorWhite,
                          ),
                        ),
                      ),
                    ),
                    GetBuilder<ReelsController>(
                        id: 'onGetLikeCount',
                        builder: (context) {
                          return Text(
                            CustomFormatNumber.convert(customChanges["like"]),
                            style: AppFontStyle.styleW700(AppColor.colorWhite, 14),
                          );
                        }),
                    15.height,
                    Obx(
                      () => SizedBox(
                        height: 40,
                        child: Container(
                          height: 40,
                          width: 40,
                          alignment: Alignment.center,
                          child: Padding(
                            padding: const EdgeInsets.only(left: 3.0),
                            child: CustomIconButton(
                              icon: isFavorite.value ? AppAsset.icFavoriteSelected : AppAsset.icFavorite,
                              callback: onClickFavorite,
                              iconSize: 36,
                            ),
                          ),
                        ),
                      ),
                    ),
                    GetBuilder<ReelsController>(
                        id: 'onGetFavCount',
                        builder: (context) {
                          return Text(
                            CustomFormatNumber.convert(customChanges["favorite"]),
                            style: AppFontStyle.styleW700(AppColor.colorWhite, 14),
                          );
                        }),
                    15.height,
                    controller.mainReels[widget.index].totalVideos == 1
                        ? const SizedBox.shrink()
                        : Column(
                            children: [
                              CustomIconButton(
                                icon: AppAsset.icList,
                                circleSize: 40,
                                callback: () {
                                  onStopVideo();
                                  isReelsPage.value = false;
                                  Get.toNamed(
                                    AppRoutes.episodeWiseReels,
                                    arguments: {
                                      "id": controller.mainReels[widget.index].videos?.id ?? "",
                                      "movieSeriesId": controller.mainReels[widget.index].id ?? "",
                                      "totalVideos": controller.mainReels[widget.index].totalVideos,
                                      "isNavigateOnHome": true
                                    },
                                  )?.then(
                                    (value) {
                                      onPlayVideo();
                                    },
                                  );
                                },
                                iconSize: 30,
                                iconColor: AppColor.colorWhite,
                              ),
                              Text(
                                EnumLocal.episode.name.tr,
                                style: AppFontStyle.styleW700(AppColor.colorWhite, 12),
                              ),
                              15.height,
                            ],
                          ),
                    CustomIconButton(
                      icon: AppAsset.icShare,
                      circleSize: 40,
                      callback: () async {
                        await BranchIoServices.onCreateBranchIoLink(
                          image: controller.mainReels[widget.index].videos?.videoImage ?? "",
                          movieSeriesId: controller.mainReels[widget.index].id ?? "",
                          contentType: "episode",
                          episodeNumber: 0,
                          totalVideos: controller.mainReels[widget.index].totalVideos ?? 0,
                          movieName: controller.mainReels[widget.index].movieSeriesName ?? "",
                          title: controller.mainReels[widget.index].movieSeriesName ?? "",
                          description: controller.mainReels[widget.index].movieSeriesDescription ?? "",
                        );

                        final link = await BranchIoServices.onGenerateLink();

                        if (link != null) {
                          Share.share(link);
                        }
                        isReelsPage.value = false;
                      },
                      iconSize: 30,
                      iconColor: AppColor.colorWhite,
                    ),
                    Text(
                      EnumLocal.share.name.tr,
                      style: AppFontStyle.styleW700(AppColor.colorWhite, 14),
                    ),
                    15.height,
                    CustomIconButton(
                      icon: AppAsset.icMore,
                      circleSize: 40,
                      callback: () async {
                        ReportBottomSheetUi.show(context: context, eventId: controller.mainReels[widget.index].id ?? "", eventType: 1);
                      },
                      iconSize: 24,
                      iconColor: AppColor.colorWhite,
                    ),
                    60.height,
                  ],
                ),
              ),
            ),
            Positioned(
              left: 15,
              bottom: 20,
              child: SizedBox(
                height: 400,
                width: Get.width / 1.5,
                child: Align(
                  alignment: Alignment.bottomLeft,
                  child: SingleChildScrollView(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        Text(
                          controller.mainReels[widget.index].movieSeriesName ?? "",
                          style: AppFontStyle.styleW700(AppColor.colorWhite, 18),
                          overflow: TextOverflow.ellipsis,
                          maxLines: 1,
                        ),
                        6.height,
                        Visibility(
                          visible: controller.mainReels[widget.index].movieSeriesDescription?.trim().isNotEmpty ?? false,
                          child: ReadMoreText(
                            controller.mainReels[widget.index].movieSeriesDescription ?? "",
                            trimMode: TrimMode.Line,
                            trimLines: 3,
                            style: AppFontStyle.styleW500(AppColor.colorWhite, 14),
                            colorClickableText: AppColor.colorPrimary,
                            trimCollapsedText: ' Show more',
                            trimExpandedText: ' Show less',
                            moreStyle: AppFontStyle.styleW500(AppColor.colorPrimary, 13.5),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
            // Positioned(
            //   bottom: 0,
            //   left: 0,
            //   right: 0,
            //   child: GestureDetector(
            //     onTap: () {
            //       isControlsVisible.value = true;
            //       // startHideControlsTimer();
            //     },
            //     child: Obx(
            //       () => Visibility(
            //         visible: isControlsVisible.value,
            //         child: Column(
            //           mainAxisSize: MainAxisSize.min,
            //           children: [
            //             // Slimmer Slider
            //             SliderTheme(
            //               data: SliderTheme.of(context).copyWith(
            //                 trackHeight: 2.5,
            //                 thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 8.0, disabledThumbRadius: 8.0),
            //                 overlayShape: const RoundSliderOverlayShape(overlayRadius: 16.0),
            //               ),
            //               child: Slider(
            //                 value: sliderValue.value,
            //                 onChanged: (value) async {
            //                   final duration = videoPlayerController?.value.duration ?? Duration.zero;
            //                   final newPosition = duration * value;
            //                   await videoPlayerController?.seekTo(newPosition);
            //                 },
            //                 activeColor: AppColor.colorPrimary,
            //                 inactiveColor: AppColor.colorWhite.withOpacity(0.3),
            //               ),
            //             ),
            //           ],
            //         ),
            //       ),
            //     ),
            //   ),
            // ),
            Positioned(
              bottom: 0,
              right: 0,
              left: 0,
              child: GestureDetector(
                onHorizontalDragStart: (_) {
                  dragDeltaX = 0;
                  showSeekOverlay.value = true;
                },
                onHorizontalDragUpdate: (details) {
                  dragDeltaX += details.delta.dx;

                  // Every 10px → 1 second
                  int seconds = (dragDeltaX / 10).round();

                  // Clamp between -20 and +20 seconds
                  seconds = seconds.clamp(-20, 20);
                  seekAmount.value = seconds;
                },
                onHorizontalDragEnd: (_) async {
                  if (seekAmount.value != 0) {
                    await seekBy(seekAmount.value);
                  }

                  showSeekOverlay.value = false;
                  seekAmount.value = 0;
                },
                child: Obx(
                  () => LinearProgressIndicator(
                    value: sliderValue.value,
                    backgroundColor: AppColor.colorWhite.withOpacity(0.2),
                    valueColor: AlwaysStoppedAnimation<Color>(AppColor.colorPrimary),
                    minHeight: 3,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class CustomFormatNumber {
  static String convert(int number) {
    if (number >= 10000000) {
      double millions = number / 1000000;
      return '${millions.toStringAsFixed(1)}M';
    } else if (number >= 1000) {
      double thousands = number / 1000;
      return '${thousands.toStringAsFixed(1)}k';
    } else {
      return number.toString();
    }
  }
}
