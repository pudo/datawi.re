
var datawire = angular.module('datawire', [], function($routeProvider, $locationProvider) {
  $routeProvider.when('/profile', {
    templateUrl: '/static/partials/profile.html',
    controller: ProfileCtrl
  });

  $routeProvider.when('/feed', {
    templateUrl: '/static/partials/feed.html',
    controller: FeedCtrl
  });

  $locationProvider.html5Mode(true);
});

datawire.directive('xlink', function ($window) {
    return {
        restrict: 'E',
        template: '<a href=""><span ng-transclude></span></a>',
        transclude: true,
        link: function(scope, element, attrs) {
            element.bind('click', function() {
                $window.location.href = attrs.href;
            });
        }
    };
});

Handlebars.registerHelper('entity', function(text) {
    text = Handlebars.Utils.escapeExpression(text);
    var result = '<strong>' + text + '</strong>';
    return new Handlebars.SafeString(result);
});

datawire.factory('identity', function($http) {
    var dfd = $http.get('/api/1/sessions');
    return {
        session: dfd.success
    };
});

function ProfileCtrl($scope, $routeParams, $http) {
    $http.get('/api/1/profile').success(function(data) {
        $scope.profile = data;
    });

    $scope.save = function() {
        var dfd = $http.post('/api/1/profile', $scope.profile);
        dfd.success(function(data) {
            $scope.profile = data;
            $scope.flash('success', 'Your profile has been updated.');
        });
        dfd.error(function(data) {
            $scope.flash('error', 'There was an error saving your profile.');
        });
    };
}

function AppCtrl($scope, $window, $routeParams, identity) {
    identity.session(function(data) {
        $scope.session = data;
    });


    $scope.flash = function(type, message) {
        $scope.currentFlash = {
            visible: true,
            type: type,
            message: message
        };
    };
}

function FeedCtrl($scope, $routeParams, $http) {
    $scope.tableObject = function(obj) {
        var table = {};
        angular.forEach(obj, function(v, k) {
            if (v && v.length) {
                table[k] = v;
            }
        });
        return table;
    };

    $http.get('/api/1/frames?limit=20').success(function(data) {
        $scope.frames = data.results;
        $scope.services = data.services;
        $scope.templates = {};
        angular.forEach(data.services, function(service, key) {
            angular.forEach(service.events, function(event, i) {
                if (!$scope.templates[service.key]) {
                    $scope.templates[service.key] = {};
                }
                var tmpl = Handlebars.compile(event.template);
                $scope.templates[service.key][event.key] = tmpl;
            });
        });
        angular.forEach($scope.frames, function(frame, i) {
            $http.get(frame.api_uri).success(function(fd) {
                frame.data = fd.data;
                frame.renderedView = true;
                var tmpl = $scope.templates[fd.service][fd.event];
                frame.rendered = tmpl(fd.data);
            });
        });
    });
}