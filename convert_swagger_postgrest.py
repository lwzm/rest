#!/usr/bin/env python3


import collections
import time
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
    for tableName in definitions:
        properties = definitions[tableName]["properties"]
        fs = []
        for columnName in properties:
            attrs = properties[columnName]
            desc = attrs.get("description", "")
            fkInfo = fkRegExp.search(desc)
            if fkInfo:
                t, c = fkInfo.groups()
                fkInfo = {
                    "tableName": t,
                    "columnName": c,
                }
            fs.append({
                "columnName": columnName,
                "format": columnFormatMap.get(attrs["format"], "string"),
                "pkFlag": ".<pk" in desc,
                "fkInfo": fkInfo,
            })

        tables.append({
            "tableName": tableName,
            "fs": fs,
        })

    print("export default " + json.dumps(tables, indent=4))


if __name__ == "__main__":
    """
    usage:
        ./convert_swagger_postgrest.py >definitions.js
    """
    main()
