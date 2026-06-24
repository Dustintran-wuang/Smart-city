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
public class AlertRequest {

    @NotBlank(message = "Device code is required")
    private String deviceCode;

    private Double earValue;

    private Integer consecutiveFrames;

    private String imageBase64;
}
