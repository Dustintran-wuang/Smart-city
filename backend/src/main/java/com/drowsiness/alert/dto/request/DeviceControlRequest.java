package com.drowsiness.alert.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class DeviceControlRequest {
    
    @NotBlank(message = "Action is required (ON or OFF)")
    private String action;
    
}
