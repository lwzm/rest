drop trigger update_user_flag on keyword;
drop trigger ts on keyword;
-- drop function update_user_flag; -- cascade;

create or replace function update_user_flag() returns trigger
language plpgsql
as $$
declare
row record;
begin
    if (TG_OP = 'DELETE') then
        row := OLD;
    else
        row := NEW;
    end if;
    update "user" set flag = true where id = row.user;
    return row;
end
$$;

create trigger update_user_flag
after insert or update or delete
on keyword
for each row
    execute procedure
    update_user_flag();


create or replace function set_ts_now() returns trigger
language plpgsql
as $$
begin
    NEW.ts = now();
    return NEW;
end
$$;

create trigger ts
before update
on keyword
for each row
    execute procedure
    set_ts_now();
