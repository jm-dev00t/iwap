package com.iwap.application.delivery;

public record DeliveryReceipt(
        String channel,
        String providerMode,
        String status,
        String target,
        String summary,
        boolean successful
) {
    public static DeliveryReceipt demo(String channel, String target, String summary) {
        return new DeliveryReceipt(channel, "mock", "DEMO_RECORDED", target, summary, true);
    }

    public static DeliveryReceipt sent(String channel, String target, String summary) {
        return new DeliveryReceipt(channel, "real", "SENT", target, summary, true);
    }

    public static DeliveryReceipt failed(String channel, String target, String summary) {
        return new DeliveryReceipt(channel, "real", "FAILED", target, summary, false);
    }
}
