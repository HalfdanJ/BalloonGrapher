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

var startTime = moment('13:10', 'HH:mm');
var endTime = startTime.clone().add(3,'hours');

var chart = {
  heightData: null,
  simulationData: null,

  xScale: null,
  yScale: null,
  svgLine: null,
  colorScale: null,

  lineWidth: 600,
  lineHeight: 150,

  livePath: null,
  valueLine:null,


  init: function() {
    var data = {};


    this.simulationData = _.values(_.groupBy(this.simulationData, 'simulation'));

    console.log(this.heightData);

    this.initChart();
  },

  initChart: function() {
    var that = this;

    var margin = {top: 30, right: 30, bottom: 100, left: 150},
      width = $(window).width() - margin.left - margin.right,
      height = $(window).height() - margin.top - margin.bottom;

    this.x = d3.time.scale()
      .domain([
        startTime.toDate(),
        endTime.toDate()
      ])
      .range([0, width]);

    this.y = d3.scale.linear()
      .domain([
        0,40000,
      ])
      .range([height, 0]);

    // Define the axes
    var xAxis = d3.svg.axis().scale(this.x)
      .orient("bottom")
      .ticks(3)
      .innerTickSize(-height)
      .tickFormat(function(d){ return d3.time.format("%H:%M")(d)} );

    var yAxis = d3.svg.axis().scale(this.y)
      .orient("left")
      .ticks(5)
      .innerTickSize(-width)
      .tickFormat(function(d){ return DK.numberFormat(',m')(d)+' m'})


    var area = d3.svg.area()
      .x(function(d) { return x(d.time); })
      .y0(height)
      .y1(function(d) { return y(d.altitude); });

    // Define the line
    this.valueline = d3.svg.line()
      .interpolate("basis")
      .x(function(d) { return that.x(d.time); })
      .y(function(d) { return that.y(d.altitude); });


    var svg = d3.select("body")
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform","translate(" + margin.left + "," + margin.top + ")")




    var simulation = svg
      .append("g")
      .classed('simulation', true)
      .selectAll('g.simulation')
      .data(this.simulationData)
      .enter()
      .append('g')


    this.livePath = svg
      .append("g")
      .classed('live', true)
      .append('path')

    this.liveHeight = svg
      .append('path')
      .classed('line liveheight',true)

    this.liveHeightText = svg
      .append('text')


    /* .selectAll('g.live')
     .attr("transform","translate(" + margin.left + "," + margin.top + ")")
     .data([this.heightData])
     .enter()
     .append('g')*/



    /*simulation.append('path')
     .attr('class', 'area')
     .attr('d', area)*/

    simulation.append('path')
      .attr("class", "line")
      //.style("stroke-dasharray", ("5, 10"))
      .attr("d", this.valueline);


    // Add the X Axis
    svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis);

    // Add the Y Axis
    svg.append("g")
      .attr("class", "y axis")
      .call(yAxis);
  },

  updateHeight:function(data){
    this.heightData = data;

    this.livePath
      .data([this.heightData])
      .attr("class", "line")
      .attr("d", this.valueline);

    var last = _.last(this.heightData);
    var altitude = last.altitude;
    this.liveHeight
      .transition()
      .attr('d', this.valueline([{
        time:startTime.toDate(), altitude:altitude
      }, {
        time:endTime.toDate(), altitude:altitude
      }, ]))

    this.liveHeightText
      .text(DK.numberFormat(',')(Math.round(altitude))+" m")
      .attr('x', 10)
      .attr('y', this.y(altitude)-5);



  }
}


d3.csv('data/ASTRA Simulation Results.csv')
  .row(function(d){

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

setInterval(function(){
  d3.json('http://localhost:5000/aprs', function(heightData) {
    heightData = _.map(heightData, function(d){
      d.time = new Date(d.time*1000);
      return d;
    })
    chart.updateHeight(heightData);

  });
}, 1000);