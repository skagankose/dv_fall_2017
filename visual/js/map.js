// Assign Dummy Density and Lines
const MAX_NEWS_NUMBER = 30;
var YEAR = '1990';
var E;
var ID='all';
// import * as excerpts from '../data/excerpts_filtered.js';
// console.log(excerpts['28'])
// Assign Density WRT. Connection Count
for (var i = 0; i < swiss_data.features.length; i++) {
    var canton_name = swiss_data.features[i].properties.name;

    // IMPROVE > NOT JUST ONE YEAR
    swiss_data.features[i].properties.density = cantonRawConnections[canton_name][YEAR].length;
}
//function to change densities by year
function get_density(canton,year){
  return cantonRawConnections[canton][year].length
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
        {icon: customIcon}).bindTooltip(swiss_data.features[i].properties.name, {offset: L.point({x: 0, y: -25})}));

}
var cantonsLayer = L.layerGroup(cantons_list)
// Add Markers Layer END

// Create the Main Map Object
const map = L.map('map', {
    closePopupOnClick: false,
    center: [46.8, 8.8],
    zoom: 8,
    layers: [light],
    opacity: 1,
    zoomControl:false,
});

// Disable Zooming
map.dragging.disable()
map.scrollWheelZoom.disable()
map.touchZoom.disable();
map.doubleClickZoom.disable();
map.boxZoom.disable();
map.keyboard.disable();

// Layer Control
const baseMaps = {
    "Simple": light,
    "Default": streets,
};

const overlayMaps = {
    "Markers": cantonsLayer,
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
        '<b>' + properties.name + '</b><br />' + get_density(properties.name,YEAR) + ' Connections'
        : '<h4>Swiss TV Mirror Map</h4>' + '<span style="font-size:15px;color:gray;">Hover Over a Canton</span>');
};

info.addTo(map);

function highlightFeature(e) {
    var layer = e.target;

    if (get_density(e.target.feature.properties.name,YEAR) > 0) {

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
}

function resetHighlight(e) {
    geojson.resetStyle(e.target);
    info.update();
}

// Draw SuperEdge on Click -START
var polygonLayer;
var concaveLayer;


// NEWS DOTS START
/*
var newsLayer = new L.FeatureGroup();
function drawNewsDots () {

  newsLayer = new L.FeatureGroup();

  let already_drawn = [];
  for (loc of yearlyConnections[YEAR]) {
      // check if canton name already drawn
      if (!already_drawn.includes(loc)) {
        already_drawn.push(loc);

        var blackDot = L.icon({
            iconUrl: 'data/dot.png',
            iconSize:     [3, 3],
        });

        var marker  = L.marker(loc2coord[loc], {icon: blackDot});

       newsLayer.addLayer(marker);
       }
  }
  map.addLayer(newsLayer);
}


function removeNewsLayer() {map.removeLayer(newsLayer);}
*/
// NEWS DOTS END

function removeSuperEdge(e) {
    // Manually Delete Layers
    // try { map.removeLayer(polygonLayer); } catch (err) {};
    // try { map.removeLayer(concaveLayer); } catch (err) {};

    // Delete All Layers except Initials
    map.eachLayer(function (layer) {
      if (layer._leaflet_id > 130) {map.removeLayer(layer);};
    });
}

// Draw SuperEdges Given List of Connections
// Display Name of Corner Points
// Draw a Concave Hull
function drawConcaveHull(e, canton_list) {

  var cornerPoints = [];
  for (set_of_cantons of canton_list) {
    for (canton of set_of_cantons['news']) {
        // let [lat, lng] = cantonCoordinates[canton];
        let [lat, lng] = loc2coord[canton];
        let point = L.latLng({lat: lat, lng: lng});
        cornerPoints.push(point);
    }
  }

  var latLngs = new ConcaveHull(cornerPoints).getLatLngs();
  concaveLayer = new L.Polygon(latLngs, {
      color: 'black',
      weight: 1,
      opacity: 1,
      fillColor: "GRAY",
      fillOpacity: 0.3,
      smoothFactor: 1,
  })

  map.addLayer(concaveLayer);
}

// Draw a Polygon
function drawPolygon(e, canton_list) {

  var drawnItems = new L.FeatureGroup();
  cornerPoints = []

  for (set_of_cantons of canton_list) {

    let points = [];
    for (canton of set_of_cantons['news']) {
        // let [lat, lng] = cantonCoordinates[canton];
        let [lat, lng] = loc2coord[canton];
        let point = L.latLng({lat: lat, lng: lng});
        points.push(point);
      };

      cornerPoints.push(new L.Polygon(points, {
          color: 'black',
          weight: 1,
          opacity: 1,
          fillColor: 'gray',
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
// draw concave hull for news
function drawConcaveHull_news(e, canton_list) {

  var cornerPoints = [];
  for (set_of_cantons of canton_list) {
    for (canton of set_of_cantons['news']) {
        // let [lat, lng] = cantonCoordinates[canton];
        let [lat, lng] = loc2coord[canton];
        let point = L.latLng({lat: lat, lng: lng});
        cornerPoints.push(point);
    }
  }

  var latLngs = new ConcaveHull(cornerPoints).getLatLngs();
  concaveLayer = new L.Polygon(latLngs, {
      color: 'black',
      weight: 1,
      opacity: 1,
      fillColor: "black",
      fillOpacity: 0.3,
      smoothFactor: 1,
  })

  map.addLayer(concaveLayer);
}
// draw polygon for news
function drawPolygon_news(e, canton_list) {

  var drawnItems = new L.FeatureGroup();
  cornerPoints = []

  for (set_of_cantons of canton_list) {

    let points = [];
    for (canton of set_of_cantons['news']) {
        // let [lat, lng] = cantonCoordinates[canton];
        let [lat, lng] = loc2coord[canton];
        let point = L.latLng({lat: lat, lng: lng});
        points.push(point);
      };

      cornerPoints.push(new L.Polygon(points, {
          color: 'black',
          weight: 1,
          opacity: 1,
          fillColor: 'black',
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

function onClick(e) {
    connection_id = this.options["id"];
    var input = document.getElementById('description');
    if (excerpts[connection_id]["excerpt"] == '') {input.innerHTML = 'No Excerpt Avaliable!';}
    else {input.innerHTML = excerpts[connection_id]["excerpt"];}
    drawSuperEdge(E,connection_id);
    // window.location.href = "#collapseOneV2";
    document.getElementById('selectNumber').value = connection_id+","+excerpts[connection_id]["excerpt"]

    // if ($("#news_title").attr("aria-expanded")=="true"){$("#slider_title_news").click();}
}


var markerLayer = new L.FeatureGroup();

function displayNames (e, canton_list, is_raw=false) {

  markerLayer = new L.FeatureGroup();

  var redDot = L.icon({
      iconUrl: 'data/dot.png',
      iconSize: [11, 11], // size of the icon
  });

  let already_drawn = [];
  for (set_of_cantons of canton_list) {
    connection_id = set_of_cantons["id"];
    for (canton of set_of_cantons['news']) {
        // check if cnaton name already drawn
        if (!already_drawn.includes(canton)) {
          already_drawn.push(canton);

          if (is_raw) {
            var marker  = L.marker(loc2coord[canton], {icon: redDot,id: connection_id})
                           .bindTooltip(canton)
                           .on('click', onClick);;
          } else {
            var marker  = L.marker(cantonCoordinates[canton], {icon: redDot,id: connection_id})
                           .bindTooltip(canton)
                           .on('click', onClick);;
          }
        markerLayer.addLayer(marker);
      }
    }
  }

  map.addLayer(markerLayer);

}

function removeMarkers() {
  map.removeLayer(markerLayer);
}

function toInt(n){ return Math.round(Number(n)); };

function drawSuperEdge (e,id) {
  // Get Connections of the Target "e"
  // Get Connections from an External File
  canton_name = e.target.feature.properties.name;

  // news related to the choosen new
  for (news of cantonRawConnections[canton_name][YEAR]) {
    if (news['id']==id){
      connection_list_news = [news]
      break
    }
  }

  // news related to the current canton in current year
  var connection_list = cantonRawConnections[canton_name][YEAR];
  var raw_connection_list = cantonRawConnections[canton_name][YEAR];

  number_of_connections = cantonRawConnections[canton_name][YEAR].length;
  if (number_of_connections > 0) {

    // clear non-used layers
    removeSuperEdge(E)
    removeMarkers(E)

    // number of cantons related to the current canton in current year
    let canton_count = 0;
    for (i of raw_connection_list) {canton_count += i["news"].length};

    if (id=='all' || id=='All'){

      // draw all the connections related to current canton in current year
      if (canton_count <= 3) { drawPolygon(e, raw_connection_list);
      } else { drawConcaveHull(e, raw_connection_list); }
      // displayNames(e, connection_list, false);
      // drawNewsDots()
      displayNames(e, raw_connection_list, true);

    } else {

      // re-draw all the connections related to current canton in current year
      if (canton_count <= 3) { drawPolygon(e, raw_connection_list);
      } else { drawConcaveHull(e, raw_connection_list); }
      // drawNewsDots()
      displayNames(e, raw_connection_list, true);

      // draw all the connections related to current new
      if (connection_list_news[0]["news"].length <= 3) {
        drawPolygon_news(E, connection_list_news);
      } else { drawConcaveHull_news(E, connection_list_news);}
      // drawNewsDots()
      displayNames(E, connection_list_news, true);
    }
  }

}
// Draw SuperEdge on Click -END
// Listener END
// filter excerpts for canton
function filter_excerpts (e) {
  canton_name = e.target.feature.properties.name;
  var total_news = cantonRawConnections[canton_name][YEAR]
  var options = []
  for (news of total_news){
    options.push([news['id'],excerpts[news['id']]['excerpt']])
  }
  // console.log(options)
  return options
}


// show a drop down menu
function show_menu (e) {
  E = Object.assign({}, e);
  var select = document.getElementById("selectNumber");
  removeOptions(select);
  var options = filter_excerpts(e);
  for(var i = 0; i < options.length; i++) {
      if (options[i][1] == '') { var opt = '-';}
      else { var opt = options[i][1].slice(0,40)+'...';}
      var el = document.createElement("option");
      el.textContent = opt;
      el.value = options[i];
      select.appendChild(el);
}
}
//remove options from list
function removeOptions(selectbox)
{
    var i;
    for(i = selectbox.options.length - 1 ; i > 0 ; i--)
    {
        selectbox.remove(i);
    }
}
//clear description
function clear_description(){
  var input = document.getElementById('description');
  input.innerHTML = 'Excerpt of the selected new will appear here.';
}
// Color Map START
// PROCESS BOOK > INTERVAL & COLOR CHOICE
function getColor(d) {
    return d > 40 ? '#084594':
           d > 30 ? '#2171b5':
           d > 20 ? '#4292c6':
           d > 10 ? '#6baed6':
           d > 5  ? '#9ecae1':
           d > 0   ? '#c6dbef':
                     '#e7e7e7';
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
//show the description of the news
var select = document.getElementById('selectNumber');
var input = document.getElementById('description');
select.onchange = function() {
    if (select.value == "All") {
      input.innerHTML = 'Excerpt of the selected new will appear here.';
    } else {
      if (select.value.split(',').slice(1) == '') { input.innerHTML = "No Excerpt Avaliable!"}
      else { input.innerHTML = select.value.split(',').slice(1);}
      }
    // console.log(select.value.split(',').slice(1))
    // state = E.target.feature.properties.name;
    // for (news of cantonRawConnections[state][YEAR]) {
    //   if (news['id']==select.value.split(',').slice(0,1)){
    //     connection_list = [news]
    //     break
    //   }
    // }
    // removeSuperEdge(E)
    // removeMarkers(E)
    // console.log(connection_list)
    // drawConcaveHull(E, connection_list);
    // drawPolygon(E, connection_list);
    // displayNames(E, connection_list);
    drawSuperEdge(E,select.value.split(',').slice(0,1))
    ID = select.value.split(',').slice(0,1);
}
// Add a Legend START
var legend = L.control({position: 'bottomright'});

legend.onAdd = function (map) {

    var div = L.DomUtil.create('div', 'info legend'),
        grades = [0, 5, 10, 20, 30, 40]
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

function expand(){
  if ($("#news_title").attr("aria-expanded")=="false"){$("#slider_title_news").click();}
};

// Active Listeners
function onEachFeature(feature, layer) {
    layer.on({mouseover: highlightFeature});
    layer.on({click: removeSuperEdge});
    layer.on({click: removeMarkers});
    layer.on({click: function (e) {
                ID='all';
            }});
    layer.on({click: function (e) {
                drawSuperEdge(e,'all');
                E=null;
            }});
    layer.on({click: clear_description});
    layer.on({click: show_menu});
    layer.on({click: expand});
    layer.on({mouseout: resetHighlight});
    // layer.on({mouseout: removeSuperEdge});
    // layer.on({mouseout: function (e) {
    //             drawSuperEdge(E,ID);
    //         }});

}

geojson = L.geoJson(swiss_data, {style: style, onEachFeature: onEachFeature}).addTo(map);
