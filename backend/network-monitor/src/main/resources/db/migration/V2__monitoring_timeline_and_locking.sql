-- Live monitoring: last heartbeat per node and whether the monitor watches it
ALTER TABLE nodes ADD COLUMN last_heartbeat_at DATETIME(6) NULL;
ALTER TABLE nodes ADD COLUMN monitored BOOLEAN NOT NULL DEFAULT TRUE;

-- Optimistic locking: detects two people (or the monitor) editing the same row
ALTER TABLE nodes ADD COLUMN version BIGINT NOT NULL DEFAULT 0;
ALTER TABLE incidents ADD COLUMN version BIGINT NOT NULL DEFAULT 0;

-- Incidents opened automatically by the outage detector
ALTER TABLE incidents ADD COLUMN auto_generated BOOLEAN NOT NULL DEFAULT FALSE;

-- Incident timeline: every status change, note and automatic action
CREATE TABLE incident_events (
    id          BIGINT        NOT NULL AUTO_INCREMENT,
    incident_id BIGINT        NOT NULL,
    type        VARCHAR(32)   NOT NULL,
    from_status VARCHAR(32),
    to_status   VARCHAR(32),
    message     VARCHAR(1000),
    actor       VARCHAR(100)  NOT NULL,
    created_at  DATETIME(6)   NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_incident_events_incident FOREIGN KEY (incident_id) REFERENCES incidents (id)
);

CREATE INDEX idx_incident_events_created_at ON incident_events (created_at);
CREATE INDEX idx_incidents_status ON incidents (status, deleted);
CREATE INDEX idx_nodes_status ON nodes (status, deleted);
