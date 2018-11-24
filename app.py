#!/usr/bin/env python3

from datetime import datetime, date
from pony_rest import Entity, start, make_application

from pony.orm import (
    PrimaryKey,
    Required,
    Optional,
    Set,
    Json,
    db_session,
    sql_debug,
)


class Person(Entity):
    #id = PrimaryKey(int, auto=True)
    name = Required(str, 32)
    age = Required(int)
    dt = Optional(datetime)
    data = Optional(Json)
    cars = Set(lambda: Car)


class Car(Entity):
    #id = PrimaryKey(int, auto=True)
    make = Required(str, 64)
    model = Optional(str, 64, nullable=True)
    owner = Required(lambda: Person)


class Test(Entity):
    f = Optional(float)
    b = Optional(bool)
    d = Optional(datetime)
    t = Optional(date)
    j = Optional(Json)


if __name__ == '__main__':
    start(18000)
else:
    application = make_application()
