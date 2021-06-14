ALTER TABLE projects
    ADD session INTEGER;

ALTER TABLE projects
    ADD room INTEGER;

ALTER TABLE projects
    ALTER COLUMN description DROP NOT NULL;

ALTER TABLE projects
    ALTER COLUMN github DROP NOT NULL;

ALTER TABLE criteria
    ADD COLUMN ordering NUMERIC;

ALTER TABLE criteria
    ALTER COLUMN description DROP NOT NULL;
