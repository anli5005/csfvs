ALTER TABLE criteria
    ADD COLUMN required BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE criteria
    ADD COLUMN restricted BOOLEAN NOT NULL DEFAULT FALSE;