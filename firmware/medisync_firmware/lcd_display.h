#ifndef LCD_DISPLAY_H
#define LCD_DISPLAY_H

#include <Arduino.h>
#include <LiquidCrystal_I2C.h>
#include "config.h"

// ─── Initialise 16x2 I2C LCD ─────────────────────────────────────────────────
void lcd_init();

// ─── Show medicine due alert ──────────────────────────────────────────────────
// Line 1: "TAKE MEDICINE"
// Line 2: "<name> <time>"
void lcd_show_medicine_due(const char* name, const char* time);

// ─── Confirm dose taken ───────────────────────────────────────────────────────
// Line 1: "Dose Dispensed!"
// Line 2: "Thank you :)"
void lcd_show_taken();

// ─── Missed dose ──────────────────────────────────────────────────────────────
void lcd_show_missed(const char* name);

// ─── Idle clock screen ────────────────────────────────────────────────────────
// Line 1: "  MediSync IoT  "
// Line 2: "HH:MM  DD/MM/YY"
void lcd_show_idle(const char* timeStr, const char* dateStr);

// ─── Low stock warning ────────────────────────────────────────────────────────
// Line 1: "LOW STOCK!"
// Line 2: "Comp<N>: <X> left"
void lcd_show_low_stock(int compartment, int remaining);

// ─── WiFi connecting status ───────────────────────────────────────────────────
void lcd_show_wifi_connecting();

// ─── WiFi connected ───────────────────────────────────────────────────────────
void lcd_show_wifi_connected(const char* ssid);

// ─── Firebase syncing ─────────────────────────────────────────────────────────
void lcd_show_syncing();

// ─── Generic two-line message ─────────────────────────────────────────────────
void lcd_show_message(const char* line1, const char* line2);

// ─── Clear the display ────────────────────────────────────────────────────────
void lcd_clear();

#endif // LCD_DISPLAY_H
