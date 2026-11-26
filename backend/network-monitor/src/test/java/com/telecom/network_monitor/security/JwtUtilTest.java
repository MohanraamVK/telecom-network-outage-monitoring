package com.telecom.network_monitor.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class JwtUtilTest {

    private JwtUtil jwtUtil;

    @BeforeEach
    void setUp() {
        jwtUtil = jwtUtil("unit-test-secret-unit-test-secret-unit-test", 60_000);
    }

    @Test
    void generatedTokenIsValidForItsUser() {
        String token = jwtUtil.generateToken("admin");

        assertThat(jwtUtil.extractUsername(token)).isEqualTo("admin");
        assertThat(jwtUtil.isTokenValid(token, "admin")).isTrue();
        assertThat(jwtUtil.isTokenValid(token, "someone-else")).isFalse();
    }

    @Test
    void tokenSignedWithAnotherSecretIsRejected() {
        String foreignToken = jwtUtil("another-secret-another-secret-another-secret", 60_000)
                .generateToken("admin");

        assertThatThrownBy(() -> jwtUtil.extractUsername(foreignToken))
                .isInstanceOf(io.jsonwebtoken.JwtException.class);
    }

    @Test
    void expiredTokenIsRejected() {
        String expiredToken = jwtUtil("unit-test-secret-unit-test-secret-unit-test", -1_000)
                .generateToken("admin");

        assertThatThrownBy(() -> jwtUtil.extractUsername(expiredToken))
                .isInstanceOf(io.jsonwebtoken.ExpiredJwtException.class);
    }

    private static JwtUtil jwtUtil(String secret, long expirationMs) {
        JwtUtil util = new JwtUtil();
        ReflectionTestUtils.setField(util, "jwtSecret", secret);
        ReflectionTestUtils.setField(util, "jwtExpirationMs", expirationMs);
        return util;
    }
}
