// Slider START
var num_years = 38;
var years_data = d3.range(0, num_years).map(function (d) { return new Date(1980 + d, 10, 3); });
var slider = d3.sliderHorizontal()
  .min(d3.min(years_data))
  .max(d3.max(years_data))
  .step(1000 * 60 * 60 * 24 * 365)
  .width(1470)
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
    geojson.setStyle(style);

    removeNewsLayer()
    drawNewsDots()

  });



var g = d3.select("div#slider").append("svg")
  .attr("width", 1600)
  .attr("height", 100)
  .append("g")
  .attr("transform", "translate(30,30)");

g.call(slider);
starting_value = new Date(1990, 12, 12);
slider.value(starting_value);
// d3.select("a#setValue2").on("click", () => slider.value(new_value));



// Slide slider according to clicked object
function sliderSlider (e) {

  try {
    year = parseInt(e.originalTarget.attributes.value.value);
    new_value = new Date(year, 10, 10);
    slider.value(new_value);
  } catch (err) {
  year = parseInt(e.srcElement.getAttribute("value"));
  new_value = new Date(year, 10, 10);
  slider.value(new_value);

  };
}

d3.select("#value").text(d3.timeFormat('%Y')(slider.value()));
// Slider END

// Ignore this
function popup_function() {
    var popup = document.getElementById("myPopup");
    popup.classList.toggle("show");
}

(function($) {
    $.fn.clickToggle = function(func1, func2) {
        var funcs = [func1, func2];
        this.data('toggleclicked', 0);
        this.click(function() {
            var data = $(this).data();
            var tc = data.toggleclicked;
            $.proxy(funcs[tc], this)();
            data.toggleclicked = (tc + 1) % 2;
        });
        return this;
    };
}(jQuery));

$('#news_title').clickToggle(function() {
  $("#description").animate({
      height: "415px"
  }, 400);
},
function() {
  $("#description").animate({
      height: "216px"
  }, 200);
});

$('#news_details').clickToggle(function() {
  $("#selectNumber").animate({
      height: "415px"
  }, 400);
},
function() {
  $("#selectNumber").animate({
      height: "200px"
  }, 200);
});
