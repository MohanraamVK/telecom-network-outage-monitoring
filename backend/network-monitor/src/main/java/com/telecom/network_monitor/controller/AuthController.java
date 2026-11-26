package com.telecom.network_monitor.controller;

import com.telecom.network_monitor.dto.ApiResponse;
import com.telecom.network_monitor.dto.AuthRequestDTO;
import com.telecom.network_monitor.dto.AuthResponseDTO;
import com.telecom.network_monitor.dto.ChangePasswordRequestDTO;
import com.telecom.network_monitor.dto.ErrorResponseDTO;
import com.telecom.network_monitor.dto.RefreshRequestDTO;
import com.telecom.network_monitor.entity.User;
import com.telecom.network_monitor.security.JwtUtil;
import com.telecom.network_monitor.security.LoginAttemptService;
import com.telecom.network_monitor.security.RefreshTokenService;
import com.telecom.network_monitor.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Auth API", description = "Login, token refresh, logout and password change")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final AuthService authService;
    private final RefreshTokenService refreshTokenService;
    private final LoginAttemptService loginAttempts;

    public AuthController(AuthenticationManager authenticationManager,
                          JwtUtil jwtUtil,
                          AuthService authService,
                          RefreshTokenService refreshTokenService,
                          LoginAttemptService loginAttempts) {
        this.authenticationManager = authenticationManager;
        this.jwtUtil = jwtUtil;
        this.authService = authService;
        this.refreshTokenService = refreshTokenService;
        this.loginAttempts = loginAttempts;
    }

    @Operation(summary = "Log in",
            description = "Returns a short-lived access token (send as 'Authorization: Bearer <token>') and a refresh "
                    + "token. Repeated failures lock the username for this IP address for 15 minutes (HTTP 429).")
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody AuthRequestDTO authRequest, HttpServletRequest request) {
        String ip = request.getRemoteAddr();
        String username = authRequest.getUsername();

        Optional<Duration> locked = loginAttempts.lockedFor(username, ip);
        if (locked.isPresent()) {
            return tooManyAttempts(locked.get());
        }

        try {
            authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(username, authRequest.getPassword()));
        } catch (AuthenticationException ex) {
            loginAttempts.loginFailed(username, ip);
            Optional<Duration> nowLocked = loginAttempts.lockedFor(username, ip);
            if (nowLocked.isPresent()) {
                return tooManyAttempts(nowLocked.get());
            }
            // Same message for unknown users and wrong passwords: never reveal which usernames exist
            return error(HttpStatus.UNAUTHORIZED, "Invalid username or password.", "/api/auth/login");
        }

        loginAttempts.loginSucceeded(username, ip);
        User user = authService.getByUsername(username);
        return ResponseEntity.ok(tokens(user, refreshTokenService.issue(user)));
    }

    @Operation(summary = "Refresh tokens",
            description = "Exchanges a refresh token for a new access + refresh token pair. Each refresh token works "
                    + "once; reusing an old one revokes all of that user's sessions.")
    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(@Valid @RequestBody RefreshRequestDTO body) {
        try {
            RefreshTokenService.Rotation rotation = refreshTokenService.rotate(body.refreshToken());
            return ResponseEntity.ok(tokens(rotation.user(), rotation.refreshToken()));
        } catch (RefreshTokenService.InvalidRefreshTokenException ex) {
            return error(HttpStatus.UNAUTHORIZED, ex.getMessage(), "/api/auth/refresh");
        }
    }

    @Operation(summary = "Log out", description = "Revokes the given refresh token. Always succeeds.")
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@RequestBody(required = false) RefreshRequestDTO body) {
        refreshTokenService.revoke(body == null ? null : body.refreshToken());
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Current user")
    @GetMapping("/me")
    public ApiResponse<Map<String, String>> me(Authentication authentication) {
        User user = authService.getByUsername(authentication.getName());
        return new ApiResponse<>(true, "Current user", Map.of("username", user.getUsername(), "role", user.getRole()));
    }

    @Operation(summary = "Change password",
            description = "Admins only. Signs out every other session and returns a fresh token pair for this one.")
    @PostMapping("/change-password")
    public ResponseEntity<AuthResponseDTO> changePassword(@Valid @RequestBody ChangePasswordRequestDTO body,
                                                          Authentication authentication) {
        User user = authService.changePassword(authentication.getName(), body.currentPassword(), body.newPassword());
        return ResponseEntity.ok(tokens(user, refreshTokenService.issue(user)));
    }

    // ---------------------------------------------------------------- helpers

    private AuthResponseDTO tokens(User user, String refreshToken) {
        return new AuthResponseDTO(jwtUtil.generateToken(user.getUsername()), refreshToken,
                jwtUtil.getExpirationSeconds(), user.getUsername(), user.getRole());
    }

    private ResponseEntity<ErrorResponseDTO> tooManyAttempts(Duration wait) {
        long minutes = Math.max(1, (wait.toSeconds() + 59) / 60);
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                .header(HttpHeaders.RETRY_AFTER, String.valueOf(Math.max(1, wait.toSeconds())))
                .body(new ErrorResponseDTO(HttpStatus.TOO_MANY_REQUESTS.value(), "Too Many Requests",
                        "Too many failed login attempts. Try again in " + minutes + " minute" + (minutes == 1 ? "" : "s") + ".",
                        "/api/auth/login", LocalDateTime.now()));
    }

    private ResponseEntity<ErrorResponseDTO> error(HttpStatus status, String message, String path) {
        return ResponseEntity.status(status)
                .body(new ErrorResponseDTO(status.value(), status.getReasonPhrase(), message, path, LocalDateTime.now()));
    }
}
