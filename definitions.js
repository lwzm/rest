export default [
    {
        "tableName": "_meta",
        "displayForFk": "name",
        "fs": [
            {
                "columnName": "name",
                "format": "string",
                "pkFlag": true,
                "fkInfo": null
            },
            {
                "columnName": "type",
                "format": "string",
                "pkFlag": false,
                "fkInfo": null
            },
            {
                "columnName": "choices",
                "format": "json",
                "pkFlag": false,
                "fkInfo": null
            },
            {
                "columnName": "pinned",
                "format": "boolean",
                "pkFlag": false,
                "fkInfo": null
            },
            {
                "columnName": "readonly",
                "format": "boolean",
                "pkFlag": false,
                "fkInfo": null
            },
            {
                "columnName": "hide",
                "format": "boolean",
                "pkFlag": false,
                "fkInfo": null
            }
        ]
    },
    {
        "tableName": "item",
        "displayForFk": "name",
        "fs": [
            {
                "columnName": "id",
                "format": "number",
                "pkFlag": true,
                "fkInfo": null
            },
            {
                "columnName": "name",
                "format": "string",
                "pkFlag": false,
                "fkInfo": null
            },
            {
                "columnName": "comment",
                "format": "text",
                "pkFlag": false,
                "fkInfo": null
            },
            {
                "columnName": "ts",
                "format": "datetime",
                "pkFlag": false,
                "fkInfo": null
            }
        ]
    },
    {
        "tableName": "price",
        "displayForFk": "id",
        "fs": [
            {
                "columnName": "id",
                "format": "number",
                "pkFlag": true,
                "fkInfo": null
            },
            {
                "columnName": "item",
                "format": "number",
                "pkFlag": false,
                "fkInfo": {
                    "tableName": "item",
                    "columnName": "id"
                }
            },
            {
                "columnName": "value",
                "format": "float",
                "pkFlag": false,
                "fkInfo": null
            },
            {
                "columnName": "unit",
                "format": "string",
                "pkFlag": false,
                "fkInfo": null
            },
            {
                "columnName": "comment",
                "format": "text",
                "pkFlag": false,
                "fkInfo": null
            },
            {
                "columnName": "ts",
                "format": "datetime",
                "pkFlag": false,
                "fkInfo": null
            }
        ]
    }
]
