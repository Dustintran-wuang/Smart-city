package com.drowsiness.alert.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeviceRequest {

    @NotBlank(message = "Device code is required")
    private String deviceCode;

    private String vehiclePlate;

    @NotBlank(message = "Status is required")
    private String status; // ACTIVE, INACTIVE, MAINTENANCE
}
