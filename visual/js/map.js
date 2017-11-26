// Assign Dummy Density and Lines
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


// Adding Location Markers
const obj_to_map = ( obj => {
    let mp = new Map;
    Object.keys(obj).forEach(k => {
        mp.set(k, obj[k])
    });
    return mp;
});

var locationMarker = L.icon({
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

var locations = L.layerGroup(locationList)
// Adding Location Markers END


// Create the Main Map Object
var map = L.map('map', {
    center: [46.818, 8.227],
    zoom: 8,
    layers: [light]
})

// Layer Control
var baseMaps = {
    "Simple": light,
    "Default": streets,
}
var overlayMaps = {
    "Markers": cantons,
    "Locations": locations
}
L.control.layers(baseMaps, overlayMaps).addTo(map);

// Listener START
var info = L.control();

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
// Listener END

// Add .geojson to the Map
geojson = L.geoJson(swiss_data).addTo(map);

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
        weight: 1,
        opacity: 1,
        color: 'black',
        fillOpacity: 1
    };
}
// Color Map END

// Add a Legend
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

// Active Listeners
function onEachFeature(feature, layer) {
    layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight,
    });

    // layer.on({ click: showName})
    layer.on({mouseout: removeLine})
    layer.on({click: drawLine})
}

geojson = L.geoJson(swiss_data, {style: style, onEachFeature: onEachFeature}).addTo(map);
