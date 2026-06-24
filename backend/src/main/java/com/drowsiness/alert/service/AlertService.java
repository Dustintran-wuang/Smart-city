package com.drowsiness.alert.service;

import com.drowsiness.alert.dto.request.AlertRequest;
import com.drowsiness.alert.dto.response.AlertResponse;

import java.util.List;

public interface AlertService {
    AlertResponse createAlert(AlertRequest request);
    List<AlertResponse> getAllAlerts();
}
