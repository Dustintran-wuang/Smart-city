package com.drowsiness.alert.service;

import java.util.List;

import com.drowsiness.alert.dto.response.AuditLogResponse;

public interface AuditLogService {
	public List<AuditLogResponse> getAllLogs();
}
