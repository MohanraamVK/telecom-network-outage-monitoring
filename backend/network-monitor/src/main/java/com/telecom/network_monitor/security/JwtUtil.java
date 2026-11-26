package com.telecom.network_monitor.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;

import static io.jsonwebtoken.Jwts.SIG;

/** Issues and verifies short-lived access tokens (HS256). */
@Component
public class JwtUtil {

    /** HS256 needs at least 256 bits of key material. */
    static final int MIN_SECRET_BYTES = 32;

    @Value("${app.jwt.secret}")
    private String jwtSecret;

    @Value("${app.jwt.expiration-ms}")
    private long jwtExpirationMs;

    /** Fail at start-up with a clear message instead of on the first login. */
    @PostConstruct
    void validateSecret() {
        if (jwtSecret == null || jwtSecret.getBytes(StandardCharsets.UTF_8).length < MIN_SECRET_BYTES) {
            throw new IllegalStateException("app.jwt.secret (JWT_SECRET) must be at least " + MIN_SECRET_BYTES
                    + " bytes long. Generate one with: openssl rand -base64 48");
        }
    }

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
    }

    public String generateToken(String username) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpirationMs);

        return Jwts.builder()
                .subject(username)
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(getSigningKey(), SIG.HS256)
                .compact();
    }

    public long getExpirationSeconds() {
        return jwtExpirationMs / 1000;
    }

    public String extractUsername(String token) {
        return extractAllClaims(token).getSubject();
    }

    public Instant extractIssuedAt(String token) {
        Date issuedAt = extractAllClaims(token).getIssuedAt();
        return issuedAt == null ? Instant.EPOCH : issuedAt.toInstant();
    }

    public boolean isTokenValid(String token, String username) {
        String extractedUsername = extractUsername(token);
        return extractedUsername.equals(username) && !isTokenExpired(token);
    }

    private boolean isTokenExpired(String token) {
        return extractAllClaims(token).getExpiration().before(new Date());
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
