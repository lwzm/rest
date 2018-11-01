export default [
    {
        "tableName": "item",
        "displayForFk": "name",
        "fs": [
            {
                "columnName": "id",
                "type": "number",
                "pkFlag": true,
                "fkInfo": null
            },
            {
                "columnName": "name",
                "type": "string",
                "pkFlag": false,
                "fkInfo": null
            },
            {
                "columnName": "comment",
                "type": "wysiwyg",
                "pkFlag": false,
                "fkInfo": null
            },
            {
                "columnName": "ts",
                "type": "datetime",
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
                "type": "number",
                "pkFlag": true,
                "fkInfo": null
            },
            {
                "columnName": "item",
                "type": "number",
                "pkFlag": false,
                "fkInfo": {
                    "tableName": "item",
                    "columnName": "id"
                }
            },
            {
                "columnName": "value",
                "type": "float",
                "pkFlag": false,
                "fkInfo": null
            },
            {
                "columnName": "unit",
                "type": "string",
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
                "type": "text",
                "pkFlag": false,
                "fkInfo": null,
                "readonly": true
            },
            {
                "columnName": "ts",
                "type": "datetime",
                "pkFlag": false,
                "fkInfo": null
            }
        ]
    }
]
