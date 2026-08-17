#include "esp_camera.h"
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <vector>

const char *ssid = "Moni";
const char *password = "giaogiaogiao";

#define CAMERA_MODEL_AI_THINKER
#include "camera_pins.h"

#define PART_BOUNDARY "123456789000000000000987654321"

static const char *STREAM_HEADER =
    "HTTP/1.1 200 OK\r\n"
    "Access-Control-Allow-Origin: *\r\n"
    "Content-Type : multipart/x-mixed-replace;boundary=" PART_BOUNDARY "\r\n\r\n";

WiFiServer server(80);
std::vector<WiFiClient> clients;

const char *MQTT_SERVER = "21b6b6e71fc04cdb8ab80f011561b98b.s1.eu.hivemq.cloud";
const int MQTT_PORT = 8883;

const char *MQTT_USER = "UserTest";
const char *MQTT_PASS = "1234567890";

const char *DEVICE_ID = "DEV-CAM-001";
const char *TOPIC_HEARTBEAT = "smartcity/device/DEV-CAM-001/heartbeat";

WiFiClientSecure espClient;
PubSubClient mqttClient(espClient);

unsigned long previousHeartbeatMillis = 0;
const unsigned long HEARTBEAT_INTERVAL = 30000;

void sendHeartbeat()
{
  if (!mqttClient.connected())
    return;

  JsonDocument doc;
  doc["device_id"] = DEVICE_ID;
  doc["status"] = "ONLINE";
  doc["clients_connected"] = clients.size();

  char jsonBuffer[160];
  serializeJson(doc, jsonBuffer);

  mqttClient.publish(TOPIC_HEARTBEAT, jsonBuffer);

  Serial.print("[HEARTBEAT -> HiveMQ Cloud]: ");
  Serial.println(jsonBuffer);
}

void reconnectMQTT()
{
  while (!mqttClient.connected())
  {
    Serial.print("Dang ket noi HiveMQ Cloud TLS (Port 8883)...");
    String clientId = String(DEVICE_ID) + "_";
    clientId += String(random(0xffff), HEX);

    if (mqttClient.connect(clientId.c_str(), MQTT_USER, MQTT_PASS))
    {
      Serial.println(" THANH CONG!");
      sendHeartbeat();
    }
    else
    {
      Serial.print(" That bai, rc=");
      Serial.print(mqttClient.state());
      Serial.println(" Thu lai sau 5 giay...");
      delay(5000);
    }
  }
}

void setup()
{
  Serial.begin(115200);
  Serial.setDebugOutput(true);
  Serial.println();

  espClient.setInsecure();

  camera_config_t config;
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer = LEDC_TIMER_0;
  config.pin_d0 = Y2_GPIO_NUM;
  config.pin_d1 = Y3_GPIO_NUM;
  config.pin_d2 = Y4_GPIO_NUM;
  config.pin_d3 = Y5_GPIO_NUM;
  config.pin_d4 = Y6_GPIO_NUM;
  config.pin_d5 = Y7_GPIO_NUM;
  config.pin_d6 = Y8_GPIO_NUM;
  config.pin_d7 = Y9_GPIO_NUM;
  config.pin_xclk = XCLK_GPIO_NUM;
  config.pin_pclk = PCLK_GPIO_NUM;
  config.pin_vsync = VSYNC_GPIO_NUM;
  config.pin_href = HREF_GPIO_NUM;
  config.pin_sscb_sda = SIOD_GPIO_NUM;
  config.pin_sscb_scl = SIOC_GPIO_NUM;
  config.pin_pwdn = PWDN_GPIO_NUM;
  config.pin_reset = RESET_GPIO_NUM;
  config.xclk_freq_hz = 20000000;
  config.pixel_format = PIXFORMAT_JPEG;

  config.frame_size = FRAMESIZE_QQVGA;
  config.jpeg_quality = 30;
  config.fb_count = 2;


  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK)
  {
    Serial.printf("Lỗi khởi tạo Camera: 0x%x", err);
    return;
  }

  sensor_t *s = esp_camera_sensor_get();
  s->set_vflip(s, 1);
  s->set_hmirror(s, 1);

  WiFi.begin(ssid, password);
  Serial.print("Đang kết nối Wi-Fi");
  while (WiFi.status() != WL_CONNECTED)
  {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWi-Fi đã kết nối!");

  mqttClient.setServer(MQTT_SERVER, MQTT_PORT);

  server.begin();

  Serial.print("-> URL Luồng Video (Hỗ trợ xem đồng thời): http://");
  Serial.print(WiFi.localIP());
  Serial.println("/stream");
}

void loop()
{
  if (!mqttClient.connected())
  {
    reconnectMQTT();
  }
  mqttClient.loop();

  unsigned long currentMillis = millis();
  if (currentMillis - previousHeartbeatMillis >= HEARTBEAT_INTERVAL)
  {
    previousHeartbeatMillis = currentMillis;
    sendHeartbeat();
  }

  WiFiClient newClient = server.available();
  if (newClient)
  {
    newClient.print(STREAM_HEADER);
    clients.push_back(newClient);
    Serial.printf("-> [ESP32] Có thiết bị mới kết nối! Tổng số thiết bị: %d\n", clients.size());
  }

  if (!clients.empty())
  {
    camera_fb_t *fb = esp_camera_fb_get();
    if (fb)
    {
      char part_buf[128];
      size_t hlen = snprintf(part_buf, sizeof(part_buf),
                             "--" PART_BOUNDARY "\r\n"
                             "Content-Type: image/jpeg\r\n"
                             "Content-Length: %u\r\n\r\n",
                             fb->len);

      for (int i = clients.size() - 1; i >= 0; i--)
      {
        if (clients[i].connected())
        {
          clients[i].write((const uint8_t *)part_buf, hlen);
          clients[i].write(fb->buf, fb->len);
          clients[i].write((const uint8_t *)"\r\n", 2);
        }
        else
        {
          clients[i].stop();
          clients.erase(clients.begin() + i);
          Serial.printf("-> [ESP32] Một thiết bị đã ngắt kết nối. Còn lại: %d\n", clients.size());
        }
      }
      esp_camera_fb_return(fb);
    }
  }
  else
  {
    delay(10);
  }
}
