package com.drowsiness.alert.service.impl;

import com.drowsiness.alert.dto.request.DeviceRequest;
import com.drowsiness.alert.dto.response.DeviceResponse;
import com.drowsiness.alert.entity.Device;
import com.drowsiness.alert.exception.AppException;
import com.drowsiness.alert.repository.DeviceRepository;
import com.drowsiness.alert.service.DeviceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DeviceServiceImpl implements DeviceService {

    private final DeviceRepository deviceRepository;

    @Override
    public DeviceResponse createDevice(DeviceRequest request) {
        if (deviceRepository.findByDeviceCode(request.getDeviceCode()).isPresent()) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Device code already exists");
        }

        Device device = Device.builder()
                .deviceCode(request.getDeviceCode())
                .deviceType("CAMERA") // default
                .location(request.getVehiclePlate()) // map vehicle plate to location for now
                .isActive("ACTIVE".equalsIgnoreCase(request.getStatus()))
                .build();

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
        return deviceRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public void deleteDevice(Long id) {
        if (!deviceRepository.existsById(id)) {
            throw new AppException(HttpStatus.NOT_FOUND, "Device not found");
        }
        deviceRepository.deleteById(id);
    }

    private DeviceResponse mapToResponse(Device device) {
        return DeviceResponse.builder()
                .id(device.getId())
                .deviceCode(device.getDeviceCode())
                .vehiclePlate(device.getLocation())
                .status(device.getIsActive() ? "ACTIVE" : "INACTIVE")
                .createdAt(device.getCreatedAt())
                .build();
    }
}
