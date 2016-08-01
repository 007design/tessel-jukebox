/* global angular */
"use strict";

angular.module('app', ['ngRoute', 'btford.socket-io'])
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
    .when('/db', {
      templateUrl: 'pages/db.html',
      controller: 'DbCtrl'
    })
    .otherwise({
      redirectTo: '/'
    });
}])

.factory('socket', function (socketFactory) {
  return socketFactory();
})

.controller('FilesCtrl', ['$scope', function($scope) {

}])

.controller('HomeCtrl', ['$scope', function($scope) {

}])

.controller('DbCtrl', ['$scope', function($scope) {

}])

.service('dataSvc', ['$http', 'socket', function($http, socket) {
  var scope = this;
  scope.busy = false;
  scope.playing = false;
  scope.track;

  socket.on('status', function(status) {
    console.log('status', status)
    scope.playing = status === 'playing';
  });

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

  function getStatus() {
    $http.get('/playing')
      .success(function(data) {
        scope.playing = data.is_playing;
      });
  }
  // $interval(getStatus,1000);

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

  scope.getTracks = function() {
    $http.get('/tracks')
      .success(function(data) {
        poll();
      });
  };

  scope.play = function(file) {
    if (scope.playing) {
      scope.playing = false;
      if (scope.track === file)
        return socket.emit('pause');
      else {
        socket.emit('stop');
        return scope.play(file);
      }
    }

    if (scope.track === file)
      return socket.emit('resume');

    socket.emit('play', file, function() {
      scope.playing = true;
      scope.track = file;
    });
    //   $http.get('/stop');
    //   scope.playing = false;
    // } else
    //   $http.get('/play', {
    //     params: {
    //       p: file
    //     }
    //   }).success(function() {
    //     scope.playing = file;
    //   });
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
        return dataSvc.playing;
      }, function(p) {
        scope.playing = p;
      });

      scope.$watch(function() {
        return $routeParams.path;
      }, function(d) {
        dataSvc.getDir(d);
      });

      scope.play = function(file) {
        dataSvc.play(file);
      };
      // scope.refresh = function() {
      //   dataSvc.refresh();
      // };
    }
  };
}])

.directive('trackList', ['dataSvc', function(dataSvc) {
  return {
    restrict: 'C',
    link: function(scope) {
      scope.$watch(function() {
        return dataSvc.fileList;
      }, function(t) {
        scope.tracks = t;
      });

      dataSvc.getTracks();

      scope.play = function(file) {
        dataSvc.play(file);
      };
    }
  };
}]);
