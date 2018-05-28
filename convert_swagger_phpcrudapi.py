#!/usr/bin/env python3


import collections
import time
import json
import re

import requests

columnFormatMap = {
    "tinyint": "number",
    "smallint": "number",
    "mediumint": "number",
    "int": "number",
    "bigint": "number",
    "integer": "number",
    "enum": "number",
    "real": "float",
    "float": "float",
    "double": "float",
    "varchar": "string",
    "tinytext": "string",
    "text": "text",
    "longtext": "text",
    "boolean": "boolean",
    "datetime": "datetime",
    "timestamp": "datetime",
    "date": "date",
    "json": "json",
}


def main():
    tables = []

    url = "http://crud.z.tyio.net/api/"
    url = "http://crud.tyio.net/api/"
    data = requests.get(url).json()
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


if __name__ == "__main__":
    """
    usage:
        ./convert_swagger_phpcrudapi.py >definitions.js
    """
    main()
