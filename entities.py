#!/usr/bin/env python3

"""
money patch first
converting.str2datetime = my custom str2datetime must be first
"""
# money patch begin
from datetime import datetime, date

import pendulum
import pony.converting

def str2datetime(s):
    tz = pendulum.local_timezone()
    dt = pendulum.parse(s, tz=tz)
    return datetime.fromtimestamp(dt.timestamp(), tz=tz)

pony.converting.str2datetime = str2datetime

import pony.orm
assert pony.orm.dbapiprovider.str2datetime is str2datetime
# money patch end


import yaml

from pony.orm import (
    Database,
    PrimaryKey,
    Required,
    Optional,
    Set,
    Json,
    db_session,
    sql_debug,
)


#sql_debug(True)

db = Database()
Entity = db.Entity


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



with open("entities.yaml") as f:
    options, *_ = yaml.load_all(f)
db.bind(**options)
db.generate_mapping(create_tables=True)


formats_for_js = {
    str: "string",
    int: "number",
    float: "float",
    bool: "boolean",
    datetime: "datetime",
    date: "date",
    Json: "json",
}


def init():
    with db_session:
        p1 = Person(name='John', age=20, dt=datetime.now())
        p2 = Person(name='Mary', age=22, data=[{1:2}])
        p3 = Person(name='Bob', age=30)
        Car(make='Toyota', model='Prius', owner=p2)
        Car(make='Ford', model='Explorer', owner=p3)
        Test(t=date.today())


def export():
    lst = []
    pks = {}
    tables = Entity.__subclasses__()

    with open("entities-patch.yaml") as f:
        patch = yaml.load(f)

    # 1
    for table in tables:
        tableName = table.__name__.lower()
        tablePatch = patch.get(tableName, {})
        pk = None
        fs = []
        for column in table._attrs_:
            columnName = column.column
            if not columnName:
                continue
            assert column.py_type, column
            if column.is_pk:
                pk = columnName
                pks[table] = {
                    "tableName": tableName,
                    "columnName": columnName,
                }
            py_type = column.py_type
            type = formats_for_js.get(py_type, py_type)
            if type == "string" and not column.args:
                type = "text"
            o = {
                "columnName": columnName,
                "type": type,
            }
            o.update(tablePatch.pop(columnName, {}))
            fs.append(o)

        t = {
            "tableName": tableName,
            "primaryKey": pk,
            "fs": fs,
        }
        t.update(tablePatch)
        lst.append(t)

    # 2
    for i in lst:
        for f in i["fs"]:
            t = f["type"]
            if not isinstance(t, str):
                assert issubclass(t, Entity), t
                f["foreignKey"] = pks[f.pop("type")]

    import json
    print("export default ", json.dumps(lst,  indent=4, ensure_ascii=False))


if __name__ == '__main__':
    init()
    export()
