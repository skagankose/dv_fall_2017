// Slider START
var num_years = 28;
var years_data = d3.range(0, num_years).map(function (d) { return new Date(1990 + d, 10, 3); });
var slider = d3.sliderHorizontal()
  .min(d3.min(years_data))
  .max(d3.max(years_data))
  .step(1000 * 60 * 60 * 24 * 365)
  .width(1050)
  .tickFormat(d3.timeFormat('%Y'))
  .tickValues(years_data)
  .on('onchange', val => {

    d3.select("#value").text(d3.timeFormat('%Y')(val));
    YEAR  = d3.timeFormat('%Y')(val);

    removeOptions(select)
    clear_description()
    removeSuperEdge(E)
    removeMarkers(E)
    E = null;
    // map.removeLayer(geojson);
    // geojson.resetStyle();
    geojson.setStyle(style);
    // geojson = L.geoJson(swiss_data, {style: style, onEachFeature: onEachFeature}).addTo(map);

  });

var g = d3.select("div#slider").append("svg")
  .attr("width", 1100)
  .attr("height", 100)
  .append("g")
  .attr("transform", "translate(30,30)");

g.call(slider);

d3.select("#value").text(d3.timeFormat('%Y')(slider.value()));
// Slider END

// Ignore this
function popup_function() {
    var popup = document.getElementById("myPopup");
    popup.classList.toggle("show");
}
