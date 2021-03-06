var map;
var geocoder;
var infoWindow;
var start = []; //start (green dot)
var markers = []; //marker array
var labels = '123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
var labelIndex = 0;
var greenDot = 'http://maps.google.com/mapfiles/ms/icons/green-dot.png'; //user location
var FSURL = 'https://api.foursquare.com/v2/venues/explore'
var FSclientID = 'R0QSI5RXZLR3RNVFLF5GNEI2MVHCPC5XLUOF51TRSQZVC154';
var FSclientSecret = 'GUESJ3L0PXMMQAHMOSRDGGVGOEYHJIGZRQ1LO0RSRVSQUXWY';

//----- LOAD MAP & LEGEND
//----------------------------//

function initialize() { // Load map
	geocoder = new google.maps.Geocoder();
	var start = new google.maps.LatLng(43.648358, -79.397966);
	
	map = new google.maps.Map(document.getElementById('map-canvas'), {
		center: start,
		zoom: 13
	});
}

function searchVenue() { // find address with keyword search, add marker and center map, find venue with Foursquare
	
	//----- GOOGLE GEOCODING
	//----------------------------//
	var address = document.getElementById('enter-location').value; // obtain keyword from user
	geocoder.geocode( { 'address' : address}, function(results, status) { // use Google Geocoder to find location
		
		if (status == google.maps.GeocoderStatus.OK) {
			var myLocation = results[0].geometry.location
			setUpMap(myLocation.lat(), myLocation.lng());

		}
		else {
			alert('Unable find location because: ' + status);
		}
	});
}

function setUpMap(lat, lng) {
	var location = (lat + "," + lng);
	map.setCenter(new google.maps.LatLng(lat, lng));
	map.setZoom(16);

	var marker = new google.maps.Marker({ // add marker for My Location
		map: map,
		icon: greenDot,
		position: new google.maps.LatLng(lat, lng)
	});
	start.push(marker); // push marker to array

	infoWindow = new google.maps.InfoWindow();
	infoWindow.setContent( // content of infoWindow
		'<strong class="wifi-name"> YOU ARE HERE </strong><br><br>'
	);
	infoWindow.open(map, marker);
			
	//------- FOURSQUARE venue explore
	//--------------------------------------//
	$.ajax({  // GET foursquare venue explore
		url: FSURL,
		type: 'GET',
		dataType: 'json',
		data: {
			client_id: FSclientID,
			client_secret: FSclientSecret,
			ll: location,
			sortByDistance: 1,
			limit: 30,
			radius: 1000,
			v: 20140806,
			query: 'free wifi'
		},
		success: function(venues){
			displayInfo(venues.response.groups[0].items);
		}
	});
	google.maps.event.addListener(map, 'dragend', loadVenues);
	google.maps.event.addListener(map, 'zoom_changed', loadVenues);
};
			
			
function displayInfo(results) { // cycle through results to create markers and venuelist
	for (var i = 0; i < results.length; i++) {
		createMarker(results[i], i);
		displayVenues(results[i], i); 
	}
}
			

function createMarker(place, i) { // create markers for venues
	var venueLoc = place.venue.location;
	var marker = new google.maps.Marker({ // create markers
		map: map,
		position: venueLoc,
		label: labels[i]
	});
	markers.push(marker); // push marker to array
	

	infoWindow = new google.maps.InfoWindow(); // create pop-up windows on markers
	google.maps.event.addListener(marker, 'click', function() {
		infoWindow.close();
		var venueObj = {
			'name':place.venue.name,
			'address':place.venue.location.address,
			'city':place.venue.location.city,
			'state':place.venue.location.state,
			'postal':place.venue.location.postalCode,
			'phone':place.venue.contact.formattedPhone,
			'url':place.venue.url,
			'hours':place.venue.hours.status // <<< ERROR >>> - infoWindow with undefined statuses are not showing
		};

		for(var key in venueObj){
			if (venueObj.hasOwnProperty(key)){
				if(venueObj[key] === undefined)
				venueObj[key] = '';
			}
		}
	
		infoWindow.setContent( //content of infoWindow
			
			'<strong class="wifi-name">' + labels[i] + '. '+ venueObj.name + '</strong><br><br>'
			
			+ venueObj.address + '<br>'
			+ venueObj.city + ', ' + venueObj.state + ' ' + venueObj.postal + '<br><br>'
			+ venueObj.phone + '<br>'
			+ venueObj.url + '<br><br>'
			+ venueObj.hours + '<br>'
		);
		infoWindow.open(map, marker);
	});

}
			
// NEW - moved the display Venues function into the search Venue function to use less code and ensure the Venue List and Map Markers are consistent (e.g. use the same "for" loop)

displayVenues = function(place, i){ // generate venue list "cards"
	var venueObj = {
		'name':place.venue.name,
		'address':place.venue.location.address,
		'city':place.venue.location.city,
		'state':place.venue.location.state,
		'postal':place.venue.location.postalCode,
		'phone':place.venue.contact.formattedPhone,
		'url':place.venue.url,
	};
	var placeLL = place.venue.location.lat+','+place.venue.location.lng;

	for(var key in venueObj){
		if (venueObj.hasOwnProperty(key)){
			if(venueObj[key] == undefined)
			venueObj[key] = '';
		}
	}

	$('#location-names').append('<div class="venueListItem" onclick="focusOnMarker\('+placeLL+'\);"><h4>'+labels[i]+". "+ venueObj.name + '</h4><p>'
	+ venueObj.address + '</p><p>'
	+ venueObj.city + ' '
	+ venueObj.postal + '</p></div>');
}
		
		
function loadVenues() { // empty venue list div and wifi search at the end of a drag
	$("#location-names").empty();
	deleteVenueMarkers();
	searchMoreVenues();
}
		
	
function searchMoreVenues () { // identified LatLng for center of viewport and uses that for call to Foursquare
	var viewportCentre = map.center.lat()+','+map.center.lng();
	
	$.ajax({  // GET foursquare venue explore
		url: FSURL,
		type: 'GET',
		dataType: 'json',
		data: {
			client_id: FSclientID,
			client_secret: FSclientSecret,
			ll: viewportCentre,
			sortByDistance: 1,
			limit: 30,
			radius: 1000,
			v: 20140806,
			query: 'free wifi'
		},
		success: function(venues){
			displayInfo(venues.response.groups[0].items);
		}
	});
}
	

//----- MARKER controls
//--------------------------//

function clearMarkers() { // Turn off markers on map
	setVenueMarkers(null);
	setStartMarker(null);
}

function deleteVenueMarkers () {
	setVenueMarkers(null);
	markers = [];
}

function deleteMarkers() { // Turn off markers and then delete from array
	clearMarkers();
	markers = [];
	start = [];
}

function setVenueMarkers(map) { // Place markers on map
	for (var i = 0; i < markers.length; i++) {
			markers[i].setMap(map);
	}
}

function setStartMarker(map) {
	for (var i = 0; i < start.length; i++) {
			start[i].setMap(map);
	}
}



//----- BUTTONS
//----------------------//

function searchArea() { // clear previous markers, empty venue list div and run address search and wifi search on click of Search button
	deleteMarkers();
	$("#location-names").empty();
	searchVenue();
}

function clearForm() { // clear form values and map markers
	deleteMarkers();
	document.getElementById("find-wifi").reset();
}

$('#enter-location').keypress(function (e) { // pressing Enter on Address textbox triggers click on search button
	if (e.which == 13) {
		$('.search').click();
		return false;
	}
});

function focusOnMarker(placeLat, placeLng) {
	map.setZoom(18);
	map.setCenter(new google.maps.LatLng(placeLat, placeLng));
}



//----- GEOLOCATE
//----------------------//

// geo-location on-click listener //
$('.getLocation').on('click', geoLocate());

function geoLocate() {
  
  function showMyPosition(position) {
    // $('#location-names').html("Your position is: " + position.coords.latitude + ", " + position.coords.longitude + " (Timestamp: "  + position.timestamp + ")<br />" + $('#location-names').html());
  	var llat = position.coords.latitude;
  	var llong = position.coords.longitude;
  	// var myLocationLL=(llat + "," + llong);
  	setUpMap(llat, llong);
  }
  
  function noLocation(error) {
    $('.result:eq(0)').html("No location info available. Error code: <br>" + JSON.stringify(error));
  }
  
  $('.getLocation').on('click', function() {
    $.geolocation.get({success: showMyPosition, error: noLocation});
  });
};

//----- SMOOTH SCROLL
//----------------------//

$(function() {
	$('a[href*=#]:not([href=#])').click(function() {
		if (location.pathname.replace(/^\//,'') == this.pathname.replace(/^\//,'') && location.hostname == this.hostname) {
			var target = $(this.hash);
			target = target.length ? target : $('[name=' + this.hash.slice(1) +']');
			if (target.length) {
				$('html,body').animate({
					scrollTop: target.offset().top
				}, 1000);
				return false;
			}
		}
	});
});
//----- INITIALIZE map
//----------------------//
google.maps.event.addDomListener(window, 'load', initialize);
