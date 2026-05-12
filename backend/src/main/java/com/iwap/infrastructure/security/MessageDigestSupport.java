package com.iwap.infrastructure.security;

import java.security.MessageDigest;

final class MessageDigestSupport {

    private MessageDigestSupport() {
    }

    static boolean equals(byte[] expected, byte[] actual) {
        return MessageDigest.isEqual(expected, actual);
    }
}
