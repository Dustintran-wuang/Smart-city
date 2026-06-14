#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

#define RED_LIGHT 21
#define YELLOW_LIGHT 22
#define GREEN_LIGHT 23

unsigned int timeRed = 5;
unsigned int timeYellow = 2;
unsigned int timeGreen = 4;

const char* ssid = "Wokwi-GUEST"; //Chạy giả lập 
const char* password = "";        //Chạy giả lập
const char* mqtt_server = "a46f7c1729084df7bcd94b64791d9897.s1.eu.hivemq.cloud";
const int mqtt_port = 8883;
const char* mqtt_user = "phamtung";
const char* mqtt_pass = "...";

const char* sub_topic = "iot/traffic_light/config";

WiFiClientSecure espClient;
PubSubClient client(espClient);

enum TrafficState {STATE_RED, STATE_YELLOW, STATE_GREEN};
TrafficState currentState = STATE_RED;

//millis nên xài kiểu dữ liệu long để tránh tràn dữ liệu
unsigned long previousMillis = 0;            //kiểm tra currentMillis chạy đến ở chu kỳ trước
unsigned long currentPeriod = timeRed * 1000; //đổi sang miligiây

void setup_wifi() {
  delay(10);
  Serial.println("\nConnecting to WiFi...");
  WiFi.begin(ssid, password);
  while(WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected");
}

//Hàm tiếp nhận chuỗi JSON gửi xuống từ web và xử lý chuyển đổi
// payload là con trỏ trỏ vào vùng dữ liệu thô được đẩy thông qua giao thức MQTT
void callback(char* topic, byte* payload, unsigned int  length) {
  Serial.print("\n[MQTT] Nhận cấu hình mới từ topic: ");
  Serial.println(topic);

  String messageTemp = "";

  //Phần này được sử dụng để chuyển đổi từ Byte sang string dựa trên length ???
  for (int i = 0; i < length; i++) {
    messageTemp += (char)payload[i]; //Ép chuyển đổi sang kiểu dữ liệu mà chương trình có thể đọc được
  }

  //để debug kiểm tra chuỗi JSON nhận được 
  Serial.print("Nội dung chuỗi JSON: ");
  Serial.println(messageTemp);

  JsonDocument doc;
  DeserializationError error = deserializeJson(doc, messageTemp);

  if (error) {
    Serial.print("Giải mã JSON thât bại: ");
    Serial.println(error.c_str());
    return;
  }

  if (doc.containsKey("red")) {
    timeRed = doc["red"];
    Serial.printf("Đổi thời gian Đỏ thành: %lu giây\n", timeRed);
  }

  if (doc.containsKey("yellow")) {
    timeYellow = doc["yellow"];
    Serial.printf("Đổi thời gian Vàng thành: %lu giây\n", timeYellow);
  }
  if (doc.containsKey("green")) {
    timeGreen = doc["green"];
    Serial.printf("Đổi thời gian Xanh thành: %lu giây\n", timeGreen);
  }
}

void reconnect() {
  while (!client.connected()) {
    Serial.print("Connecting to MQTT Broker...");
    String clientId = "ESP32_Tung_";
    clientId += String (random(0, 0xffff), HEX); //???

    if(client.connect(clientId.c_str(), mqtt_user, mqtt_pass)) {
      Serial.println("Thành công");

      client.subscribe (sub_topic);
      Serial.printf("Đã subcribe kênh: %s\n", sub_topic);
    } else {
      Serial.print("Thất bại, mã lỗi rc=");
      Serial.print(client.state());
      Serial.println("Thử lại sáu 5 giây...");
      delay(5000);
    }
  }
}

void setup() {
  // put your setup code here, to run once:
  Serial.begin(115200);
  pinMode(RED_LIGHT, OUTPUT);
  pinMode(YELLOW_LIGHT, OUTPUT);
  pinMode(GREEN_LIGHT, OUTPUT);

  setup_wifi();
  espClient.setInsecure();

  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(callback);
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();
  
  //khác với delay() thì millis() chạy như là một đồng hồ dưới nền không ảnh hưởng hẳng tới phần cứng như delay() 
  //vì vậy nó được sử dụng như là một hàm điều kiện hơn
  unsigned int currentMillis = millis(); 

  if (currentMillis - previousMillis >= currentPeriod) {
    previousMillis = currentMillis;

    if(currentState == STATE_RED) {
      currentState = STATE_GREEN;
      currentPeriod = timeGreen * 1000;
      Serial.println("Green turned on");
    }

    else if(currentState == STATE_GREEN) {
      currentState = STATE_YELLOW;
      currentPeriod = timeYellow * 1000;
      Serial.println("Yellow turned on");

    }

    else if(currentState == STATE_YELLOW) {
      currentState = STATE_RED;
      currentPeriod = timeRed * 1000;
      Serial.println("Red turned on");

    } 
  }

  if (currentState == STATE_RED) {
    digitalWrite(RED_LIGHT, HIGH);
    digitalWrite(YELLOW_LIGHT, LOW);
    digitalWrite(GREEN_LIGHT, LOW);
  }

  else if (currentState == STATE_YELLOW) {
    digitalWrite(RED_LIGHT, LOW);
    digitalWrite(YELLOW_LIGHT, HIGH);
    digitalWrite(GREEN_LIGHT, LOW);
  }
  
  else if (currentState == STATE_GREEN) {
    digitalWrite(RED_LIGHT, LOW);
    digitalWrite(YELLOW_LIGHT, LOW);
    digitalWrite(GREEN_LIGHT, HIGH);
  }
}
