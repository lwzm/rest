function test($state, notification) {
    return {
        scope: {
            entry: "&",
        },
        link: function(scope, element, attrs) {
            const entry = scope.entry()
            const values = entry.values

            scope.values = values
            scope.click = function() {
                values
                    .patch({name: values.name + "!"})
                    .then(() => $state.reload())
                    .then(() => notification.log("OK", {addnCls: 'humane-flatty-success'}))
                    .catch(e => notification.log('Error', {addnCls: 'humane-flatty-error'}) && console.error(e))
            }
            //console.log(scope, element, attrs)
        },
        template: `
			<a ng-if="!values.name.endsWith('!')" class="btn btn-outline btn-success btn-xs" ng-click="click()">
				<span class="glyphicon glyphicon-thumbs-up"></span>
			</a>
		`
    }
}
test.$inject = ['$state', 'notification']


function directive(App) {
    App.directive('test', test)
}

export default {
	directive,
}

export {
	directive,
}
