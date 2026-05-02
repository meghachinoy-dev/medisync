#include "rtc_handler.h"
#include "config.h"
#include <time.h>

static RTC_DS3231 rtc;

bool rtc_init() {
  if (!rtc.begin()) {
    Serial.println(F("[RTC] DS3231 not found on I2C bus!"));
    return false;
  }
  if (rtc.lostPower()) {
    // RTC lost power — set to compile time as a fallback
    Serial.println(F("[RTC] Power lost, setting to compile time"));
    rtc.adjust(DateTime(F(__DATE__), F(__TIME__)));
  }
  rtc_sync_system_time();
  Serial.println(F("[RTC] Initialised"));
  return true;
}

DateTime rtc_now() {
  return rtc.now();
}

void rtc_sync_system_time() {
  DateTime now = rtc.now();
  // Convert DateTime to Unix timestamp and set system time
  struct tm t = {};
  t.tm_year = now.year() - 1900;
  t.tm_mon  = now.month() - 1;
  t.tm_mday = now.day();
  t.tm_hour = now.hour();
  t.tm_min  = now.minute();
  t.tm_sec  = now.second();
  time_t epoch = mktime(&t);
  // On ESP8266 we set the internal RTC via settimeofday
  struct timeval tv = { .tv_sec = epoch, .tv_usec = 0 };
  settimeofday(&tv, nullptr);
  Serial.print(F("[RTC] System time synced: "));
  Serial.println(epoch);
}

bool rtc_time_matches(const char* hhmm, int shiftMinutes) {
  DateTime now = rtc.now();
  long nowSecs = (long)now.hour() * 3600 + now.minute() * 60 + now.second();

  int h, m;
  sscanf(hhmm, "%d:%d", &h, &m);
  long targetSecs = (long)h * 3600 + m * 60 - shiftMinutes * 60;
  // Clamp to day boundary
  if (targetSecs < 0) targetSecs = 0;
  if (targetSecs > 86399) targetSecs = 86399;

  long diff = abs(nowSecs - targetSecs);
  return diff <= DOSE_MATCH_WINDOW_S;
}

void rtc_get_time_str(char* buf, int bufLen) {
  DateTime now = rtc.now();
  snprintf(buf, bufLen, "%02d:%02d", now.hour(), now.minute());
}

void rtc_get_date_str(char* buf, int bufLen) {
  DateTime now = rtc.now();
  snprintf(buf, bufLen, "%04d-%02d-%02d", now.year(), now.month(), now.day());
}

long rtc_seconds_today() {
  DateTime now = rtc.now();
  return (long)now.hour() * 3600 + now.minute() * 60 + now.second();
}
