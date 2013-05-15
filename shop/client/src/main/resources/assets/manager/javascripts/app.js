'use strict'

angular.module('TenantManager.tenants', [])

    .controller('TenantListController', ['$scope', '$resource', '$http',
        function ($scope, $resource, $http) {

            var itemsPerPage = 10;

            $scope.currentPage = 1;
            $scope.totalPages = 0;

            $scope.tenant = {};
            $scope.user = {};
            $scope.pages = [];

            $scope.isEditingSlug = false;

            $scope.gotoPage = function (page) {
                $scope.currentPage = page;
                $scope.fetchTenants();
            }

            $scope.fetchTenants = function () {
                var number = itemsPerPage,
                    offset= ($scope.currentPage - 1) * itemsPerPage;

                $scope.tenants = [];
                $scope.loading = true;

                $http.get("/api/tenants?number=" + number + "&offset=" + offset).success(function (tenants) {
                    var number = tenants.number,
                        numberOfPages = Math.floor(tenants.total / number);
                    numberOfPages += (tenants.total % number === 0 ? 0 : 1);

                    $scope.totalPages = numberOfPages;
                    for (var i = 0; i < numberOfPages; i++) {
                        $scope.pages[i] = {
                            number: i + 1,
                            href: "?number=" + number + "&offset=" + (numberOfPages * number)
                        };
                    }

                    $scope.tenants = tenants.items;
                    $scope.loading = false;
                });
            }

            $scope.$watch('tenant.name', function () {
                if (!$scope.isEditingSlug) {
                    $scope.tenant.slug = $scope.slugify($scope.tenant.name);
                }
            });

            $scope.$watch('tenant.slug', function (newValue) {
                if ($scope.isEditingSlug) {
                    $scope.tenant.slug = $scope.slugify(newValue);
                }
            });

            $scope.slugify = function (text) {
                if (typeof text !== 'undefined') {
                    text = text.replace(/[^-a-zA-Z0-9_\-,&\s]+/ig, '');
                    text = text.replace(/\s/gi, "-");
                    text = text.toLowerCase();
                }
                return text;
            }

            $scope.createTenant = function () {
                $scope.loading = true;
                $http.post("/api/tenants/", {
                    "user": $scope.user,
                    "tenant": $scope.tenant
                }).success(function (data, status, headers, config) {
                        $scope.$parent.createNewTenant = false;
                        $scope.fetchTenants();
                    });
            }

            $scope.fetchTenants();

        }]);


var TenantManager = angular.module('TenantManager', [
    'mayocat',
    'TenantManager.tenants'
]);

TenantManager.controller("ManagerController", ['$scope', 'configurationService', function ($scope, configurationService) {

    configurationService.get("site.domainName", function(value){
        $scope.domainName = value;
    })

    $scope.toggleNewTenantForm = function () {
        $scope.createNewTenant = !$scope.createNewTenant;
    }
    $scope.hideNewTenantForm = function () {
        $scope.createNewTenant = false;
    }

}]);

TenantManager.config(['$routeProvider', function ($routeProvider) {
    $routeProvider.
        when('/', {templateUrl: 'partials/tenants.html', controller: 'TenantListController'}).
        otherwise({redirectTo: '/'});
}]);