-- drop schema api cascade;
-- su postgres; psql your-db; and then:
--create role web_anon nologin;
--create schema api;
--grant web_anon to your-db;
--grant usage on schema api to web_anon;
--grant all on schema api to your-user;

drop table api._meta;
create table api._meta (
    name varchar(32) primary key,
    type varchar(16),
    choices jsonb,  -- this is an array
    readonly boolean,
    hide boolean
);
grant all on api._meta to web_anon;
\q


drop table api.exts;
drop table api.todos;

create table api.todos (
    id serial primary key,
    done boolean not null default false,
    task text not null,
    dt date,
    due timestamp with time zone
);


create table api.exts (
    id serial primary key,

    n2 int,
    n7 float,

    x jsonb,
    todo integer references api.todos (id)
);


grant all on api.todos to web_anon;
grant all on api.exts to web_anon;
grant usage, select on sequence api.todos_id_seq to web_anon;
grant usage, select on sequence api.exts_id_seq to web_anon;
