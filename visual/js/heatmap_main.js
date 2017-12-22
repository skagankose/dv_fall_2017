var formatDateIntoYear = d3.timeFormat("%Y");
var formatDate = d3.timeFormat("%d %b %Y");
var parseDate = d3.timeParse("%d/%m/%Y");

var startDate = new Date("1930-01-01"),
    endDate = new Date("2017-12-01");


var margin = {top: 50, right: 100, bottom: 0, left: 50},
    width = 1000 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

var svg = d3.select("#vis")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom);

var runningSpeed = 10;
var numofGroupByDays = 30;


// Presents (Settable Visualization Configurations)

var presentWorld = {
    center: {lat: 34.016241889667036, lng: 3.6914062500000004},
    zoom: 2,
    radius: 5
};

var presentSwitzerland = {
    center: {lat: 46.86019101567027, lng: 8.165588378906252},
    zoom: 8,
    radius: 0.2
};

var presentEurope = {
    center: {lat: 51.56341232867588, lng: 18.588867187500004},
    zoom: 4,
    radius: 2
}

var presentWW2 = {
    center: {lat: 34.016241889667036, lng: 3.6914062500000004},
    zoom: 2,
    radius: 5

}


function setPresent(_present) {
    map.setZoom(_present.zoom);
    map.panTo(_present.center);
    cfg["radius"] = _present.radius;
    drawPlot(dataset);
}

function setEventPresent(_presnet) {
    map.setZoom(_present.zoom);
    map.panTo(_present.center);
    cfg["radius"] = _present.radius;
}

////////// map ////////////

// Default Map Settings

var radius = 2,
    minOpacity = 0,
    maxOpacity = 0.5,
    scaleRadius = true,
    useLocalExtrema = true,
    lat = 46.79,
    lng = 8.20,
    zoom = 8;


// Dynamic heatmap Settings (can be set in-operation)
var cfg = {
    // radius should be small ONLY if scaleRadius is true (or small radius is intended)
    // if scaleRadius is false it will be the constant radius used in pixels
    "radius": radius,
    // "maxOpacity": .5,
    "minOpacity": minOpacity,
    "maxOpacity": maxOpacity,
    // scales the radius based on map zoom
    "scaleRadius": scaleRadius,
    // if set to false the heatmap uses the global maximum for colorization
    // if activated: uses the data maximum within the current map boundaries
    //   (there will always be a red spot with useLocalExtremas true)
    "useLocalExtrema": useLocalExtrema,
    // which field name in your data represents the latitude - default "lat"
    latField: 'x',
    // which field name in your data represents the longitude - default "lng"
    lngField: 'y',
    // which field name in your data represents the data value - default "value"
    valueField: 'valueField',
    gradient: {
        // enter n keys between 0 and 1 here
        // for gradient color customization
        '0.3': '#fee8c8',
        '0.6': '#fdbb84',
        '0.9': '#e34a33',
    }
};

var heatmapLayer = new HeatmapOverlay(cfg);

var tonerUrl = "http://{S}tile.stamen.com/toner/{Z}/{X}/{Y}.png";
var url = tonerUrl.replace(/({[A-Z]})/g, function (s) {
    return s.toLowerCase();
});

var baseLayer = L.tileLayer(
    url, {
        subdomains: ['', 'a.', 'b.', 'c.', 'd.'],
        minZoom: 0,
        maxZoom: 20,
        type: 'png',
        attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, ' +
        'under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. ' +
        'Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, under ' +
        '<a href="http://creativecommons.org/licenses/by-sa/3.0">CC BY SA</a>'
    }
);

var map = new L.Map("map-container", {
    center: new L.LatLng(lat, lng),
    zoom: zoom,
    layers: [baseLayer, heatmapLayer],
    // zoomControl: false,
});


// Disable Zooming
// map.touchZoom.disable();
// map.doubleClickZoom.disable();
// map.scrollWheelZoom.disable();
// map.boxZoom.disable();
// map.keyboard.disable();

////////// speed slider /////

// Speed Slider
var speedSlider = document.getElementById('slider');

speedSlider.style.width = '200px';
speedSlider.style.margin = '0 auto 30px';

noUiSlider.create(speedSlider, {
        start: runningSpeed,
        step: 1,
        connect: "lower",
        orientation: 'horizontal',
        tooltips: true,
        behaviour: "tap-drag",
        range: {
            'min': 1,
            'max': 20
        },
        format: {
            to: function (value) {
                return ~~value;
            },
            from: Number
        }
    }
);


// Reverb Slider
var reverbSlider = document.getElementById('slider-reverb');

reverbSlider.style.width = '200px';
reverbSlider.style.margin = '0 auto 30px';

noUiSlider.create(reverbSlider, {
        start: numofGroupByDays,
        step: 1,
        connect: "lower",
        orientation: 'horizontal',
        tooltips: true,
        behaviour: "tap-drag",
        range: {
            'min': 1,
            'max': 90
        },
        format: {
            to: function (value) {
                return ~~value;
            },
            from: Number
        }
    }
);

////////// slider //////////

var moving = false;
var currentValue = 0;
var targetValue = width;

var playButton = d3.select("#play-button");

var x = d3.scaleTime()
    .domain([startDate, endDate])
    .range([0, targetValue])
    .clamp(true);

var slider = svg.append("g")
    .attr("class", "slider")
    .attr("transform", "translate(" + margin.left + "," + height / 5 + ")");

slider.append("line")
    .attr("class", "track")
    .attr("x1", x.range()[0])
    .attr("x2", x.range()[1])
    .select(function () {
        return this.parentNode.appendChild(this.cloneNode(true));
    })
    .attr("class", "track-inset")
    .select(function () {
        return this.parentNode.appendChild(this.cloneNode(true));
    })
    .attr("class", "track-overlay")
    .call(d3.drag()
        .on("start.interrupt", function () {
            slider.interrupt();
        })
        .on("start drag", function () {
            currentValue = d3.event.x;
            update(x.invert(currentValue));
        })
    );

slider.insert("g", ".track-overlay")
    .attr("class", "ticks")
    .attr("transform", "translate(0," + 18 + ")")
    .selectAll("text")
    // .data(x.ticks(10))
    .data(x.ticks(20))
    .enter()
    .append("text")
    .attr("x", x)
    .attr("y", 10)
    .attr("text-anchor", "middle")
    .text(function (d) {
        return formatDateIntoYear(d);
    });

var handle = slider.insert("circle", ".track-overlay")
    .attr("class", "handle")
    .attr("r", 9);

var label = slider.append("text")
    .attr("class", "label")
    .attr("text-anchor", "middle")
    .text(formatDate(startDate))
    .attr("transform", "translate(0," + (-25) + ")")


////////// plot //////////

var dataset;
var filtered_data;

function loadData(points) {
    var len = points.length;
    var newpoints = [];
    var max = 0;
    while (len--) {
        var val = points[len];
        max = Math.max(max, val);
        var point = {x: val.x, y: val.y, value: val.value};
        newpoints.push(point);
    }
    var data = {max: max, data: newpoints};
    myloadedData = data;
    return data;
}


var available_genres;
var selected_genres;

function calcAvailableOptions() {
    let all_genres_options = [];
    for (r = 0; r < filtered_data.length; r++) {
        for (i = 0; i < filtered_data[r].genre.length; i++) {
            all_genres_options.push(filtered_data[r].genre[i]);
        }
    }
    available_genres = Array.from(new Set(all_genres_options))
}

function intersect(a, b) {
    return [...new Set(a)].filter(x => new Set(b).has(x));
}

function filter_genre(d) {

    // If "All" is selected.
    try {
        for (i = 0; i < selected_genres.length; i++) {
            if (selected_genres[i].text === "All") {
                // console.log("ALL IS SELECTED.")
                return true;
            }
        }
    }
    catch (e) {
        return false;
    }

    {
        // Find the codes for the currently selected items
        selected_genres_codes = [];
        try {
            for (i = 0; i < selected_genres.length; i++) {
                selected_genres_codes.push(genre2code[selected_genres[i].text])
            }
        }
        catch (e) {
            return false;
        }

        // filter data and keep only the samples that have matching codes
        matching_codes = intersect(d.genre_code, selected_genres_codes);

        return (matching_codes.length > 0)
    }
}


///// Data Set Loading

d3.csv("data/heatmap_date_freq_coord_genre.csv", prepare, function (data) {
    dataset = data;
    filtered_data = data;
    calcAvailableOptions();

    // Adding (Filtering) Options

    // Adding Genres
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


    $(document).ready(function () {

        // Genre Filtering Instantiation
        $('#genreList').select2({
            closeOnSelect: false,
            width: '100%',
        });

        // To enbale default 'All' option, on load.
        selected_genres = $('#genreList').select2('data');

        // Event Listener for the list.
        $('#genreList').on('select2:select', function (e) {
            var data = e.params.data;
            selected_genres = $('#genreList').select2('data');
            console.log(selected_genres);
        });

        // To allow for 'All' option.
        $('#genreList').select2('val', null);


        // Speed Slider
        speedSlider.noUiSlider.on('update', function (values, handle) {
            runningSpeed = values[handle];
        });


        // Reverb Slider
        reverbSlider.noUiSlider.on('update', function (values, handle) {
            numofGroupByDays = values[handle];
        });


    });


    // Initial Setup
    setPresent(presentSwitzerland);

    playButton
        .on("click", function () {
            var button = d3.select(this);
            if (button.text() == "Pause") {
                moving = false;
                clearInterval(timer);
                // timer = 0;
                button.text("Play");
                speedSlider.removeAttribute('disabled');
            } else {
                moving = true;
                timer = setInterval(step, 100);
                button.text("Pause");
                speedSlider.setAttribute('disabled', true);
            }
            // console.log("Slider moving: " + moving);
        })
});


function prepare(d) {
    d.id = parseInt(d.id);
    d.date = parseDate(d.date);
    d.value = parseInt(d.value);
    d.x = parseFloat(d.x);
    d.y = parseFloat(d.y);
    d.genre_code = JSON.parse(d.genre_code);
    d.genre = [];
    for (i = 0; i < d.genre_code.length; i++) {
        d.genre.push(code2genre[d.genre_code[i]]);
    }
    return d;
}

function step() {
    update(x.invert(currentValue));
    // currentValue = currentValue + (targetValue / 151);
    currentValue = currentValue + runningSpeed * (targetValue / 30000);
    if (currentValue > targetValue) {
        moving = false;
        currentValue = 0;
        clearInterval(timer);
        // timer = 0;
        playButton.text("Play");
        // console.log("Slider moving: " + moving);
    }
}

var count = 0;

function drawPlot(data) {
    console.log(data.length);
    heatmapLayer.setData(loadData(data));
}

function update(h) {

    // update position and text of label according to slider scale
    handle.attr("cx", x(h));
    label
        .attr("x", x(h))
        .text(formatDate(h));

    // filter data set and redraw plot
    var newData = dataset.filter(function (d) {
        return (d.date >= d3.timeDay.offset(h, -numofGroupByDays)) && (d.date < h);
    });

    // filter data set for range and redraw the plot
    var newData_1 = newData.filter(filter_genre);

    drawPlot(newData_1);
}
