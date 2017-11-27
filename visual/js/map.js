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
/*
const obj2Arr = obj => Object.keys(obj).map(function (key) {
    return obj[key];
});
*/

const obj2Map = ( obj => {
    let mp = new Map;
    Object.keys(obj).forEach(k => {
        mp.set(k, obj[k])
    });
    return mp;
});

/*
for (j=0; j < 4; j++) {
    let polygonPoints = [];
    let locs = supedgeArr[j];
    for (let i=0; i <locs.length; i++) {
        console.log(locs[i]);
        console.log(loc2coordMap.get(locs[i]));
        // loc_coord = loc2coordMap.get(locs[i]);
        polygonPoints.push(L.LatLng(locs[i]));
    }
    let polygon = new L.Polygon(polygonPoints);
    Polygons.push(polygon);
}
*/

newsMap = obj2Map(supededges);
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

// method that we will use to update the control based on feature properties passed
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

/*
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

function showName(e) {
    lat = e.target.getCenter().lat;
    lng = e.target.getCenter().lng
    var popup = L.popup()
        .setLatLng([lat, lng])
        .setContent(e.target.feature.properties.name)
        .openOn(map);
}
*/


// Draw SuperEdge on Click START
var dummyLayer;

function removeSuperEdge(e) {
    try {
        map.removeLayer(dummyLayer);
    } catch (err) {
        // pass
    }
}

function drawPolygon(e, canton_list) {

  var drawnItems = new L.FeatureGroup();
  cornerPoints = []

  for (let set_of_cantons of canton_list) {

    let lines = e.target.feature.properties.connected;
    let points = [];
    for (canton of set_of_cantons) {
        let [lat, lng] = loc2coord[canton];
        let point = L.latLng({lat: lat, lng: lng});
        points.push(point);
      };

      cornerPoints.push(new L.Polygon(points, {
          color: 'black',
          weight: 3,
          opacity: 0.7,
          smoothFactor: 1,
      }));
  };

  for (points of cornerPoints) {
    drawnItems.addLayer(points);
  }

  dummyLayer = drawnItems;
  map.addLayer(dummyLayer);

}


function drawSuperEdge (e) {
  // Get Connections of the Target "e"
  let cantons_to_connect = [["Vaud",  "Zurich", "Obwald"],
    ["Vaud",  "JURA (MONTAGNE)", "Appenzell (cantons)"]];
  drawPolygon(e, cantons_to_connect);
}
// Draw SuperEdge on Click END
// Listener END

// Add .geojson to the Map
// geojson = L.geoJson(swiss_data).addTo(map);

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
    // layer.on({ click: showName})
    // layer.on({click: drawLine})
    // layer.on({mouseout: removeLine})

}

geojson = L.geoJson(swiss_data, {style: style, onEachFeature: onEachFeature}).addTo(map);
