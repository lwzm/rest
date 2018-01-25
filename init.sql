-- drop schema api cascade;
-- su postgres; psql your-db; and then:
--create role web_anon nologin;
--create schema api;
--grant web_anon to your-db;
--grant usage on schema api to web_anon;
--grant all on schema api to your-user;

drop table api.uu;
drop table api.u;
drop table api.t;

CREATE TABLE api.t (
    id SERIAL PRIMARY KEY,
    x JSONB
);

CREATE TABLE api.u (
    id SERIAL PRIMARY KEY,
    s TEXT,
    t INTEGER REFERENCES api.t (id)
);

CREATE TABLE api.uu (
    id INTEGER PRIMARY KEY REFERENCES api.u (id),
    data JSONB
);


grant all on api.t to web_anon;
grant all on api.u to web_anon;
grant all on api.uu to web_anon;
grant usage, select on sequence api.t_id_seq to web_anon;
grant usage, select on sequence api.u_id_seq to web_anon;
