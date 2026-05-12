package com.iwap.infrastructure.security;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.Instant;
import java.util.Base64;
import java.util.List;
import java.util.Map;

@Component
class DemoJwtService {

    private static final Base64.Encoder BASE64_URL_ENCODER = Base64.getUrlEncoder().withoutPadding();
    private static final Base64.Decoder BASE64_URL_DECODER = Base64.getUrlDecoder();
    private static final TypeReference<Map<String, Object>> MAP_TYPE = new TypeReference<>() {
    };

    private final String secret;
    private final Clock clock;
    private final ObjectMapper objectMapper;

    @Autowired
    DemoJwtService(@Value("${iwap.security.demo-jwt-secret}") String secret) {
        this(secret, Clock.systemUTC());
    }

    DemoJwtService(String secret, Clock clock) {
        this.secret = secret;
        this.clock = clock;
        this.objectMapper = new ObjectMapper();
    }

    String createToken(DemoLoginUser user) {
        Instant now = clock.instant();
        Instant expiresAt = now.plusSeconds(60 * 60 * 8);
        Map<String, Object> header = Map.of("alg", "HS256", "typ", "JWT");
        Map<String, Object> payload = Map.of(
                "sub", user.email(),
                "name", user.displayName(),
                "roles", user.roles(),
                "iat", now.getEpochSecond(),
                "exp", expiresAt.getEpochSecond()
        );

        String unsigned = base64Json(header) + "." + base64Json(payload);
        return unsigned + "." + sign(unsigned);
    }

    DemoJwtClaims parse(String token) {
        try {
            String[] parts = token.split("\\.");
            if (parts.length != 3) {
                throw new IllegalArgumentException("Invalid demo JWT format");
            }

            String unsigned = parts[0] + "." + parts[1];
            if (!constantTimeEquals(sign(unsigned), parts[2])) {
                throw new IllegalArgumentException("Invalid demo JWT signature");
            }

            Map<String, Object> payload = objectMapper.readValue(BASE64_URL_DECODER.decode(parts[1]), MAP_TYPE);
            Instant expiresAt = Instant.ofEpochSecond(((Number) payload.get("exp")).longValue());
            if (!expiresAt.isAfter(clock.instant())) {
                throw new IllegalArgumentException("Invalid demo JWT expiration");
            }

            @SuppressWarnings("unchecked")
            List<String> roles = ((List<Object>) payload.get("roles")).stream()
                    .map(Object::toString)
                    .toList();

            return new DemoJwtClaims(
                    payload.get("sub").toString(),
                    payload.get("name").toString(),
                    roles,
                    expiresAt
            );
        } catch (Exception exception) {
            if (exception instanceof IllegalArgumentException illegalArgumentException) {
                throw illegalArgumentException;
            }
            throw new IllegalArgumentException("Invalid demo JWT", exception);
        }
    }

    private String base64Json(Map<String, Object> value) {
        try {
            return BASE64_URL_ENCODER.encodeToString(objectMapper.writeValueAsBytes(value));
        } catch (Exception exception) {
            throw new IllegalStateException("Could not encode demo JWT", exception);
        }
    }

    private String sign(String unsigned) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return BASE64_URL_ENCODER.encodeToString(mac.doFinal(unsigned.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception exception) {
            throw new IllegalStateException("Could not sign demo JWT", exception);
        }
    }

    private boolean constantTimeEquals(String expected, String actual) {
        return MessageDigestSupport.equals(expected.getBytes(StandardCharsets.UTF_8), actual.getBytes(StandardCharsets.UTF_8));
    }
}
