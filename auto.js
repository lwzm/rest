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
                response.totalCount = 100
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
                break
            case 'getList':
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
    const admin = nga.application('base on postgrest')
        .baseApiUrl(BasePath)
        .debug(false)

    nga.configure(admin)

    //var u = nga.entity('h5_link');
    const tableNames = [
        "user",
        "h5_goods",
        "goods",
    ]

    let entities = {}

    for (const tableName of tableNames) {
        const resp = $.ajax({url: `${BasePath}${tableName}/describe` , async: false})
        if (resp.status > 200) {
            alert(resp.status)
            throw resp
        }
        const describe = JSON.parse(resp.response)
        const entity = nga.entity(tableName)
            .updateMethod("patch")
            .label(tableName)
        const fields = []

        for (const info of describe) {
            //console.log(info)
            let type = info.Type
            if (type.startsWith("int")) {
                type = "number"
            } else if (type.indexOf("char") > -1) {
                type = "string"
            } else {
                type = "string"
            }
            let columnName = info.Field
            let field
            if (info.Key == "PRI") {
                const pk = nga.field(columnName, type)
                    .isDetailLink(true)
                    .pinned(true)
                    .label(columnName)
                entity.identifier(pk)
                entity.listView().sortField(columnName)
                field = pk
            } else {
                field = nga.field(columnName, type).label(columnName)
            }
            fields.push(field)
        }

        entity.listView()
            .fields(fields)
            .exportFields(fields)
            .perPage(10)
            //.title(tableName)
            //.sortDir("ASC")
            //.infinitePagination(true)

        const fieldsForEdit = fields
            .filter((i) => !(i.name() == "RecordID" || i.name() == "id" && i.type() == "number"))
        const fieldsForCreate = fieldsForEdit
        //.filter((i) => i.editable())
        entity.editionView().fields(fieldsForEdit)
        entity.creationView().fields(fieldsForCreate)

        admin.addEntity(entity)
    } 
    //let rid = nga.field("RecordID").isDetailLink(true)
    //var u = nga.entity('user').identifier(rid);
    //u.listView().fields([
        //rid,
        //nga.field('username'),
    //])
    //u.editionView().fields(u.listView().fields());
    //admin.addEntity(u);


    // uri: /_meta
    let definitions=[]
    for (const tableName in definitions) {
        const properties = definitions[tableName].properties
        const entity = entities[tableName]
        const fields = []

        for (const columnName in properties) {
            const attr = properties[columnName]
            const desc = attr.description || ""
            const setting = customSettings[tableName][columnName] || {}
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
                const [_0, fkTable, _2, fkColumn] = desc.slice(fkIdx).split("'")
                field = nga.field(columnName, "reference")
                    .label(columnName)
                    .targetEntity(entities[fkTable])
                    .targetField(nga.field(fkColumn))
                    .remoteComplete(true, remoteCompleteOptionsFactory(fkColumn))
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

        const fieldsForList = fields.filter(function (i) {
            const meta = customSettings[tableName][i.name()]
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

        admin.addEntity(entity)
        //console.log(tableName, definitions[tableName], entity)
    }

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
