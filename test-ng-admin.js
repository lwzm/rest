(function (window, angular) {
    const app = angular.module('myApp', ['ng-admin'])
    const ENV = {}
    const pattern = RegExp("/([^/]+)$")

    app.config(['NgAdminConfigurationProvider', function (nga) {
        // create an admin application
        const admin = nga.application('My First Admin')
            .baseApiUrl('/api/')

        ENV.admin = admin

        function addEntity(name, fields, idToken) {
            const entity = nga.entity(name).updateMethod('patch')
            const fieldsWithID = fields.slice()

            if (!idToken) {
                fieldsWithID.unshift(nga.field('id', 'number'))
            }

            entity.listView().fields(fieldsWithID)
            entity.editionView().fields(fields)
            entity.creationView().fields(fields)

            // at last
            if (idToken) {
                let id = entity.listView().getField(idToken)
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
            ,
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
                    //params["id"] = `eq.${pattern.exec(url)[1]}`
                    idKey = ENV.admin.getEntity(what).identifier().name()
                    idValue = decodeURI(pattern.exec(url)[1])
                    params[idKey] = `eq.${idValue}`
                    params.___ = true
                    break
                case 'getList':
                    headers['Range-Unit'] = what
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
                    console.log(config)

                    if (config.params && config.params.___) {
                        delete config.params.___
                        let url = config.url
                        config.url = url.slice(0, url.lastIndexOf("/"))
                    }

                    return config
                },
            }
        })
    }])

})(window, angular)