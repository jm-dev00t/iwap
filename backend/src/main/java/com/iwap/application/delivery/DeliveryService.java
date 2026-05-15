package com.iwap.application.delivery;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.Map;
import java.util.Properties;

@Service
public class DeliveryService {

    private final String integrationMode;
    private final String smtpHost;
    private final int smtpPort;
    private final String smtpUsername;
    private final String smtpPassword;
    private final String slackBotToken;
    private final String slackDefaultChannel;

    public DeliveryService(
            @Value("${iwap.integrations.mode:mock}") String integrationMode,
            @Value("${SMTP_HOST:}") String smtpHost,
            @Value("${SMTP_PORT:587}") int smtpPort,
            @Value("${SMTP_USERNAME:}") String smtpUsername,
            @Value("${SMTP_PASSWORD:}") String smtpPassword,
            @Value("${SLACK_BOT_TOKEN:}") String slackBotToken,
            @Value("${SLACK_DEFAULT_CHANNEL:#sales-report}") String slackDefaultChannel
    ) {
        this.integrationMode = integrationMode;
        this.smtpHost = smtpHost;
        this.smtpPort = smtpPort;
        this.smtpUsername = smtpUsername;
        this.smtpPassword = smtpPassword;
        this.slackBotToken = slackBotToken;
        this.slackDefaultChannel = slackDefaultChannel;
    }

    public static DeliveryService demo() {
        return new DeliveryService("mock", "", 587, "", "", "", "#sales-report");
    }

    public DeliveryReceipt sendEmail(String to, String subject, String body) {
        if (!isRealMode() || smtpHost.isBlank() || smtpUsername.isBlank() || smtpPassword.isBlank()) {
            return DeliveryReceipt.demo("email", to, "데모 발송함에 이메일 내용을 기록했습니다.");
        }

        try {
            JavaMailSenderImpl sender = new JavaMailSenderImpl();
            sender.setHost(smtpHost);
            sender.setPort(smtpPort);
            sender.setUsername(smtpUsername);
            sender.setPassword(smtpPassword);
            Properties properties = sender.getJavaMailProperties();
            properties.put("mail.smtp.auth", "true");
            properties.put("mail.smtp.starttls.enable", "true");

            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(smtpUsername);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);
            sender.send(message);
            return DeliveryReceipt.sent("email", to, "실제 이메일 발송을 완료했습니다.");
        } catch (Exception exception) {
            return DeliveryReceipt.failed("email", to, "이메일 발송 실패: " + exception.getMessage());
        }
    }

    public DeliveryReceipt sendSlack(String channel, String text) {
        String targetChannel = channel == null || channel.isBlank() ? slackDefaultChannel : channel;
        if (!isRealMode() || slackBotToken.isBlank()) {
            return DeliveryReceipt.demo("slack", targetChannel, "데모 발송함에 슬랙 메시지를 기록했습니다.");
        }

        try {
            String body = RestClient.create("https://slack.com")
                    .post()
                    .uri("/api/chat.postMessage")
                    .contentType(MediaType.APPLICATION_JSON)
                    .header("Authorization", "Bearer " + slackBotToken)
                    .body(Map.of("channel", targetChannel, "text", text))
                    .retrieve()
                    .body(String.class);
            if (body != null && body.contains("\"ok\":true")) {
                return DeliveryReceipt.sent("slack", targetChannel, "실제 슬랙 메시지 발송을 완료했습니다.");
            }
            return DeliveryReceipt.failed("slack", targetChannel, "슬랙 API가 실패 응답을 반환했습니다.");
        } catch (Exception exception) {
            return DeliveryReceipt.failed("slack", targetChannel, "슬랙 발송 실패: " + exception.getMessage());
        }
    }

    public DeliveryReceipt recordKakaoWork(String room, String text) {
        return isRealMode()
                ? DeliveryReceipt.demo("kakao", room, "카카오워크 실제 연동 키가 없어 데모 발송함에 기록했습니다.")
                : DeliveryReceipt.demo("kakao", room, "데모 발송함에 카카오워크 메시지를 기록했습니다.");
    }

    private boolean isRealMode() {
        return "real".equalsIgnoreCase(integrationMode) || "live".equalsIgnoreCase(integrationMode);
    }
}
