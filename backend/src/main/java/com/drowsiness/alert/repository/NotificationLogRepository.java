package com.drowsiness.alert.repository;

import com.drowsiness.alert.entity.NotificationLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationLogRepository extends JpaRepository<NotificationLog, Long> {
    List<NotificationLog> findByAlertLogId(Long alertLogId);
    List<NotificationLog> findByStatus(String status);
}
