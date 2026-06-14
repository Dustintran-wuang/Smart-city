package com.drowsiness.alert.repository;

import com.drowsiness.alert.entity.AlertLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AlertLogRepository extends JpaRepository<AlertLog, Long>, JpaSpecificationExecutor<AlertLog> {

    long countByCreatedAtBetween(LocalDateTime start, LocalDateTime end);

    long countByIsAcknowledgedFalse();

    List<AlertLog> findTop5ByOrderByCreatedAtDesc();

    // Query stats by hour
    @Query("SELECT EXTRACT(HOUR FROM a.createdAt) as hourVal, COUNT(a) as logCount FROM AlertLog a GROUP BY EXTRACT(HOUR FROM a.createdAt) ORDER BY hourVal ASC")
    List<Object[]> getHourlyStatistics();

    // Query stats by day
    @Query("SELECT CAST(a.createdAt AS date) as dateVal, COUNT(a) as logCount FROM AlertLog a GROUP BY CAST(a.createdAt AS date) ORDER BY dateVal ASC")
    List<Object[]> getDailyStatistics();
}
