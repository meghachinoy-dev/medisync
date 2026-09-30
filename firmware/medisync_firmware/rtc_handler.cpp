#include "rtc_handler.h"
#include "config.h"
#include <time.h>
#include <sys/time.h>   // settimeofday() on ESP8266

static RTC_DS3231 rtc;
static bool rtcAvailable = false;   // true if a DS3231 answered on I2C
static bool ntpSynced    = false;   // true once NTP has set the system clock

// India Standard Time = UTC+5:30. POSIX TZ writes the offset with the opposite
// sign, so "IST-5:30" means 5h30m AHEAD of UTC. With this set, localtime()
// returns IST everywhere while time() stays true UTC epoch (correct for JS Date).
static const char* TZ_INDIA = "IST-5:30";

bool rtc_init() {
  if (!rtc.begin()) {
    rtcAvailable = false;
    Serial.println(F("[RTC] DS3231 not found on I2C bus — will use NTP over WiFi instead"));
    return false;
  }
  rtcAvailable = true;
  if (rtc.lostPower()) {
    Serial.println(F("[RTC] Power lost (no coin cell?) — setting to compile time"));
    rtc.adjust(DateTime(F(__DATE__), F(__TIME__)));
  }
  rtc_sync_system_time();
  Serial.println(F("[RTC] Initialised (DS3231)"));
  return true;
}

bool rtc_is_available() {
  return rtcAvailable || ntpSynced;   // do we know the real time from ANY source?
}

// ─── NTP fallback ─────────────────────────────────────────────────────────────
// Fetch the real time from the internet. Only needed when the DS3231 is absent,
// but harmless to call otherwise. Requires an active WiFi connection.
void rtc_sync_ntp() {
  if (rtcAvailable) return;   // hardware clock present, no need
  Serial.println(F("[NTP] Syncing time from pool.ntp.org..."));
  configTime(TZ_INDIA, "pool.ntp.org", "time.nist.gov", "time.google.com");

  // Wait (up to ~8s) for the clock to advance past a 2021 sanity threshold.
  time_t now = time(nullptr);
  int tries = 0;
  while (now < 1609459200 && tries < 40) {   // 1609459200 = 2021-01-01
    delay(200);
    now = time(nullptr);
    tries++;
  }

  if (now >= 1609459200) {
    ntpSynced = true;
    char buf[32];
    struct tm* t = localtime(&now);
    strftime(buf, sizeof(buf), "%Y-%m-%d %H:%M:%S", t);
    Serial.print(F("[NTP] Time synced (IST): "));
    Serial.println(buf);
  } else {
    ntpSynced = false;
    Serial.println(F("[NTP] Sync FAILED (no internet time?) — timestamps unavailable"));
  }
}

DateTime rtc_now() {
  if (rtcAvailable) return rtc.now();
  time_t now = time(nullptr);           // NTP-backed system clock (UTC epoch)
  struct tm* t = localtime(&now);       // -> IST via TZ
  return DateTime(t->tm_year + 1900, t->tm_mon + 1, t->tm_mday,
                  t->tm_hour, t->tm_min, t->tm_sec);
}

void rtc_sync_system_time() {
  if (!rtcAvailable) return;            // nothing to copy from
  DateTime now = rtc.now();
  struct tm t = {};
  t.tm_year = now.year() - 1900;
  t.tm_mon  = now.month() - 1;
  t.tm_mday = now.day();
  t.tm_hour = now.hour();
  t.tm_min  = now.minute();
  t.tm_sec  = now.second();
  time_t epoch = mktime(&t);
  struct timeval tv = { .tv_sec = epoch, .tv_usec = 0 };
  settimeofday(&tv, nullptr);
  Serial.print(F("[RTC] System time synced: "));
  Serial.println(epoch);
}

bool rtc_time_matches(const char* hhmm, int shiftMinutes) {
  DateTime now = rtc_now();
  long nowSecs = (long)now.hour() * 3600 + now.minute() * 60 + now.second();

  int h, m;
  sscanf(hhmm, "%d:%d", &h, &m);
  long targetSecs = (long)h * 3600 + m * 60 - shiftMinutes * 60;
  if (targetSecs < 0) targetSecs = 0;
  if (targetSecs > 86399) targetSecs = 86399;

  long diff = abs(nowSecs - targetSecs);
  return diff <= DOSE_MATCH_WINDOW_S;
}

void rtc_get_time_str(char* buf, int bufLen) {
  DateTime now = rtc_now();
  snprintf(buf, bufLen, "%02d:%02d", now.hour(), now.minute());
}

void rtc_get_date_str(char* buf, int bufLen) {
  DateTime now = rtc_now();
  snprintf(buf, bufLen, "%04d-%02d-%02d", now.year(), now.month(), now.day());
}

long rtc_seconds_today() {
  DateTime now = rtc_now();
  return (long)now.hour() * 3600 + now.minute() * 60 + now.second();
}
