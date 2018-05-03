/*
 * https://www.cnblogs.com/princesong/p/6728250.html
 * http://babeljs.io/docs/plugins/transform-runtime/
import 'babel-polyfill'
*/

import cfg from "./cfg"

const BasePath = "/api/"
const PKS = {}
const App = angular.module('myApp', ['ng-admin'])


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

    const tables = {}

    // uri: /
    {
        const resp = $.ajax({url: BasePath, async: false})
        if (resp.status > 200) {
            alert(resp.status)
            throw resp
        }

        //Object.assign(definitions, JSON.parse(resp.response).definitions)
        const definitions = JSON.parse(resp.response).definitions

        for (const tableName in definitions) {
            const entity = nga.entity(tableName)
                .updateMethod("patch")
                .label(tableName)
            tables[tableName] = {
                entity,
                properties: definitions[tableName].properties,
                customSettings: {},
                referencedList: [],
            }
        }
    }

    // uri: /_meta
    {
        const resp = $.ajax({url: BasePath + "_meta", async: false})
        const meta = JSON.parse(resp.response)
        for (const i of meta) {
            const [table, column] = i.name.split(".")
            tables[table].customSettings[column] = i
        }
    }

    const remoteCompleteOptions = {
        refreshDelay: 300,
        searchQuery: function (search) {
            return {
                "id": search,
            }
        },
    }

    function remoteCompleteOptionsFactory(key) {
        return {
            refreshDelay: 300,
            searchQuery: (search) => ({
                [key]: search,
            }),
        }
    }

    const fkReg = RegExp("<fk table='([^']+)' column='([^']+)'/>")

    for (const tableName in tables) {
        const table = tables[tableName]
        const {entity, properties} = table
        const fields = []

        for (const columnName in properties) {
            const attr = properties[columnName]
            const desc = attr.description || ""
            const setting = table.customSettings[columnName] || {}
            /*
             * desc likes those:
             * "Note: This is a Primary Key.<pk/>"
             * "Note: This is a Foreign Key to `todos.id`.<fk table='todos' column='id'/>"
             */
            const pkIdx = desc.indexOf(".<pk")
            const fkIdx = desc.indexOf(".<fk")
            const type = setting.type || cfg.columnFormatMap[attr.format] || "string"

            let field

            if (pkIdx > -1) {
                const pk = nga.field(columnName, type)
                    .isDetailLink(true)
                    .pinned(true)
                    .label(columnName)
                entity.identifier(pk)
                entity.listView().sortField(columnName)
                PKS[tableName] = columnName
                field = pk
            } else if (fkIdx > -1) {
                const [_0, fkTableName, fkColumnName] = fkReg.exec(desc)
                const fkTable = tables[fkTableName]
                fkTable.referencedList.push({tableName, columnName})
                field = nga.field(columnName, "reference")
                    .label(columnName)
                    .targetEntity(fkTable.entity)
                    .targetField(nga.field(fkColumnName))
                    .remoteComplete(true, remoteCompleteOptionsFactory(fkColumnName))
            } else if (setting.choices) {
                field = nga.field(columnName, "choice").choices(
                    setting.choices.map((i) => ({value: i, label: i}))
                ).label(columnName)
            } else {
                field = nga.field(columnName, type).label(columnName)
            }

            if (setting.readonly) {
                field = field.editable(false)
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
        Object.assign(table, {fields, filters})
    }

    for (const tableName in tables) {
        const {fields, filters, entity, customSettings} = tables[tableName]

        const fieldsForList = fields.filter(function (i) {
            const meta = customSettings[i.name()]
            if (meta && meta.hide) {
                return false
            }
            return true
        })

        entity.listView()
            .fields(fieldsForList)
            .exportFields(fields)
            .filters(filters)
            .perPage(10)
            //.title(tableName)
            //.sortDir("ASC")
            //.infinitePagination(true)

        const fieldsForEdit = fields
            .filter((i) => !(i.name() == "id" && i.type() == "number"))
        const fieldsForCreate = fieldsForEdit
            .filter((i) => i.editable())
        entity.editionView().fields(fieldsForEdit)
        entity.creationView().fields(fieldsForCreate)
    }

    for (const tableName in tables) {
        const {entity, referencedList} = tables[tableName]
        const fields = []
        for (const {tableName, columnName} of referencedList) {
            const target = tables[tableName].entity
            fields.push(
                nga.field(tableName, "referenced_list")
                    .targetEntity(target)
                    .targetReferenceField(columnName)
                    .targetFields(target.listView().fields())
                    .label(tableName)
                    .perPage(5)
            )
            fields.push(
                nga.field('commands button', 'template')
                    .label('')
                    .template(`
                        <ma-filtered-list-button
                         entity-name="${tableName}"
                         filter="{ ${columnName}: entry.values.id }"
                        ></ma-filtered-list-button>
                    `),
            )
        }
        entity.editionView().fields(fields)
    }

    for (const tableName in tables) {
        const {entity} = tables[tableName]
        admin.addEntity(entity)
    }

    window.admin = admin
}])

!async function() {
    await sleep(1000)
    //let resp = await fetch("http://ip.tyio.net")
    //let text = await resp.text()
    //console.log(text)
}()

class T {
    a = 1
}
