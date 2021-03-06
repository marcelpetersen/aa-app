angular.module('near.me.controller', [])

.controller('NearMeCtrl', ['$scope', '$rootScope', '$state', '$http', '$interval', '$ionicLoading', '$timeout', '$window', '$ionicHistory', '$ionicModal', '$ionicScrollDelegate', '$localstorage', function($scope, $rootScope, $state, $http, $interval, $ionicLoading, $timeout, $window, $ionicHistory, $ionicModal, $ionicScrollDelegate, $localstorage) {

  $scope.$on('$ionicView.enter', function() {
    $rootScope.showTabs = true;
    $rootScope.showBack = true;   
  });

  $scope.$on('$ionicView.leave', function() {
    angular.element(document.getElementById("tab-nearme")).removeClass("tab-active");
  });

  $scope.showSpiralNear = true;     

  $timeout(function(){    

    $scope.showMapBtn = false;
    var finalResultArray;

    loadDistanceBefore($rootScope, $ionicHistory, $scope, $timeout, $interval, $http, $ionicLoading)

    var promise = $interval(function() {

      if(typeof $scope.nearMeData !== 'undefined') {

        $scope.showMapBtn = true;
        finalResultArray = $scope.nearMeData;

        $interval.cancel(promise);

      }

    }, 500);

    $scope.controllerMapView = function() {

      $localstorage.set("closeTab", "true")
      $localstorage.set("type", "nearMe");
      $localstorage.setObject("nearMeData", $scope.nearMeData);
      $state.go('app.map-view');

    }

    $scope.select = "distance"
    $scope.filterBy = "Distance";
    $scope.openModal = function() {
      showModal($ionicModal, $scope, $rootScope, $scope.select);        
    };
    $scope.filterData = function(filterType, mySelect) {
      filter(filterType, mySelect, $scope, $rootScope);
    }
    $scope.closeModal = function() {
      runFilter($scope, finalResultArray, $rootScope, $ionicScrollDelegate)
      $scope.nearMeAcommodations = $scope.filteredData;
      $scope.nearMeAcommodations.length = $scope.filteredData.length;
      if($scope.nearMeAcommodations == 0) {
        $scope.noRatings = true;
      } else {
        $scope.noRatings = false;
      }
      // $scope.accommodation.distance = $scope.distanceArray;
      $scope.aaRating = $scope.aaRatingArray;
      // loadItemsByScroll("accommodation", $scope, $ionicScrollDelegate, $rootScope, $scope.filteredData, $window, $timeout)
      $scope.modal.hide();
    }; 

    $scope.refreshContent = function() {
      $ionicLoading.show({template: $rootScope.ionSpinnerTemplate})
      loadDistanceBefore($rootScope, $ionicHistory, $scope, $timeout, $interval, $http, $ionicLoading)
      $ionicScrollDelegate.scrollTop();
      $scope.alphabetical = false;
      $scope.priceHigh = false;
      $scope.priceLow = false;
      $scope.distance = true;
      $scope.featureSelected = false;
      $scope.filterBy = "Distance";
      $scope.select = "distance";
    }   

  }, 500);

}])