package com.telecom.network_monitor.security;

import com.telecom.network_monitor.entity.RefreshToken;
import com.telecom.network_monitor.entity.User;
import com.telecom.network_monitor.repository.RefreshTokenRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class RefreshTokenServiceTest {

    private static final Instant NOW = Instant.parse("2026-03-01T12:00:00Z");

    @Mock
    private RefreshTokenRepository repository;

    private final Map<String, RefreshToken> store = new HashMap<>();
    private RefreshTokenService service;
    private User user;

    @BeforeEach
    void setUp() {
        service = new RefreshTokenService(repository, Duration.ofDays(7), Clock.fixed(NOW, ZoneOffset.UTC));
        user = new User(1L, "admin", "hash", "ADMIN");
        when(repository.save(any(RefreshToken.class))).thenAnswer(i -> {
            RefreshToken t = i.getArgument(0);
            store.put(t.getTokenHash(), t);
            return t;
        });
        when(repository.findByTokenHash(anyString())).thenAnswer(i -> Optional.ofNullable(store.get(i.<String>getArgument(0))));
    }

    @Test
    void storesOnlyAHashOfTheToken() {
        String raw = service.issue(user);

        assertThat(store).doesNotContainKey(raw);
        assertThat(store).containsKey(RefreshTokenService.hash(raw));
        assertThat(raw).hasSizeGreaterThan(40);
    }

    @Test
    void rotationReturnsANewTokenAndRetiresTheOld() {
        String first = service.issue(user);

        var rotation = service.rotate(first);

        assertThat(rotation.refreshToken()).isNotEqualTo(first);
        assertThat(rotation.user()).isSameAs(user);
        assertThat(store.get(RefreshTokenService.hash(first)).isRevoked()).isTrue();
        assertThat(store.get(RefreshTokenService.hash(rotation.refreshToken())).isRevoked()).isFalse();
    }

    @Test
    void reusingARotatedTokenRevokesEverySession() {
        String first = service.issue(user);
        service.rotate(first);

        assertThatThrownBy(() -> service.rotate(first))
                .isInstanceOf(RefreshTokenService.InvalidRefreshTokenException.class);
        verify(repository).revokeAllForUser(1L, LocalDateTime.ofInstant(NOW, ZoneOffset.UTC));
    }

    @Test
    void loggedOutTokenIsRejectedWithoutRevokingOthers() {
        String raw = service.issue(user);
        service.revoke(raw);

        assertThatThrownBy(() -> service.rotate(raw))
                .isInstanceOf(RefreshTokenService.InvalidRefreshTokenException.class);
        verify(repository, never()).revokeAllForUser(anyLong(), any());
    }

    @Test
    void unknownOrBlankTokensAreRejected() {
        assertThatThrownBy(() -> service.rotate("nope")).isInstanceOf(RefreshTokenService.InvalidRefreshTokenException.class);
        assertThatThrownBy(() -> service.rotate(" ")).isInstanceOf(RefreshTokenService.InvalidRefreshTokenException.class);
    }

    @Test
    void expiredTokenIsRejected() {
        RefreshToken old = new RefreshToken(user, RefreshTokenService.hash("old"),
                LocalDateTime.ofInstant(NOW, ZoneOffset.UTC).minusDays(8),
                LocalDateTime.ofInstant(NOW, ZoneOffset.UTC).minusDays(1));
        store.put(old.getTokenHash(), old);

        assertThatThrownBy(() -> service.rotate("old")).isInstanceOf(RefreshTokenService.InvalidRefreshTokenException.class);
    }
}
