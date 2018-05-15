/*
 * https://www.cnblogs.com/princesong/p/6728250.html
 * http://babeljs.io/docs/plugins/transform-runtime/
import 'babel-polyfill'
*/

import cfg from "./cfg"

const BasePath = "/api/"
const PKS = {}
const App = angular.module('myApp', ['ng-admin', 'pascalprecht.translate'])


function sleep (ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

// See:
// https://ng-admin-book.marmelab.com/


// https://ng-admin-book.marmelab.com/doc/Translation.html
App.config(['$translateProvider', function ($translateProvider) {
  $translateProvider.translations('zh', cfg.translations);
  $translateProvider.preferredLanguage('zh');
}]);


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

        const fkRegExp = RegExp("<fk table='([^']+)' column='([^']+)'/>")

        for (const tableName in definitions) {
            const entity = nga.entity(tableName)
                .updateMethod("patch")
                .label(tableName)
            const properties = definitions[tableName].properties
            const fs = []
            for (var columnName in properties) {
                let attrs = properties[columnName]
                let format = cfg.columnFormatMap[attrs.format] || "string"
                /*
                 * desc likes those:
                 * "Note: This is a Primary Key.<pk/>"
                 * "Note: This is a Foreign Key to `todos.id`.<fk table='todos' column='id'/>"
                 */
                let desc = attrs.description || ""
                let pkFlag = desc.indexOf(".<pk") > -1
                let fkInfo = fkRegExp.exec(desc)
                if (fkInfo) {
                    fkInfo = {
                        tableName: fkInfo[1],
                        columnName: fkInfo[2],
                    }
                }
                fs.push({
                    columnName,
                    format,
                    pkFlag,
                    fkInfo,
                })
            }

            tables[tableName] = {
                entity,
                fs,
                settings: {},
                relations: [],
            }
        }
    }

    // uri: /_meta
    {
        const resp = $.ajax({url: BasePath + "_meta", async: false})
        const meta = JSON.parse(resp.response)
        for (const i of meta) {
            const [table, column] = i.name.split(".")
            const t = tables[table]
            if (t) {
                t.settings[column] = i
            }
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


    for (const tableName in tables) {
        const table = tables[tableName]
        const {entity, fs, settings} = table
        const fields = []

        for (let {columnName, format, pkFlag, fkInfo} of fs) {
            const meta = settings[columnName] || {}
            let field
            
            if (meta.type) {
                format = meta.type  //todo: rename type to format
            }

            if (pkFlag) {
                field = nga.field(columnName, meta.type || format)
                    .isDetailLink(true)
                    .pinned(true)
                    .label(columnName)
                entity.identifier(field)
                entity.listView().sortField(columnName)
                PKS[tableName] = columnName
            } else if (fkInfo) {
                const fkTable = tables[fkInfo.tableName]
                fkTable.relations.push({tableName, columnName})
                field = nga.field(columnName, "reference")
                    .label(columnName)
                    .targetEntity(fkTable.entity)
                    .targetField(nga.field(fkInfo.columnName))
                    .remoteComplete(true, remoteCompleteOptionsFactory(fkInfo.columnName))
            } else if (meta.choices) {
                field = nga.field(columnName, "choice").choices(
                    meta.choices.map((i) => ({value: i, label: i}))
                ).label(columnName)
            } else {
                field = nga.field(columnName, format).label(columnName)
            }

            if (meta.readonly) {
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
                    filters.push(
                        nga.field(name, type)
                            .label(`${name} =`)
                    )
                    filters.push(
                        nga.field(`${name}...gt`, type)
                            .label(`${name} >`)
                    )
                    filters.push(
                        nga.field(`${name}...lt`, type)
                            .label(`${name} <`)
                    )
                    break
                case 'string':
                case 'text':
                case 'wysiwyg':
                case 'email':
                    filters.push(
                        nga.field(`${name}...like`, type)
                        .label(`${name} ~`)
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
        const {fields, filters, entity, settings} = tables[tableName]

        const fieldsForList = fields.filter(function (i) {
            const meta = settings[i.name()]
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
        const {entity, relations} = tables[tableName]
        const fields = []
        for (const {tableName, columnName} of relations) {
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
