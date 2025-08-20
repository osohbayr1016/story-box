import 'dart:convert';
import 'dart:developer';

import 'package:get/get.dart';
import 'package:http/http.dart' as http;
import 'package:story_box/ui/home_page/controller/home_controller.dart';
import 'package:story_box/ui/home_page/model/new_releases_video_model.dart';
import 'package:story_box/utils/api.dart';
import 'package:story_box/utils/app_exception.dart';
import 'package:story_box/utils/params.dart';
import 'package:story_box/utils/utils.dart';

class NewReleasesVideoApi {
  NewReleasesVideoModel? newReleasesVideoModel;

  HomeController homeController = Get.find<HomeController>();

  Future<NewReleasesVideoModel?> callApi({
    required String userId,
    required String start,
    required String limit,
  }) async {
    try {
      homeController.startNewReleaseCount++;

      final queryParameters = {
        Params.userId: userId,
        Params.start: start,
        Params.limit: limit,
      };

      String queryString = Uri(queryParameters: queryParameters).query;

      log("New Releases Video Params :: $queryString");

      final url = Uri.parse(ApiConstant.getBaseURL() + ApiConstant.newReleasesVideo + queryString);
      log("New Releases Video Url :: $url");

      final headers = {"key": ApiConstant.SECRET_KEY, 'Content-Type': 'application/json'};
      log("New Releases Video Headers :: $headers");

      final response = await http.get(url, headers: headers);

      log("New Releases Video Status Code :: ${response.statusCode}");
      log("New Releases Video Response :: ${response.body}");

      if (response.statusCode == 200) {
        final jsonResponse = jsonDecode(response.body);
        return NewReleasesVideoModel.fromJson(jsonResponse);
      }
      log("New Releases Video Api Called Successfully");
    } on AppException catch (exception) {
      Utils.showToast(Get.context!, exception.message);
    } catch (e) {
      log("Error call New Releases Video Api :: $e");
    } finally {}
    return null;
  }
}
