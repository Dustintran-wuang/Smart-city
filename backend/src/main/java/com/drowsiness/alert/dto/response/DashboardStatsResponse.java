package com.drowsiness.alert.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStatsResponse {
    
    private Long totalAlertsToday;
    private Long activeDevices;
    private List<Map<String, Object>> alertsByHour;

}
