// Assign Dummy Density and Lines
const MAX_NEWS_NUMBER = 30;
var YEAR = '1970';

// Assign Density WRT. Connection Count
for (var i = 0; i < swiss_data.features.length; i++) {
    var canton_name = swiss_data.features[i].properties.name;

    // IMPROVE > NOT JUST ONE YEAR
    swiss_data.features[i].properties.density = cantonConnections[canton_name][YEAR].length;
}

// Calculate Centers START
function find_center(co) {
    center_x = 0;
    center_y = 0;
    for (var i = 0; i < co.length; i++) {
        center_y += co[i][0];
        center_x += co[i][1];
    }
    return [center_x / co.length, center_y / co.length]
}

for (var i = 0; i < swiss_data.features.length; i++) {
    co = swiss_data.features[i].geometry.coordinates[0][0]
    swiss_data.features[i].properties.center = find_center(co)
}

// Correct Faulty Centers
swiss_data.features[21].properties.center = [46.561, 6.536] // Vaud
swiss_data.features[10].properties.center = [47.208, 7.532] // Solothurn
swiss_data.features[12].properties.center = [47.441, 7.764] // Basel Landschaft
swiss_data.features[16].properties.center = [47.424, 9.376] // St. Gallen
swiss_data.features[14].properties.center = [47.366, 9.300] // Appenzell Ausserhoden

cantonCoordinates["Vaud"] = [46.561, 6.536] // Vaud
cantonCoordinates["Solothurn"] = [47.208, 7.532] // Solothurn
cantonCoordinates["Basel Landschaft"] = [47.441, 7.764] // Basel Landschaft
cantonCoordinates["St. Gallen"] = [47.424, 9.376] // St. Gallen
cantonCoordinates["Appenzell Ausserhoden"] = [47.366, 9.300] // Appenzell Ausserhoden
// Calculate Centers END

var geojson;
var mapboxAccessToken = 'pk.eyJ1IjoiMmJlb3JkaW5hcnkiLCJhIjoiY2phM2twb2wwMTAwZTMzbGZjODR2MGY5ZyJ9.ZKg4ICl_lpwgbEt5fZw5Wg';

// Crete the Main Layers
var light =
    L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=' + mapboxAccessToken, {
        id: 'mapbox.light',
    })

var streets =
    L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=' + mapboxAccessToken, {
        id: 'mapbox.streets-basic',
    })

// Add Markers Layer Start
let cantons_list = [];
var customIcon = L.icon({
    iconUrl: 'data/marker.png',
    iconSize: [40, 40], // size of the icon
    iconAnchor: [20, 35], // point of the icon which will correspond to marker's location
    popupAnchor: [0, -30]  // point from which the popup should open relative to the iconAnchor
});

for (var i = 0; i < swiss_data.features.length; i++) {
    cantons_list.push(L.marker(swiss_data.features[i].properties.center,
        {icon: customIcon}).bindPopup("Canton Name: " + swiss_data.features[i].properties.name));

}
var cantons = L.layerGroup(cantons_list)
// Add Markers Layer END

// Adding Location Markers START
const obj_to_map = ( obj => {
    let mp = new Map;
    Object.keys(obj).forEach(k => {
        mp.set(k, obj[k])
    });
    return mp;
});

const locationMarker = L.icon({
    iconUrl: 'data/location_marker.png',
    iconSize: [40, 40], // size of the icon
    iconAnchor: [20, 35], // point of the icon which will correspond to marker's location
    popupAnchor: [0, -30]  // point from which the popup should open relative to the iconAnchor
});

loc2coordMap = obj_to_map(loc2coord);

let locationList = [];

for (let [key, value] of loc2coordMap) {
    locationList.push(L.marker(value,
        {icon: locationMarker}).bindPopup(key));
}

const locations = L.layerGroup(locationList);
// Adding Location Markers END

// Adding News Polygons START
const obj2Map = ( obj => {
    let mp = new Map;
    Object.keys(obj).forEach(k => {
        mp.set(k, obj[k])
    });
    return mp;
});

newsMap = obj2Map(superEdges);
loc2coordMap = obj2Map(loc2coord);
let mapIter = newsMap.entries();
// console.log(newsMap);

let Polygons = [];

for (count = 0; count < MAX_NEWS_NUMBER; count++) {
    let polygonPoints = [];
    let [thisNewsID, thisNewsLocations] = mapIter.next().value;
    // console.log(thisNewsID, thisNewsLocations);
    for (let loc of thisNewsLocations) {
        let thisLocationCoordinates = loc2coordMap.get(loc);
        // console.log([thisNewsID, loc, thisLocationCoordinates]);
        let [Lat, Lng] = thisLocationCoordinates;
        // console.log([Lat, Lng]);
        let point = L.latLng({lat: Lat, lng: Lng});
        polygonPoints.push(point);
    }
    let polygon = new L.Polygon(polygonPoints);
    Polygons.push(polygon);
}

// console.log(Polygons);
let newsLayer = L.layerGroup(Polygons);
// Adding News Polygons END

// Create the Main Map Object
const map = L.map('map', {
    closePopupOnClick: false,
    center: [46.818, 8.227],
    zoom: 8,
    layers: [light],
    opacity: 1,
});

// Layer Control
const baseMaps = {
    "Simple": light,
    "Default": streets,
};

const overlayMaps = {
    "Markers": cantons,
    "Locations": locations,
    "News": newsLayer,
};

L.control.layers(baseMaps, overlayMaps).addTo(map);

// Listener START
let info = L.control();

info.onAdd = function (map) {
    this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
    this.update();
    return this._div;
};

// Method that we will use to update the control based on feature properties passed
info.update = function (properties) {
    this._div.innerHTML = (properties ?
        '<b>' + properties.name + '</b><br />' + properties.density + ' Connection Density'
        : '<h4>Swiss TV Mirror Map</h4>' + '<span style="font-size:15px;color:gray;">Hover Over a Canton</span>');
};

info.addTo(map);

function highlightFeature(e) {
    var layer = e.target;

    layer.setStyle({
        weight: 3,
        color: 'black',
        opacity: 1,
        dashArray: '',
        fillOpacity: 1,
    })

    if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
        layer.bringToFront();
    }

    info.update(layer.feature.properties);
}

function resetHighlight(e) {
    geojson.resetStyle(e.target);
    info.update();
}

// Draw SuperEdge on Click -START
var polygonLayer;
var concaveLayer;

function removeSuperEdge(e) {
    // Manually Delete Layers
    try { map.removeLayer(polygonLayer); } catch (err) {};
    try { map.removeLayer(concaveLayer); } catch (err) {};

}

// Draw SuperEdges Given List of Connections
// Display Name of Corner Points
// Draw One Big Polygon
function drawConcaveHull(e, canton_list) {

  var cornerPoints = [];
  for (set_of_cantons of canton_list) {
    for (canton of set_of_cantons) {
        let [lat, lng] = cantonCoordinates[canton];
        let point = L.latLng({lat: lat, lng: lng});
        cornerPoints.push(point);
    }
  }

  var latLngs = new ConcaveHull(cornerPoints).getLatLngs();
  concaveLayer = new L.Polygon(latLngs, {
      color: 'black',
      weight: 3,
      opacity: 1,
      fillColor: "MAROON",
      fillOpacity: 0.3,
      smoothFactor: 1,
  })

  map.addLayer(concaveLayer);
}

// Draw Multiple Polygons
function drawPolygon(e, canton_list) {

  var drawnItems = new L.FeatureGroup();
  cornerPoints = []

  for (set_of_cantons of canton_list) {

    let points = [];
    for (canton of set_of_cantons) {
        let [lat, lng] = cantonCoordinates[canton];
        let point = L.latLng({lat: lat, lng: lng});
        points.push(point);
      };

      cornerPoints.push(new L.Polygon(points, {
          color: 'black',
          weight: 3,
          opacity: 1,
          fillColor: 'MAROON',
          fillOpacity: 0.3,
          smoothFactor: 1,
      }));
  };

  for (points of cornerPoints) {
    drawnItems.addLayer(points);
  }

  polygonLayer = drawnItems;
  map.addLayer(polygonLayer);

}

var markerLayer = new L.FeatureGroup();

function displayNames (e, canton_list) {

  markerLayer = new L.FeatureGroup();

  let marker_list = [];
  for (set_of_cantons of canton_list) {
    for (canton of set_of_cantons) {

          var marker = L.popup({
                        closeButton: false,
                        autoClose: false
                      })
                      .setLatLng(cantonCoordinates[canton])
                      .setContent(canton);

        markerLayer.addLayer(marker);
    }
  }

  map.addLayer(markerLayer);

}

function removeMarkers() {
  map.removeLayer(markerLayer);
}

// We only took first 3 connections for demonstration purposes.
// IMPROVE > CHOOSE NUMBER OF CONNECTIONS
const numConnections = 3;

function drawSuperEdge (e) {
  // Get Connections of the Target "e"
  // Get Connections from an External File
  canton_name = e.target.feature.properties.name;
  var connection_list = cantonConnections[canton_name][YEAR].slice(1, numConnections);

  // Can either draw multiple polygons or a concave hull
  drawConcaveHull(e, connection_list);
  drawPolygon(e, connection_list);
  displayNames(e, connection_list);

}
// Draw SuperEdge on Click -END
// Listener END

// Color Map START
// PROCESS BOOK > INTERVAL & COLOR CHOICE
function getColor(d) {
    return d > 400 ? '#123f5a':
           d > 300 ? '#235d72':
           d > 200 ? '#3a7c89':
           d > 100 ? '#559c9e':
           d > 50 ? '#7bbcb0':
           d > 0   ? '#a5dbc2':
                    '#d2fbd4';
}

function style(feature) {
    return {
        fillColor: getColor(feature.properties.density),
        weight: 0.5,
        opacity: 0.5,
        color: 'black',
        fillOpacity: 0.7
    };
}
// Color Map END

// Add a Legend START
var legend = L.control({position: 'bottomright'});

legend.onAdd = function (map) {

    var div = L.DomUtil.create('div', 'info legend'),
        grades = [0, 100, 300, 500, 700, 900],
        labels = [];

    // loop through our density intervals and generate a label with a colored square for each interval
    for (var i = 0; i < grades.length; i++) {
        div.innerHTML +=
            '<i style="background:' + getColor(grades[i] + 1) + '"></i> ' +
            grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+');
    }

    return div;
};

legend.addTo(map);
// Add a Legend END

// Active Listeners
function onEachFeature(feature, layer) {
    layer.on({mouseover: highlightFeature});
    layer.on({click: drawSuperEdge});
    layer.on({mouseout: resetHighlight});
    layer.on({mouseout: removeSuperEdge});
    layer.on({mouseout: removeMarkers});

}

geojson = L.geoJson(swiss_data, {style: style, onEachFeature: onEachFeature}).addTo(map);
