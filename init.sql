-- drop schema api cascade;
-- su postgres; psql your-db; and then:
--create role web_anon nologin;
--create schema api;
--grant web_anon to your-db;
--grant usage on schema api to web_anon;
--grant all on schema api to your-user;


drop table api.kv;
create table api.kv (
    k varchar(9) primary key,
    v varchar(9)
);
grant all on api.kv to web_anon;
\q
drop table api._meta;
create table api._meta (
    id serial primary key,
    "table" varchar(32) not null,
    "column" varchar(32) not null,
    type varchar(16),
    readonly boolean,
    hide boolean
);
grant all on api._meta to web_anon;
grant usage, select on sequence api._meta_id_seq to web_anon;


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
