package com.drowsiness.alert.controller;

import com.drowsiness.alert.entity.NotificationLog;
import com.drowsiness.alert.repository.NotificationLogRepository;
import com.drowsiness.alert.service.NotificationService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final NotificationLogRepository notificationLogRepository;

    @GetMapping("/logs")
    public ResponseEntity<List<NotificationLog>> getNotificationLogs() {
        return ResponseEntity.ok(notificationLogRepository.findAll());
    }

    @PostMapping("/test-telegram")
    public ResponseEntity<Map<String, Object>> testTelegram(@RequestBody TestTelegramRequest request) {
        String message = request.getMessage() != null ? request.getMessage() 
                : "⚠️ <b>[TEST CẢNH BÁO TÀI XẾ]</b> Phát hiện dấu hiệu ngủ gật khi đang lái xe DEV-CAM-001. Vui lòng dừng xe nghỉ ngơi!";

        boolean success = notificationService.sendTelegramCaution(request.getChatId(), message, null);

        return ResponseEntity.ok(Map.of(
                "success", success,
                "recipient", request.getChatId(),
                "message", success ? "Telegram test notification sent successfully!" : "Failed to send Telegram test notification. Check Bot Token & Chat ID."
        ));
    }

    @PostMapping("/test-email")
    public ResponseEntity<Map<String, Object>> testEmail(@RequestBody TestEmailRequest request) {
        String subject = request.getSubject() != null ? request.getSubject()
                : "🚨 [TEST CẢNH BÁO CÔNG TY] Kiểm tra hệ thống cảnh báo tài xế ngủ gật";
        
        String htmlBody = "<html><body>" +
                "<h2>🚨 CẢNH BÁO AN TOÀN TÀI XẾ (TEST)</h2>" +
                "<p>Đây là tin nhắn thử nghiệm hệ thống cảnh báo ngủ gật tự động gửi tới công ty quản lý tài xế.</p>" +
                "</body></html>";

        boolean success = notificationService.sendEmailCaution(request.getEmail(), subject, htmlBody, null);

        return ResponseEntity.ok(Map.of(
                "success", success,
                "recipient", request.getEmail(),
                "message", success ? "Email test notification sent successfully!" : "Failed to send Email. Check SMTP configuration in application.yml."
        ));
    }

    @Data
    public static class TestTelegramRequest {
        private String chatId;
        private String message;
    }

    @Data
    public static class TestEmailRequest {
        private String email;
        private String subject;
    }
}
