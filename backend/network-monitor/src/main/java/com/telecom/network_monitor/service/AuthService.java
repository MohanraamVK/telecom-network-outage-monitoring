package com.telecom.network_monitor.service;

import com.telecom.network_monitor.entity.User;
import com.telecom.network_monitor.exception.BadRequestException;
import com.telecom.network_monitor.exception.ResourceNotFoundException;
import com.telecom.network_monitor.repository.UserRepository;
import com.telecom.network_monitor.security.RefreshTokenService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final RefreshTokenService refreshTokenService;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder,
                       RefreshTokenService refreshTokenService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.refreshTokenService = refreshTokenService;
    }

    public User getByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    /**
     * Changes the password, then invalidates every existing session: refresh tokens are
     * revoked and access tokens issued before now are rejected by the JWT filter.
     */
    @Transactional
    public User changePassword(String username, String currentPassword, String newPassword) {
        User user = getByUsername(username);

        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new BadRequestException("Current password is incorrect.");
        }
        if (currentPassword.equals(newPassword)) {
            throw new BadRequestException("New password must be different from the current one.");
        }
        if (newPassword.equalsIgnoreCase(username)) {
            throw new BadRequestException("New password must not be your username.");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        // JWT "issued at" has second precision, so compare at seconds as well
        user.setPasswordChangedAt(LocalDateTime.now().truncatedTo(ChronoUnit.SECONDS));
        userRepository.save(user);
        refreshTokenService.revokeAll(user);
        return user;
    }
}
