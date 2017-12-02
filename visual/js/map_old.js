// Assign Dummy Density and Lines
const MAX_NEWS_NUMBER = 30;

for (var i = 0; i < swiss_data.features.length; i++) {
    swiss_data.features[i].properties.density = Math.round((i * 100 / 30 + 10) * 100) / 100;
    swiss_data.features[i].properties.connected = [Math.abs(i - 5),
        Math.abs(i - 6),
        Math.abs(i - 14),
        Math.abs(i - 20),
        Math.abs(i - 2),]
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

// Adding News Polygones START
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
// Adding News Polygones END

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

// let newsLayers = _.extend({}, Polygons);
// console.log(newsLayers);

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

/* DRAWS SINGLE EDGES
// Draw Edge on Click -START
var polyLine;

function removeLine(e) {
    try {
        map.removeLayer(polyLine);
    } catch (err) {
        // pass
    }
}

function drawLine(e) {
    let lines = e.target.feature.properties.connected;
    let pointList = [];

    // Add Lines
    for (var i = 0; i < lines.length; i++) {
        let pointA = new L.LatLng(e.target.getCenter().lat, e.target.getCenter().lng);
        let pointB = new L.LatLng(swiss_data.features[lines[i]].properties.center[0], swiss_data.features[lines[i]].properties.center[1]);
        pointList.push(pointA);
        pointList.push(pointB);
    }

    // Draw Added Lines
    polyLine = new L.Polyline(pointList, {
        color: 'black',
        weight: 3,
        opacity: 0.7,
        smoothFactor: 1,
    });

    map.addLayer(polyLine);
}
// Draw Edge on Click -END

function showName(e) {
    lat = e.target.getCenter().lat;
    lng = e.target.getCenter().lng
    var popup = L.popup()
        .setLatLng([lat, lng])
        .setContent(e.target.feature.properties.name)
        .openOn(map);
}
*/


// Draw SuperEdge on Click -START
var polygonLayer;
var concaveLayer;

function removeSuperEdge(e) {
    try {
        map.removeLayer(concaveLayer);
        map.removeLayer(polygonLayer);
    } catch (err) {
        // pass
    }
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
      opacity: 0.7,
      fillOpacity: 0.2,
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
          color: 'red',
          weight: 0,
          opacity: 0.1,
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

function drawSuperEdge (e) {
  // Get Connections of the Target "e"
  // Get Random Connections for Prototype

  /* RANDOMLY GENERATES CONNECTIONS
  // Randomly Generated Canton List
  var connection_list = [];
  for (var i = 0; i < 3; i++) {
    connection = [];
    let n = 0;
    while (n < 2) {
      var k = Object.keys(loc2coord)
      let rand = Math.floor(Math.random() * k.length);
      let rand_loc = k[rand];
      lat = loc2coord[k[rand]][0];
      lng = loc2coord[k[rand]][1];
      if (lat < 48 && lat > 46 && lng < 10 && lng > 5) {
        connection.push(rand_loc);
        n += 1;
        }
    }
    connection_list.push(connection);
  }
  */

  // Get Connection from an External File
  // We only took first 3 connections for demonstration purposes.
  canton_name = e.target.feature.properties.name;
  var connection_list = cantonConnections[canton_name].slice(1, 3);

  // Can either draw multiple polygons or a concave hull
  // drawPolygon(e, connection_list);
  drawConcaveHull(e, connection_list);
  displayNames(e, connection_list);

}
// Draw SuperEdge on Click -END
// Listener END

// Color Map START
function getColor(d) {
    return d > 95 ? '#123f5a' :
              d > 90 ? '#235d72' :
                  d > 70 ? '#3a7c89' :
                      d > 50 ? '#559c9e' :
                          d > 30 ? '#7bbcb0' :
                              d > 0 ? '#a5dbc2' :
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
        grades = [0, 30, 50, 70, 90, 95],
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

// Debug Function
function getInfo(e) {
  console.log(e);
}

// Active Listeners
function onEachFeature(feature, layer) {
    layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight,
    });

    layer.on({click: getInfo});
    layer.on({click: drawSuperEdge});
    layer.on({mouseout: removeSuperEdge});
    layer.on({mouseout: removeMarkers});
    // layer.on({ click: showName})
    // layer.on({click: drawLine})
    // layer.on({mouseout: removeLine})

}

geojson = L.geoJson(swiss_data, {style: style, onEachFeature: onEachFeature}).addTo(map);
