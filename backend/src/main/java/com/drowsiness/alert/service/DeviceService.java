package com.drowsiness.alert.service;

import com.drowsiness.alert.dto.request.DeviceRequest;
import com.drowsiness.alert.dto.response.DeviceResponse;

import java.util.List;

public interface DeviceService {
    DeviceResponse createDevice(DeviceRequest request);
    DeviceResponse updateDevice(Long id, DeviceRequest request);
    DeviceResponse getDeviceById(Long id);
    List<DeviceResponse> getAllDevices();
    void deleteDevice(Long id);
}
