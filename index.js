import 'babel-polyfill'
import chunk from 'lodash/map'

const app = angular.module('myApp', ['ng-admin'])
const ENV = {}

//console.log(async () => 1)

app.config(['NgAdminConfigurationProvider', function (nga) {
    // create an admin application
    const admin = nga.application('test')
        .baseApiUrl('/api/')

    ENV.admin = admin

    function addEntity(name, opts) {
        const {fields1, fields2, idToken} = opts
        const entity = nga.entity(name).updateMethod('patch')
        const filters = []

        if (!idToken) {
            let id = nga.field('id')
                .label("ID")
                .pinned(true)  // place ID-searching at top-right corner forever
            fields1.unshift(id)
            filters.unshift(id)
        }

        const fields = fields1.concat(fields2 || [])

        for (const field of fields1) {  // or `field of fields`
            const name = field.name()
            const type = field.type()

            field.label(name)  // patch it, prefer raw rather than capitalized

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
            let table = entity.listView()
            let id = table.getField(idToken)
            table.sortField(idToken)
            id.isDetailLink(true)
            entity.identifier(id)
        }

        admin.addEntity(entity)
        return entity
    }


    const todo = addEntity("todos", {
        fields1: [
            nga.field('task', 'text').isDetailLink(true).sortable(false),
            nga.field('done', 'boolean').choices([
                { value: false, label: 'false'},
                { value: true, label: 'true'},
            ]),
            nga.field('due', 'datetime'),
        ],
        fields2: [
            nga.field('others', 'json'),
        ],
    })

    const user = addEntity("users", {
        idToken: "name",
        fields1: [
            nga.field('name', 'string'),
            nga.field('password', 'string'),
        ],
    })

    const zone = addEntity("zone", {
        fields1: [
            nga.field('name', 'string'),
            nga.field('beds', 'number'),
        ],
    })

    const targetFiledID = nga.field('id')

    const zoneReference = nga.field('zone', 'reference')
        .targetEntity(zone)
        .targetField(nga.field('name'))

    const remoteCompleteID = {
        searchQuery: (search) => {
            return {
                'id...eq': search,
            }
        },
        refreshDelay: 300,
    }

    const doctor = addEntity("doctor", {
        fields1: [
            zoneReference,
            nga.field('name', 'string'),
            nga.field('info', 'json'),
        ],
    })

    const patient = addEntity("patient", {
        fields1: [
            nga.field('bed', 'number'),
            nga.field('state', 'string'),
            zoneReference,
            nga.field('info', 'json'),
        ],
    })

    const log = addEntity("log", {
        fields1: [
            nga.field('datetime', 'datetime'),
            nga.field('key', 'string'),
            nga.field('patient', 'reference')
            .targetEntity(patient)
            .targetField(targetFiledID)
            .perPage(100)
            ,
            nga.field('info', 'json'),
        ],
    })

    //const cfg = addEntity("cfg", [
    //    nga.field('k', 'string'),
    //    nga.field('v', 'json'),
    //    nga.field('comment', 'text'),
    //], "k")

    const post = addEntity("posts", {
        fields1: [
            nga.field('title', 'string'),
            nga.field('content', 'wysiwyg'),
            //nga.field('user', 'string'),
            nga.field('user', 'reference')
            .targetEntity(user)
            .targetField(nga.field('name'))
            .label("User Name")
            .perPage(5)
            .remoteComplete(true, {
                searchQuery: (search) => {
                    return {
                        'name...like': `*${search}*`,
                    }
                },
                refreshDelay: 300,
            })
            ,
            //nga.field('d', 'reference')
            //    .targetEntity(doctor)
            //    .targetField(targetFiledID)
            //    .perPage(2)
            //    .remoteComplete(true, remoteCompleteID)
            //,
        ],
    })

    const mapdata = addEntity("mapdata", {
        fields1: [
            nga.field("nid"),
            nga.field("title"),
            nga.field("location_type"),
            nga.field("province_state"),
            nga.field("city"),
        ],
        fields2: [
            nga.field("address_line_1"),
            nga.field("address_line_2"),
            nga.field("latitude"),
            nga.field("longitude"),
            nga.field("hours"),
            nga.field("tel"),
            nga.field("otherinfo", "text"),
            nga.field("location_id"),
            nga.field("citycode"),
            nga.field("locked"),
            nga.field("lockid"),
            nga.field("psw"),
        ],
    })

    nga.configure(admin)
}])


app.config(['NgAdminConfigurationProvider', "RestangularProvider", "$httpProvider", function(nga, rest, http) {
    rest.addFullRequestInterceptor(function(element, operation, what, url, headers, params, httpConfig) {
        headers = headers || {}
        //console.log(arguments)

        switch (operation) {
            case 'get':
            case 'patch':
            case 'remove':
                headers["Accept"] = "application/vnd.pgrst.object+json"
                let idKey = ENV.admin.getEntity(what).identifier().name()
                let idValue = decodeURI(url.slice(url.lastIndexOf("/") + 1))
                params[idKey] = `eq.${idValue}`
                params.___strip_id_todo = true
                break
            case 'getList':
                headers['Prefer'] = "count=exact"

                let filters = params._filters
                delete params._filters

                for (let key in filters) {
                    let v = filters[key]
                    if (v != null) {
                        let _ = key.split('...')
                        let k = _[0]
                        let operator = _[1] || 'eq'
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

    rest.addResponseInterceptor(function(data, operation, what, url, response, deferred) {
        switch (operation) {
            case 'getList':
                response.totalCount = response.headers('Content-Range').split('/')[1]
                break
        }

        return data
    })

    http.interceptors.push(function() {
        return {
            request: function(config) {

                if (config.params && config.params.___strip_id_todo) {
                    delete config.params.___strip_id_todo
                    let url = config.url
                    config.url = url.slice(0, url.lastIndexOf("/"))
                }

                return config
            },
        }
    })
}])

