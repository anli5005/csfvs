CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE projects (
    project_id UUID PRIMARY KEY NOT NULL DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    github TEXT NOT NULL,
    url TEXT,
    image TEXT,
    color TEXT
);

CREATE TABLE users (
    user_id UUID PRIMARY KEY NOT NULL DEFAULT uuid_generate_v4(),
    outlook_id TEXT NOT NULL,
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    project_id UUID REFERENCES projects ON DELETE SET NULL
);

CREATE TABLE criteria (
    criteria_id UUID PRIMARY KEY NOT NULL DEFAULT uuid_generate_v4(),
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL
);

CREATE TABLE reviews (
    review_id UUID PRIMARY KEY NOT NULL DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects ON DELETE CASCADE,
    description TEXT NOT NULL
);

CREATE TABLE xref (
    review_id UUID NOT NULL REFERENCES reviews ON DELETE CASCADE,
    criteria_id UUID NOT NULL REFERENCES criteria ON DELETE CASCADE,
    description TEXT NOT NULL,
    val INT,
    CONSTRAINT xref_pkey PRIMARY KEY (review_id, criteria_id)
);
