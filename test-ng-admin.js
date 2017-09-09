/*
 * https://ng-admin-book.marmelab.com/doc/reference/Field.html#field-configuration
 * https://postgrest.com/en/v4.1/api.html#horizontal-filtering-rows
 */

(function (window, angular) {
    const app = angular.module('myApp', ['ng-admin'])
    const ENV = {}

    app.config(['NgAdminConfigurationProvider', function (nga) {
        // create an admin application
        const admin = nga.application('test')
            .baseApiUrl('/api/')

        ENV.admin = admin

        function addEntity(name, fields, idToken) {
            const entity = nga.entity(name).updateMethod('patch')
            const fieldsWithID = fields.slice()
            const extraFilters = []

            for (let field of fields) {
                let name = field.name()
                let type = field.type()

                field.label(name)  // patch
                
                switch (type) {
                    case 'number':
                    case 'float':
                    case 'date':
                    case 'datetime':
                        extraFilters.push(
                            nga.field(`${name}...gte`, type)
                            .label(`${name} >=`)
                        )
                        extraFilters.push(
                            nga.field(`${name}...lte`, type)
                            .label(`${name} <=`)
                        )
                        break;
                    case 'string':
                    case 'text':
                    case 'wysiwyg':
                    case 'email':
                        extraFilters.push(
                            nga.field(`${name}...like`, type)
                            .label(`${name} ~`)
                        )
                        break;
                    default:
                        break;
                }
            }

            if (!idToken) {
                fieldsWithID.unshift(
                    nga.field('id', 'number')
                    .label("ID")
                    .pinned(true)
                )
            }

            entity.listView().fields(fieldsWithID.slice(0, 5))
                .filters(fieldsWithID.concat(extraFilters))
                .perPage(10)
                //.batchActions(['delete'])
            entity.editionView().fields(fields)
            entity.creationView().fields(fields)

            // at last
            // sortField, isDetailLink, identifier
            if (idToken) {
                let lv = entity.listView()
                let id = lv.getField(idToken)
                lv.sortField(idToken)
                id.isDetailLink(true)
                entity.identifier(id)
            }

            admin.addEntity(entity)
            return entity
        }


        const todo = addEntity("todos", [
            nga.field('task', 'text').isDetailLink(true).sortable(false),
            nga.field('done', 'boolean').choices([
                { value: false, label: 'false'},
                { value: true, label: 'true'},
            ]),
            nga.field('due', 'datetime'),
            nga.field('others', 'json'),
        ])

        const user = addEntity("users", [
            nga.field('name', 'string'),
            nga.field('password', 'string'),
        ], "name")
        window.u = user

        const post = addEntity("posts", [
            nga.field('title', 'string'),
            nga.field('content', 'wysiwyg'),
            nga.field('user', 'reference')
            .targetEntity(user)
            .targetField(nga.field('name'))
            .label("User Name")
            .perPage(6)
            .remoteComplete(true, {
                searchQuery: (search) => {
                    return {
                        'name...like': search,
                    }
                },
                refreshDelay: 300,
            })
            ,
        ])

        const mapdata = addEntity("mapdata", [
            nga.field("nid"),
            nga.field("title"),
            nga.field("location_type"),
            nga.field("province_state"),
            nga.field("city"),
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
        ])

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
                    headers['Range'] = ((params._page - 1) * params._perPage) + '-' + (params._page * params._perPage - 1)
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

})(window, angular)
