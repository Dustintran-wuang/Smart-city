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
public class AuditLogResponse {
	private Long id;
	private String username;
	private String action;
	private String ipAddress;
	private LocalDateTime createdAt;
}
