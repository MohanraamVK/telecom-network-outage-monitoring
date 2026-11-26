package com.telecom.network_monitor.controller;

import com.telecom.network_monitor.dto.AuthRequestDTO;
import com.telecom.network_monitor.dto.AuthResponseDTO;
import com.telecom.network_monitor.dto.ErrorResponseDTO;
import com.telecom.network_monitor.entity.User;
import com.telecom.network_monitor.security.JwtUtil;
import com.telecom.network_monitor.service.AuthService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Auth API", description = "Login and JWT issuing")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final AuthService authService;

    public AuthController(AuthenticationManager authenticationManager,
                          JwtUtil jwtUtil,
                          AuthService authService) {
        this.authenticationManager = authenticationManager;
        this.jwtUtil = jwtUtil;
        this.authService = authService;
    }

    @Operation(summary = "Log in", description = "Returns a JWT to send as 'Authorization: Bearer <token>'")
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody AuthRequestDTO authRequest) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            authRequest.getUsername(),
                            authRequest.getPassword()
                    )
            );

            User user = authService.getByUsername(authRequest.getUsername());
            String token = jwtUtil.generateToken(user.getUsername());

            AuthResponseDTO response = new AuthResponseDTO(
                    token,
                    user.getUsername(),
                    user.getRole()
            );

            return ResponseEntity.ok(response);

        } catch (AuthenticationException ex) {
            // Covers bad credentials, unknown users and locked/disabled accounts
            // with the same message, so the API never reveals which usernames exist.
            ErrorResponseDTO errorResponse = new ErrorResponseDTO(
                    HttpStatus.UNAUTHORIZED.value(),
                    "Unauthorized",
                    "Invalid username or password.",
                    "/api/auth/login",
                    LocalDateTime.now()
            );

            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorResponse);
        }
    }
}