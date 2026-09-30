#include "lcd_display.h"
#include <Wire.h>

static LiquidCrystal_I2C lcd(LCD_I2C_ADDR, LCD_COLS, LCD_ROWS);
static bool lcdPresent = false;

// Prepare the shared I2C bus once, with a clock-stretch timeout so a stuck or
// slow device can NEVER hang the sketch forever (root cause of the boot freeze).
void i2c_bus_begin() {
  Wire.begin();                     // NodeMCU defaults: SDA=GPIO4(D2), SCL=GPIO5(D1)
  Wire.setClockStretchLimit(1500);  // microseconds; bail out instead of hanging
}

// Print every address that ACKs on the I2C bus. Purely diagnostic.
void i2c_scan() {
  Serial.println(F("[I2C] Scanning bus..."));
  int found = 0;
  for (uint8_t addr = 1; addr < 127; addr++) {
    Wire.beginTransmission(addr);
    if (Wire.endTransmission() == 0) {
      Serial.print(F("[I2C]   device at 0x"));
      Serial.println(addr, HEX);
      found++;
    }
  }
  if (found == 0) Serial.println(F("[I2C]   NONE found — check SDA/SCL/power/pull-ups"));
}

// Return true if a device ACKs at the given address.
static bool i2c_present(uint8_t addr) {
  Wire.beginTransmission(addr);
  return Wire.endTransmission() == 0;
}

// Helper: write two padded lines
static void lcd_write(const char* l1, const char* l2) {
  if (!lcdPresent) return;   // no display wired — skip silently
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print(l1);
  lcd.setCursor(0, 1);
  lcd.print(l2);
}

void lcd_init() {
  // Probe first — if nothing ACKs at the LCD address, skip lcd.init() entirely
  // so a missing/faulty display can never freeze the boot.
  if (!i2c_present(LCD_I2C_ADDR)) {
    lcdPresent = false;
    Serial.print(F("[LCD] not found at 0x"));
    Serial.print(LCD_I2C_ADDR, HEX);
    Serial.println(F(" — skipping (device will still run headless)"));
    return;
  }
  lcdPresent = true;
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
