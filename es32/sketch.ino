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

const char* DEVICE_ID = "ESP32_CABIN_01";

// ================= 2. CẤU HÌNH HIVEMQ CLOUD (TLS 8883) =================
const char* MQTT_SERVER = ""; //Tự cấu hình
const int   MQTT_PORT   = 8883; //Tự cấu hình

// ⚠️ Điền Username & Password bạn tạo trong tab Access Management vào đây:
const char* MQTT_USER   = "your_hivemq_username"; 
const char* MQTT_PASS   = "your_hivemq_password"; 

// MQTT Topics
const char* TOPIC_CONTROL   = "smarttruck/device/control";   // Sub: Nhận lệnh Bật/Tắt từ Web/Mobile
const char* TOPIC_HEARTBEAT = "smarttruck/device/heartbeat"; // Pub: Định kỳ 30s gửi tín hiệu Online về Backend

// ================= 3. CẤU HÌNH SOFTAP & CAPTIVE PORTAL =================
const char* AP_SSID = "SmartTruck_Setup";
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
bool isAlertActive = false;
String stored_ssid = "";
String stored_pass = "";

// Biến quản lý thời gian Heartbeat (30s)
unsigned long previousHeartbeatMillis = 0;
const unsigned long HEARTBEAT_INTERVAL = 30000; // 30,000 ms = 30 giây

// ================= 4. LUỒNG HEARTBEAT (30S/LẦN) =================
void sendHeartbeat() {
  if (isAPMode || !mqttClient.connected()) return;

  JsonDocument doc;
  doc["device_id"]    = DEVICE_ID;
  doc["status"]       = "ONLINE";
  doc["alert_status"] = isAlertActive ? "ON" : "OFF";

  char jsonBuffer[128];
  serializeJson(doc, jsonBuffer);

  mqttClient.publish(TOPIC_HEARTBEAT, jsonBuffer);
  Serial.print("[HEARTBEAT 30s -> HiveMQ Cloud]: ");
  Serial.println(jsonBuffer);
}

// ================= 5. ĐIỀU KHIỂN PHẦN CỨNG (4 LED + BUZZER) =================
void setAlertState(bool enable) {
  isAlertActive = enable;

  for (int i = 0; i < NUM_LEDS; i++) {
    digitalWrite(LED_PINS[i], enable ? HIGH : LOW);
  }
  digitalWrite(BUZZER_PIN, enable ? HIGH : LOW);

  Serial.println(enable ? "[HARDWARE] BAT CANH BAO (4 LED ON + BUZZER ON)" 
                        : "[HARDWARE] TAT CANH BAO (4 LED OFF + BUZZER OFF)");
}

void mqttCallback(char* topic, byte* payload, unsigned int length) {
  Serial.print("[MQTT Input <- HiveMQ Cloud] Topic [");
  Serial.print(topic);
  Serial.println("]");

  JsonDocument doc;
  DeserializationError error = deserializeJson(doc, payload, length);

  if (!error && doc.containsKey("command")) {
    String command = doc["command"].as<String>();
    command.toUpperCase();

    if (command == "ON" || command == "ALERT_ON") {
      setAlertState(true);
    } else if (command == "OFF" || command == "ALERT_OFF") {
      setAlertState(false);
    }
  }
}

void reconnectMQTT() {
  while (!mqttClient.connected() && !isAPMode) {
    Serial.print("Dang ket noi HiveMQ Cloud TLS (Port 8883)...");
    String clientId = "ESP32_Truck_";
    clientId += String(random(0xffff), HEX);

    if (mqttClient.connect(clientId.c_str(), MQTT_USER, MQTT_PASS)) {
      Serial.println(" THANH CONG!");
      mqttClient.subscribe(TOPIC_CONTROL);
      Serial.print("Da Subscribe topic: ");
      Serial.println(TOPIC_CONTROL);

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
  html += "<title>SmartTruck WiFi Setup</title>";
  html += "<style>body{font-family:Arial,sans-serif;background:#eef2f3;text-align:center;padding:20px;}";
  html += ".card{background:white;padding:25px;border-radius:12px;box-shadow:0 4px 10px rgba(0,0,0,0.1);max-width:340px;margin:0 auto;}";
  html += "h2{color:#007bff;margin-bottom:15px;}select,input{width:100%;padding:10px;margin:8px 0;border:1px solid #ccc;border-radius:6px;box-sizing:border-box;font-size:14px;}";
  html += "input[type='submit']{background:#007bff;color:white;font-weight:bold;border:none;cursor:pointer;font-size:16px;margin-top:15px;}</style></head><body>";
  
  html += "<div class='card'><h2>🚘 SmartTruck WiFi Setup</h2>";
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