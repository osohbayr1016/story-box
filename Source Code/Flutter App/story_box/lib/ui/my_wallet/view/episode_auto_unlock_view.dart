import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:story_box/custom_widget/no_data_widget.dart';
import 'package:story_box/main.dart';
import 'package:story_box/shimmer/transaction_history_shimmer.dart';
import 'package:story_box/ui/my_wallet/controller/wallet_controller/wallet_controller.dart';
import 'package:story_box/utils/asset.dart';
import 'package:story_box/utils/color.dart';
import 'package:story_box/utils/enums.dart';
import 'package:story_box/utils/font_style.dart';

class EpisodeAutoUnlockView extends StatelessWidget {
  const EpisodeAutoUnlockView({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColor.colorBlack,
      appBar: AppBar(
        backgroundColor: AppColor.colorBlack,
        centerTitle: true,
        leading: GestureDetector(
          child: const Icon(
            Icons.arrow_back_ios,
            color: Colors.white,
          ),
          onTap: () => Get.back(),
        ),
        title: Text(
          EnumLocal.episodesOnAutoUnlock.name.tr,
          style: AppFontStyle.styleW600(AppColor.colorWhite, 20),
        ),
      ),
      body: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
        child: SingleChildScrollView(
          child: Column(
            children: [
              GetBuilder<WalletController>(
                id: 'episodeAutoUnlock',
                builder: (walletController) {
                  return walletController.isEpisodeAutoUnlockLoading
                      ? const TransactionHistoryShimmer()
                      : walletController.episodeAutoUnlock.isEmpty
                          ? Center(child: NoDataWidget(text: EnumLocal.youDontHaveAnyEpisodesOnAutoUnlockYet.name.tr)).paddingOnly(top: Get.height * .25)
                          : ListView.builder(
                              shrinkWrap: true,
                              physics: const NeverScrollableScrollPhysics(),
                              itemCount: walletController.episodeAutoUnlock.length,
                              itemBuilder: (context, index) {
                                final item = walletController.episodeAutoUnlock[index];
                                return Padding(
                                  padding: const EdgeInsets.only(bottom: 22),
                                  child: Row(
                                    children: [
                                      ClipRRect(
                                        borderRadius: BorderRadius.circular(6),
                                        child: CachedNetworkImage(
                                          imageUrl: item.thumbnail ?? '',
                                          placeholder: (context, url) => Center(
                                            child: Image.asset(
                                              AppAsset.placeHolderImage,
                                              // fit: BoxFit.cover,
                                              color: AppColor.colorIconGrey,
                                            ).paddingAll(16),
                                          ),
                                          errorWidget: (context, url, error) => const Icon(Icons.error, color: Colors.red),
                                          fit: BoxFit.cover,
                                          height: 80,
                                          width: 60,
                                        ),
                                      ),
                                      8.width,
                                      Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            item.name ?? '',
                                            style: AppFontStyle.styleW600(AppColor.colorWhite, 16),
                                          ),
                                          2.height,
                                          // Text(
                                          //   'Played to Episode ${item.uniqueId ?? 0}',
                                          //   style: AppFontStyle.styleW500(AppColor.colorIconGrey, 12),
                                          // ),
                                          Text(
                                            ' ${item.date ?? 0}',
                                            style: AppFontStyle.styleW500(AppColor.colorIconGrey, 12),
                                          ),
                                        ],
                                      ),
                                      const Spacer(),
                                      Switch(
                                        value: walletController.switchStates[index],
                                        activeColor: AppColor.colorWhite,
                                        activeTrackColor: AppColor.primaryColor,
                                        inactiveThumbColor: AppColor.colorWhite,
                                        inactiveTrackColor: AppColor.greyColor,
                                        // trackOutlineColor: WidgetStatePropertyAll(AppColor.greyColor),
                                        // trackColor: WidgetStatePropertyAll(AppColor.primaryColor),
                                        onChanged: (value) {
                                          walletController.onSwitch(index, value, item.movieSeriesId);
                                        },
                                      ),
                                    ],
                                  ),
                                );
                              },
                            );
                },
              ),
              // 26.height,
              // Text(
              //   'That\'s all for now',
              //   style: AppFontStyle.styleW600(AppColor.greyColor, 14),
              // ),
            ],
          ),
        ),
      ),
    );
  }
}
