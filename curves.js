var margin = {top: 0,
	          right: 0,
			  bottom: 0,
			  left: 0},
	width = window.innerWidth - margin.left - margin.right,
	height = window.innerHeight - margin.top - margin.bottom,
	screenCenterX = window.innerWidth / 2,
	screenCenterY = window.innerHeight / 2;

var x = d3.scale.linear()
	.domain([0, width])
	.range([0, width]);

var y = d3.scale.linear()
	.domain([0, height])
	.range([0, height]);

var line = d3.svg.line()
	.x(function(d, i) { return x(d.re); })
	.y(function(d, i) { return y(d.im); });

var fourierLine = d3.svg.line()
	.x(function(d, i) { return x(d.re) + screenCenterX; })
	.y(function(d, i) { return y(d.im) + screenCenterY; });

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

var time = 0.0,
	timeStep = 0.001,
	alreadyAnimating = false;

var savedCoefficients = [];

var dots = [],
	circles = [];

function mouseClick() {
	var clickCoords = d3.mouse(this),
		complexClickCoords = math.complex(clickCoords[0], clickCoords[1]);

	complexInputPoints.push(math.complex(complexClickCoords.re - screenCenterX, complexClickCoords.im - screenCenterY));
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
			   .attr("d", fourierLine);

	savedCoefficients = coefficients;
	createAssemblage(coefficients);

	if (!alreadyAnimating) {
		setTimeout(animate, 500);
		alreadyAnimating = true;
	}
}

function createAssemblage(coefficients) {
	var positions = computeAssemblagePositions(coefficients, 0),
		prevPosition = math.complex(0.0, 0.0),
		idx = -Math.floor(complexInputPoints.length/2) + 1;

	while (dots.length > 0) {
		var dot = dots.pop();
		dot.remove();
	}

	while (circles.length > 0) {
		var circle = circles.pop();
		circle.remove();
	}

	positions.forEach(function (p) {
		var dot = svg.append("circle")
			.attr("class", "dot")
			.attr("r", 1)
			.attr("transform", "translate(" + [p.re + screenCenterX, p.im + screenCenterY] + ")");

	    dots.push(dot);

		var coefficient = coefficients[idx],
		    magnitude = Math.sqrt(coefficient.re * coefficient.re + coefficient.im * coefficient.im);

		var circle = svg.append("circle")
			.attr("class", "circle")
			.attr("r", magnitude)
			.attr("transform", "translate(" + [prevPosition.re + screenCenterX, prevPosition.im + screenCenterY] + ")");

	    circles.push(circle);

		prevPosition = p;
		++idx;
	});
}

function animate() {
	var positions = computeAssemblagePositions(savedCoefficients, time),
		idx = 0;

	positions.forEach(function (p) {
		var dot = dots[idx];
		dot.attr("transform", "translate(" + [p.re + screenCenterX, p.im + screenCenterY] + ")");

		if (idx < positions.length - 1) {
			var circle = circles[idx + 1];
			circle.attr("transform", "translate(" + [p.re + screenCenterX, p.im + screenCenterY] + ")");
		}

		++idx;
	});

	time += timeStep;
	setTimeout(animate, 5);
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

function computeAssemblagePositions(coefficients, t) {
	var positions = [],
		sum = math.complex(0.0, 0.0),
		idx = 0;

	for (var n = -Math.floor(complexInputPoints.length/2) + 1; n <= Math.floor(complexInputPoints.length/2) - 1; ++n) {
		var exponential = math.exp(math.chain(2.0)
				                       .multiply(Math.PI)
									   .multiply(math.complex(0.0, 1.0))
									   .multiply(n)
									   .multiply(t)
									   .done());

		sum = math.add(sum, math.multiply(coefficients[n], exponential));
		positions[idx] = sum;
		idx += 1;
	}

	return positions;
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

