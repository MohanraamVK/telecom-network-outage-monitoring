package com.telecom.network_monitor.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

/**
 * A long-lived token used only to obtain new access tokens. Only its SHA-256 hash is
 * stored, so a database leak does not hand out working tokens. Each use rotates it.
 */
@Entity
@Table(name = "refresh_tokens")
public class RefreshToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "token_hash", nullable = false, unique = true, length = 64)
    private String tokenHash;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "revoked_at")
    private LocalDateTime revokedAt;

    /** Hash of the token that replaced this one when it was rotated. */
    @Column(name = "replaced_by", length = 64)
    private String replacedBy;

    protected RefreshToken() {
    }

    public RefreshToken(User user, String tokenHash, LocalDateTime createdAt, LocalDateTime expiresAt) {
        this.user = user;
        this.tokenHash = tokenHash;
        this.createdAt = createdAt;
        this.expiresAt = expiresAt;
    }

    public Long getId() {
        return id;
    }

    public User getUser() {
        return user;
    }

    public String getTokenHash() {
        return tokenHash;
    }

    public LocalDateTime getExpiresAt() {
        return expiresAt;
    }

    public LocalDateTime getRevokedAt() {
        return revokedAt;
    }

    public String getReplacedBy() {
        return replacedBy;
    }

    public void revoke(LocalDateTime at, String replacedByHash) {
        this.revokedAt = at;
        this.replacedBy = replacedByHash;
    }

    public boolean isRevoked() {
        return revokedAt != null;
    }
}
