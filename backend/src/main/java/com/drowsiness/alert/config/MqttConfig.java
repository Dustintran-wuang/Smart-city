package com.drowsiness.alert.config;

import java.time.LocalDateTime;
import java.util.Optional;

import org.eclipse.paho.client.mqttv3.MqttConnectOptions;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.integration.annotation.ServiceActivator;
import org.springframework.integration.channel.DirectChannel;
import org.springframework.integration.core.MessageProducer;
import org.springframework.integration.mqtt.core.DefaultMqttPahoClientFactory;
import org.springframework.integration.mqtt.core.MqttPahoClientFactory;
import org.springframework.integration.mqtt.inbound.MqttPahoMessageDrivenChannelAdapter;
import org.springframework.integration.mqtt.outbound.MqttPahoMessageHandler;
import org.springframework.integration.mqtt.support.DefaultPahoMessageConverter;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessageHandler;

import com.drowsiness.alert.entity.Device;
import com.drowsiness.alert.repository.DeviceRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Configuration
@RequiredArgsConstructor
public class MqttConfig {
	@Value("${mqtt.broker}")
	private String brokerUrl;
	@Value("${mqtt.client-id}")
	private String clientId;
	@Value("${mqtt.topic}")
	private String topic;
	private final DeviceRepository deviceRepository;

	// 1. Tạo Client Factory kết nối tới HiveMQ
	@Bean
	public MqttPahoClientFactory mqttClientFactory() {
		DefaultMqttPahoClientFactory factory = new DefaultMqttPahoClientFactory();
		MqttConnectOptions options = new MqttConnectOptions();
		options.setServerURIs(new String[] { brokerUrl });
		options.setAutomaticReconnect(true);
		options.setCleanSession(true);
		factory.setConnectionOptions(options);
		return factory;
	}

	// 2. Tạo Kênh (Channel) chứa dữ liệu nhận được
	@Bean
	public MessageChannel mqttInputChannel() {
		return new DirectChannel();
	}

	// 3. Adapter lắng nghe Topic từ HiveMQ và đẩy dữ liệu vào Kênh
	@Bean
	public MessageProducer inbound() {
		MqttPahoMessageDrivenChannelAdapter adapter = new MqttPahoMessageDrivenChannelAdapter(clientId + "_inbound",
				mqttClientFactory(), topic);
		adapter.setCompletionTimeout(5000);
		adapter.setConverter(new DefaultPahoMessageConverter());
		adapter.setQos(1);
		adapter.setOutputChannel(mqttInputChannel());
		return adapter;
	}

	// 4. BỘ XỬ LÝ (LOGIC): Khi có tin nhắn Heartbeat gửi về -> Cập nhật DB
	@Bean
	@ServiceActivator(inputChannel = "mqttInputChannel")
	public MessageHandler handler() {
		return message -> {
			String receivedTopic = (String) message.getHeaders().get("mqtt_receivedTopic");
			String payload = (String) message.getPayload();
			log.info("[MQTT] Received topic: {}, payload: {}", receivedTopic, payload);
			// Bóc tách lấy deviceCode từ Topic (Ví dụ:
			// smartcity/device/DEV-CAM-001/heartbeat -> DEV-CAM-001)
			if (receivedTopic != null && receivedTopic.contains("/")) {
				String[] parts = receivedTopic.split("/");
				if (parts.length >= 3) {
					String deviceCode = parts[2];

					// Cập nhật lastHeartbeat vào Database
					Optional<Device> deviceOpt = deviceRepository.findByDeviceCode(deviceCode);
					if (deviceOpt.isPresent()) {
						Device device = deviceOpt.get();
						device.setLastHeartbeat(LocalDateTime.now());
						deviceRepository.save(device);
						log.info("[MQTT] Updated lastHeartbeat for device: {}", deviceCode);
					}
				}
			}
		};
	}

	// 5. Kênh (Channel) đẩy dữ liệu ra ngoài
	@Bean
	public MessageChannel mqttOutboundChannel() {
		return new DirectChannel();
	}

	// 6. Adapter kết nối kênh đầu ra với HiveMQ Broker
	@Bean
	@ServiceActivator(inputChannel = "mqttOutboundChannel")
	public MessageHandler mqttOutbound() {
		MqttPahoMessageHandler messageHandler = new MqttPahoMessageHandler(clientId + "_outbound", mqttClientFactory());
		messageHandler.setAsync(true);
		messageHandler.setDefaultTopic("smartcity/device/dummy"); // Header sẽ ghi đè topic thực tế
		messageHandler.setDefaultQos(1);
		return messageHandler;
	}

}
