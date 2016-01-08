angular.module('near.me.controller', [])

.controller('NearMeCtrl', ['$scope', '$rootScope', '$http', '$interval', '$ionicLoading', '$timeout', '$window', '$ionicHistory', '$ionicModal', '$ionicScrollDelegate', function($scope, $rootScope, $http, $interval, $ionicLoading, $timeout, $window, $ionicHistory, $ionicModal, $ionicScrollDelegate) {
  
  $scope.$on('$ionicView.beforeEnter', function() {
  });

  $scope.$on('$ionicView.enter', function() {
    $rootScope.showTabs = true;
    $rootScope.showBack = true;    
    $rootScope.enquireBtn = false;
    $rootScope.showMapBtn = true;

    // if($rootScope.showMap == true) {
    //   $timeout(function(){
    //     var mapBtn = angular.element(document.getElementsByClassName('map-view-btn'));
    //     mapBtn.addClass('yellow-activated');
    //   }, 100);      
    // } else {
    //   $timeout(function(){
    //     var listBtn = angular.element(document.getElementsByClassName('list-view-btn'));
    //     listBtn.addClass('yellow-activated');
    //     var mapBtn = angular.element(document.getElementsByClassName('map-view-btn'));
    //     mapBtn.removeClass('yellow-activated');
    //   }, 100);
    // }
    
  });

  $scope.showSpiralNear = true;     

  $timeout(function(){

    loadDistanceBefore("near-me", $rootScope, $ionicHistory, $scope, $timeout, $interval, $http, $window);

    $scope.select = "distance"
    $scope.filterBy = "Distance";
    $scope.openModal = function() {
      showModal($ionicModal, $scope, $rootScope, $scope.select);        
    };
    $scope.filterData = function(filterType, mySelect) {
      filter(filterType, mySelect, $scope, $rootScope);
    }
    $scope.closeModal = function() {
      runFilter($scope, $scope.nearMeAccommodations, $rootScope, $ionicScrollDelegate)
      $scope.accommodations = $scope.filteredData;
      $scope.results = $scope.filteredData.length;
      if($scope.results == 0) {
        angular.element(document.getElementsByClassName('end-text')).html("No results found")
      } else {
        angular.element(document.getElementsByClassName('end-text')).html("No more results")
      }
      $scope.acommodationsDistances = $scope.distanceArray;
      $scope.aaRating = $scope.aaRatingArray;
      // loadItemsByScroll("accommodation", $scope, $ionicScrollDelegate, $rootScope, $scope.filteredData, $window, $timeout)
      $scope.modal.hide();
    }; 

  }, 500);

}])