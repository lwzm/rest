import 'babel-polyfill'
import axios from 'axios'

const app = angular.module('myApp', ['ng-admin'])

const test_async = async () => {
    let resp = await axios.get("http://ip.tyio.net")
    console.log(resp)
}
test_async()

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
        .baseApiUrl('/api/')

    nga.configure(admin)

    rest.addFullRequestInterceptor((element, operation, what, url, headers, params, httpConfig) => {
        headers = headers || {}

        switch (operation) {
            case 'get':
            case 'patch':
            case 'remove':
                headers["Accept"] = "application/vnd.pgrst.object+json"
                const idKey = admin.getEntity(what).identifier().name()
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
                        const _ = key.split('...')
                        const k = _[0]
                        const operator = _[1] || 'eq'
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



    const addEntity = (name, opts) => {
        const {fields1, fields2, idToken} = opts
        const entity = nga.entity(name).updateMethod('patch')
        const filters = []

        if (!idToken) {
            const id = nga.field('id')
                .label("ID")
                .pinned(true)  // place ID-searching at top-right corner forever
            fields1.unshift(id)
            filters.unshift(id)
        }

        const fields = fields1.concat(fields2 || [])

        for (const field of fields) {
            const name = field.name()
            field.label(name)  // patch it, prefer raw rather than capitalized
        }

        for (const field of fields1) {  // or `field of fields`
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


        entity.listView().fields(fields1)
            .filters(filters)
            .perPage(10)  // 10 lines is height enough, i hate scrolling
            .exportFields(fields1)
        entity.editionView().fields(fields)
        entity.creationView().fields(fields)

        // at last
        // sortField, isDetailLink, identifier
        if (idToken) {
            const table = entity.listView()
            const id = table.getField(idToken)
            table.sortField(idToken)
            id.isDetailLink(true)
            entity.identifier(id)
        }

        admin.addEntity(entity)
        return entity
    }

        /*
    const cfg = addEntity("zone", {
        fields1: [
            nga.field('name', 'string'),
            nga.field('beds', 'number'),
        ],
    })
        */

    var id = nga.field('id', "number").isDetailLink(true)
    const zone = nga.entity("zone").updateMethod('patch')
    const doctor = nga.entity("doctor").updateMethod('patch')
    const zoneReference = nga.field('zone', 'reference').targetEntity(zone).targetField(nga.field('id'))

    zone.listView().fields([
        id,
        nga.field('name', 'string'),
        nga.field('beds', 'number'),
    ]).identifier(nga.field('id'))
    zone.editionView().fields([
        id,
        nga.field('name', 'string'),
        nga.field('beds', 'number'),
    ])

    doctor.listView().fields([
        id,
        zoneReference,
        nga.field('name', 'string'),
    ]).identifier(nga.field('id'))
    doctor.editionView().fields([
        id,
        zoneReference,
        nga.field('name', 'string'),
        nga.field('info', 'json'),
    ])

    admin.addEntity(zone)
    admin.addEntity(doctor)



}])

