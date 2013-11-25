// Heavily influenced by Mike Bostock's Scatter Matrix example
// http://mbostock.github.io/d3/talk/20111116/iris-splom.html
//

ScatterMatrix = function(url) {
  this.__url = url;
  this.__data = undefined;
};

ScatterMatrix.prototype.onData = function(cb) {
  if (this.__data) { cb(); return; }
  var self = this;
  d3.csv(self.__url, function(data) {
    self.__data = data;
    cb();
  });
};

ScatterMatrix.prototype.render = function () {
  var self = this;
  
  this.onData(function() {
    var data = self.__data;

    // Fetch data and get all string variables
    var string_variables = [undefined];
    for (k in data[0]) {
      if (isNaN(+data[0][k])) { string_variables.push(k); }
    }

    var container = d3.select('body').append('div')
                                     .attr('class', 'scatter-matrix-container');
    var control = container.append('div')
                           .attr('class', 'scatter-matrix-control');

    var svg = container.append('div')
                       .attr('class', 'scatter-matrix-svg');

    control.append('p').text('Select a variable to color:')

    control.append('div').attr('class', 'scatter-matrix-color-control')
           .append('ul')
           .selectAll('li')
           .data(string_variables)
           .enter().append('li')
             .append('a')
               .attr('href', '#')
               .text(function(d) { return d ? d : 'None'; })
               .on('click', function(d, i) { self.__draw(d, svg); });

    self.__draw(undefined, svg);
  });
};

ScatterMatrix.prototype.__draw = function (color, container_el) {
  var self = this;
  this.onData(function() {
    var data = self.__data;

    container_el.selectAll('svg').remove();

    // If no data, don't do anything
    if (data.length == 0) { return; }

    // Parse headers from first row of data
    var numeric_variables = [];
    for (k in data[0]) {
      if (!isNaN(+data[0][k])) { numeric_variables.push(k); }
    }

    // Get values of the string variable
    var colors = [];
    if (color) {
      data.forEach(function(d) {
        var s = d[color];
        if (colors.indexOf(s) < 0) { colors.push(s); }
      })
    }

    function color_class(d) {
      var c = d;
      if (color && d[color]) { c = d[color]; }
      return colors.length > 0 ? 'color-'+colors.indexOf(c) : 'color-2';
    }

    // Size parameters
    var size = 140, padding = 10, axis_width = 40, legend_width = 200, margin = 0;

    // Get x and y scales for each numeric variable
    var x = {}, y = {};
    numeric_variables.forEach(function(trait) {
      // Coerce values to numbers.
      data.forEach(function(d) { d[trait] = +d[trait]; });

      var value = function(d) { return d[trait]; },
          domain = [d3.min(data, value), d3.max(data, value)],
          range = [padding / 2, size - padding / 2];
      x[trait] = d3.scale.linear().domain(domain).range(range);
      y[trait] = d3.scale.linear().domain(domain).range(range.reverse());
    });

    // Axes
    var axis = d3.svg.axis()
        .ticks(5)
        .tickSize(size * numeric_variables.length);

    // Brush - for highlighting regions of data
    var brush = d3.svg.brush()
        .on("brushstart", brushstart)
        .on("brush", brush)
        .on("brushend", brushend);

    // Root panel
    var svg = container_el.append("svg:svg")
        .attr("width", axis_width + legend_width + margin * 2 + size * numeric_variables.length)
        .attr("height", axis_width + margin * 2 + size * numeric_variables.length)
      .append("svg:g")
        .attr("transform", "translate(" + margin + "," + margin + ")");

    // Legend.
    var legend = svg.selectAll("g.legend")
        .data(colors)
      .enter().append("svg:g")
        .attr("class", "legend")
        .attr("transform", function(d, i) {
          return "translate(" + (margin + size * numeric_variables.length + axis_width) + "," + (i*20+10) + ")";
        });

    legend.append("svg:circle")
        .attr("class", function(d, i) { return color_class(d); })
        .attr("r", 3);

    legend.append("svg:text")
        .attr("x", 12)
        .attr("dy", ".31em")
        .text(function(d) { return d; });

    // Draw X-axis
    svg.selectAll("g.x.axis")
        .data(numeric_variables)
      .enter().append("svg:g")
        .attr("class", "x axis")
        .attr("transform", function(d, i) { return "translate(" + i * size + ",0)"; })
        .each(function(d) { d3.select(this).call(axis.scale(x[d]).orient("bottom")); });

    // Draw Y-axis
    svg.selectAll("g.y.axis")
        .data(numeric_variables)
      .enter().append("svg:g")
        .attr("class", "y axis")
        .attr("transform", function(d, i) { return "translate(0," + i * size + ")"; })
        .each(function(d) { d3.select(this).call(axis.scale(y[d]).orient("right")); });

    // Draw scatter plot
    var cell = svg.selectAll("g.cell")
        .data(cross(numeric_variables, numeric_variables))
      .enter().append("svg:g")
        .attr("class", "cell")
        .attr("transform", function(d) { return "translate(" + d.i * size + "," + d.j * size + ")"; })
        .each(plot);

    // Add titles for diagonal cells
    cell.filter(function(d) { return d.i == d.j; }).append("svg:text")
        .attr("x", padding)
        .attr("y", padding)
        .attr("dy", ".71em")
        .text(function(d) { return d.x; });

    function plot(p) {
      var cell = d3.select(this);

      // Plot frame.
      cell.append("svg:rect")
          .attr("class", "frame")
          .attr("x", padding / 2)
          .attr("y", padding / 2)
          .attr("width", size - padding)
          .attr("height", size - padding);

      // Plot dots.
      cell.selectAll("circle")
          .data(data)
        .enter().append("svg:circle")
          .attr("class", function(d) { return color_class(d); })
          .attr("cx", function(d) { return x[p.x](d[p.x]); })
          .attr("cy", function(d) { return y[p.y](d[p.y]); })
          .attr("r", 3);

      // Plot brush.
      cell.call(brush.x(x[p.x]).y(y[p.y]));
    }

    // Clear the previously-active brush, if any.
    function brushstart(p) {
      if (brush.data !== p) {
        cell.call(brush.clear());
        brush.x(x[p.x]).y(y[p.y]).data = p;
      }
    }

    // Highlight the selected circles.
    function brush(p) {
      var e = brush.extent();
      svg.selectAll(".cell circle").attr("class", function(d) {
        return e[0][0] <= d[p.x] && d[p.x] <= e[1][0]
            && e[0][1] <= d[p.y] && d[p.y] <= e[1][1]
            ? color_class(d) : null;
      });
    }

    // If the brush is empty, select all circles.
    function brushend() {
      if (brush.empty()) svg.selectAll(".cell circle").attr("class", function(d) {
        return color_class(d);
      });
    }

    function cross(a, b) {
      var c = [], n = a.length, m = b.length, i, j;
      for (i = -1; ++i < numeric_variables.length;) for (j = -1; ++j < m;) c.push({x: a[i], i: i, y: b[j], j: j});
      return c;
    }
  }); 

};

