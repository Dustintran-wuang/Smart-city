package com.drowsiness.alert.repository;

import com.drowsiness.alert.entity.DeviceStatusLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DeviceStatusLogRepository extends JpaRepository<DeviceStatusLog, Long> {
    Optional<DeviceStatusLog> findTop1ByDeviceIdOrderByCreatedAtDesc(Long deviceId);
    Page<DeviceStatusLog> findByDeviceId(Long deviceId, Pageable pageable);
}
