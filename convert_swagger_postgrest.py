#!/usr/bin/env python3

import json
import re

import requests
import yaml


columnFormatMap = {

    "integer": "number",
    "smallint": "number",
    "bigint": "number",

    "jsonb": "json",
    "json": "json",

    "text": "text",
    "character varying": "string",
    "character": "string",

    "boolean": "boolean",

    "timestamp without time zone": "datetime",
    "timestamp with time zone": "datetime",
    "date": "date",

    "double precision": "float",
    "real": "float",
    "numeric": "float",
}


def main():
    data = requests.get("http://127.0.0.1:3000/").json()
    fkRegExp = re.compile(r"<fk table='([^']+)' column='([^']+)'/>")

    tables = []

    definitions = data["definitions"]
    with open("postgrest-patch.yaml") as f:
        patch = yaml.load(f)

    for tableName in definitions:
        tablePatch = patch.get(tableName, {})
        properties = definitions[tableName].get("properties", [])
        fs = []
        pk = []
        for columnName in properties:
            attrs = properties[columnName]
            desc = attrs.get("description", "")
            foreignKey = fkRegExp.search(desc)
            if foreignKey:
                t, c = foreignKey.groups()
                foreignKey = {
                    "tableName": t,
                    "columnName": c,
                }
            if ".<pk" in desc:
                pk.append(columnName)
            o = {
                "columnName": columnName,
            }
            if foreignKey:
                o["foreignKey"] = foreignKey
            else:
                o["type"] = columnFormatMap.get(attrs["format"], "string")
            o.update(tablePatch.pop(columnName, {}))
            fs.append(o)

        pk = pk[0] if len(pk) == 1 else None  # composite primary key is not supported currently

        t = {
            "tableName": tableName,
            "primaryKey": pk,
            "fs": fs,
        }
        t.update(tablePatch)
        tables.append(t)

    print("export default " + json.dumps(tables, indent=4, ensure_ascii=False))


if __name__ == "__main__":
    """
    usage:
        ./convert_swagger_postgrest.py >definitions.js
    """
    main()
