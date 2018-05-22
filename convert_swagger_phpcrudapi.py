#!/usr/bin/env python3


import collections
import time
import json
import re

import requests

columnFormatMap = {
    "integer": "number",
    "varchar": "string",
    "text": "text",
    "boolean": "boolean",
    "datetime": "datetime",
    "timestamp": "datetime",
    "date": "date",
    "json": "json",
}


def main():
    tables = []

    data = requests.get("http://crud.tyio.net/").json()
    for k, v in data["paths"].items():
        if k.count("/") > 1:
            continue

        tableName = k[1:]
        fs = []
        properties = v["post"]["parameters"][0]["schema"]["properties"]  # omg...

        for columnName, info in properties.items():
            fkInfo = info.get("x-references")
            if fkInfo:
                fkInfo = {
                    "tableName": fkInfo[0],
                    "columnName": fkInfo[1],
                }
            fs.append({
                "columnName": columnName,
                "format": columnFormatMap[info["x-dbtype"].partition("(")[0]],
                "pkFlag": info.get("x-primary-key"),
                "fkInfo": fkInfo,
            })

        tables.append({
            "tableName": tableName,
            "fs": fs,
        })

    print("export default " + json.dumps(tables, indent=4))
    return

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

    print("export default " + json.dumps(tables["paths"], indent=4))


if __name__ == "__main__":
    """
    usage:
        ./convert_swagger_postgrest.py >definitions.js
    """
    main()
