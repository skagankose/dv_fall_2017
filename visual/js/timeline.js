var years_data = d3.range(0, 17).map(function (d) { return new Date(2000 + d, 10, 3); });
var slider = d3.sliderHorizontal()
  .min(d3.min(years_data))
  .max(d3.max(years_data))
  .step(1000 * 60 * 60 * 24 * 365)
  .width(900)
  .tickFormat(d3.timeFormat('%Y'))
  .tickValues(years_data)
  .on('onchange', val => {
    d3.select("span#value").text(d3.timeFormat('%Y')(val));
  });

var g = d3.select("div#slider").append("svg")
  .attr("width", 1100)
  .attr("height", 100)
  .append("g")
  .attr("transform", "translate(30,30)");

g.call(slider);

d3.select("span#value").text(d3.timeFormat('%Y')(slider.value()));
