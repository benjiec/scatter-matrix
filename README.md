
# scatter-matrix.js

scatter-matrix.js (SM) is a JavaScript library for drawing scatterplot matrix.
SM handles matrix data in CSV format: rows represent samples and columns
represent observations. SM interprets the first row as a header. All numeric
columns appear as rows and columns of the scatterplot matrix.

SM is a simple extension/generalization of [Mike Bostock's scatterplot matrix
example](http://mbostock.github.io/d3/talk/20111116/iris-splom.html).
Additional and optional features include

  * Coloring of dots by values of a user selected non-numeric column/variable.
  * Data filtering using a user selected non-numeric column/variable.
  * Selecting which numeric columns to include in the scatterplot matrix.

For demo, see http://benjiec.github.io/scatter-matrix/demo/demo.html

