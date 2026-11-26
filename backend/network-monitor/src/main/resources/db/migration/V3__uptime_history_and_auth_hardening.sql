-- When each node was added (uptime windows start there for new nodes)
ALTER TABLE nodes ADD COLUMN created_at DATETIME(6) NULL;

-- Periods a node spent DOWN or in MAINTENANCE; open periods have no ended_at.
-- Uptime and SLA figures are computed from these.
CREATE TABLE node_status_periods (
    id            BIGINT      NOT NULL AUTO_INCREMENT,
    node_id       BIGINT      NOT NULL,
    status        VARCHAR(32) NOT NULL,
    started_at    DATETIME(6) NOT NULL,
    ended_at      DATETIME(6),
    auto_detected BOOLEAN     NOT NULL DEFAULT FALSE,
    PRIMARY KEY (id),
    CONSTRAINT fk_node_status_periods_node FOREIGN KEY (node_id) REFERENCES nodes (id)
);

CREATE INDEX idx_node_status_periods_window ON node_status_periods (started_at, ended_at);

-- Rotating refresh tokens (only a SHA-256 hash is stored)
CREATE TABLE refresh_tokens (
    id             BIGINT      NOT NULL AUTO_INCREMENT,
    user_id        BIGINT      NOT NULL,
    token_hash     VARCHAR(64) NOT NULL,
    created_at     DATETIME(6) NOT NULL,
    expires_at     DATETIME(6) NOT NULL,
    revoked_at     DATETIME(6),
    replaced_by    VARCHAR(64),
    PRIMARY KEY (id),
    CONSTRAINT uk_refresh_tokens_hash UNIQUE (token_hash),
    CONSTRAINT fk_refresh_tokens_user FOREIGN KEY (user_id) REFERENCES users (id)
);

-- Access tokens issued before a password change stop working
ALTER TABLE users ADD COLUMN password_changed_at DATETIME(6) NULL;
