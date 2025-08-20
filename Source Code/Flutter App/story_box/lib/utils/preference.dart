import 'dart:async';
import 'dart:convert';
import 'dart:developer';

import 'package:get/get.dart';
import 'package:get_storage/get_storage.dart';

/* global class for handle all the preference activity into application */

class Preference {
  // Preference key
  static const String selectedLanguage = "SELECTED_LANGUAGE";
  static const String selectedCountryCode = "SELECTED_COUNTRY_CODE";

  static const String FCM_TOKEN = "FCM_TOKEN";
  static const String IDENTITY = "IDENTITY";

  static const String isFirstTimeOpenApp = "IS_FIRST_TIME_OPEN_APP";
  static const String userData = "USER_DATA";
  static const String USER_ID = "USER_ID";
  static const String USER_COIN = "USER_COIN";
  static const String LANGUAGE = "LANGUAGE";
  static const String IS_LOGIN = "IS_LOGIN";
  static const String IS_VIP = "IS_VIP";
  static const String IS_CHECK = "IS_CHECK";
  static const String accessToken = "ACCESS_TOKEN";
  static const String isShowNotificationBadge = "IS_SHOW_NOTIFICATION_BADGE";
  static const String weekday = "WEEKDAY";
  static const String lastWeekWatchTime = "LAST_WEEK_WATCH_TIME";
  static const String nextAdTaskTime = "NEXT_AD_TASK_TIME";
  static const String lastRewardDate = "LAST_REWARD_DATE";
  static const String NOTIFICATION = "NOTIFICATION";
  static const String name = "name";
  static const String uniqueId = "uniqueId";
  static const String loginType = "loginType";
  static const String profilePic = "profilePic";
  static const String IS_AUTO_SCROLL = "IS_AUTO_SCROLL";

  // ------------------ SINGLETON -----------------------
  static final Preference _preference = Preference._internal();

  factory Preference() {
    return _preference;
  }

  Preference._internal();

  static Preference get shared => _preference;

  static GetStorage? _pref;

  /* make connection with preference only once in application */
  Future<GetStorage?> instance() async {
    if (_pref != null) return _pref;
    await GetStorage.init().then((value) {
      if (value) {
        _pref = GetStorage();
      }
    }).catchError((onError) {
      _pref = null;
    });
    return _pref;
  }

  String? getString(String key) {
    return _pref!.read(key);
  }

  Future<void> setString(String key, String value) {
    return _pref!.write(key, value);
  }

  int? getInt(String key) {
    return _pref!.read(key);
  }

  Future<void> setInt(String key, int value) {
    return _pref!.write(key, value);
  }

  bool? getBool(String key) {
    return _pref!.read(key);
  }

  Future<void> setBool(String key, bool value) {
    return _pref!.write(key, value);
  }

  // Double get & set
  double? getDouble(String key) {
    return _pref!.read(key);
  }

  Future<void> setDouble(String key, double value) {
    return _pref!.write(key, value);
  }

  // Array get & set
  List<String>? getStringList(String key) {
    return _pref!.read(key);
  }

  Future<void> setStringList(String key, List<String> value) {
    return _pref!.write(key, value);
  }

  /* remove element from preferences */
  Future<void> remove(key, [multi = false]) async {
    GetStorage? pref = await instance();
    if (multi) {
      key.forEach((f) async {
        return await pref!.remove(f);
      });
    } else {
      return await pref!.remove(key);
    }

    pref!.erase();
  }

  /* remove all elements from preferences */
  static Future<bool> clear() async {
    // return await _pref.clear();
    _pref!.getKeys().forEach((key) async {
      await _pref!.remove(key);
    });

    _pref!.erase();

    return Future.value(true);
  }

  static Future<bool> clearToken() async {
    return Future.value(true);
  }

  static Future<bool> clearLogout() async {
    return Future.value(true);
  }

  // >>>>> Watch Time Database <<<<<

  static int get lastOpenWeekDay => _pref?.read(weekday) ?? 0;

  static int dayWiseWatchTime(int day) => _pref?.read("$day") ?? 0;

  static int get lastWeekWatchTimes => _pref?.read(lastWeekWatchTime) ?? 0;
  static bool get isAutoScrollEnabled => _pref?.read(IS_AUTO_SCROLL) ?? true;

  static Future<void> setAutoScrollEnabled(bool value) async => await _pref?.write(IS_AUTO_SCROLL, value);

  static RxInt userCoin = RxInt(_pref?.read(USER_COIN) ?? 0);

  // static int get language => _pref?.read(LANGUAGE) ?? 0;

  static String get fcmToken => _pref?.read(FCM_TOKEN) ?? "";

  static String get identity => _pref?.read(IDENTITY) ?? "";

  static String get userId => _pref?.read(USER_ID) ?? "";

  static bool get isLogin => _pref?.read(IS_LOGIN) ?? false;

  static bool get isVip => _pref?.read(IS_VIP) ?? false;

  static bool get isAutoCheck => _pref?.read(IS_CHECK) ?? false;

  static bool get notification => _pref?.read(NOTIFICATION) ?? false;

  static onSetUserID(String userId) async => await _pref?.write(USER_ID, userId);

  static onIsLogin(bool isLogin) async => await _pref?.write(IS_LOGIN, isLogin);

  static onIsVip(bool isVip) async => await _pref?.write(IS_VIP, isVip);

  static onIsAutoCheck(bool isCheck) async => await _pref?.write(IS_CHECK, isCheck);

  static onIsNotification(bool isCheck) async => await _pref?.write(NOTIFICATION, isCheck);

  static onSetDayWiseWatchTime(int day, int watchTime) async => await _pref?.write("$day", watchTime);

  static onSetLastOpenWeekDay(int weekDay) async => await _pref?.write(weekday, weekDay);

  static onSetFcmToken(String fcmToken) async => await _pref?.write(FCM_TOKEN, fcmToken);

  static onSetIdentity(String identity) async => await _pref?.write(IDENTITY, identity);

  static onSetLastWeekWatchTime(int watchTime) async => await _pref?.write(lastWeekWatchTime, watchTime);

  static onSetUserCoin(int coin) async {
    userCoin.value = coin;
    await _pref?.write(USER_COIN, coin);
  }

  static onSetLanguage(int language) async => await _pref?.write(LANGUAGE, language);

  // *** Watch Ad History Database ***

  static int? get nextAdTaskTimes => _pref?.read(nextAdTaskTime);

  static onSetNextAdTaskTime(int nextAdTaskTimes) async => await _pref?.write(nextAdTaskTime, nextAdTaskTimes);

  static String? get lastRewardDates => _pref?.read(lastRewardDate);

  static onSetLastRewardDate(String lastRewardDates) async => await _pref?.write(lastRewardDates, lastRewardDates);

// *** Watch Ad History Database ***

  static const String watchedVideos = "WATCHED_VIDEOS";

  // static Future<void> addVideoToHistory(Map<String, dynamic> videoData) async {
  //   try {
  //     final existingHistory = getWatchedVideos();
  //     final videoId = videoData['id'];
  //
  //     final existingIndex = existingHistory.indexWhere((video) => video['id'] == videoId);
  //     if (existingIndex != -1) {
  //       existingHistory[existingIndex] = videoData;
  //     } else {
  //       existingHistory.add(videoData);
  //       log('Video added to history: $videoData');
  //     }
  //
  //     await _pref?.write(watchedVideos, jsonEncode(existingHistory));
  //     log('SAVE DATA :: $existingHistory');
  //   } catch (e) {
  //     log('Error saving video to history: $e');
  //   }
  // }

  static Future<void> addVideoToHistory(Map<String, dynamic> videoData) async {
    log("Watch History Adding Method Call Success");

    try {
      final List existingHistory = await getWatchedVideos();

      final videoId = videoData['id'];

      await 200.milliseconds.delay();

      RxBool isAvailable = false.obs;

      for (int i = 0; i < existingHistory.length; i++) {
        if (videoId != existingHistory[i]["id"]) {
          isAvailable.value = false;
        } else {
          existingHistory.removeAt(i);
          100.milliseconds.delay();
          isAvailable.value = true;
        }
      }
      existingHistory.insert(0, videoData);
      await _pref?.write(watchedVideos, jsonEncode(existingHistory));
    } catch (e) {
      log('Error saving video to history: $e');
    }
  }

  static Future<List> getWatchedVideos() async {
    final jsonString = await _pref?.read(watchedVideos) ?? "[]";
    final List<dynamic> jsonList = jsonDecode(jsonString);
    return jsonList;
  }

  static Future<void> clearWatchedVideos() async {
    await _pref?.write(watchedVideos, "[]");
    _pref!.erase();
  }

  // *** search History Database ***

  static const String searchVideos = "SEARCH_VIDEOS";

  static Future<void> addSearchToHistory(String searchTerm) async {
    try {
      final existingHistory = getSearchHistory();
      if (!existingHistory.contains(searchTerm)) {
        log("save search history :: $existingHistory}");
        existingHistory.add(searchTerm);
        await _pref?.write(searchVideos, jsonEncode(existingHistory));
        log("Search term added: $searchTerm");
      }
    } catch (e) {
      log("Error adding search term to history: $e");
    }
  }

  /// Retrieve the search history
  static List<String> getSearchHistory() {
    try {
      final jsonString = _pref?.read(searchVideos) ?? "[]";
      final List<dynamic> jsonList = jsonDecode(jsonString);
      return jsonList.cast<String>();
    } catch (e) {
      log("Error retrieving search history: $e");
      return [];
    }
  }

  /// Delete a specific search term from the history
  static Future<void> deleteSearchFromHistory(String searchTerm) async {
    try {
      final existingHistory = getSearchHistory();
      if (existingHistory.contains(searchTerm)) {
        existingHistory.remove(searchTerm);
        await _pref?.write(searchVideos, jsonEncode(existingHistory));
        log("Search term deleted: $searchTerm");
      }
    } catch (e) {
      log("Error deleting search term from history: $e");
    }
  }

  /// Clear the entire search history
  static Future<void> clearSearchHistory() async {
    try {
      await _pref?.write(searchVideos, jsonEncode([]));
      log("Search history cleared");
    } catch (e) {
      log("Error clearing search history: $e");
    }
  }

  static int get language {
    final value = _pref?.read(LANGUAGE);
    log("Language: >>>>>$value");
    log("Language: >>>>>int.tryParse(value?.toString() ?? '') ?? 0${int.tryParse(value?.toString() ?? '') ?? 0}");
    // Safely parse to int or return a default value
    return int.tryParse(value?.toString() ?? '') ?? 0;
  }
}
