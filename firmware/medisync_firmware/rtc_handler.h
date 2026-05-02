#ifndef RTC_HANDLER_H
#define RTC_HANDLER_H

#include <Arduino.h>
#include <RTClib.h>

// ─── Initialise DS3231 over I2C ───────────────────────────────────────────────
bool rtc_init();

// ─── Get current time as a DateTime object ────────────────────────────────────
DateTime rtc_now();

// ─── Sync system epoch time from DS3231 (needed for time() in Firebase code) ──
void rtc_sync_system_time();

// ─── Returns true if the current second matches "HH:MM" ± DOSE_MATCH_WINDOW_S ─
bool rtc_time_matches(const char* hhmm, int shiftMinutes);

// ─── Format current time as "HH:MM" into buffer ───────────────────────────────
void rtc_get_time_str(char* buf, int bufLen);

// ─── Format current date as "YYYY-MM-DD" into buffer ─────────────────────────
void rtc_get_date_str(char* buf, int bufLen);

// ─── Return seconds since midnight ────────────────────────────────────────────
long rtc_seconds_today();

#endif // RTC_HANDLER_H
