package com.telecom.network_monitor.dto;

/**
 * Login / refresh result. {@code token} is the short-lived access token for the
 * Authorization header; {@code refreshToken} gets a new pair when it expires.
 */
public class AuthResponseDTO {

    private String token;
    private String refreshToken;
    private long expiresIn;
    private String username;
    private String role;

    public AuthResponseDTO() {
    }

    public AuthResponseDTO(String token, String username, String role) {
        this.token = token;
        this.username = username;
        this.role = role;
    }

    public AuthResponseDTO(String token, String refreshToken, long expiresIn, String username, String role) {
        this(token, username, role);
        this.refreshToken = refreshToken;
        this.expiresIn = expiresIn;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getRefreshToken() {
        return refreshToken;
    }

    public void setRefreshToken(String refreshToken) {
        this.refreshToken = refreshToken;
    }

    /** Access token lifetime in seconds. */
    public long getExpiresIn() {
        return expiresIn;
    }

    public void setExpiresIn(long expiresIn) {
        this.expiresIn = expiresIn;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }
}
