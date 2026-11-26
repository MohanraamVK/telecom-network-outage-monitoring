package com.telecom.network_monitor.security;

import com.telecom.network_monitor.entity.User;
import com.telecom.network_monitor.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;
import java.time.ZoneId;

/**
 * Authenticates requests carrying "Authorization: Bearer &lt;access token&gt;".
 * Tokens issued before the user's last password change are rejected.
 */
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;

    public JwtAuthenticationFilter(JwtUtil jwtUtil, UserRepository userRepository) {
        this.jwtUtil = jwtUtil;
        this.userRepository = userRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");

        if (authHeader != null && authHeader.startsWith("Bearer ")
                && SecurityContextHolder.getContext().getAuthentication() == null) {
            authenticate(authHeader.substring(7), request);
        }

        filterChain.doFilter(request, response);
    }

    private void authenticate(String token, HttpServletRequest request) {
        String username;
        Instant issuedAt;
        try {
            username = jwtUtil.extractUsername(token);
            issuedAt = jwtUtil.extractIssuedAt(token);
            if (!jwtUtil.isTokenValid(token, username)) {
                return;
            }
        } catch (Exception ignored) {
            // Malformed, tampered or expired token: continue unauthenticated (401 from the entry point)
            return;
        }

        User user = userRepository.findByUsername(username).orElse(null);
        if (user == null || issuedBeforePasswordChange(issuedAt, user)) {
            return;
        }

        UserDetails details = org.springframework.security.core.userdetails.User.builder()
                .username(user.getUsername())
                .password(user.getPassword())
                .roles(user.getRole())
                .build();

        var authentication = new UsernamePasswordAuthenticationToken(details, null, details.getAuthorities());
        authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }

    private static boolean issuedBeforePasswordChange(Instant issuedAt, User user) {
        if (user.getPasswordChangedAt() == null) {
            return false;
        }
        Instant changedAt = user.getPasswordChangedAt().atZone(ZoneId.systemDefault()).toInstant();
        return issuedAt.isBefore(changedAt);
    }
}
