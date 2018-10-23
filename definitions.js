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
        "tableName": "user",
        "displayForFk": "name",
        "fs": [
            {
                "columnName": "id",
                "format": "number",
                "pkFlag": true,
                "fkInfo": null
            },
            {
                "columnName": "ksid",
                "format": "string",
                "pkFlag": false,
                "fkInfo": null,
                "template": "<a href='{{ \"https://live.kuaishou.com/profile/\" + value }}' target=_blank>{{ value }}</a>"
            },
            {
                "columnName": "name",
                "format": "string",
                "pkFlag": false,
                "fkInfo": null
            },
            {
                "columnName": "city",
                "format": "string",
                "pkFlag": false,
                "fkInfo": null
            },
            {
                "columnName": "fans",
                "format": "number",
                "pkFlag": false,
                "fkInfo": null
            },
            {
                "columnName": "videos",
                "format": "number",
                "pkFlag": false,
                "fkInfo": null
            },
            {
                "columnName": "source",
                "format": "json",
                "pkFlag": false,
                "fkInfo": null,
                "template": "<div> <h6>{{ value.verifiedStatus.description }}</h6> <img width=48 height=48 src='{{ value.profile }}' > </div>"
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
        ],
        "avatar": {
            "template": "<img width=48 height=48 src='{{ value }}' >"
        }
    },
    {
        "tableName": "video",
        "displayForFk": "id",
        "fs": [
            {
                "columnName": "id",
                "format": "string",
                "pkFlag": true,
                "fkInfo": null
            },
            {
                "columnName": "user",
                "format": "number",
                "pkFlag": false,
                "fkInfo": {
                    "tableName": "user",
                    "columnName": "id"
                }
            },
            {
                "columnName": "caption",
                "format": "string",
                "pkFlag": false,
                "fkInfo": null
            },
            {
                "columnName": "views",
                "format": "number",
                "pkFlag": false,
                "fkInfo": null
            },
            {
                "columnName": "likes",
                "format": "number",
                "pkFlag": false,
                "fkInfo": null
            },
            {
                "columnName": "url",
                "format": "text",
                "pkFlag": false,
                "fkInfo": null,
                "template": "<video width=\"150\" height=\"200\" controls> <source src='{{ value }}' type=\"video/mp4\"> </video>"
            },
            {
                "columnName": "source",
                "format": "json",
                "pkFlag": false,
                "fkInfo": null,
                "hide": true
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
