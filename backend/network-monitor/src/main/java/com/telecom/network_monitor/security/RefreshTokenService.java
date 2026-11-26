package com.telecom.network_monitor.security;

import com.telecom.network_monitor.entity.RefreshToken;
import com.telecom.network_monitor.entity.User;
import com.telecom.network_monitor.repository.RefreshTokenRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HexFormat;

/**
 * Rotating refresh tokens with reuse detection: every refresh returns a new token and
 * revokes the old one. If a revoked token is ever presented again, it was probably
 * stolen, so every session of that user is revoked.
 */
@Service
public class RefreshTokenService {

    private static final Logger log = LoggerFactory.getLogger(RefreshTokenService.class);

    private final RefreshTokenRepository repository;
    private final Duration lifetime;
    private final Clock clock;
    private final SecureRandom random = new SecureRandom();

    @Autowired
    public RefreshTokenService(RefreshTokenRepository repository,
                               @Value("${app.jwt.refresh-expiration:7d}") Duration lifetime) {
        this(repository, lifetime, Clock.systemDefaultZone());
    }

    RefreshTokenService(RefreshTokenRepository repository, Duration lifetime, Clock clock) {
        this.repository = repository;
        this.lifetime = lifetime;
        this.clock = clock;
    }

    /** Creates a new refresh token and returns the raw value (shown to the client once). */
    @Transactional
    public String issue(User user) {
        String raw = newRawToken();
        LocalDateTime now = now();
        repository.save(new RefreshToken(user, hash(raw), now, now.plus(lifetime)));
        return raw;
    }

    /**
     * Exchanges a refresh token for a new one.
     *
     * @throws InvalidRefreshTokenException if it is unknown, expired, or already used
     */
    @Transactional(noRollbackFor = InvalidRefreshTokenException.class)
    public Rotation rotate(String rawToken) {
        RefreshToken token = find(rawToken);
        LocalDateTime now = now();

        if (token.isRevoked()) {
            if (token.getReplacedBy() != null) {
                // A rotated token came back: treat the whole session family as compromised
                int revoked = repository.revokeAllForUser(token.getUser().getId(), now);
                log.warn("Refresh token reuse for user '{}': revoked {} session(s)", token.getUser().getUsername(), revoked);
            }
            throw new InvalidRefreshTokenException();
        }
        if (token.getExpiresAt().isBefore(now)) {
            throw new InvalidRefreshTokenException();
        }

        String nextRaw = newRawToken();
        String nextHash = hash(nextRaw);
        token.revoke(now, nextHash);
        repository.save(token);
        repository.save(new RefreshToken(token.getUser(), nextHash, now, now.plus(lifetime)));
        return new Rotation(token.getUser(), nextRaw);
    }

    /** Logout: the token stops working. Unknown tokens are ignored (logout always succeeds). */
    @Transactional
    public void revoke(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            return;
        }
        repository.findByTokenHash(hash(rawToken)).ifPresent(token -> {
            if (!token.isRevoked()) {
                token.revoke(now(), null);
                repository.save(token);
            }
        });
    }

    /** After a password change every existing session must log in again. */
    @Transactional
    public void revokeAll(User user) {
        repository.revokeAllForUser(user.getId(), now());
    }

    /** Housekeeping: expired tokens are useless, keep the table small. */
    @Scheduled(cron = "0 17 3 * * *")
    @Transactional
    public void purgeExpired() {
        repository.deleteExpiredBefore(now().minusDays(1));
    }

    private RefreshToken find(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            throw new InvalidRefreshTokenException();
        }
        return repository.findByTokenHash(hash(rawToken)).orElseThrow(InvalidRefreshTokenException::new);
    }

    private String newRawToken() {
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    static String hash(String raw) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(raw.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException(ex);
        }
    }

    private LocalDateTime now() {
        return LocalDateTime.now(clock);
    }

    public record Rotation(User user, String refreshToken) {
    }

    public static class InvalidRefreshTokenException extends RuntimeException {
        public InvalidRefreshTokenException() {
            super("Your session has expired. Please log in again.");
        }
    }
}
