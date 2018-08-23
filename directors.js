function test(Restangular, $state, notification) {
    return {
        scope: {
            entry: "&",
        },
        link: function(scope, element, attrs) {
            const entry = scope.entry()
            scope.values = entry.values
            scope.click = function() {
                Restangular
                    .one(entry._entityName, entry.values.id)
                    .patch({name: entry.values.name + "!"})
                    .then(() => $state.reload())
                    .then(() => notification.log("OK", {addnCls: 'humane-flatty-success'}))
                    .catch(e => notification.log('Error', {addnCls: 'humane-flatty-error'}) && console.error(e))
            }
            //console.log(scope, element, attrs)
        },
        template: `
			<a ng-if="!values.name.endsWith('!')" class="btn btn-outline btn-success btn-sm" ng-click="click()">
				<span class="glyphicon glyphicon-thumbs-up"></span>
			</a>
		`
    }
}
test.$inject = ['Restangular', '$state', 'notification']


function directive(App) {
    App.directive('test', test)
}

export default {
	directive,
}

export {
	directive,
}
