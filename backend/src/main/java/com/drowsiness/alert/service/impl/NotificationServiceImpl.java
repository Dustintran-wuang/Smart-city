package com.drowsiness.alert.service.impl;

import com.drowsiness.alert.entity.AlertLog;
import com.drowsiness.alert.entity.Driver;
import com.drowsiness.alert.entity.NotificationLog;
import com.drowsiness.alert.entity.SystemConfig;
import com.drowsiness.alert.repository.NotificationLogRepository;
import com.drowsiness.alert.repository.SystemConfigRepository;
import com.drowsiness.alert.service.NotificationService;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.*;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.io.File;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final NotificationLogRepository notificationLogRepository;
    private final SystemConfigRepository systemConfigRepository;

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${notification.telegram.bot-token:}")
    private String defaultTelegramBotToken;

    @Value("${notification.telegram.default-chat-id:}")
    private String defaultTelegramChatId;

    @Value("${notification.telegram.enabled:true}")
    private boolean telegramEnabledConfig;

    @Value("${spring.mail.username:}")
    private String mailSenderUsername;

    @Value("${notification.email.company-email:company_safety@fleet.com}")
    private String defaultCompanyEmail;

    @Value("${notification.email.enabled:true}")
    private boolean emailEnabledConfig;

    private final RestTemplate restTemplate = new RestTemplate();

    @Override
    @Async
    public void sendDrowsinessCautionNotifications(AlertLog alertLog) {
        log.info("Processing drowsiness caution notifications for Alert ID: {}", alertLog.getId());

        Driver driver = alertLog.getDriver();
        String driverName = (driver != null && driver.getName() != null) ? driver.getName() : "Tài xế thử nghiệm";
        String licensePlate = (driver != null && driver.getLicensePlate() != null) ? driver.getLicensePlate() : "N/A";
        String deviceCode = (alertLog.getDevice() != null) ? alertLog.getDevice().getDeviceCode() : "N/A";
        String location = (alertLog.getDevice() != null && alertLog.getDevice().getLocation() != null) 
                ? alertLog.getDevice().getLocation() : "Không xác định";

        String timestampStr = alertLog.getCreatedAt() != null 
                ? alertLog.getCreatedAt().format(DateTimeFormatter.ofPattern("HH:mm:ss dd/MM/yyyy"))
                : LocalDateTime.now().format(DateTimeFormatter.ofPattern("HH:mm:ss dd/MM/yyyy"));

        String imagePath = resolveImagePath(alertLog.getImageUrl());

        // --- 1. SEND TELEGRAM CAUTION TO DRIVER ---
        if (isTelegramEnabled()) {
            String targetChatId = getConfigValue("telegram_default_chat_id", defaultTelegramChatId);

            String telegramMsg = String.format(
                    "⚠️ <b>CẢNH BÁO TÀI XẾ / DRIVER CAUTION ALERT</b> ⚠️\n\n" +
                    "Phát hiện dấu hiệu <b>NGỦ GẬT</b> khi vận hành phương tiện!\n" +
                    "-----------------------------------------\n" +
                    "👤 <b>Tài xế:</b> %s\n" +
                    "🚗 <b>Biển số xe:</b> %s\n" +
                    "📷 <b>Thiết bị:</b> %s\n" +
                    "📍 <b>Vị trí:</b> %s\n" +
                    "👁️ <b>Chỉ số EAR:</b> %.3f\n" +
                    "⏰ <b>Thời gian:</b> %s\n" +
                    "-----------------------------------------\n" +
                    "⚠️ <b>YÊU CẦU:</b> Hãy giảm tốc độ, tấp xe vào nơi an toàn và nghỉ ngơi ngay lập tức!",
                    driverName, licensePlate, deviceCode, location, alertLog.getEarValue(), timestampStr
            );

            boolean telegramSuccess = sendTelegramCaution(targetChatId, telegramMsg, imagePath);
            saveNotificationLog(alertLog, "TELEGRAM", targetChatId, telegramSuccess, 
                    telegramSuccess ? null : "Failed to send Telegram message/photo");
        } else {
            log.info("Telegram notification disabled in configuration.");
        }

        // --- 2. SEND EMAIL CAUTION TO COMPANY ---
        if (isEmailEnabled()) {
            String targetCompanyEmail = getConfigValue("company_default_email", defaultCompanyEmail);

            String subject = String.format("🚨 [CẢNH BÁO AN TOÀN FLOT] Tài xế %s (%s) phát hiện ngủ gật!", driverName, licensePlate);

            String htmlBody = buildCompanyEmailHtml(driverName, licensePlate, deviceCode, location, 
                    alertLog.getEarValue(), alertLog.getConsecutiveFrames(), timestampStr);

            boolean emailSuccess = sendEmailCaution(targetCompanyEmail, subject, htmlBody, imagePath);
            saveNotificationLog(alertLog, "EMAIL", targetCompanyEmail, emailSuccess, 
                    emailSuccess ? null : "Failed to send email caution to company");
        } else {
            log.info("Email notification disabled in configuration.");
        }
    }

    @Override
    public boolean sendTelegramCaution(String chatId, String messageText, String imagePath) {
        String botToken = getConfigValue("telegram_bot_token", defaultTelegramBotToken);
        if (botToken == null || botToken.isBlank() || botToken.equals("YOUR_TELEGRAM_BOT_TOKEN")) {
            log.warn("Telegram Bot Token is not configured. Skipping Telegram API call.");
            return false;
        }

        if (chatId == null || chatId.isBlank() || chatId.equals("YOUR_TELEGRAM_CHAT_ID")) {
            log.warn("Telegram Chat ID is not configured. Skipping Telegram API call.");
            return false;
        }

        try {
            File imgFile = (imagePath != null) ? new File(imagePath) : null;

            if (imgFile != null && imgFile.exists()) {
                // Send photo with caption
                String photoUrl = String.format("https://api.telegram.org/bot%s/sendPhoto", botToken);

                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.MULTIPART_FORM_DATA);

                MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
                body.add("chat_id", chatId);
                body.add("caption", messageText);
                body.add("parse_mode", "HTML");
                body.add("photo", new FileSystemResource(imgFile));

                HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);
                ResponseEntity<String> response = restTemplate.postForEntity(photoUrl, requestEntity, String.class);

                if (response.getStatusCode().is2xxSuccessful()) {
                    log.info("Successfully sent Telegram photo alert to Chat ID: {}", chatId);
                    return true;
                }
            }

            // Fallback: Send text message
            String textUrl = String.format("https://api.telegram.org/bot%s/sendMessage", botToken);
            Map<String, String> payload = new HashMap<>();
            payload.put("chat_id", chatId);
            payload.put("text", messageText);
            payload.put("parse_mode", "HTML");

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, String>> requestEntity = new HttpEntity<>(payload, headers);

            ResponseEntity<String> response = restTemplate.postForEntity(textUrl, requestEntity, String.class);
            if (response.getStatusCode().is2xxSuccessful()) {
                log.info("Successfully sent Telegram text alert to Chat ID: {}", chatId);
                return true;
            }
        } catch (Exception e) {
            log.error("Error sending Telegram alert: {}", e.getMessage(), e);
        }
        return false;
    }

    @Override
    public boolean sendEmailCaution(String recipientEmail, String subject, String bodyHtml, String imagePath) {
        if (mailSender == null) {
            log.warn("JavaMailSender bean is not configured in Spring. Email skipped.");
            return false;
        }

        if (recipientEmail == null || recipientEmail.isBlank()) {
            log.warn("Recipient email is empty. Skipping email dispatch.");
            return false;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            String fromAddr = (mailSenderUsername != null && !mailSenderUsername.isBlank()) 
                    ? mailSenderUsername : "company_safety@fleet.com";
            helper.setFrom(fromAddr, "Smart City Drowsiness Alert System");

            helper.setTo(recipientEmail);
            helper.setSubject(subject);
            helper.setText(bodyHtml, true);

            File imgFile = (imagePath != null) ? new File(imagePath) : null;
            if (imgFile != null && imgFile.exists()) {
                helper.addAttachment("drowsiness_snapshot.jpg", imgFile);
            }

            mailSender.send(message);
            log.info("Successfully sent company caution email to: {}", recipientEmail);
            return true;
        } catch (Exception e) {
            log.error("Failed to send caution email to company {}: {}", recipientEmail, e.getMessage(), e);
            return false;
        }
    }

    private String buildCompanyEmailHtml(String driverName, String licensePlate, String deviceCode, 
                                        String location, double earValue, Integer frames, String timestamp) {
        return "<html>" +
                "<body style='font-family: Arial, sans-serif; background-color: #f4f6f9; padding: 20px;'>" +
                "<div style='max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1);'>" +
                "<div style='background-color: #d9534f; color: #ffffff; padding: 20px; text-align: center;'>" +
                "<h2 style='margin: 0;'>🚨 CẢNH BÁO AN TOÀN TÀI XẾ</h2>" +
                "<p style='margin: 5px 0 0 0;'>Hệ thống Smart City Drowsiness Detection</p>" +
                "</div>" +
                "<div style='padding: 20px; color: #333333;'>" +
                "<p>Kính gửi BQL Đội xe / Công ty Quản lý,</p>" +
                "<p>Hệ thống camera giám sát thông minh vừa phát hiện tài xế thuộc quản lý của Quý vị có dấu hiệu <b>NGỦ GẬT CRITICAL</b> khi đang điều khiển phương tiện.</p>" +
                "<table style='width: 100%; border-collapse: collapse; margin-top: 15px;'>" +
                "<tr style='background: #f8f9fa;'><td style='padding: 10px; border: 1px solid #dddddd;'><b>Tên tài xế:</b></td><td style='padding: 10px; border: 1px solid #dddddd;'>" + driverName + "</td></tr>" +
                "<tr><td style='padding: 10px; border: 1px solid #dddddd;'><b>Biển số xe:</b></td><td style='padding: 10px; border: 1px solid #dddddd;'>" + licensePlate + "</td></tr>" +
                "<tr style='background: #f8f9fa;'><td style='padding: 10px; border: 1px solid #dddddd;'><b>Mã thiết bị Camera:</b></td><td style='padding: 10px; border: 1px solid #dddddd;'>" + deviceCode + "</td></tr>" +
                "<tr><td style='padding: 10px; border: 1px solid #dddddd;'><b>Vị trí ghi nhận:</b></td><td style='padding: 10px; border: 1px solid #dddddd;'>" + location + "</td></tr>" +
                "<tr style='background: #f8f9fa;'><td style='padding: 10px; border: 1px solid #dddddd;'><b>Chỉ số EAR (Độ mở mắt):</b></td><td style='padding: 10px; border: 1px solid #dddddd; color: #d9534f; font-weight: bold;'>" + earValue + "</td></tr>" +
                "<tr><td style='padding: 10px; border: 1px solid #dddddd;'><b>Thời gian phát hiện:</b></td><td style='padding: 10px; border: 1px solid #dddddd;'>" + timestamp + "</td></tr>" +
                "</table>" +
                "<p style='margin-top: 20px; padding: 12px; background: #fff3cd; color: #856404; border-left: 4px solid #ffebaa; border-radius: 4px;'>" +
                "⚠️ <b>Hành động đề xuất:</b> Vui lòng liên hệ trực tiếp với tài xế để kiểm tra tình trạng sức khỏe và yêu cầu tạm dừng phương tiện nghỉ ngơi." +
                "</p>" +
                "</div>" +
                "<div style='background-color: #f1f1f1; padding: 10px; text-align: center; font-size: 12px; color: #777777;'>" +
                "Hệ thống Giám sát & Cảnh báo Ngủ gật Thông minh © Smart City Fleet Management" +
                "</div>" +
                "</div>" +
                "</body>" +
                "</html>";
    }

    private void saveNotificationLog(AlertLog alertLog, String type, String recipient, boolean success, String errorMsg) {
        try {
            NotificationLog nLog = NotificationLog.builder()
                    .alertLog(alertLog)
                    .type(type)
                    .recipient(recipient != null ? recipient : "UNKNOWN")
                    .status(success ? "SENT" : "FAILED")
                    .errorMessage(errorMsg)
                    .sentAt(success ? LocalDateTime.now() : null)
                    .build();
            notificationLogRepository.save(nLog);
        } catch (Exception e) {
            log.error("Failed to save NotificationLog to database: {}", e.getMessage());
        }
    }

    private String resolveImagePath(String imageUrl) {
        if (imageUrl == null || imageUrl.isBlank()) return null;
        if (imageUrl.startsWith("/")) {
            return imageUrl.substring(1);
        }
        return imageUrl;
    }

    private boolean isTelegramEnabled() {
        String val = getConfigValue("telegram_enabled", String.valueOf(telegramEnabledConfig));
        return "true".equalsIgnoreCase(val);
    }

    private boolean isEmailEnabled() {
        String val = getConfigValue("email_enabled", String.valueOf(emailEnabledConfig));
        return "true".equalsIgnoreCase(val);
    }

    private String getConfigValue(String key, String defaultValue) {
        Optional<SystemConfig> configOpt = systemConfigRepository.findByConfigKey(key);
        if (configOpt.isPresent() && configOpt.get().getConfigValue() != null && !configOpt.get().getConfigValue().isBlank()) {
            return configOpt.get().getConfigValue();
        }
        return defaultValue;
    }
}
