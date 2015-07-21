var margin = {top: 0,
	          right: 0,
			  bottom: 0,
			  left: 0},
	width = window.innerWidth - margin.left - margin.right,
	height = window.innerHeight - margin.top - margin.bottom;

var x = d3.scale.linear()
	.domain([0, width])
	.range([0, width]);

var y = d3.scale.linear()
	.domain([0, height])
	.range([0, height]);

var line = d3.svg.line()
	.x(function(d, i) { return x(d.re); })
	.y(function(d, i) { return y(d.im); });

var svg = d3.select("body").append("svg")
	.attr("width", width + margin.left + margin.right)
	.attr("height", height + margin.top + margin.bottom)
	.on("click", mouseClick)
	.append("g")
	.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var complexInputPoints = [],
	pathData = [],
	fourierPathData = [];

var path = svg.append("path")
	.datum(pathData)
	.attr("class", "line")
	.attr("d", line);

var fourierPath = svg.append("path")
	.datum(fourierPathData)
	.attr("class", "fourierLine")
	.attr("d", line);

function mouseClick() {
	var clickCoords = d3.mouse(this),
		complexClickCoords = math.complex(clickCoords[0], clickCoords[1]);

	complexInputPoints.push(complexClickCoords);
	pathData.push(complexClickCoords);
	path.attr("d", line);

	if (complexInputPoints.length == 1) {
		return;
	}

	var coefficients = fourierCoefficients(complexInputPoints, Math.floor(complexInputPoints.length/2) - 1),
		complexCurvePoints = complexFourierPoints(coefficients);

	while (fourierPathData.length > 0) {
		fourierPathData.pop();
	}

	complexCurvePoints.forEach(function (p) {
		fourierPathData.push(p);
	});

	fourierPathData.push(complexCurvePoints[0]);

	fourierPath.transition()
		       .duration(50)
			   .ease("linear")
			   .attr("d", line);
}

function fourierCoefficients(complexPoints, numPairs) {
	var N = complexPoints.length,
        coefficients = {};

	for (var n = -numPairs; n <= numPairs; ++n) {
		var coefficient = math.complex(1.0 / N, 0);

		var sum = math.complex(0.0, 0.0);
		for (var k = 0; k < N; ++k) {
			var exponential = math.exp(math.chain(-2.0)
					                       .multiply(Math.PI)
					                       .multiply(math.complex(0.0, 1.0))
										   .multiply(n)
										   .multiply(k)
										   .multiply(1.0 / N)
										   .done());
			sum = math.add(sum, math.multiply(complexPoints[k], exponential));
		}

		coefficient = math.multiply(coefficient, sum);
		coefficients[n] = coefficient;
	}

	return coefficients;
}

function complexFourierPoints(coefficients) {
	var points = [];

	var step = 0.01;

	for (var t = step; t <= 1; t += step) {
		var sum = math.complex(0.0, 0.0);

		for (var n = -Math.floor(complexInputPoints.length/2) + 1; n <= Math.floor(complexInputPoints.length/2) - 1; ++n) {
			var exponential = math.exp(math.chain(2.0)
					                       .multiply(Math.PI)
										   .multiply(math.complex(0.0, 1.0))
										   .multiply(n)
										   .multiply(t)
										   .done());
			sum = math.add(sum, math.multiply(coefficients[n], exponential));
		}

		points.push(sum);
	}

	return points;
}

