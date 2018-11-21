drop trigger update_user_flag on keyword;
drop function update_user_flag; -- cascade;

create or replace function update_user_flag() returns trigger
language plpgsql
as $$
begin
    if (TG_OP = 'DELETE') then
        update "user" set flag = true where id = OLD.user;
        return OLD;
    else
        update "user" set flag = true where id = NEW.user;
        return NEW;
    end if;
end
$$;

create trigger update_user_flag
after insert or update or delete
on keyword
for each row
    execute procedure
    update_user_flag();
