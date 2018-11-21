drop table keyword;
drop table "user";

create table "user" (
    id serial primary key,
    name varchar(32) not null,
    email varchar(64),
    comment text,
    alarm boolean,
    flag boolean,
    ts timestamp with time zone default current_timestamp
);

create table keyword (
    id serial primary key,
    "user" integer references "user" (id) not null,
    text varchar(256) not null,
    factor real default 0.0,
    level integer default 0,
    pages integer default 1,
    years text,
    comment text,
    ts timestamp with time zone default current_timestamp
);


\q
