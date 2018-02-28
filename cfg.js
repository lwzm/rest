const v = 1

const columnFormatMap = {
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

export default {
    v,
    columnFormatMap,
}
