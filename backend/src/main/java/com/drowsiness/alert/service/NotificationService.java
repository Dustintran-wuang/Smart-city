package com.drowsiness.alert.service;

import com.drowsiness.alert.entity.AlertLog;

public interface NotificationService {

    /**
     * Trigger caution notifications (Telegram to driver, Email to company)
     * when drowsiness is detected.
     */
    void sendDrowsinessCautionNotifications(AlertLog alertLog);

    /**
     * Direct test method for Telegram Caution Notification
     */
    boolean sendTelegramCaution(String chatId, String messageText, String imagePath);

    /**
     * Direct test method for Email Caution Notification
     */
    boolean sendEmailCaution(String recipientEmail, String subject, String bodyHtml, String imagePath);
}
