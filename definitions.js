export default [
    {
        "tableName": "item",
        "primaryKey": "id",
        "displayForFk": "name",
        "fs": [
            {
                "columnName": "id",
                "type": "number",
                "foreignKey": null
            },
            {
                "columnName": "name",
                "type": "string",
                "foreignKey": null
            },
            {
                "columnName": "comment",
                "type": "wysiwyg",
                "foreignKey": null
            },
            {
                "columnName": "ts",
                "type": "datetime",
                "foreignKey": null,
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
                "foreignKey": null
            },
            {
                "columnName": "item",
                "type": "number",
                "foreignKey": {
                    "tableName": "item",
                    "columnName": "id"
                }
            },
            {
                "columnName": "value",
                "type": "float",
                "foreignKey": null
            },
            {
                "columnName": "unit",
                "type": "string",
                "foreignKey": null,
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
                "foreignKey": null,
                "readonly": true
            },
            {
                "columnName": "ts",
                "type": "datetime",
                "foreignKey": null
            }
        ]
    }
]
