var DK = d3.locale( {
  "decimal": ",",
  "thousands": ".",
  "grouping": [3],
  "currency": ["$", ""],
  "dateTime": "%a %b %e %X %Y",
  "date": "%m/%d/%Y",
  "time": "%H:%M:%S",
  "periods": ["AM", "PM"],
  "days": ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  "shortDays": ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  "months": ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  "shortMonths": ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
});

var chart = {
  data: null,
  simulationData: null,

  xScale: null,
  yScale: null,
  svgLine: null,
  colorScale: null,

  lineWidth: 600,
  lineHeight: 150,

  init: function() {
    var data = {};

    var	dataset = _.map(this.data.height, function(data, k) {
      /*      var yearAve = _.reduce(data, function(m, v) {return m + v;}, 0) / 12;
       var yearMax = _.max(data);
       var yearMin = _.min(data);*/
      return {/*year: +k, */data: data/*, mean: yearAve, max: yearMax, min: yearMin*/};
    });
    this.data.height = {data: dataset.reverse() , extent: [-2, 16]};

    this.simulationData = _.values(_.groupBy(this.simulationData, 'simulation'));

    console.log(this.simulationData);

    this.initChart();
  },

  initChart: function() {
    var that = this;

    var margin = {top: 30, right: 30, bottom: 100, left: 150},
      width = $(window).width() - margin.left - margin.right,
      height = $(window).height() - margin.top - margin.bottom;

    var x = d3.time.scale()
      .domain([
        this.simulationData['1'][0].time,
        _.max(_.pluck(this.simulationData['4'],'time'))
        ])
      .range([0, width]);

    var y = d3.scale.linear()
      .domain([
        0,_.max(_.pluck(this.simulationData['1'],'altitude'))+5000,
      ])
      .range([height, 0]);

    // Define the axes
    var xAxis = d3.svg.axis().scale(x)
      .orient("bottom")
      .ticks(3)
      .innerTickSize(-height)
      .tickFormat(d3.time.format("%H:%M"));

    var yAxis = d3.svg.axis().scale(y)
      .orient("left")
      .ticks(5)
      .innerTickSize(-width)
      .tickFormat(DK.numberFormat(',m'))


    var area = d3.svg.area()
      .x(function(d) { return x(d.time); })
      .y0(height)
      .y1(function(d) { return y(d.altitude); });

    // Define the line
    var valueline = d3.svg.line()
      .x(function(d) { return x(d.time); })
      .y(function(d) { return y(d.altitude); });


    var svg = d3.select("body")
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .classed('simulation', true)
      .attr("transform","translate(" + margin.left + "," + margin.top + ")")

    var simulation = svg
      .selectAll('g.simulation')

      .data(this.simulationData)
      .enter()
      .append('g')
    /*
     simulation.append('path')
     .attr('class', 'area')
     .attr('d', area)*/

    simulation.append('path')
      .attr("class", "line")
      .style("stroke-dasharray", ("3, 3"))
      .attr("d", valueline);

    //.attr('transform', this.translate(30, this.chartHeight))
    /* .selectAll('g.year')
     .data(this.data.height.data)
     .enter()
     .append('g')
     .attr('class', function(d, i) {
     console.log(d);
     'year-' + d.year;})*/
    /*.classed('year', true)
     //.sort(this.sortFunction[this.uiState.sortBy])
     .attr('transform', function(d, i) {
     //return that.translate(i * that.perspectiveOffsetX, -i * that.perspectiveOffsetY);
     })
     .style('opacity', function(d, i) {
     //  return that.colorScale(i);
     });*/


    // Add the valueline path.
    /* svg.append("path")
     .attr("class", "line")
     .attr("d", valueline(this.simulationData['1']));
     */
    // Add the X Axis
    svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis);

    // Add the Y Axis
    svg.append("g")
      .attr("class", "y axis")
      .call(yAxis);
  }
}

d3.json('data/height.json', function(heightData) {

  chart.data = heightData;

  d3.csv('data/ASTRA Simulation Results.csv')
    .row(function(d){
      var startTime = moment('18:40', 'HH:mm');
      var t = startTime.clone().add(parseInt(d['Time from launch [s]']),'seconds').toDate();
      return {
        simulation: parseInt(d['Simulation #']),
        time: t,
        lat: parseFloat(d['Latitude']),
        lon: parseFloat(d['Longitude']),
        altitude: parseFloat(d['Altitude [m]'])
      }
    })
    .get(function(error, rows){

      chart.simulationData = rows;
      chart.init();
    })

});