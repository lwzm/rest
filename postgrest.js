/*
 * https://www.cnblogs.com/princesong/p/6728250.html
 * http://babeljs.io/docs/plugins/transform-runtime/
import 'babel-polyfill'
*/

import cfg from "./cfg"
import definitions from "./definitions"

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
            case 'post':
                delete element.id
                for (const [k, v] of Object.entries(element)) {
                    if (v === null) {
                        delete element[k]
                    }
                }
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

                if (params._page) {
                    const p = params._page
                    const u = params._perPage
                    delete params._page
                    delete params._perPage
                    headers['Range'] = `${(p - 1) * u}-${p * u - 1}`
                }

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
    const admin = nga.application('_')
        .baseApiUrl(BasePath)
        .debug(false)

    nga.configure(admin)
    admin.dashboard(nga.dashboard())

    init(nga, admin)

}])

function init(nga, admin) {
    const tables = []
    const relations = []
    const entities = {}
    const metas = {}

    // uri: /
    for (const i of definitions) {
        const entity = nga.entity(i.tableName)
            .updateMethod("patch")
            .label(i.tableName)
        entity.displayForFk = i.displayForFk
        entities[i.tableName] = entity
        tables.push(Object.assign({entity}, i))
    }

    // uri: /_meta
    try {
        const resp = $.ajax({url: BasePath + "_meta", async: false})
        const meta = JSON.parse(resp.response)
        for (const i of meta) {
            metas[i.name] = i
        }
    } catch (e) {
        console.error(e)
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


    for (const table of tables) {
        const {tableName, entity, fs} = table
        const fields = []

        for (const {columnName, format, pkFlag, fkInfo} of fs) {
            const meta = metas[`${tableName}.${columnName}`] || {}
            let field
            
            const type = meta.type || format

            if (pkFlag) {
                field = nga.field(columnName, type)
                    .isDetailLink(true)
                    .pinned(true)
                    .label(columnName)
                entity.identifier(field)
                entity.listView().sortField(columnName)
                PKS[tableName] = columnName
            } else if (fkInfo) {
                const fkEntity = entities[fkInfo.tableName]
                relations.push({fkEntity, entity, tableName, columnName})
                const fkName = fkEntity.displayForFk || fkInfo.columnName
                field = nga.field(columnName, "reference")
                    .label(columnName)
                    .targetEntity(fkEntity)
                    .targetField(nga.field(fkName))
                    .remoteComplete(true, remoteCompleteOptionsFactory(fkName))
            } else if (meta.choices) {
                field = nga.field(columnName, "choice").choices(
                    meta.choices.map(
                        (i) => typeof(i) == "string" ? {value: i, label: i} : i
                    )
                ).label(columnName)
            } else {
                field = nga.field(columnName, type).label(columnName)
            }

            if (meta.readonly) {
                field.editable(false)
            }

            if (meta.pinned) {
                field.pinned(true)
            }

            fields.push(field)
        }

        const filters = []
        for (const field of fields) {
            const name = field.name()
            const type = field.type()
            const pinned = field.pinned()
            switch (type) {
                case 'number':
                case 'float':
                case 'date':
                case 'datetime':
                    filters.push(
                        nga.field(name, type)
                            .label(`${name} =`)
                            .pinned(pinned)
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
                            .pinned(pinned)
                    )
                    break
                case 'reference':
                    filters.push(
                        nga.field(name, type)
                            .label(`${name} =`)
                            .pinned(pinned)
                            .targetEntity(field.targetEntity())
                            .targetField(field.targetField())
                    )
                    break
                default:
                    filters.push(
                        nga.field(name, type)
                            .label(`${name} =`)
                            .pinned(pinned)
                    )
                    break
            }
        }

        filters.sort((a, b) => a.name() < b.name() ? 1 : -1)

        Object.assign(table, {fields, filters})
    }


    for (const {entity, tableName, fields, filters} of tables) {
        const fieldsForList = fields.filter(function (i) {
            const columnName = i.name()
            const meta = metas[`${tableName}.${columnName}`]
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


    for (const {fkEntity, entity, tableName, columnName} of relations) {
        const fields = [
            nga.field(tableName, "referenced_list")
                .targetEntity(entity)
                .targetReferenceField(columnName)
                .targetFields(entity.listView().fields())
                .label(tableName)
                .perPage(5)
            ,
            nga.field('commands button', 'template')
                .label('')
                .template(`
                    <ma-filtered-list-button
                        entity-name="${tableName}"
                        filter="{ ${columnName}: entry.values.id }"
                    ></ma-filtered-list-button>
                `)  // entry.values.id todo
            ,
        ]
        fkEntity.editionView().fields(fields)
    }


    for (const {entity} of tables) {
        admin.addEntity(entity)
    }

    window.admin = admin
}


!async function() {
    await sleep(1000)
    //let resp = await fetch("http://ip.tyio.net")
    //let text = await resp.text()
    //console.log(text)
}()

class T {
    a = 1
}
