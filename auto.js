/*
 * https://www.cnblogs.com/princesong/p/6728250.html
import 'babel-polyfill'
import 'whatwg-fetch'
*/

const app = angular.module('myApp', ['ng-admin'])

const formatMap = {
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

const basePath = "/api/"

const pks = {}

// see table _meta
const customTypes = {}
const customHides = {}

function sleep (ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}


// See:
// https://ng-admin-book.marmelab.com/
app.config(["$httpProvider", (http) => {
    const myInterceptor = {
        request: (config) => {
            if (config.params && config.params.___strip_id_todo) {
                delete config.params.___strip_id_todo
                const url = config.url
                config.url = url.slice(0, url.lastIndexOf("/"))
            }
            return config
        },
    }

    http.interceptors.push(() => myInterceptor)
}])


app.config(['NgAdminConfigurationProvider', "RestangularProvider", (nga, rest) => {
    // create an admin application
    const admin = nga.application('base on postgrest').debug(false)
        .baseApiUrl(basePath)

    nga.configure(admin)

    rest.addFullRequestInterceptor((element, operation, what, url, headers, params, httpConfig) => {
        headers = headers || {}

        switch (operation) {
            case 'get':
            case 'patch':
            case 'remove':
                headers["Accept"] = "application/vnd.pgrst.object+json"
                const idKey = pks[what]
                const idValue = decodeURI(url.slice(url.lastIndexOf("/") + 1))
                params[idKey] = `eq.${idValue}`
                params.___strip_id_todo = true
                break
            case 'getList':
                headers['Prefer'] = "count=exact"

                const filters = params._filters
                delete params._filters

                for (const key in filters) {
                    let v = filters[key]
                    if (v != null) {
                        //const _ = key.split('...')
                        //const k = _[0]
                        //const operator = _[1] || 'eq'
                        let [k, operator] = key.split("...")
                        operator = operator || "eq"
                        if (v instanceof Date) {
                            v = v.toISOString()
                        }
                        params[k] = `${operator}.${v}`
                    }
                }

                //headers['Range-Unit'] = what
                const p = params._page
                const u = params._perPage
                headers['Range'] = `${(p - 1) * u}-${p * u - 1}`
                delete params._page
                delete params._perPage
                if (params._sortField) {
                    const field = params._sortField
                    if (field == "id" && pks[what] != "id") {
                        // pass, ignore field `id` that not exists
                    } else {
                        params.order = field + '.' + params._sortDir.toLowerCase()
                    }
                    delete params._sortField
                    delete params._sortDir
                }
                break
        }
    })

    rest.addResponseInterceptor((data, operation, what, url, response, deferred) => {
        switch (operation) {
            case 'getList':
                response.totalCount = response.headers('Content-Range').split('/')[1]
                break
        }
        return data
    })

    const definitions = JSON.parse(
        $.ajax({url: basePath, async: false}).response
    ).definitions

    const meta = JSON.parse(
        $.ajax({url: basePath + "_meta", async: false}).response
    )
    for (const {table, column, type, hide} of meta) {
        if (!customTypes[table]) {
            customTypes[table] = {}
        }
        if (!customHides[table]) {
            customHides[table] = {}
        }
        customTypes[table][column] = type
        customHides[table][column] = hide
    }
    //console.log(customTypes, customHides)

    const remoteCompleteID = {
        refreshDelay: 300,
        searchQuery: function (search) {
            return {
                'id...eq': search,
            }
        },
    }

    !function () {
        const entities = {}

        for (const tableName in definitions) {
            entities[tableName] = nga.entity(tableName)
                .updateMethod("patch")
                .label(tableName)
        }

        for (const tableName in definitions) {
            const properties = definitions[tableName].properties
            const entity = entities[tableName]
            const fields = []

            const types = customTypes[tableName] || {}

            for (const columnName in properties) {
                const attr = properties[columnName]
                const desc = attr.description || ""
                const pkIdx = desc.indexOf(".<pk")
                const fkIdx = desc.indexOf(".<fk")
                const type = types[columnName] || formatMap[attr.format]
                //console.log(pkIdx, fkIdx, type, columnName, attr)
                if (pkIdx > -1) {
                    const pk = nga.field(columnName, type)
                        .isDetailLink(true)
                        .pinned(true)
                        .label(columnName)
                    entity.identifier(pk)
                    entity.listView().sortField(columnName)
                    pks[tableName] = columnName
                    fields.push(pk)
                } else if (fkIdx > -1) {
                    const fs = desc.slice(fkIdx).split("'")
                    const ref = nga.field(columnName, "reference")
                        .label(columnName)
                        .targetEntity(entities[fs[1]])
                        .targetField(nga.field(fs[3]))
                        .remoteComplete(true, remoteCompleteID)
                    fields.push(ref)
                } else {
                    fields.push(
                        nga.field(columnName, type)
                        .label(columnName)
                    )
                }
            }

            const filters = []
            for (const field of fields) {
                const name = field.name()
                const type = field.type()
                switch (type) {
                    case 'number':
                    case 'float':
                    case 'date':
                    case 'datetime':
                        filters.push(field)
                        filters.push(
                            nga.field(`${name}...gte`, type)
                            .label(`${name} >=`)
                        )
                        filters.push(
                            nga.field(`${name}...lte`, type)
                            .label(`${name} <=`)
                        )
                        break
                    case 'string':
                    case 'text':
                    case 'wysiwyg':
                    case 'email':
                        filters.push(
                            nga.field(`${name}...like`, type)
                            .label(`${name} ~=`)
                        )
                        break
                    default:
                        filters.push(field)
                        break
                }
            }

            const hides = customHides[tableName] || {}

            const fieldsList = fields.filter((i) => !hides[i.name()])

            entity.listView()
                .fields(fieldsList)
                .exportFields(fields)
                .filters(filters)
                .perPage(10)
                //.title(tableName)
                //.sortDir("ASC")
                //.infinitePagination(true)


            const fieldsWithoutID = fields.filter((i) => i.name() != "id")
            entity.editionView().fields(fieldsWithoutID)
            entity.creationView().fields(fieldsWithoutID)
            admin.addEntity(entity)
            //console.log(tableName, definitions[tableName], entity)
        }
    }()

}])

