package com.telecom.network_monitor.security;

import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;

import static org.assertj.core.api.Assertions.assertThat;

class LoginAttemptServiceTest {

    private final MutableClock clock = new MutableClock();
    private final LoginAttemptService service =
            new LoginAttemptService(3, 5, Duration.ofMinutes(15), Duration.ofMinutes(10), clock);

    @Test
    void locksAfterMaxFailuresAndUnlocksLater() {
        for (int i = 0; i < 3; i++) {
            assertThat(service.lockedFor("admin", "1.1.1.1")).isEmpty();
            service.loginFailed("admin", "1.1.1.1");
        }
        assertThat(service.lockedFor("admin", "1.1.1.1")).contains(Duration.ofMinutes(10));

        clock.advance(Duration.ofMinutes(11));
        assertThat(service.lockedFor("admin", "1.1.1.1")).isEmpty();
    }

    @Test
    void lockIsPerUsernameAndIpSoTheRealAdminIsNotLockedOut() {
        for (int i = 0; i < 3; i++) {
            service.loginFailed("admin", "6.6.6.6");
        }
        assertThat(service.lockedFor("admin", "6.6.6.6")).isPresent();
        assertThat(service.lockedFor("admin", "10.0.0.1")).isEmpty();
    }

    @Test
    void usernameMatchingIsCaseInsensitive() {
        for (int i = 0; i < 3; i++) {
            service.loginFailed(i % 2 == 0 ? "Admin" : "ADMIN ", "1.1.1.1");
        }
        assertThat(service.lockedFor("admin", "1.1.1.1")).isPresent();
    }

    @Test
    void oneIpCyclingThroughUsernamesIsLocked() {
        for (int i = 0; i < 5; i++) {
            service.loginFailed("user" + i, "6.6.6.6");
        }
        assertThat(service.lockedFor("someone-new", "6.6.6.6")).isPresent();
    }

    @Test
    void successResetsTheCounter() {
        service.loginFailed("admin", "1.1.1.1");
        service.loginFailed("admin", "1.1.1.1");
        service.loginSucceeded("admin", "1.1.1.1");
        service.loginFailed("admin", "1.1.1.1");
        assertThat(service.lockedFor("admin", "1.1.1.1")).isEmpty();
    }

    @Test
    void failuresOutsideTheWindowDoNotAddUp() {
        service.loginFailed("admin", "1.1.1.1");
        service.loginFailed("admin", "1.1.1.1");
        clock.advance(Duration.ofMinutes(16));
        service.loginFailed("admin", "1.1.1.1");
        assertThat(service.lockedFor("admin", "1.1.1.1")).isEmpty();
    }

    static final class MutableClock extends Clock {
        private Instant now = Instant.parse("2026-01-01T00:00:00Z");

        void advance(Duration d) {
            now = now.plus(d);
        }

        @Override
        public ZoneId getZone() {
            return ZoneOffset.UTC;
        }

        @Override
        public Clock withZone(ZoneId zone) {
            return this;
        }

        @Override
        public Instant instant() {
            return now;
        }
    }
}
