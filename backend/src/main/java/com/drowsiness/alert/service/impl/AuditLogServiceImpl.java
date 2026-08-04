package com.drowsiness.alert.service.impl;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.drowsiness.alert.dto.response.AuditLogResponse;
import com.drowsiness.alert.entity.AuditLog;
import com.drowsiness.alert.repository.AuditLogRepository;
import com.drowsiness.alert.service.AuditLogService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuditLogServiceImpl implements AuditLogService {
	// @Autowired
	// private AuditLogRepository auditLogRepo;
	private final AuditLogRepository auditLogRepo;

	@Override
	public List<AuditLogResponse> getAllLogs() {
		List<AuditLog> auditLogs = auditLogRepo.findAll();
		return auditLogs.stream().map(
				auditLog -> {
					AuditLogResponse auditLogResponse = new AuditLogResponse();
					auditLogResponse.setId(auditLog.getId());
					String username = "";
					if (auditLog.getUser() != null) {
						username = auditLog.getUser().getUsername();
					}
					auditLogResponse.setUsername(username);
					auditLogResponse.setAction(auditLog.getAction());
					auditLogResponse.setIpAddress(auditLog.getIpAddress());
					auditLogResponse.setCreatedAt(auditLog.getCreatedAt());
					return auditLogResponse;
				}).toList();
	}

	/*
	 * use lombok
	 * return auditLogs.stream()
	 * .map(auditLog -> AuditLogResponse.builder()
	 * .id(auditLog.getId())
	 * .username(auditLog.getUser() != null ? auditLog.getUser().getUsername() :
	 * null)
	 * .action(auditLog.getAction())
	 * .ipAddress(auditLog.getIpAddress())
	 * .createdAt(auditLog.getCreatedAt())
	 * .build())
	 * .toList();
	 */

}
