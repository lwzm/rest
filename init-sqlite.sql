drop table _meta;
create table _meta (
    name varchar(32) primary key,
    type varchar(16),
    choices json,  -- this is an array
    pinned boolean,
    readonly boolean,
    hide boolean
);
insert into _meta (name, choices) values (
    '_meta-type',
    '[
      "string",
      "text",
      "wysiwyg",
      "password",
      "email",
      "date",
      "datetime",
      "number",
      "float",
      "boolean",
      "json"
    ]'
);
.exit
