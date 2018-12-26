drop table keyword;
drop table "user";

create table "user" (
    id serial primary key,
    name varchar(32) not null,
    email varchar(64),
    vip integer default 0,
    alarm boolean,
    flag boolean,
    comment text,
    ts timestamp with time zone default current_timestamp
);

create table keyword (
    id bigserial primary key,
    "user" integer references "user" (id) not null,
    text varchar(256) not null,
    factor real default 0.0,
    level integer default 0,
    pages integer default 1,
    years text,
    match_mode varchar(64),
    comment text,
    ts timestamp with time zone default current_timestamp
);


\q
