#include <WiFi.h>
#include <WiFiClientSecure.h> 
#include <DNSServer.h>
#include <WebServer.h>
#include <Preferences.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

// ================= 1. CẤU HÌNH PHẦN CỨNG =================
const int LED_PINS[] = {25, 26, 27, 14};
const int NUM_LEDS = 4;
const int BUZZER_PIN = 32; 

// Định nghĩa Topic theo cấu trúc: "smartcity/device/{device_id}/{target}"
// LED 1 -> smartcity/device/LED_1/light
// LED 2 -> smartcity/device/LED_2/light
// LED 3 -> smartcity/device/LED_3/light
// LED 4 -> smartcity/device/LED_4/light
// BUZZER -> smartcity/device/BUZZER_1/buzzer

// ================= 2. CẤU HÌNH HIVEMQ CLOUD (TLS 8883) =================
const char* MQTT_SERVER = "21b6b6e71fc04cdb8ab80f011561b98b.s1.eu.hivemq.cloud"; // Tự cấu hình
const int   MQTT_PORT   = 8883; // Tự cấu hình

// ⚠️ Điền Username & Password bạn tạo trong tab Access Management vào đây:
const char* MQTT_USER   = "UserTest"; 
const char* MQTT_PASS   = "1234567890"; 

// MQTT Topics
const char* TOPIC_CONTROL_WILDCARD = "smartcity/device/+/+";       // Sub: Bắt toàn bộ các topic điều khiển
const char* TOPIC_HEARTBEAT        = "smartcity/device/heartbeat"; // Pub: Định kỳ 30s gửi tín hiệu Online & trạng thái thiết bị

// ================= 3. CẤU HÌNH SOFTAP & CAPTIVE PORTAL =================
const char* AP_SSID = "SmartCity_Setup";
const char* AP_PASS = "12345678";

const byte DNS_PORT = 53;
IPAddress apIP(192, 168, 4, 1);

// Các đối tượng hệ thống
DNSServer dnsServer;
WebServer server(80);
Preferences preferences;

WiFiClientSecure espClient; 
PubSubClient mqttClient(espClient);

// Biến trạng thái hệ thống
bool isAPMode = false;
String stored_ssid = "";
String stored_pass = "";

// Biến quản lý thời gian Heartbeat (30s)
unsigned long previousHeartbeatMillis = 0;
const unsigned long HEARTBEAT_INTERVAL = 30000; // 30,000 ms = 30 giây

// ================= 4. LUỒNG HEARTBEAT (30S/LẦN) =================
void sendHeartbeat() {
  if (isAPMode || !mqttClient.connected()) return;

  JsonDocument doc;
  doc["status"] = "ONLINE";
  
  JsonObject devices = doc["devices"].to<JsonObject>();
  for (int i = 0; i < NUM_LEDS; i++) {
    String ledKey = "LED_" + String(i + 1);
    devices[ledKey] = (digitalRead(LED_PINS[i]) == HIGH) ? "ON" : "OFF";
  }
  devices["BUZZER_1"] = (digitalRead(BUZZER_PIN) == HIGH) ? "ON" : "OFF";

  char jsonBuffer[256];
  serializeJson(doc, jsonBuffer);

  mqttClient.publish(TOPIC_HEARTBEAT, jsonBuffer);
  Serial.print("[HEARTBEAT 30s -> HiveMQ Cloud]: ");
  Serial.println(jsonBuffer);
}

// ================= 5. XỬ LÝ NHẬN LỆNH MQTT =================
void setDeviceState(const String& deviceId, const String& target, bool turnOn) {
  int state = turnOn ? HIGH : LOW;

  if (target == "light") {
    if (deviceId == "LED_1") {
      digitalWrite(LED_PINS[0], state);
      Serial.printf("[HARDWARE] LED_1 (Pin %d) -> %s\n", LED_PINS[0], turnOn ? "ON" : "OFF");
    } else if (deviceId == "LED_2") {
      digitalWrite(LED_PINS[1], state);
      Serial.printf("[HARDWARE] LED_2 (Pin %d) -> %s\n", LED_PINS[1], turnOn ? "ON" : "OFF");
    } else if (deviceId == "LED_3") {
      digitalWrite(LED_PINS[2], state);
      Serial.printf("[HARDWARE] LED_3 (Pin %d) -> %s\n", LED_PINS[2], turnOn ? "ON" : "OFF");
    } else if (deviceId == "LED_4") {
      digitalWrite(LED_PINS[3], state);
      Serial.printf("[HARDWARE] LED_4 (Pin %d) -> %s\n", LED_PINS[3], turnOn ? "ON" : "OFF");
    } else {
      // Mặc định mọi ID khác (DEV-CAM-001, ALL, ALL_LEDS,...) -> Bật/Tắt toàn bộ 4 LED
      for (int i = 0; i < NUM_LEDS; i++) {
        digitalWrite(LED_PINS[i], state);
      }
      Serial.printf("[HARDWARE] ALL 4 LEDs (Device: %s) -> %s\n", deviceId.c_str(), turnOn ? "ON" : "OFF");
    }
  } else if (target == "buzzer") {
    digitalWrite(BUZZER_PIN, state);
    Serial.printf("[HARDWARE] BUZZER (Pin %d, Device: %s) -> %s\n", BUZZER_PIN, deviceId.c_str(), turnOn ? "ON" : "OFF");
  } else if (target == "all" || target == "alert") {
    // Bật/Tắt toàn bộ 4 LED + Còi Buzzer cùng lúc
    for (int i = 0; i < NUM_LEDS; i++) {
      digitalWrite(LED_PINS[i], state);
    }
    digitalWrite(BUZZER_PIN, state);
    Serial.printf("[HARDWARE] ALL DEVICES (4 LEDs + Buzzer) -> %s\n", turnOn ? "ON" : "OFF");
  } else {
    Serial.printf("[HARDWARE] Unknown target: %s\n", target.c_str());
  }
}

void mqttCallback(char* topic, byte* payload, unsigned int length) {
  Serial.print("[MQTT Input <- HiveMQ Cloud] Topic [");
  Serial.print(topic);
  Serial.print("]: ");

  String payloadStr = "";
  for (unsigned int i = 0; i < length; i++) {
    payloadStr += (char)payload[i];
  }
  Serial.println(payloadStr);

  // Phân tích Topic: smartcity/device/{device_id}/{target}
  String topicStr = String(topic);
  String prefix = "smartcity/device/";
  if (!topicStr.startsWith(prefix)) {
    return;
  }

  String subPath = topicStr.substring(prefix.length()); // {device_id}/{target}
  int slashIndex = subPath.indexOf('/');
  if (slashIndex == -1) {
    return;
  }

  String deviceId = subPath.substring(0, slashIndex);
  String target = subPath.substring(slashIndex + 1);

  // Lấy command từ payload (hỗ trợ cả JSON {"command": "ON"} và chuỗi thuần "ON"/"OFF")
  String command = "";
  JsonDocument doc;
  DeserializationError error = deserializeJson(doc, payload, length);

  if (!error && doc.containsKey("command")) {
    command = doc["command"].as<String>();
  } else {
    command = payloadStr;
  }
  command.trim();
  command.toUpperCase();

  if (command == "ON" || command == "ALERT_ON" || command == "1" || command == "TRUE") {
    setDeviceState(deviceId, target, true);
  } else if (command == "OFF" || command == "ALERT_OFF" || command == "0" || command == "FALSE") {
    setDeviceState(deviceId, target, false);
  } else {
    Serial.println("[MQTT] Lenh khong hop le: " + command);
  }
}

void reconnectMQTT() {
  while (!mqttClient.connected() && !isAPMode) {
    Serial.print("Dang ket noi HiveMQ Cloud TLS (Port 8883)...");
    String clientId = "ESP32_City_";
    clientId += String(random(0xffff), HEX);

    if (mqttClient.connect(clientId.c_str(), MQTT_USER, MQTT_PASS)) {
      Serial.println(" THANH CONG!");
      // Đăng ký topic wildcard bắt toàn bộ các thiết bị smartcity/device/{device_id}/{target}
      mqttClient.subscribe(TOPIC_CONTROL_WILDCARD);
      Serial.print("Da Subscribe topic: ");
      Serial.println(TOPIC_CONTROL_WILDCARD);

      sendHeartbeat();
    } else {
      Serial.print(" That bai, rc=");
      Serial.print(mqttClient.state());
      Serial.println(" Thu lai sau 5 giay...");
      delay(5000);
    }
  }
}

// ================= 6. XỬ LÝ SOFTAP & CAPTIVE PORTAL =================
void handleRoot() {
  int n = WiFi.scanNetworks();

  String html = "<!DOCTYPE html><html><head>";
  html += "<meta charset='UTF-8'><meta name='viewport' content='width=device-width, initial-scale=1.0'>";
  html += "<title>SmartCity WiFi Setup</title>";
  html += "<style>body{font-family:Arial,sans-serif;background:#eef2f3;text-align:center;padding:20px;}";
  html += ".card{background:white;padding:25px;border-radius:12px;box-shadow:0 4px 10px rgba(0,0,0,0.1);max-width:340px;margin:0 auto;}";
  html += "h2{color:#007bff;margin-bottom:15px;}select,input{width:100%;padding:10px;margin:8px 0;border:1px solid #ccc;border-radius:6px;box-sizing:border-box;font-size:14px;}";
  html += "input[type='submit']{background:#007bff;color:white;font-weight:bold;border:none;cursor:pointer;font-size:16px;margin-top:15px;}</style></head><body>";
  
  html += "<div class='card'><h2>🏙️ SmartCity WiFi Setup</h2>";
  html += "<form action='/save' method='POST'><label style='float:left;font-size:13px;font-weight:bold;'>Chọn mạng Wi-Fi:</label><select name='ssid'>";
  if (n <= 0) {
    html += "<option value=''>Không tìm thấy Wi-Fi nào</option>";
  } else {
    for (int i = 0; i < n; ++i) {
      html += "<option value='" + WiFi.SSID(i) + "'>" + WiFi.SSID(i) + " (" + String(WiFi.RSSI(i)) + " dBm)</option>";
    }
  }
  html += "</select><br><label style='float:left;font-size:13px;font-weight:bold;margin-top:10px;'>Mật khẩu Wi-Fi:</label>";
  html += "<input type='password' name='password' placeholder='Nhập mật khẩu...'>";
  html += "<input type='submit' value='Lưu Cấu Hình & Kết Nối'></form></div></body></html>";

  server.send(200, "text/html; charset=utf-8", html);
}

void handleSave() {
  if (server.hasArg("ssid") && server.hasArg("password")) {
    String new_ssid = server.arg("ssid");
    String new_pass = server.arg("password");

    preferences.begin("wifi-config", false);
    preferences.putString("ssid", new_ssid);
    preferences.putString("password", new_pass);
    preferences.end();

    String response = "<!DOCTYPE html><html><head><meta charset='UTF-8'></head>";
    response += "<body style='text-align:center;font-family:Arial;padding-top:50px;'><h2 style='color:green;'>Lưu Cấu Hình Thành Công!</h2>";
    response += "<p>ESP32 đang khởi động lại để kết nối vào Wi-Fi: <b>" + new_ssid + "</b></p></body></html>";
    
    server.send(200, "text/html; charset=utf-8", response);
    delay(2000);
    ESP.restart(); 
  } else {
    server.send(400, "text/plain", "Thiếu thông tin SSID hoặc Password");
  }
}

void startSoftAP() {
  isAPMode = true;
  WiFi.mode(WIFI_AP);
  WiFi.softAPConfig(apIP, apIP, IPAddress(255, 255, 255, 0));
  WiFi.softAP(AP_SSID, AP_PASS);

  dnsServer.start(DNS_PORT, "*", apIP);
  server.on("/", HTTP_GET, handleRoot);
  server.on("/save", HTTP_POST, handleSave);
  server.onNotFound(handleRoot); 
  server.begin();
}

// ================= 7. SETUP & MAIN LOOP =================
void setup() {
  Serial.begin(115200);
  delay(1000);

  espClient.setInsecure();

  for (int i = 0; i < NUM_LEDS; i++) {
    pinMode(LED_PINS[i], OUTPUT);
    digitalWrite(LED_PINS[i], LOW);
  }
  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);

  preferences.begin("wifi-config", true);
  stored_ssid = preferences.getString("ssid", "");
  stored_pass = preferences.getString("password", "");
  preferences.end();

  if (stored_ssid != "") {
    Serial.print("Đang kết nối Wi-Fi đã lưu: ");
    Serial.println(stored_ssid);

    WiFi.mode(WIFI_STA);
    WiFi.begin(stored_ssid.c_str(), stored_pass.c_str());

    int timeout = 0;
    while (WiFi.status() != WL_CONNECTED && timeout < 20) { 
      delay(500);
      Serial.print(".");
      timeout++;
    }

    if (WiFi.status() == WL_CONNECTED) {
      Serial.println("\n[SUCCESS] Kết nối Wi-Fi thành công! IP: " + WiFi.localIP().toString());

      mqttClient.setServer(MQTT_SERVER, MQTT_PORT);
      mqttClient.setCallback(mqttCallback);
      return; 
    }
  }

  startSoftAP();
}

void loop() {
  if (isAPMode) {
    dnsServer.processNextRequest();
    server.handleClient();
  } else {
    if (!mqttClient.connected()) {
      reconnectMQTT();
    }
    mqttClient.loop();

    unsigned long currentMillis = millis();
    if (currentMillis - previousHeartbeatMillis >= HEARTBEAT_INTERVAL) {
      previousHeartbeatMillis = currentMillis;
      sendHeartbeat();
    }
  }
}