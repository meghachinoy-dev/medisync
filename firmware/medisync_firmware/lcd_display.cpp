#include "lcd_display.h"

static LiquidCrystal_I2C lcd(LCD_I2C_ADDR, LCD_COLS, LCD_ROWS);

// Helper: write two padded lines
static void lcd_write(const char* l1, const char* l2) {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print(l1);
  lcd.setCursor(0, 1);
  lcd.print(l2);
}

void lcd_init() {
  lcd.init();
  lcd.backlight();
  lcd_write("  MediSync IoT  ", "  Initialising  ");
  delay(1200);
  Serial.println(F("[LCD] Initialised"));
}

void lcd_show_medicine_due(const char* name, const char* time) {
  char line2[17] = {};
  // Truncate name to fit with time on 16 chars
  int timeLen = strlen(time);
  int nameMax = LCD_COLS - timeLen - 1;
  char truncName[17] = {};
  strncpy(truncName, name, min((int)strlen(name), nameMax));
  snprintf(line2, sizeof(line2), "%-*s %s", nameMax, truncName, time);
  lcd_write("  TAKE MEDICINE ", line2);
}

void lcd_show_taken() {
  lcd_write("Dose Dispensed! ", "   Thank you :) ");
}

void lcd_show_missed(const char* name) {
  char line2[17] = {};
  snprintf(line2, sizeof(line2), "%-16s", name);
  lcd_write("   DOSE MISSED  ", line2);
}

void lcd_show_idle(const char* timeStr, const char* dateStr) {
  char line2[17] = {};
  // Format: "HH:MM  DD/MM/YY"
  // dateStr format: "YYYY-MM-DD" → convert to "DD/MM/YY"
  char day[3] = {dateStr[8], dateStr[9], 0};
  char mon[3] = {dateStr[5], dateStr[6], 0};
  char yr[3]  = {dateStr[2], dateStr[3], 0};
  snprintf(line2, sizeof(line2), "%s  %s/%s/%s   ", timeStr, day, mon, yr);
  lcd_write("  MediSync IoT  ", line2);
}

void lcd_show_low_stock(int compartment, int remaining) {
  char line2[17] = {};
  snprintf(line2, sizeof(line2), "Comp%d: %d left   ", compartment, remaining);
  lcd_write("  LOW STOCK!    ", line2);
}

void lcd_show_wifi_connecting() {
  lcd_write("Connecting WiFi ", "Please wait...  ");
}

void lcd_show_wifi_connected(const char* ssid) {
  char line2[17] = {};
  snprintf(line2, sizeof(line2), "%-16s", ssid);
  lcd_write("WiFi Connected! ", line2);
}

void lcd_show_syncing() {
  lcd_write("Syncing Firebase", "                ");
}

void lcd_show_message(const char* line1, const char* line2) {
  lcd_write(line1, line2);
}

void lcd_clear() {
  lcd.clear();
}
