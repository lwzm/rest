#!/usr/bin/env python3

import json
import re

import requests


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
    data = requests.get("http://localhost:3000/").json()
    fkRegExp = re.compile(r"<fk table='([^']+)' column='([^']+)'/>")

    tables = []

    definitions = data["definitions"]
    representable = {"id", "name"}

    with open("postgrest-patch.json") as f:
        patch = json.load(f)

    for tableName in definitions:
        tablePatch = patch.get(tableName, {})
        properties = definitions[tableName]["properties"]
        fs = []
        displayForFk = None
        for columnName in properties:
            if columnName in representable:
                displayForFk = columnName
            attrs = properties[columnName]
            desc = attrs.get("description", "")
            fkInfo = fkRegExp.search(desc)
            if fkInfo:
                t, c = fkInfo.groups()
                fkInfo = {
                    "tableName": t,
                    "columnName": c,
                }
            o = {
                "columnName": columnName,
                "format": columnFormatMap.get(attrs["format"], "string"),
                "pkFlag": ".<pk" in desc,
                "fkInfo": fkInfo,
            }
            o.update(tablePatch.pop(columnName, {}))
            fs.append(o)

        t = {
            "tableName": tableName,
            "displayForFk": displayForFk,
            "fs": fs,
        }
        t.update(tablePatch)
        tables.append(t)

    print("export default " + json.dumps(tables, indent=4))


if __name__ == "__main__":
    """
    usage:
        ./convert_swagger_postgrest.py >definitions.js
    """
    main()
