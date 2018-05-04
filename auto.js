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


App.config(["RestangularProvider", (rest) => {
    rest.addResponseInterceptor((data, operation, what, url, response, deferred) => {
        switch (operation) {
            case 'get':
                data = data[0]
                break
            case 'getList':
                response.totalCount = 5000
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
                for (const k of Object.keys(element)) {
                    if (k.endsWith("_time")) {
                        delete element[k]
                    }
                }
            case 'remove':
                break
            case 'getList':

                const filters = params._filters
                delete params._filters

                const _where = []

                for (const key in filters) {
                    let v = filters[key]
                    if (v != null) {
                        let [k, operator] = key.split("...")
                        operator = operator || "eq"
                        if (v instanceof Date) {
                            v = v.toISOString()
                        }
                        _where.push(`(${k},${operator},${v})`)
                    }
                }
                params._where = _where.join("~and")

                params._size = params._perPage
                params._p = params._page
                delete params._perPage
                delete params._page

                if (params._sortField) {
                    let sort = params._sortField
                    if (params._sortDir == "DESC") {
                        sort = '-' + sort
                    }
                    params._sort = sort
                    delete params._sortDir
                    delete params._sortField
                }
                break
        }
    })
}])


App.config(["NgAdminConfigurationProvider", (nga) => {
    // create an admin application
    const admin = nga.application('xmysql')
        .baseApiUrl(BasePath)
        .debug(false)

    nga.configure(admin)
    admin.dashboard(nga.dashboard())

    //var u = nga.entity('h5_link');
    const resp = $.ajax({url: "/schema.json", async: false})
    if (resp.status > 200) {
        alert(resp.status)
        throw resp
    }
    let re = /[a-zA-Z0-9_]/

    const tableInfos = JSON.parse(resp.response)
    const relations = []
    const tables = {}

    for (const tableName in tableInfos) {
        const entity = nga.entity(tableName)
            .updateMethod("patch")
            .label(tableName)
        tables[tableName] = entity
    }

    function remoteCompleteOptionsFactory(key) {
        return {
            refreshDelay: 300,
            searchQuery: (search) => ({
                [key]: search,
            }),
        }
    }

    for (const tableName in tableInfos) {
        const describe = tableInfos[tableName]
        const entity = tables[tableName]

        const fields = []

        for (const info of describe) {
            //console.log(info)
            let type = info.Type
            let columnName = info.Field
            let fk = info.fk
            if (type.indexOf("int") > -1) {
                type = "number"
            } else if (type.indexOf("char") > -1) {
                type = "string"
            } else if (type.indexOf("enum") > -1) {
                type = "string"
            } else if (type.indexOf("text") > -1) {
                type = "text"
            } else if (type.indexOf("double") > -1) {
                type = "float"
            } else if (type == "datetime") {
                type = "datetime"
            } else if (type == "timestamp") {
                type = "datetime"
            } else if (type == "date") {
                type = "date"
            } else {
                console.log(tableName, columnName, type)
                type = "string"
            }
            let field
            if (info.Key == "PRI") {
                const pk = nga.field(columnName, type)
                    .isDetailLink(true)
                    .pinned(true)
                    .label(columnName)
                entity.identifier(pk)
                entity.listView().sortField(columnName)
                field = pk
            } else if (fk) {
                const [fkTableName, fkColumnName] = fk
                field = nga.field(columnName, "reference")
                    .label(columnName)
                    .targetEntity(tables[fkTableName])
                    .targetField(nga.field(fkColumnName))
                    .remoteComplete(true, remoteCompleteOptionsFactory(fkColumnName))
                relations.push({
                    entity,
                    columnName,
                    fkTableName,
                    fkColumnName,
                })
            } else {
                field = nga.field(columnName, type).label(columnName)
            }
            if (info.ro) {
                field.editable(false)
            }
            if (columnName == "id") {
                field.editable(false)
            }

            if (!(columnName.endsWith("e_time") || columnName.endsWith("password"))) {
                fields.push(field)
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
                    //filters.push(
                        //nga.field(`${name}...gte`, type)
                        //.label(`${name} >=`)
                    //)
                    //filters.push(
                        //nga.field(`${name}...lte`, type)
                        //.label(`${name} <=`)
                    //)
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

        entity.listView()
            .fields(fields)
            .filters(filters)
            .exportFields(fields)
            .perPage(50)
            //.title(tableName)
            //.sortDir("ASC")
            //.infinitePagination(true)

        const fieldsForEdit = fields
            .filter((i) => {
                if (i.name() == "id" && i.type() == "number") {
                    return true
                }
                if (i.name().endsWith("_time")) {
                    return
                }
                return true
            })

        const fieldsForCreate = fieldsForEdit
        //.filter((i) => i.editable())
        entity.editionView().fields(fieldsForEdit)
        entity.creationView().fields(fieldsForCreate)

                    
    } 

            console.log(relations);
        for (const {entity, columnName, fkTableName, fkColumnName} of relations) {
            const target = tables[fkTableName]
            target.editionView().fields([
                nga.field(fkColumnName, "referenced_list")
                    .targetEntity(entity)
                    .targetReferenceField(columnName)
                    .targetFields(entity.listView().fields())
                    .label(fkTableName)
                    .perPage(5)
            ])
        }

    for (const name in tables) {
        admin.addEntity(tables[name])
    }


}])
