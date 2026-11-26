package com.telecom.network_monitor.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Brute-force protection for the login endpoint.
 *
 * After {@code maxFailures} failed attempts for the same username from the same IP
 * within the window, that pair is locked for {@code lockDuration}. Keying on the pair
 * (not the username alone) means an attacker cannot lock the real admin out from
 * elsewhere. A separate, higher per-IP limit stops one address from cycling through
 * usernames. State is in memory: fine for a single instance, and it resets on restart.
 */
@Service
public class LoginAttemptService {

    static final int MAX_TRACKED_KEYS = 10_000;

    private final int maxFailures;
    private final int maxFailuresPerIp;
    private final Duration window;
    private final Duration lockDuration;
    private final Clock clock;

    private final Map<String, Attempts> attempts = new ConcurrentHashMap<>();

    @Autowired
    public LoginAttemptService(@Value("${app.security.login.max-failures:5}") int maxFailures,
                               @Value("${app.security.login.max-failures-per-ip:20}") int maxFailuresPerIp,
                               @Value("${app.security.login.window:15m}") Duration window,
                               @Value("${app.security.login.lock-duration:15m}") Duration lockDuration) {
        this(maxFailures, maxFailuresPerIp, window, lockDuration, Clock.systemUTC());
    }

    LoginAttemptService(int maxFailures, int maxFailuresPerIp, Duration window, Duration lockDuration, Clock clock) {
        this.maxFailures = maxFailures;
        this.maxFailuresPerIp = maxFailuresPerIp;
        this.window = window;
        this.lockDuration = lockDuration;
        this.clock = clock;
    }

    /** @return how long the caller must wait, or empty when a login attempt is allowed */
    public Optional<Duration> lockedFor(String username, String ip) {
        Instant now = clock.instant();
        return longest(remaining(userKey(username, ip), now), remaining(ipKey(ip), now));
    }

    public void loginFailed(String username, String ip) {
        Instant now = clock.instant();
        if (attempts.size() > MAX_TRACKED_KEYS) {
            attempts.entrySet().removeIf(e -> e.getValue().isStale(now, window));
        }
        attempts.computeIfAbsent(userKey(username, ip), k -> new Attempts()).fail(now, window, maxFailures, lockDuration);
        attempts.computeIfAbsent(ipKey(ip), k -> new Attempts()).fail(now, window, maxFailuresPerIp, lockDuration);
    }

    public void loginSucceeded(String username, String ip) {
        attempts.remove(userKey(username, ip));
    }

    private Optional<Duration> remaining(String key, Instant now) {
        Attempts a = attempts.get(key);
        return a == null ? Optional.empty() : a.lockedFor(now);
    }

    private static Optional<Duration> longest(Optional<Duration> a, Optional<Duration> b) {
        if (a.isEmpty()) return b;
        if (b.isEmpty()) return a;
        return a.get().compareTo(b.get()) >= 0 ? a : b;
    }

    private static String userKey(String username, String ip) {
        return "u:" + (username == null ? "" : username.trim().toLowerCase(Locale.ROOT)) + "|" + ip;
    }

    private static String ipKey(String ip) {
        return "ip:" + ip;
    }

    private static final class Attempts {
        private int failures;
        private Instant windowStart;
        private Instant lockedUntil;

        synchronized void fail(Instant now, Duration window, int max, Duration lockDuration) {
            if (windowStart == null || now.isAfter(windowStart.plus(window))) {
                windowStart = now;
                failures = 0;
            }
            failures++;
            if (failures >= max) {
                lockedUntil = now.plus(lockDuration);
                failures = 0;
                windowStart = null;
            }
        }

        synchronized Optional<Duration> lockedFor(Instant now) {
            if (lockedUntil != null && now.isBefore(lockedUntil)) {
                return Optional.of(Duration.between(now, lockedUntil));
            }
            return Optional.empty();
        }

        synchronized boolean isStale(Instant now, Duration window) {
            boolean lockOver = lockedUntil == null || now.isAfter(lockedUntil);
            boolean windowOver = windowStart == null || now.isAfter(windowStart.plus(window));
            return lockOver && windowOver;
        }
    }
}
