/*
 * https://www.cnblogs.com/princesong/p/6728250.html
import 'babel-polyfill'
import 'whatwg-fetch'
*/

const app = angular.module('myApp', ['ng-admin'])

const formatMap = {
    "integer": "number",
    "jsonb": "json",
    "text": "string",
}

const basePath = "/api/"

const pks = {}

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
    const admin = nga.application('base on postgrest', false)
        .baseApiUrl(basePath)

    nga.configure(admin)

    rest.addFullRequestInterceptor((element, operation, what, url, headers, params, httpConfig) => {
        headers = headers || {}

        switch (operation) {
            case 'get':
            case 'patch':
            case 'remove':
                headers["Accept"] = "application/vnd.pgrst.object+json"
                const idKey = "id"
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
                    params.order = params._sortField + '.' + params._sortDir.toLowerCase()
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

    var definitions = JSON.parse(
        $.ajax({url: "/api/", async: false}).response
    ).definitions

    !function () {
        const entities = {}

        for (const tableName in definitions) {
            entities[tableName] = nga.entity(tableName).updateMethod("patch")
        }

        for (const tableName in definitions) {
            const properties = definitions[tableName].properties
            const entity = entities[tableName]
            const fields = []

            for (const columnName in properties) {
                const attr = properties[columnName]
                const desc = attr.description || ""
                const pkIdx = desc.indexOf(".<pk")
                const fkIdx = desc.indexOf(".<fk")
                const type = formatMap[attr.format]
                //console.log(pkIdx, fkIdx, type, columnName, attr)
                if (pkIdx > -1) {
                    const pk = nga.field(columnName, type)
                        .isDetailLink(true)
                    entity.identifier(pk)
                    pks[tableName] = pk
                    fields.push(pk)
                } else if (fkIdx > -1) {
                    const _ = desc.slice(fkIdx).split("'")
                    const table = _[1]
                    const column = _[3]
                    const ref = nga.field(columnName, "reference")
                        .label(columnName)
                        .targetEntity(entities[table])
                        .targetField(nga.field(column))
                    fields.push(ref)
                } else {
                    fields.push(
                        nga.field(columnName, type)
                        .label(columnName)
                    )
                }
            }

            entity.listView().fields(fields)
            const fieldsWithoutID = fields.filter((i) => i != entity.identifier() && i.name() != "id")
            entity.editionView().fields(fieldsWithoutID)
            entity.creationView().fields(fieldsWithoutID)
            admin.addEntity(entity)
            console.log(tableName, definitions[tableName], entity)
        }
    }()

}])

