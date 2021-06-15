CREATE TABLE assignments (
    project_id UUID NOT NULL REFERENCES projects ON DELETE CASCADE,
    email TEXT NOT NULL,
    CONSTRAINT assignments_pkey PRIMARY KEY (project_id, email)
);
