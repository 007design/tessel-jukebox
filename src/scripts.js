/* global angular */
"use strict";

angular.module('app', ['ngRoute'])
.config(['$routeProvider', function($routeProvider) {
  $routeProvider
    .when('/', {
      templateUrl: 'pages/home.html',
      controller: 'HomeCtrl'
    })
    .when('/files/:path*?', {
      templateUrl: 'pages/files.html',
      controller: 'FilesCtrl'
    })
    .otherwise({
      redirectTo: '/'
    });
}])

.controller('FilesCtrl', ['$scope', function($scope) {

}])

.controller('HomeCtrl', ['$scope', function($scope) {

}])

.service('dataSvc', ['$http', function($http) {
  var scope = this;
  scope.busy = false;

  function poll() {
    $http.get('/status')
      .success(function(data) {
        if (data.status === 'busy')
          setTimeout(poll,1000);
        else {
          scope.busy = false;
          scope.getList();
        }
      });
  }

  scope.getList = function() {
    $http.get('/list')
      .success(function(data) {
        scope.fileList = data;
      });
  };

  scope.getDir = function(dir) {
    dir = dir || '';
    $http.get('/dir', {
      params: {
        d: dir
      }
    }).success(function(data) {
        poll();
      });
  };

  // scope.refresh = function() {
  //   scope.busy = true;
  //   $http.get('/refresh')
  //     .success(function(data) {
  //       poll();
  //     });
  // };

  return scope;
}])

.directive('fileList', ['dataSvc', '$location', '$routeParams', function(dataSvc, $location, $routeParams) {
  return {
    restrict: 'C',
    link: function(scope) {
      scope.$watch(function() {
        return dataSvc.fileList;
      }, function(f) {
        scope.files = f;
      });

      scope.$watch(function() {
        return $routeParams.path;
      }, function(d) {
        dataSvc.getDir(d);
      });
      // scope.refresh = function() {
      //   dataSvc.refresh();
      // };
    }
  };
}]);
