package com.drowsiness.alert.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AlertResponse {

    private Long id;
    private String deviceCode;
    private String alertType;
    private Double earValue;
    private Integer consecutiveFrames;
    private String imageUrl;
    private LocalDateTime createdAt;

}
