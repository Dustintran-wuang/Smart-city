#include "esp_camera.h"
#include <WiFi.h>
#include <vector> // Thư viện mảng động để chứa danh sách nhiều kết nối

const char *ssid = "Moni";
const char *password = "giaogiaogiao";

#define CAMERA_MODEL_AI_THINKER
#include "camera_pins.h"

#define PART_BOUNDARY "123456789000000000000987654321"

// HTTP Header tiêu chuẩn cho luồng MJPEG Stream + Cho phép Web React kết nối (CORS)
static const char* STREAM_HEADER = 
  "HTTP/1.1 200 OK\r\n"
  "Access-Control-Allow-Origin: *\r\n"
  "Content-Type: multipart/x-mixed-replace;boundary=" PART_BOUNDARY "\r\n\r\n";

// Khởi tạo Server Socket ở port 80
WiFiServer server(80);

// Mảng lưu danh sách các thiết bị đang xem stream (Python, Web...)
std::vector<WiFiClient> clients;

void setup() {
  Serial.begin(115200);
  Serial.setDebugOutput(true);
  Serial.println();

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

  if (psramFound()) {
    config.frame_size = FRAMESIZE_QVGA; // 320x240 để mượt khi gửi nhiều thiết bị
    config.jpeg_quality = 12;
    config.fb_count = 2;
  } else {
    Serial.println("-> Không tìm thấy PSRAM, chuyển về độ phân giải thấp!");
    config.frame_size = FRAMESIZE_QVGA;
    config.jpeg_quality = 12;
    config.fb_count = 1;
  }

  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("Lỗi khởi tạo Camera: 0x%x", err);
    return;
  }

  sensor_t *s = esp_camera_sensor_get();
  s->set_vflip(s, 1);
  s->set_hmirror(s, 1);

  WiFi.begin(ssid, password);
  Serial.print("Đang kết nối Wi-Fi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWi-Fi đã kết nối!");

  // Bắt đầu mở Server
  server.begin();

  Serial.print("-> URL Luồng Video (Hỗ trợ xem đồng thời): http://");
  Serial.print(WiFi.localIP());
  Serial.println("/stream");
}

void loop() {
  // 1. Kiểm tra xem có thiết bị mới kết nối không (Python hoặc Web)
  WiFiClient newClient = server.available();
  if (newClient) {
    // Gửi Header chào mừng HTTP Stream cho thiết bị mới
    newClient.print(STREAM_HEADER);
    clients.push_back(newClient);
    Serial.printf("-> [ESP32] Có thiết bị mới kết nối! Tổng số thiết bị: %d\n", clients.size());
  }

  // 2. Nếu có ít nhất 1 thiết bị đang kết nối, tiến hành chụp và gửi ảnh
  if (!clients.empty()) {
    camera_fb_t *fb = esp_camera_fb_get();
    if (fb) {
      char part_buf[128];
      size_t hlen = snprintf(part_buf, sizeof(part_buf),
        "--" PART_BOUNDARY "\r\n"
        "Content-Type: image/jpeg\r\n"
        "Content-Length: %u\r\n\r\n", fb->len);

      // Duyệt ngược mảng để gửi ảnh tới tất cả các kết nối
      for (int i = clients.size() - 1; i >= 0; i--) {
        if (clients[i].connected()) {
          // Bắn khung hình cho client
          clients[i].write((const uint8_t*)part_buf, hlen);
          clients[i].write(fb->buf, fb->len);
          clients[i].write((const uint8_t*)"\r\n", 2);
        } else {
          // Ngắt kết nối nếu client đã đóng trang/thoát app
          clients[i].stop();
          clients.erase(clients.begin() + i);
          Serial.printf("-> [ESP32] Một thiết bị đã ngắt kết nối. Còn lại: %d\n", clients.size());
        }
      }
      
      // Trả lại bộ nhớ đệm cho camera
      esp_camera_fb_return(fb);
    }
  } else {
    // Nếu không ai xem stream thì nghỉ 10ms để tránh nóng chip
    delay(10);
  }
}