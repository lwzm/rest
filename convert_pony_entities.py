#!/usr/bin/env python3

from app import Entity

import json
import yaml
from datetime import datetime, date

from pony.orm import Json


formats_for_js = {
    str: "string",
    int: "number",
    float: "float",
    bool: "boolean",
    datetime: "datetime",
    date: "date",
    Json: "json",
}


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

    print("export default ", json.dumps(lst,  indent=4, ensure_ascii=False))


if __name__ == '__main__':
    export()
