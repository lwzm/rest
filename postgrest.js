/*
 * https://www.cnblogs.com/princesong/p/6728250.html
 * http://babeljs.io/docs/plugins/transform-runtime/
import 'babel-polyfill'
*/

import cfg from "./cfg"
import definitions from "./definitions"
import {directive} from "./directors"

const BasePath = "/api/"
const PKS = {}
const CC = {}  // CountCache
const App = angular.module('myApp', ['ng-admin', 'pascalprecht.translate'])
directive(App)

let AuthUserName

// See:
// https://ng-admin-book.marmelab.com/


// https://ng-admin-book.marmelab.com/doc/Translation.html
App.config(['$translateProvider', function ($translateProvider) {
  $translateProvider.translations('zh', cfg.translations)
  $translateProvider.preferredLanguage('zh')
}])


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
        if (!AuthUserName) {
            AuthUserName = response.headers()["auth-user-name"]
            setTimeout(function () {
                $('.navbar-header .navbar-brand').text(AuthUserName)
            }, 1000)
        }
        const cache = CC[what]
        switch (operation) {
            case 'getList':
                const n = +response.headers('Content-Range').split('/')[1]
                if (isNaN(n)) {
                    response.totalCount = cache[cache._] || 999
                } else {
                    response.totalCount = cache[cache._] = n
                }
                break
            case 'post':
                for (const k in cache) {
                    cache[k]++
                }
                break
            case 'remove':
                for (const k in cache) {
                    cache[k]--
                }
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
                break
            case 'getList':
                const filters = {}
                if (params._filters) {
                    for (const [k, v] of Object.entries(params._filters)) {
                        if (v != null) {
                            filters[k] = v
                        }
                    }
                    delete params._filters
                }

                const cache = CC[what] || {}
                CC[what] = cache

                cache._ = Object.entries(filters)
                    .map(([k, v]) => `${k}=${v}`)
                    .sort()
                    .join(",")
                if (!cache[cache._]) {
                    headers['Prefer'] = "count=exact"
                }

                for (let [k, v] of Object.entries(filters)) {
                    let [k2, operator] = k.split("...")
                    operator = operator || "eq"
                    if (v instanceof Date) {
                        v = v.toISOString()
                    }
                    params[k2] = `${operator}.${v}`
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
    window.admin = admin
}])


function init(nga, admin) {
    const tables = []
    const entities = {}
    const metas = {}

    // uri: /
    for (const i of definitions) {
        const entity = nga.entity(i.tableName)
            .updateMethod("patch")
            .label(i.tableName)
        const fsMap = {}
        for (const field of i.fs) {
            fsMap[field.columnName] = field
        }
        i.fsMap = fsMap
        entity.customConfig = i
        entities[i.tableName] = entity
        tables.push(entity)
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


    function remoteCompleteOptionsFactory(key, fuzzy=false) {
        if (fuzzy) {
            key = `${key}...like`
        }
        return {
            refreshDelay: 300,
            searchQuery: (search) => ({
                [key]: fuzzy ? search + "*" : search,
            }),
        }
    }


    const fuzzySearchFormats = new Set([
        "string",
        "text",
        "wysiwyg",
    ])


    function generateFields(entity) {
        const {tableName, fs} = entity.customConfig
        const fields = []

        for (const {columnName, format, pkFlag, fkInfo, template, hide} of fs) {
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
                const fkName = fkEntity.customConfig.displayForFk || fkInfo.columnName
                const rco = remoteCompleteOptionsFactory(fkName, fuzzySearchFormats.has(fkEntity.customConfig.fsMap[fkName].format))
                field = nga.field(columnName, "reference")
                    .label(columnName)
                    .targetEntity(fkEntity)
                    .targetField(nga.field(fkName))
                    .remoteComplete(true, rco)
                field.___rco = rco  // store this
            } else if (meta.choices) {
                field = nga.field(columnName, "choice").choices(
                    meta.choices.map(
                        (i) => typeof(i) == "string" ? {value: i, label: i} : i
                    )
                ).label(columnName)
            } else {
                field = nga.field(columnName, type).label(columnName)
            }

            switch (type) {
                case 'float':
                    field.format("0.00")
                    break
                case 'number':
                    field.format && field.format("0")
                    break
            }

            field._todo_template = template
            field._todo_hide = hide

            if (meta.readonly) {
                field.editable(false)
            }

            if (meta.pinned) {
                field.pinned(true)
            }

            fields.push(field)
        }
        return fields
    }

    function generateFilters(fields) {
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
                            .remoteComplete(true, field.___rco)
                    )
                    break
                case 'choice':
                    filters.push(
                        nga.field(name, "choice")
                            .label(`${name} =`)
                            .pinned(pinned)
                            .choices(field.choices())
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
        return filters
    }


    for (const entity of tables) {
        const {tableName} = entity.customConfig
        const fieldsForList = generateFields(entity).filter((i) => {
            if (i._todo_template) {
                i.template(i._todo_template)
            }
            const columnName = i.name()
            const meta = metas[`${tableName}.${columnName}`]
            if (i._todo_hide || meta && meta.hide) {
                return false
            }
            return true
        })

        entity.listView()
            .fields(fieldsForList)
            .exportFields(fieldsForList)
            .filters(generateFilters(fieldsForList))
            .perPage(10)
            //.title(tableName)
            //.sortDir("ASC")
            //.infinitePagination(true)
        const actions = entity.customConfig.listActions
        if (actions) {
            entity.listView().listActions(actions.map(tag => `<${tag} entry="entry"></${tag}>`))
        }

        const fieldsForEdit = generateFields(entity)
            .filter((i) => !(i.name() == "id" && i.type() == "number"))
        const fieldsForCreate = fieldsForEdit
            .filter((i) => i.editable())
        entity.editionView().fields(fieldsForEdit)
        entity.creationView().fields(fieldsForCreate)
    }


    const extraReferencedList = true
    if (extraReferencedList) {
        const relations = []
        for (const entity of tables) {
            const {tableName, fs} = entity.customConfig
            for (const {columnName, fkInfo} of fs) {
                if (fkInfo) {
                    const fkEntity = entities[fkInfo.tableName]
                    const fkName = fkEntity.customConfig.displayForFk || fkInfo.columnName
                    relations.push({fkEntity, entity, tableName, columnName})
                }
            }
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
    }


    for (const entity of tables) {
        admin.addEntity(entity)
    }

}


/*
 * .babelrc should has:
    "plugins": [
        "transform-runtime",
        "transform-class-properties",
    ],


function sleep (ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
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
*/
