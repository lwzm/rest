/*
 * https://www.cnblogs.com/princesong/p/6728250.html
 * http://babeljs.io/docs/plugins/transform-runtime/
import 'babel-polyfill'
*/

import cfg from "./cfg"

const App = angular.module('myApp', ['ng-admin'])

const BasePath = "/api/"

const PKS = {}

function sleep (ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

// See:
// https://ng-admin-book.marmelab.com/


App.config(["$httpProvider", (http) => {
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


App.config(["RestangularProvider", (rest) => {
    rest.addResponseInterceptor((data, operation, what, url, response, deferred) => {
        switch (operation) {
            case 'getList':
                response.totalCount = response.headers('Content-Range').split('/')[1]
                break
        }
        return data
    })
}])


App.config(["RestangularProvider", (rest) => {
    rest.addFullRequestInterceptor((element, operation, what, url, headers, params, httpConfig) => {
        headers = headers || {}

        switch (operation) {
            case 'get':
            case 'patch':
            case 'remove':
                headers["Accept"] = "application/vnd.pgrst.object+json"
                const idKey = PKS[what]
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
                    if (field == "id" && PKS[what] != "id") {
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
}])


App.config(["NgAdminConfigurationProvider", (nga) => {
    // create an admin application
    const admin = nga.application('base on postgrest')
        .baseApiUrl(BasePath)
        .debug(false)

    nga.configure(admin)

    // see table _meta
    const customTypes = {}
    const customHides = {}
    const customReadOnlies = {}

    const definitions = JSON.parse(
        $.ajax({url: BasePath, async: false}).response
    ).definitions

    const resp = $.ajax({url: BasePath + "_meta", async: false})
    if (resp.status == 200) {
        const meta = JSON.parse(resp.response)
        for (const {table, column, type, readonly, hide} of meta) {
            if (!customTypes[table]) {
                customTypes[table] = {}
            }
            if (!customHides[table]) {
                customHides[table] = {}
            }
            if (!customReadOnlies[table]) {
                customReadOnlies[table] = {}
            }

            customTypes[table][column] = type
            customHides[table][column] = hide
            customReadOnlies[table][column] = readonly
        }
    }

    const remoteCompleteOptions = {
        refreshDelay: 300,
        searchQuery: function (search) {
            return {
                'id...eq': search,
            }
        },
    }

    function remoteCompleteOptionsFactory(key) {
        return {
            refreshDelay: 300,
            searchQuery: (search) => ({
                [`${key}...eq`]: search,
            }),
        }
    }

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
            /*
             * desc likes those:
             * "Note: This is a Primary Key.<pk/>"
             * "Note: This is a Foreign Key to `todos.id`.<fk table='todos' column='id'/>"
             */
            const pkIdx = desc.indexOf(".<pk")
            const fkIdx = desc.indexOf(".<fk")
            const type = types[columnName] || cfg.columnFormatMap[attr.format] || "string"
            //console.log(pkIdx, fkIdx, type, columnName, attr)


            let field
            if (tableName == "_meta" && columnName == "type") {
                field = nga.field(columnName, "choice").choices(
                    cfg.fieldTypes.map((i) => ({value: i, label: i}))
                ).label(columnName)
            } else if (pkIdx > -1) {
                const pk = nga.field(columnName, type)
                    .isDetailLink(true)
                    .pinned(true)
                    .label(columnName)
                entity.identifier(pk)
                entity.listView().sortField(columnName)
                PKS[tableName] = columnName
                field = pk
            } else if (fkIdx > -1) {
                const [_0, fkTable, _2, fkColumn] = desc.slice(fkIdx).split("'")
                field = nga.field(columnName, "reference")
                    .label(columnName)
                    .targetEntity(entities[fkTable])
                    .targetField(nga.field(fkColumn))
                    .remoteComplete(true, remoteCompleteOptionsFactory(fkColumn))
            } else {
                field = nga.field(columnName, type).label(columnName)
            }
            fields.push(field)

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
        const readOnlies = customReadOnlies[tableName] || {}
        const fieldsForList = fields.filter((i) => !hides[i.name()])

        entity.listView()
            .fields(fieldsForList)
            .exportFields(fields)
            .filters(filters)
            .perPage(10)
            //.title(tableName)
            //.sortDir("ASC")
            //.infinitePagination(true)

        const fieldsForEdit = fields
            .filter((i) => i.name() != "id")
            .filter((i) => !readOnlies[i.name()])
        entity.editionView().fields(fieldsForEdit)
        entity.creationView().fields(fieldsForEdit)

        admin.addEntity(entity)
        //console.log(tableName, definitions[tableName], entity)
    }

}])

async function t() {
    await sleep(1000)
    let resp = await fetch("http://ip.tyio.net")
    let text = await resp.text()
    console.log(text)
}
t()
