export default [
    {
        "tableName": "item",
        "primaryKey": "id",
        "displayForFk": "name",
        "fs": [
            {
                "columnName": "id",
                "type": "number",
                "fkInfo": null
            },
            {
                "columnName": "name",
                "type": "string",
                "fkInfo": null
            },
            {
                "columnName": "comment",
                "type": "wysiwyg",
                "fkInfo": null
            },
            {
                "columnName": "ts",
                "type": "datetime",
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
        "primaryKey": "id",
        "displayForFk": "id",
        "fs": [
            {
                "columnName": "id",
                "type": "number",
                "fkInfo": null
            },
            {
                "columnName": "item",
                "type": "number",
                "fkInfo": {
                    "tableName": "item",
                    "columnName": "id"
                }
            },
            {
                "columnName": "value",
                "type": "float",
                "fkInfo": null
            },
            {
                "columnName": "unit",
                "type": "string",
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
                "fkInfo": null,
                "readonly": true
            },
            {
                "columnName": "ts",
                "type": "datetime",
                "fkInfo": null
            }
        ]
    }
]
