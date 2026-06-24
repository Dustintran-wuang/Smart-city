package com.drowsiness.alert.service.impl;

import com.drowsiness.alert.dto.request.AlertRequest;
import com.drowsiness.alert.dto.response.AlertResponse;
import com.drowsiness.alert.entity.AlertLog;
import com.drowsiness.alert.entity.Device;
import com.drowsiness.alert.repository.AlertLogRepository;
import com.drowsiness.alert.repository.DeviceRepository;
import com.drowsiness.alert.service.AlertService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AlertServiceImpl implements AlertService {

    private final AlertLogRepository alertLogRepository;
    private final DeviceRepository deviceRepository;

    private static final String UPLOAD_DIR = "uploads/";

    @Override
    public AlertResponse createAlert(AlertRequest request) {
        Device device = deviceRepository.findByDeviceCode(request.getDeviceCode())
                .orElseGet(() -> {
                    // Auto-register device if not exists
                    Device newDevice = Device.builder()
                            .deviceCode(request.getDeviceCode())
                            .deviceType("CAMERA")
                            .isActive(true)
                            .lastHeartbeat(LocalDateTime.now())
                            .build();
                    return deviceRepository.save(newDevice);
                });

        // Update heartbeat
        device.setLastHeartbeat(LocalDateTime.now());
        deviceRepository.save(device);

        String imageUrl = saveImage(request.getImageBase64());

        AlertLog alertLog = AlertLog.builder()
                .device(device)
                .alertType("DROWSY")
                .earValue(request.getEarValue() != null ? request.getEarValue() : 0.0)
                .earThreshold(0.20) // Default from python script
                .consecutiveFrames(request.getConsecutiveFrames() != null ? request.getConsecutiveFrames() : 30)
                .imageUrl(imageUrl)
                .isAcknowledged(false)
                .build();

        AlertLog savedAlert = alertLogRepository.save(alertLog);

        return mapToResponse(savedAlert);
    }

    @Override
    public List<AlertResponse> getAllAlerts() {
        return alertLogRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private String saveImage(String base64Data) {
        if (base64Data == null || base64Data.isEmpty()) {
            return null;
        }

        try {
            Path uploadPath = Paths.get(UPLOAD_DIR);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            // Remove data URI scheme prefix if present
            if (base64Data.contains(",")) {
                base64Data = base64Data.split(",")[1];
            }

            byte[] decodedBytes = Base64.getDecoder().decode(base64Data);
            String fileName = UUID.randomUUID().toString() + ".jpg";
            Path filePath = uploadPath.resolve(fileName);

            try (FileOutputStream fos = new FileOutputStream(filePath.toFile())) {
                fos.write(decodedBytes);
            }

            return "/uploads/" + fileName;
        } catch (IOException e) {
            log.error("Failed to save image", e);
            return null;
        }
    }

    private AlertResponse mapToResponse(AlertLog alertLog) {
        return AlertResponse.builder()
                .id(alertLog.getId())
                .deviceCode(alertLog.getDevice() != null ? alertLog.getDevice().getDeviceCode() : null)
                .alertType(alertLog.getAlertType())
                .earValue(alertLog.getEarValue())
                .consecutiveFrames(alertLog.getConsecutiveFrames())
                .imageUrl(alertLog.getImageUrl())
                .createdAt(alertLog.getCreatedAt())
                .build();
    }
}
