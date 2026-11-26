-- Baseline: the schema Hibernate generated before Flyway was introduced.
-- Existing databases skip this file (spring.flyway.baseline-on-migrate=true,
-- baseline-version=1); new databases are created from it.
-- Written in portable SQL so it runs on MySQL, TiDB and H2 (tests).

CREATE TABLE nodes (
    id       BIGINT       NOT NULL AUTO_INCREMENT,
    name     VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    status   VARCHAR(32),
    deleted  BOOLEAN      NOT NULL DEFAULT FALSE,
    PRIMARY KEY (id)
);

CREATE TABLE incidents (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    description VARCHAR(255),
    severity    VARCHAR(32),
    status      VARCHAR(32),
    deleted     BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at  DATETIME(6),
    updated_at  DATETIME(6),
    resolved_at DATETIME(6),
    node_id     BIGINT       NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_incidents_node FOREIGN KEY (node_id) REFERENCES nodes (id)
);

CREATE TABLE users (
    id       BIGINT       NOT NULL AUTO_INCREMENT,
    username VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role     VARCHAR(50)  NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_users_username UNIQUE (username)
);
