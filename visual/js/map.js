var YEAR = '1990';
var E;
var ID='all';
var parseDate = d3.timeParse("%d/%m/%Y");
const allIncluded = cantonRawConnections;

//////////////////// FILTER - START ////////////////////

// initialize required variable for genre filtering
var available_genres;
var selected_genres;
var dataset;
var filtered_data;
var current_genres = new Array();

// function to clean any priorly selected genre, to be used before selecting new genre
function clearSelected(){
   var elements = document.getElementById("genreList").options;
   for(var i = 0; i < elements.length; i++){
     elements[i].selected = false;
   }
 }

// function to handle selected genres
// filter the data according to selected genres and re-drawn the entire map
function processFilters() {
  // console.log(current_genres);

  // check if there is any genres selected to be filter with
  // if so filter accordingly else take the entire dataset
  if (current_genres.length == 0) {
    cantonRawConnections = allIncluded;
  } else {
    if (cantonFilterConnections[current_genres[0]]) {
      cantonRawConnections = cantonFilterConnections[current_genres[0]];

      let n = 0;
      for (i of Object.keys(cantonRawConnections)) {n += cantonRawConnections[i][YEAR].length};

      if (n == 0) {
        // popup to inform user that no broadcast found for the selected filter in the current year
        // console.log("Can't find any broadcast in the current year for the selected filter!")
        var popup = document.getElementById("year_popup");
        popup.classList.toggle("show");
        setTimeout(function() {
            popup.classList.toggle("show");
        }, 2000);
      }

    } else {
      // popup to inform user that no broadcast found for the selected filter
      // console.log("Can't find any broadcast for the selected filter!")
      var popup = document.getElementById("no_popup");
      popup.classList.toggle("show");
      setTimeout(function() {
          popup.classList.toggle("show");
      }, 2000);

      // incase there is no news according to filter, then, show all the news
      cantonRawConnections = allIncluded;
    }
  }
  // if a canton is clicked re-draw superedges according to filtered data
  removeMarkers()
  removeSuperEdge()
  if (E) {
    drawSuperEdge(E,'all');
    show_menu(E);
  }
  // re-assign colors according to filtered data
  geojson.setStyle(style);
}

// function to return which elements are selected for filtering
function selected_elements(select) {
    var hasSelection = true;
    var i;
    var selected_items = new Array();
    for (i = 0; i < select.options.length; i += 1) {
        if (select.options[i].selected) {
            selected_items.push(select.options[i].text);
            hasSelection = false;
        }
    }
    return [hasSelection,selected_items];
}


// function to load genres and corresponding connections
// then prepare the menu for filtering
d3.csv("data/id_genre_theme_location_date.csv", prepare, function (error, data) {
    dataset = data;
    filtered_data = data;

    // genres
    let all_genres_options = [];
    for (r = 0; r < filtered_data.length; r++) {
        for (i = 0; i < filtered_data[r].genre.length; i++) {
            all_genres_options[all_genres_options.length] = filtered_data[r].genre[i];
        }
    }
    available_genres = Array.from(new Set(all_genres_options));

    // console.log(data);
    if (error) {
        console.log(error);
    }

    // adding genres to List
    d3.select('body')
        .select('#genreList')
        .selectAll('option')
        .append("option")
        .data(available_genres)
        .enter()
        .append('option')
        .attr('value', function (d, i) {
            return i
        })
        .text(function (d) {
            return d
        });

    //  creating genres selection list
    $('#genreList').select2({
        closeOnSelect: false,
        width: '100%',
        placeholder: 'Filter on a genre'
    });

    // event listener for the list
    $('#genreList').on('change', function (e) {

      selections = selected_elements(this);
      if (selections[0]) {
        current_genres = Array();
      } else {
        selected_genres = selections[1];
        current_genres = filter_genre();
      }
      processFilters()
     clearSelected()
    });


});

function prepare(d) {
    d.id = parseInt(d.id);
    d.date = parseDate(d.publicationDate);
    d.genre_code = JSON.parse(d.genre_code);
    d.loc_code = JSON.parse(d.loc_code)
    d.genre = [];
    d.loc = [];

    // processing code to genre
    for (i = 0; i < d.genre_code.length; i++) {
        d.genre.push(code2genre[d.genre_code[i]]);
    }

    // processing code to location
    for (i = 0; i < d.loc_code.length; i++) {
        d.loc.push(code2loc[d.loc_code[i]])
    }

    return d;
}


// function to convert selected genre texts into corresponding codes
function filter_genre(d) {

    // Find the codes for the currently selected items
    selected_genre_codes = [];
    try {
        for (i = 0; i < selected_genres.length; i++) {
            selected_genre_codes[selected_genre_codes.length] = genre2code[selected_genres[i]];
        }
    }
    catch (e) {
        return false;
    }

    return (selected_genre_codes)
}
//////////////////// FILTER - END ////////////////////

// assign density to each canton according to number of connection it has for the current year
for (var i = 0; i < swiss_data.features.length; i++) {
    var canton_name = swiss_data.features[i].properties.name;

    swiss_data.features[i].properties.density = cantonRawConnections[canton_name][YEAR].length;
}
// function to change densities by year
function get_density(canton,year){
  return cantonRawConnections[canton][year].length
}

// function to calculate center of cantons to be able to put marker on them
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

// correct faulty centers
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

var geojson;
var mapboxAccessToken = 'pk.eyJ1IjoiMmJlb3JkaW5hcnkiLCJhIjoiY2phM2twb2wwMTAwZTMzbGZjODR2MGY5ZyJ9.ZKg4ICl_lpwgbEt5fZw5Wg';

// create main layers for the map
var light =
    L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=' + mapboxAccessToken, {
        id: 'mapbox.light',
    })

var streets =
    L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=' + mapboxAccessToken, {
        id: 'mapbox.streets-basic',
    })

// add markers to the map
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


// create the main map object
const map = L.map('map', {
    closePopupOnClick: false,
    center: [46.8, 8.8],
    zoom: 8,
    layers: [light],
    opacity: 1,
    zoomControl:false,
});

// disable zooming since we are only interested on Switzerland
map.dragging.disable()
map.scrollWheelZoom.disable()
map.touchZoom.disable();
map.doubleClickZoom.disable();
map.boxZoom.disable();
map.keyboard.disable();

// add 2 layers for the actual map
// add 1 layer for the markers
const baseMaps = {
    "Simple": light,
    "Default": streets,
};

const overlayMaps = {
    "Markers": cantonsLayer,
};

L.control.layers(baseMaps, overlayMaps).addTo(map);

// create control to display information about the canton (e.g. name, number of connections)
let info = L.control();

info.onAdd = function (map) {
    this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
    this.update();
    return this._div;
};

// method to update density according to choosen year
info.update = function (properties) {
    this._div.innerHTML = (properties ?
        '<b>' + properties.name + '</b><br />' + get_density(properties.name,YEAR) + ' Connections'
        : '<h4>Swiss TV Mirror Map</h4>' + '<span style="font-size:15px;color:gray;">Hover Over a Canton</span>');
};

info.addTo(map);

// function to set what happends when user hover overs a canton
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

// function to set what happends when user hover outs a canton
function resetHighlight(e) {
    geojson.resetStyle(e.target);
    info.update();
}

//////////////////// DRAW SUPEREDGES - START ////////////////////

// create layers to drawn superedges on
var polygonLayer;
var concaveLayer;


// function to remove unused layers
function removeSuperEdge(e) {

    // delete all layers except on-used ones
    map.eachLayer(function (layer) {
      if (layer._leaflet_id > 130) {map.removeLayer(layer);};
    });
}

// set of functions to draw actual superedge
// draw superedges given list of connections
// display names of locations
// function to draw a concave hull
function drawConcaveHull(e, canton_list) {

  var cornerPoints = [];
  for (set_of_cantons of canton_list) {
    for (canton of set_of_cantons['news']) {
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

// function to draw a polygone
function drawPolygon(e, canton_list) {

  var drawnItems = new L.FeatureGroup();
  cornerPoints = []

  for (set_of_cantons of canton_list) {

    let points = [];
    for (canton of set_of_cantons['news']) {
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

// function to draw a concave hull for the selected new
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

// function to draw a polygon for the selected new
function drawPolygon_news(e, canton_list) {

  var drawnItems = new L.FeatureGroup();
  cornerPoints = []

  for (set_of_cantons of canton_list) {

    let points = [];
    for (canton of set_of_cantons['news']) {
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

// function to set what happens when individual dot corresponding to a new is clicked
// select that new from the menu in the left
// display its excerpt
// draw corresponding superedge
function onClick(e) {
    connection_id = this.options["id"];
    var input = document.getElementById('description');
    if (excerpts[connection_id]["excerpt"] == '') {input.innerHTML = 'No Excerpt Avaliable!';}
    else {input.innerHTML = excerpts[connection_id]["excerpt"];}
    drawSuperEdge(E,connection_id);
    document.getElementById('selectNumber').value = connection_id+","+excerpts[connection_id]["excerpt"]
}

// create layer for displaying location names
var markerLayer = new L.FeatureGroup();

// function to displau location names
// it is used both for displaying all the location related to a canton
// and for individual news
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
        // check if canton name already drawn to avoid multiple drawns
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

// function to remove names when they are no longer used
function removeMarkers() {
  map.removeLayer(markerLayer);
}

// actual function to draw superedges
// it draws polygone if number of connected location is less than 4
// and draws concave hull if more than 3
// it draws superedges for both entire cantons and individual news
// it also display names according to choosen canton and news
function drawSuperEdge (e,id) {

  // get connections of the target "e"
  canton_name = e.target.feature.properties.name;

  // news related to the choosen canton
  if (id !='all'|| id=='All'){
    for (news of cantonRawConnections[canton_name][YEAR]) {
      if (news['id']==id){
        connection_list_news = [news]
        break
      }
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
      displayNames(e, raw_connection_list, true);

    } else {

      // re-draw all the connections related to current canton in current year
      if (canton_count <= 3) { drawPolygon(e, raw_connection_list);
      } else { drawConcaveHull(e, raw_connection_list); }
      displayNames(e, raw_connection_list, true);

      // draw all the connections related to current new
      if (connection_list_news[0]["news"].length <= 3) {
        drawPolygon_news(E, connection_list_news);
      } else { drawConcaveHull_news(E, connection_list_news);}
      displayNames(E, connection_list_news, true);
    }
  }

}
//////////////////// DRAW SUPEREDGES - END ////////////////////

// fucntion to get excerpts for choosen canton
function filter_excerpts (e) {
  canton_name = e.target.feature.properties.name;
  var total_news = cantonRawConnections[canton_name][YEAR]
  var options = []
  for (news of total_news){
    options.push([news['id'],excerpts[news['id']]['excerpt']])
  }
  return options
}


// fucntion to show a drop down menu according to choosen canton
function show_menu (e) {
  E = Object.assign({}, e);
  var select = document.getElementById("selectNumber");
  removeOptions(select);
  var options = filter_excerpts(e);
  for(var i = 0; i < options.length; i++) {
      if (id2title[options[i][0]].length > 40){
        var opt = id2title[options[i][0]].slice(0,1)+id2title[options[i][0]].slice(1,40).toLowerCase()+'...';
      }
      else{
        var opt = id2title[options[i][0]].slice(0,1)+id2title[options[i][0]].slice(1).toLowerCase();
      }
      var el = document.createElement("option");
      el.textContent = opt;
      el.value = options[i];
      select.appendChild(el);
}
}

// remove options from list
function removeOptions(selectbox)
{
    var i;
    for(i = selectbox.options.length - 1 ; i > 0 ; i--)
    {
        selectbox.remove(i);
    }
}

// clear description
function clear_description(){
  var input = document.getElementById('description');
  input.innerHTML = 'Excerpt of the selected new will appear here.';
}

// function to determine colors according to number of connections
function getColor(d) {
    return d > 40 ? '#084594':
           d > 30 ? '#2171b5':
           d > 20 ? '#4292c6':
           d > 10 ? '#6baed6':
           d > 5  ? '#9ecae1':
           d > 0   ? '#c6dbef':
                     '#e7e7e7';
}

// function to color the map using getColor() function
function style(feature) {
    return {
        fillColor: getColor(get_density(feature.properties.name,YEAR)),
        weight: 0.5,
        opacity: 0.5,
        color: 'black',
        fillOpacity: 0.7
    };
}

// show the description for the selected new
// draw corresponding superedge
var select = document.getElementById('selectNumber');
var input = document.getElementById('description');
select.onchange = function() {
    if (select.value == "All") {
      input.innerHTML = 'Excerpt of the selected new will appear here.';
    } else {
      if (select.value.split(',').slice(1) == '') { input.innerHTML = "No Excerpt Avaliable!"}
      else { input.innerHTML = select.value.split(',').slice(1);}
      }
    drawSuperEdge(E,select.value.split(',').slice(0,1))
    ID = select.value.split(',').slice(0,1);
}

// add color legend at the bottom of the map
var legend = L.control({position: 'bottomright'});

legend.onAdd = function (map) {

    var div = L.DomUtil.create('div', 'info legend'),
        grades = [0, 5, 10, 20, 30, 40]
        labels = [];

    // loop through density intervals and generate a label with a colored square for each interval
    for (var i = 0; i < grades.length; i++) {
        div.innerHTML +=
            '<i style="background:' + getColor(grades[i] + 1) + '"></i> ' +
            grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+');
    }

    return div;
};

legend.addTo(map);

// function to collapse and expand menu in the left
function expand(){
  if ($("#news_title").attr("aria-expanded")=="false"){$("#slider_title_news").click();}
};

// activate listeners
// they are called whenever a canton is clicked
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


}

// add .geojson data to the map
geojson = L.geoJson(swiss_data, {style: style, onEachFeature: onEachFeature}).addTo(map);
