export default [
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
                "fkInfo": null,
                "template": "<img width=20 height=20 src=\"https://code.angularjs.org/1.6.1/docs/img/angularjs-for-header-only.svg\" >{{ value }}"
            },
            {
                "columnName": "ts",
                "format": "datetime",
                "pkFlag": false,
                "fkInfo": null,
                "hide": true
            }
        ],
        "listActions": [
            "test"
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
                "fkInfo": null,
                "choices": [
                    "吨",
                    "公斤",
                    "斤",
                    "瓶",
                    "箱",
                    "盒",
                    "条",
                    "袋",
                    "克"
                ]
            },
            {
                "columnName": "comment",
                "format": "text",
                "pkFlag": false,
                "fkInfo": null,
                "readonly": true
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
