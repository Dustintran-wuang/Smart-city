package com.drowsiness.alert.service.impl;

import com.drowsiness.alert.dto.response.DashboardStatsResponse;
import com.drowsiness.alert.repository.AlertLogRepository;
import com.drowsiness.alert.repository.DeviceRepository;
import com.drowsiness.alert.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class DashboardServiceImpl implements DashboardService {

    private final AlertLogRepository alertLogRepository;
    private final DeviceRepository deviceRepository;

    @Override
    public DashboardStatsResponse getDashboardStats() {
        LocalDateTime startOfDay = LocalDateTime.of(LocalDate.now(), LocalTime.MIN);
        LocalDateTime endOfDay = LocalDateTime.of(LocalDate.now(), LocalTime.MAX);

        long totalAlertsToday = alertLogRepository.countByCreatedAtBetween(startOfDay, endOfDay);
        long activeDevices = deviceRepository.findAll().stream().filter(d -> Boolean.TRUE.equals(d.getIsActive())).count();

        List<Object[]> hourlyStatsRaw = alertLogRepository.getHourlyStatistics();
        List<Map<String, Object>> hourlyStats = new ArrayList<>();
        
        for (Object[] row : hourlyStatsRaw) {
            Map<String, Object> statMap = new HashMap<>();
            statMap.put("hour", row[0]);
            statMap.put("count", row[1]);
            hourlyStats.add(statMap);
        }

        return DashboardStatsResponse.builder()
                .totalAlertsToday(totalAlertsToday)
                .activeDevices(activeDevices)
                .alertsByHour(hourlyStats)
                .build();
    }
}
