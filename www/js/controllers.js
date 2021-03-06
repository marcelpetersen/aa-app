angular.module('starter.controllers', [])

.controller('AppCtrl', ['$scope', '$localstorage', '$ionicModal', '$timeout', '$rootScope', '$ionicHistory', '$cordovaGeolocation', function($scope, $localstorage, $ionicModal, $timeout, $rootScope, $ionicHistory, $cordovaGeolocation) {

  $rootScope.showNavItem = true;

  $rootScope.goBack = function() {
    $ionicHistory.goBack();
  };

  $rootScope.$on('$ionicView.beforeEnter', function() {
    angular.element(document.getElementById("tab-topdes")).addClass("tab-active");
    var currentView = $ionicHistory.currentView().stateName;
    if(currentView == "app.destinations") {
      angular.element(document.getElementsByClassName("tab-item")).removeClass("tab-active");
      angular.element(document.getElementById("tab-topdes")).addClass("tab-active");
    } else if(currentView == "app.featured-accommodation") {
      angular.element(document.getElementsByClassName("tab-item")).removeClass("tab-active");
      angular.element(document.getElementById("tab-featured")).addClass("tab-active");
    } else if(currentView == "app.near-me") {
      angular.element(document.getElementsByClassName("tab-item")).removeClass("tab-active");
      angular.element(document.getElementById("tab-nearme")).addClass("tab-active");
    } else {
      angular.element(document.getElementsByClassName("tab-item")).removeClass("tab-active");
    }
  });

  $rootScope.$on('$ionicView.beforeLeave', function() {

    if($rootScope.getLocationEnable === false) {
      //Check status of gps
      cordova.plugins.diagnostic.isLocationEnabled(function(enabled){
        if(enabled) {
          $rootScope.getLocationAfterEnable();   
          console.log("Location Enabled");
        }
      }, function(error){
        console.error("The following error occurred: "+error);
      });
    }
    
  });

}]);

// FUNCTIONS --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

function loadDistanceBefore($rootScope, $ionicHistory, $scope, $timeout, $interval, $http, $ionicLoading) {
 
  // test if the location has been updated yet, if not an interval starts
  var promise = $interval(function() {

    if (typeof $rootScope.myLat !== 'undefined' || typeof $rootScope.myLong !== 'undefined'){

      $http({
        method: 'GET',
        url: 'http://www.aatravel.co.za/_mobi_app/accomm.php?gps=1&latitude='+$rootScope.myLat+'&longitude='+$rootScope.myLong
      }).then(function successCallback(response) {

        $ionicLoading.hide();

        $scope.showSpiralNear = false;
        $scope.resultsLoaded = true;

        $scope.aaRating = calculateRating(response.data);        

        var acommodations = response.data;                

        var distanceArray = [];
        for ( var x = 0; x < acommodations.length; x++) {
          acommodations[x].distance = Math.round(getDistanceFromLatLonInKm($rootScope.myLat,$rootScope.myLong,acommodations[x].lat,acommodations[x].lon));
        }

        acommodations.sort(function(a,b) {
          return a.distance - b.distance;
        });

        $scope.nearMeAcommodations = acommodations;
        $scope.nearMeData = acommodations;

        // returnData()

      }, function errorCallback(response) {

        navigator.notification.alert(
          'We regret that there is a problem retrieving the acommodations near you',  // message
          null,                     // callback
          'Alert',                // title
          'Done'                  // buttonName
        );

      });
      
      // the interval breaks if location is loaded
      $interval.cancel(promise);

    }

  }, 500);

}

function loadDistances(data, $rootScope, $interval, $scope) {
  if(ionic.Platform.isWebView()) {
    cordova.plugins.diagnostic.isLocationEnabled(function(enabled){
      if(enabled) {
        var distanceArray = [];
        var promise = $interval(function() {
          console.log("waiting for location before distance is loaded");
          if (typeof $rootScope.myLat !== 'undefined' || typeof $rootScope.myLong !== 'undefined'){
            for ( var x = 0; x < data.length; x++) {            
              distanceArray.push(Math.round(getDistanceFromLatLonInKm($rootScope.myLat,$rootScope.myLong,data[x].lat,data[x].lon)));
            }   
            $scope.acommodationsDistances = distanceArray;

            $interval.cancel(promise);
            
          }  
        }, 500);        
      }
    }, function(error){
      console.error("The following error occurred: "+error);
    });
  } else {
    var distanceArray = [];
    for ( var x = 0; x < data.length; x++) {            
      distanceArray.push(Math.round(getDistanceFromLatLonInKm($rootScope.myLat,$rootScope.myLong,data[x].lat,data[x].lon)));
    }
    $scope.acommodationsDistances = distanceArray;
  }
}

function buildProvinces() {
  return [
    { id: 1, link: 'eastern-cape', name: 'Eastern Cape', image: 'img/provinces/eastern-cape.svg' },
    { id: 2, link: 'free-state', name: 'Free State', image: 'img/provinces/freestate.svg' },
    { id: 3, link: 'gauteng', name: 'Gauteng', image: 'img/provinces/gauteng.svg' },
    { id: 4, link: 'kwazulu-natal', name: 'KwaZulu Natal', image: 'img/provinces/kwazulu-natal.svg'  },    
    { id: 5, link: 'mpumalanga', name: 'Mpumalanga', image: 'img/provinces/mpumalanga.svg'  },
    { id: 6, link: 'northern-cape', name: 'Northern Cape', image: 'img/provinces/northern-cape.svg'  },    
    { id: 8, link: 'north-west', name: 'North West', image: 'img/provinces/north-west.svg'  },
    { id: 9, link: 'western-cape', name: 'Western Cape', image: 'img/provinces/western-cape.svg'  },
    { id: 11, link: 'limpopo', name: 'Limpopo', image: 'img/provinces/limpopo.svg'  }
  ];
}

function getDistanceFromLatLonInKm(lat1,lon1,lat2,lon2) {
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2-lat1);  // deg2rad below
  var dLon = deg2rad(lon2-lon1); 
  var a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
    ; 
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  var d = R * c; // Distance in km
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI/180);
}

function mapView(data, $rootScope, mapType, $ionicLoading) {

  var nearMeMap;

  if(mapType == 'accommodation-map') {

    // run normal add marker script    
    var accomLatlng = new google.maps.LatLng(data[0].lat, data[0].lon);
    var mapOptions = {
      zoom: 11,
      center: accomLatlng,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      disableDefaultUI: true
    };

    nearMeMap = new google.maps.Map(document.getElementById("map"), mapOptions);

  } else if(mapType == 'nearme-map') {

    var Latlng = new google.maps.LatLng($rootScope.myLat, $rootScope.myLong);
    var nearMeMapOptions = {
      zoom: 11,
      center: Latlng,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      disableDefaultUI: true
    };

    // add your location with unique marker
    nearMeMap = new google.maps.Map(document.getElementById("map"), nearMeMapOptions);

    var myLocImage = 'img/markers/accom-marker-location.svg';
    var marker = new google.maps.Marker({
      position: Latlng,
      map: nearMeMap,
      icon: myLocImage,
      title: "You are here!"
    });
    marker.addListener('click', markerMyLocation);

  }  

  // hide loader
  setTimeout(function() {
    $ionicLoading.hide();
  }, 1000);

  var markersArray = [];
  var image = 'img/markers/accom-marker.svg';
  for(var x = 0; x < data.length; x++) {
    
    var markerLatLng = new google.maps.LatLng(data[x].lat,data[x].lon);
    var accomMarker = new google.maps.Marker({
      position: markerLatLng,
      map: nearMeMap,
      id: data[x].id,
      title: data[x].n,
      icon: image
    });
    accomMarker.addListener('click', markerId);

    markersArray.push(accomMarker);

  }

  var infowindow = new google.maps.InfoWindow();

  function markerMyLocation() {
    infowindow.close();
    infowindow.setContent(this.title);
    infowindow.open(nearMeMap, this);
  }

  function markerId() {

    if (infowindow) {
        infowindow.close();
    }

    var markerObj = {};

    for(var x = 0; x < data.length; x++) {

      if(this.id == data[x].id) {
        markerObj = data[x];
        marker = markersArray[x];
      }

    }

    console.log(markerObj);

    infowindow.close();
    infowindow.setContent(markerObj.n);
    infowindow.open(nearMeMap, marker);

    var markerLink = angular.element(document.getElementById('map-list-item-wrap'));
    var acommPrice;

    if(markerObj.pl != "0.00") {
      acommPrice = markerObj.pl+" ZAR";
    } else {
      acommPrice = "Price on enquiry";
    }

    var ratingArray = [];

    switch(markerObj.ar){
      case '1':
        ratingArray.push({"text":"AA Recommended", "rating":"img/aaqa/1.png"});
        break;
      case '2':
        ratingArray.push({"text":"AA Highly Recommended", "rating":"img/aaqa/2.png"});
        break;
      case '3':
        ratingArray.push({"text":"AA Superior", "rating":"img/aaqa/3.png"});
        break;
      case '4':
        ratingArray.push({"text":"AA Recommended/Highly Recommended", "rating":"img/aaqa/2.png"});
        break;
      case '5':
        ratingArray.push({"text":"AA Highly Recommended/Superior", "rating":"img/aaqa/3.png"});
        break;
      case '6':
        ratingArray.push({"text":"AA Eco", "rating":"img/aaqa/4.png"});
        break;
      case '7':
        ratingArray.push({"text":"AA Quality Assured", "rating":"img/aaqa/9.png"});
        break;
      case '8':
        ratingArray.push({"text":"AA Quality Assured", "rating":"img/aaqa/9.png"});
        break;
      case '9':
        ratingArray.push({"text":"Status Pending", "rating":"img/aaqa/9.png"});
        break;
      default:
        ratingArray.push({"text":"", "rating":""});
        break;
    }

    var distance;
    if(isNaN(Math.round(getDistanceFromLatLonInKm($rootScope.myLat,$rootScope.myLong,markerObj.lat,markerObj.lon)))) {
      distance = "";
    } else {
      distance = "<div class='accom-distance bg-yellow white' ng-if='$root.positionAvailable'><i class='icon ion-location'></i>&nbsp;"+Math.round(getDistanceFromLatLonInKm($rootScope.myLat,$rootScope.myLong,markerObj.lat,markerObj.lon))+" km</div>";
    }

    markerLink.html("<div class='padding map-list-item-wrap' id='"+markerObj.tb+"'>"+
        "<a type='button' class='map-item-close-btn' onclick='closeMapListItem()'>"+
          "<i class='icon ion-close'></i>"+
        "</a>"+
        "<a type='button' id='map-list-box' class='map-list-item padding' href='#/app/destinations/{{state.provinceName}}+id={{state.provinceId}}/{{state.cityName}}+id={{state.cityId}}/"+markerObj.n+"+id="+markerObj.id+"' class='accom-btn'>"+
          "<div class='row map-list-item-row'>"+
            "<div class='col accom-img-bg'>"+distance+"<img class='img-height center-image' src='"+markerObj.tb+"'>"+
            "</div>"+
            "<div class='col col-75 accom-content'>"+
              "<h3 class='page-blue-heading'>"+
                "<b>"+markerObj.n+
                "</b>"+
              "</h3>"+
              "<div class='accom-title-underline'></div>"+
              "<div class='row accom-ratings-row'>"+
                "<div class='col accom-ratings-row-price'>"+
                  "<b>"+acommPrice+"</b>"+
                "</div>"+
              "</div>"+
              "<div class='row accom-aa-ratings-row accom-aa-ratings-text'>"+
                "<p>"+ratingArray[0].text+"</p>"+
              "</div>"+
              "</div>"+
            "</div>"+
          "</div>"+
       "</a>"+
      "</div>");

  }

}

function closeMapListItem() {

  var markerLink = angular.element(document.getElementById('map-list-item-wrap'));
  markerLink.html("");

}

function calculateRating(data) {

  var ratingArray = [];

  // create the final multi dimensional array
  for ( var x = 0; x < data.length; x++) {

    switch(data[x].ar){
      case '1':
        ratingArray.push({"text":"AA Recommended", "rating":"img/aaqa/1.png"});
        break;
      case '2':
        ratingArray.push({"text":"AA Highly Recommended", "rating":"img/aaqa/2.png"});
        break;
      case '3':
        ratingArray.push({"text":"AA Superior", "rating":"img/aaqa/3.png"});
        break;
      case '4':
        ratingArray.push({"text":"AA Recommended/Highly Recommended", "rating":"img/aaqa/2.png"});
        break;
      case '5':
        ratingArray.push({"text":"AA Highly Recommended/Superior", "rating":"img/aaqa/3.png"});
        break;
      case '6':
        ratingArray.push({"text":"AA Eco", "rating":"img/aaqa/4.png"});
        break;
      case '7':
        ratingArray.push({"text":"AA Quality Assured", "rating":"img/aaqa/9.png"});
        break;
      case '8':
        ratingArray.push({"text":"AA Quality Assured", "rating":"img/aaqa/9.png"});
        break;
      case '9':
        ratingArray.push({"text":"Status Pending", "rating":"img/aaqa/9.png"});
        break;
      default:
        ratingArray.push({"text":"", "rating":""});
        break;
    }         

  }

  return ratingArray;
}

function imgError(image) {
  image.onerror = "";
  image.src = "img/no-image-available.png";
  return true;
}

function hideMap($ionicHistory, $rootScope) {

  var viewKeys = $ionicHistory.viewHistory().views;
  var viewArray = [];
  for (var key in viewKeys) {
    viewArray.push(viewKeys[key]);
  }
  var previousView = viewArray.slice(-1)[0].stateName;
  if (previousView != 'app.destinations-accom-chosen') {
    $rootScope.showMap = false;
  }

}

function showModal($ionicModal, $scope, $rootScope, page) {  

  $ionicModal.fromTemplateUrl('templates/filter-modal.html', {
    scope: $scope,
    animation: 'slide-in-up'
  }).then(function(modal) {
    $scope.modal = modal;
    $scope.modal.show();
  });

  if(typeof $scope.mySelect === 'undefined') {
    $rootScope.mySelect = '0';
  }

  if(page == 'alphabetical') {
    $scope.alphabetical = true;
    $scope.radioValue = page;
    $scope.select = "";
  } else if(page == 'distance') {
    $scope.distance = true;
    $scope.radioValue = page;
    $scope.select = "";
  }

}

function filter(filterType, mySelect, $scope, $rootScope) {

  $scope.radioValue = filterType;

  switch(filterType) {
    case 'alphabetical':
      $scope.alphabetical = true;
      $scope.priceHigh = false;
      $scope.priceLow = false;
      $scope.distance = false;
      $rootScope.mySelect = '0';
      $scope.featureSelected = true;
      break;
    case 'price-high':
      $scope.alphabetical = false;
      $scope.priceHigh = true;
      $scope.priceLow = false;
      $scope.distance = false;
      $rootScope.mySelect = '0';
      $scope.featureSelected = true;
      break;
    case 'price-low':
      $scope.alphabetical = false;
      $scope.priceHigh = false;
      $scope.priceLow = true;
      $scope.distance = false;
      $rootScope.mySelect = '0';
      $scope.featureSelected = true;
      break;
    case 'distance':
      $scope.alphabetical = false;
      $scope.priceHigh = false;
      $scope.priceLow = false;
      $scope.distance = true;
      $rootScope.mySelect = '0';
      $scope.featureSelected = true;
      break;
    case 'aaqa':
      $scope.alphabetical = false;
      $scope.priceHigh = false;
      $scope.priceLow = false;
      $scope.distance = false;
      $scope.featureSelected = true;
      break;
  }

  var allRadios;
  if(filterType != 'aaqa') {

    $rootScope.mySelect = '0';    

    allRadios = angular.element(document.getElementsByClassName("radio-icon"));
    allRadios.css({"display":"inline-block"});

  } else {

    allRadios = angular.element(document.getElementsByClassName("radio-icon"));
    allRadios.css({"display":"none"});
    
  }

}

function runFilter($scope, data, $rootScope, $ionicScrollDelegate) {

  $ionicScrollDelegate.scrollTop();

  filterType = $scope.radioValue;
  mySelect = $rootScope.mySelect;

  // sort price array
  var hasPriceArray = [];
  var missingPriceArray = [];
  var distanceArray = [];
  for(var x = 0; x < data.length; x++) {
    if (data[x].pl != "0.00") {
      hasPriceArray.push(data[x]);
    } else {
      missingPriceArray.push(data[x]);
    }
  }

  switch(filterType) {
    case 'alphabetical':
      data.sort(function(a,b) {
        if(a.n < b.n) return -1;
        if(a.n > b.n) return 1;
        return 0;
      });
      for(var a = 0; a < data.length; a++) {
        console.log(data[a].n);
      }
      $scope.filterBy = "Alphabetical";
      $scope.filteredData = data;

      // reload distances & ratings according to filter      
      reloadDistance($scope, $scope.filteredData, $rootScope); 

      break;    
    case 'price-high':
      hasPriceArray.sort(function(a,b) {
        return b.pl - a.pl;
      });
      $scope.filterBy = "Price (High to Low)";
      $scope.filteredData = hasPriceArray.concat(missingPriceArray);

      // reload distances & ratings according to filter      
      reloadDistance($scope, $scope.filteredData, $rootScope); 

      break;
    case 'price-low':
      hasPriceArray.sort(function(a,b) {
        return a.pl - b.pl;
      });
      $scope.filterBy = "Price (Low to High)";
      $scope.filteredData = hasPriceArray.concat(missingPriceArray);

      // reload distances & ratings according to filter      
      reloadDistance($scope, $scope.filteredData, $rootScope);

      break;
    case 'distance':
      for(var b = 0; b < data.length; b++) {
        data[b].distance = Math.round(getDistanceFromLatLonInKm($rootScope.myLat, $rootScope.myLong, data[b].lat, data[b].lon));
        distanceArray.push(data[b]);
      }
      distanceArray.sort(function(a,b) {
        return a.distance - b.distance;
      });
      $scope.filterBy = "Distance";
      $scope.filteredData = distanceArray;

      // reload distances & ratings according to filter      
      reloadDistance($scope, $scope.filteredData, $rootScope);

      break;
    case 'aaqa':
      selectRecom(mySelect, data, $scope, $rootScope);
      break;
    default:
      $scope.filteredData = data;
      break;
  }
}

function reloadDistance($scope, filteredData, $rootScope) {
  var distanceArray = [];
  for ( var x = 0; x < filteredData.length; x++) {
    distanceArray.push(Math.round(getDistanceFromLatLonInKm($rootScope.myLat,$rootScope.myLong,filteredData[x].lat,filteredData[x].lon)));
  }
  $scope.aaRatingArray = calculateRating(filteredData);
  $scope.distanceArray = distanceArray;
}

function selectRecom(mySelect, data, $scope, $rootScope) {
  var recommendedArray = [];      
  switch(mySelect) {
    case '1':
      for(var x = 0; x < data.length; x++) {
        if(data[x].ar == '1')
        recommendedArray.push(data[x]);
      }
      $scope.filteredData = recommendedArray;
      $scope.mySelect = '1';

      // reload distances & ratings according to filter      
      reloadDistance($scope, $scope.filteredData, $rootScope);
      $scope.filterBy = "AA Recommended";
      break;
    case '2':
      for(var c = 0; c < data.length; c++) {
        if(data[c].ar == '2')
        recommendedArray.push(data[c]);
      }
      $scope.filteredData = recommendedArray;
      $scope.mySelect = '2';

      // reload distances & ratings according to filter      
      reloadDistance($scope, $scope.filteredData, $rootScope);
      $scope.filterBy = "AA Highly Recommended";
      break;
    case '3':
      for(var d = 0; d < data.length; d++) {
        if(data[d].ar == '3')
        recommendedArray.push(data[d]);
      }
      $scope.filteredData = recommendedArray;
      $scope.mySelect = '3';

      // reload distances & ratings according to filter      
      reloadDistance($scope, $scope.filteredData, $rootScope);
      $scope.filterBy = "AA Superior";
      break;
    case '4':
      for(var e = 0; e < data.length; e++) {
        if(data[e].ar == '4')
        recommendedArray.push(data[e]);
      }
      $scope.filteredData = recommendedArray;
      $scope.mySelect = '4';

      // reload distances & ratings according to filter      
      reloadDistance($scope, $scope.filteredData, $rootScope);
      $scope.filterBy = "AA Recommended/Highly Recommended";
      break;
    case '5':
      for(var f = 0; f < data.length; f++) {
        if(data[f].ar == '5')
        recommendedArray.push(data[f]);
      }
      $scope.filteredData = recommendedArray;
      $scope.mySelect = '5';
      $scope.filterBy = "AA Highly Recommended/Superior";
      // reload distances & ratings according to filter      
      reloadDistance($scope, $scope.filteredData, $rootScope);

      break;
    case '6':
      for(var g = 0; g < data.length; g++) {
        if(data[g].ar == '6')
        recommendedArray.push(data[g]);
      }
      $scope.filteredData = recommendedArray;
      $scope.mySelect = '6';
      $scope.filterBy = "AA Eco";
      // reload distances & ratings according to filter      
      reloadDistance($scope, $scope.filteredData, $rootScope);

      break;
    case '7':
      for(var h = 0; h < data.length; h++) {
        if(data[h].ar == '7' || data[h].ar == '8')
        recommendedArray.push(data[h]);
      }
      $scope.filteredData = recommendedArray;
      $scope.mySelect = '7';
      $scope.filterBy = "AA Quality Assured";
      // reload distances & ratings according to filter      
      reloadDistance($scope, $scope.filteredData, $rootScope);

      break;
    case '8':
      for(var i = 0; i < data.length; i++) {
        if(data[i].ar == '9')
        recommendedArray.push(data[i]);
      }
      $scope.filteredData = recommendedArray;
      $scope.mySelect = '8';
      $scope.filterBy = "Status Pending";
      // reload distances & ratings according to filter      
      reloadDistance($scope, $scope.filteredData, $rootScope);

      break;
    default:
      $scope.filteredData = data;
      break;
  }
}