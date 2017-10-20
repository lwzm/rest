drop table api.log;
drop table api.patient;
drop table api.doctor;
drop table api.zone;

BEGIN;

CREATE TABLE api.zone (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    beds INTEGER
);

CREATE TABLE api.doctor (
    id SERIAL PRIMARY KEY,
    zone INTEGER REFERENCES api.zone,
    info JSONB
);

CREATE TABLE api.patient (
    id SERIAL PRIMARY KEY,
    bed INTEGER,
    state TEXT NOT NULL DEFAULT 'pending',
    zone INTEGER NOT NULL REFERENCES api.zone,
    info JSONB
);


CREATE TABLE api.log (
    id SERIAL PRIMARY KEY,
    datetime TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    key TEXT,
    patient INTEGER NOT NULL REFERENCES api.patient,
    info JSONB
);


grant all on api.zone to web_anon;
grant all on api.zone_id_seq to web_anon;
grant all on api.doctor to web_anon;
grant all on api.doctor_id_seq to web_anon;
grant all on api.patient to web_anon;
grant all on api.patient_id_seq to web_anon;
grant all on api.log to web_anon;
grant all on api.log_id_seq to web_anon;
COMMIT;
