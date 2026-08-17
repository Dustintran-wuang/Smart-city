package com.drowsiness.alert.service.impl;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import com.drowsiness.alert.dto.request.DeviceControlRequest;
import com.drowsiness.alert.dto.request.DeviceRequest;
import com.drowsiness.alert.dto.response.DeviceResponse;
import com.drowsiness.alert.entity.Device;
import com.drowsiness.alert.exception.AppException;
import com.drowsiness.alert.repository.DeviceRepository;
import com.drowsiness.alert.service.DeviceService;
import com.drowsiness.alert.service.MqttGateway;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class DeviceServiceImpl implements DeviceService {

	private final DeviceRepository deviceRepository;
	private final MqttGateway mqttGateway;

	@Override
	public DeviceResponse createDevice(DeviceRequest request) {
		if (deviceRepository.findByDeviceCode(request.getDeviceCode()).isPresent()) {
			throw new AppException(HttpStatus.BAD_REQUEST, "Device code already exists");
		}

		Device device = Device.builder().deviceCode(request.getDeviceCode()).deviceType("CAMERA") // default
				.location(request.getVehiclePlate()) // map vehicle plate to location for now
				.isActive("ACTIVE".equalsIgnoreCase(request.getStatus())).build();

		Device savedDevice = deviceRepository.save(device);
		return mapToResponse(savedDevice);
	}

	@Override
	public DeviceResponse updateDevice(Long id, DeviceRequest request) {
		Device device = deviceRepository.findById(id)
				.orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Device not found"));

		device.setDeviceCode(request.getDeviceCode());
		device.setLocation(request.getVehiclePlate());
		device.setIsActive("ACTIVE".equalsIgnoreCase(request.getStatus()));

		Device updatedDevice = deviceRepository.save(device);
		return mapToResponse(updatedDevice);
	}

	@Override
	public DeviceResponse getDeviceById(Long id) {
		Device device = deviceRepository.findById(id)
				.orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Device not found"));
		return mapToResponse(device);
	}

	@Override
	public List<DeviceResponse> getAllDevices() {
		return deviceRepository.findAll().stream().map(this::mapToResponse).collect(Collectors.toList());
	}

	@Override
	public void deleteDevice(Long id) {
		if (!deviceRepository.existsById(id)) {
			throw new AppException(HttpStatus.NOT_FOUND, "Device not found");
		}
		deviceRepository.deleteById(id);
	}

	@Override
	public void controlDevice(String deviceCode, String target, DeviceControlRequest request) {
		// Validate device exists
		if (deviceRepository.findByDeviceCode(deviceCode).isEmpty()) {
			throw new AppException(HttpStatus.NOT_FOUND, "Device not found");
		}

		String topic = "smartcity/device/" + deviceCode + "/" + target; // target: buzzer or light
		try {
			mqttGateway.sendToMqtt(topic, request.getAction());
			log.info("Sent manual MQTT control to {}: action={}", topic, request.getAction());
		} catch (Exception e) {
			log.error("Failed to send manual MQTT control to {}: {}", topic, e.getMessage());
			throw new AppException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to communicate with device");
		}
	}

	private DeviceResponse mapToResponse(Device device) {
		boolean isOnline = false;
		if (device.getLastHeartbeat() != null) {
			isOnline = device.getLastHeartbeat().isAfter(LocalDateTime.now().minusMinutes(2));
		}
		return DeviceResponse.builder().id(device.getId()).isOnline(isOnline).deviceCode(device.getDeviceCode())
				.vehiclePlate(device.getLocation()).status(device.getIsActive() ? "ACTIVE" : "INACTIVE")
				.lastHeartbeat(device.getLastHeartbeat())
				.createdAt(device.getCreatedAt()).build();
	}
}
