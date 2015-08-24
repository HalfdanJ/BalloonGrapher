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

  interpolatedData: {
    altitude : 0,
    altitude_speed:0
  },


  init: function() {
    var data = {};


    this.simulationData = _.values(_.groupBy(this.simulationData, 'simulation'));

    console.log(this.heightData);

    this.initChart();
  },

  initChart: function() {
    var that = this;

    var w = 1920;//$(window).width();
    var h = 1080; //$(window).height()
    var margin = {top: 0, right: 0, bottom: 0, left: 0},
      width =  w - margin.left - margin.right,
      height = h - margin.top - margin.bottom;

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
      .range([height, height*0.75]);

    // Define the axes
    var xAxis = d3.svg.axis().scale(this.x)
      .orient("bottom")
      .ticks(3)
      .innerTickSize(-height)
      .tickFormat(function(d){ return d3.time.format("%H:%M")(d)} );

    var yAxis = d3.svg.axis().scale(this.y)
      .orient("left")
      .tickValues([10000,20000,30000,40000])
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

    svg.selectAll('.y.axis text')
      .attr("dx", 10)
      .style("text-anchor", "start");

    svg.selectAll('.x.axis text')
      .attr("dy", -15)


  },

  updateAprsData:function(data){
    this.heightData = data;
  },

  updateInterpolation:function(){
    if(!this.heightData) return;

    var cnt = 0;
    this.interpolatedData.altitude_speed = _.reduce(_.last(this.heightData,3), function(memo, d){
        if(memo){
          memo.speed += (d.altitude - memo.last.altitude) / moment(d.time).diff(memo.last.time,'seconds') ;
          memo.last = d;
          cnt++;
          return memo;
        } else {
          return { last: d, speed:0}
        }

      },0).speed / cnt;


    var last = _.last(this.heightData);
    var lastTime = moment(last.time);

    this.interpolatedData.altitude = last.altitude + moment().diff(lastTime,'ms') *  this.interpolatedData.altitude_speed / 1000;
  },

  updateFastTexts: function(){
    if(!this.heightData) return;

    var last = _.last(this.heightData);
    var altitude = this.interpolatedData.altitude;

    this.liveHeight
//      .transition()
      .attr('d', this.valueline([{
        time:startTime.toDate(), altitude:altitude
      }, {
        time:endTime.toDate(), altitude:altitude
      }, ]))

    this.liveHeightText
      .text(DK.numberFormat(',')(Math.round(altitude))+" m")
      .attr('x', this.x(last.time)-30)
      .attr('y', this.y(altitude)-8)
      .style("text-anchor", "start");
  },

  updateHeightGraph:function(){
    if(!this.heightData) return;
    this.livePath
      .data([this.heightData])
      .attr("class", "line")
      .attr("d", this.valueline);


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
  d3.json('/aprs', function(heightData) {
    heightData = _.map(heightData, function(d){
      d.time = new Date((d.time + 60*60)*1000);
      return d;
    })

    heightData = _.filter(heightData, function(r){
      return moment(r.time).isBefore(moment())
    })

    chart.updateAprsData(heightData);

    chart.updateHeightGraph();
  });
}, 1000);

setInterval(function(){
  chart.updateInterpolation()
  chart.updateFastTexts()

}, 100);
