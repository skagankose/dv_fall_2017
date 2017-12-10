// Assign Dummy Density and Lines
const MAX_NEWS_NUMBER = 30;
var YEAR = '1990';

// Assign Density WRT. Connection Count
for (var i = 0; i < swiss_data.features.length; i++) {
    var canton_name = swiss_data.features[i].properties.name;

    // IMPROVE > NOT JUST ONE YEAR
    swiss_data.features[i].properties.density = cantonConnections[canton_name][YEAR].length;
}
//function to change densities by year
function get_density(canton,year){
  return cantonConnections[canton][year].length
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
        '<b>' + properties.name + '</b><br />' + get_density(properties.name,YEAR) + ' Connection Density'
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
    // try { map.removeLayer(polygonLayer); } catch (err) {};
    // try { map.removeLayer(concaveLayer); } catch (err) {};

    // Delete All Layers except Initials
    map.eachLayer(function (layer) {
      if (layer._leaflet_id > 150) {map.removeLayer(layer);};
    });
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

function toInt(n){ return Math.round(Number(n)); };

// We only took first 3 connections for demonstration purposes.
// IMPROVE > CHOOSE NUMBER OF CONNECTIONS

function drawSuperEdge (e) {
  // Get Connections of the Target "e"
  // Get Connections from an External File
  canton_name = e.target.feature.properties.name;
  var total_num_news = cantonConnections[canton_name][YEAR].length
  choosed_num_news = toInt(total_num_news)
  console.log(choosed_num_news);
  if (choosed_num_news > 0) {
    var connection_list = cantonConnections[canton_name][YEAR].slice(0, choosed_num_news);

    // Can either draw multiple polygons or a concave hull
    drawConcaveHull(e, connection_list);
    drawPolygon(e, connection_list);
    displayNames(e, connection_list);
  };

}
// Draw SuperEdge on Click -END
// Listener END

// Color Map START
// PROCESS BOOK > INTERVAL & COLOR CHOICE
function getColor(d) {
    return d > 40 ? '#401E1E':
           d > 30 ? '#5E3D52':
           d > 20 ? '#566A88':
           d > 10 ? '#329C9D':
           d > 5 ? '#67C687':
           d > 0   ? '#D8E366':
                    '#fafbf9';
}

function style(feature) {
    return {
        fillColor: getColor(get_density(feature.properties.name,YEAR)),
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
        grades = [0, 10, 30, 50, 70, 90],
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
