// Copyright 2013 Peter Cook @prcweb prcweb.co.uk
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

    this.simulationData = _.groupBy(this.simulationData, 'simulation');

    console.log(this.simulationData);

    this.initChart();
  },

  initChart: function() {
    var that = this;

    var margin = {top: 30, right: 30, bottom: 100, left: 50},
      width = $(window).width() - margin.left - margin.right,
      height = $(window).height() - margin.top - margin.bottom;

    var x = d3.scale.linear()
      .domain(d3.extent(this.simulationData['1'], function(d) { return d.time; }))
      .range([0, width]);

    var y = d3.scale.linear()
      .domain(d3.extent(this.simulationData['1'], function(d) { return d.altitude; }))
      .range([height, 0]);

    // Define the axes
    var xAxis = d3.svg.axis().scale(x)
      .orient("bottom").ticks(5);

    var yAxis = d3.svg.axis().scale(y)
      .orient("left").ticks(5);


    // Define the line
    var valueline = d3.svg.line()
      .x(function(d) { return x(d.time); })
      .y(function(d) { return y(d.altitude); });


    var svg = d3.select("body")
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform","translate(" + margin.left + "," + margin.top + ")");
    
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
    svg.append("path")
      .attr("class", "line")
      .attr("d", valueline(this.simulationData['1']));

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
    .row(function(d){ /*console.log(d);*/ return {
      simulation: parseInt(d['Simulation #']),
      time: parseInt(d['Time from launch [s]']),
      lat: parseFloat(d['Latitude']),
      lon: parseFloat(d['Longitude']),
      altitude: parseFloat(d['Altitude [m]'])
    }})
    .get(function(error, rows){

      chart.simulationData = rows;
      chart.init();
    })

});