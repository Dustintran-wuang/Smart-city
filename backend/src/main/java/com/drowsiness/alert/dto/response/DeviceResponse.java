package com.drowsiness.alert.dto.response;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeviceResponse {

	private Long id;
	private String deviceCode;
	private String vehiclePlate;
	private String status;
	private LocalDateTime createdAt;
	private LocalDateTime updatedAt;
	private LocalDateTime lastHeartbeat;
	private Boolean isOnline;

}
