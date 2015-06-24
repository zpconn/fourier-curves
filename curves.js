var drawnPath = new Path(),
    fourierPath = new Path(),
    center = new Point(window.innerWidth / 2, window.innerHeight / 2),
    canvas = document.getElementById('myCanvas'),
    points = [];

drawnPath.strokeColor = 'black';
fourierPath.strokeColor = 'blue';

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

function fourierCoefficients(points, numPairs) {
	var N = points.length;
	var complexPoints = [];
	points.forEach(function(point) {
		complexPoints.push(math.complex(point.x, point.y));
	});

	coefficients = {};
	for (var n = -numPairs; n <= numPairs; ++n) {
		var coefficient = math.complex(1.0 / N, 0);

		var sum = math.complex(0.0, 0.0);
		for (var k = 0; k < N; ++k) {
			var exponential = math.exp(math.chain(-2.0).multiply(Math.PI)
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

function renderFourierPath(coefficients) {
	for (var t = 0.0; t <= 1; t += 0.01) {
		var sum = math.complex(0.0, 0.0);

		for (var n = -Math.floor(points.length/2) + 1; n <= Math.floor(points.length/2) - 1; ++n) {
			var exponential = math.exp(math.chain(2.0)
					                       .multiply(Math.PI)
										   .multiply(math.complex(0.0, 1.0))
										   .multiply(n)
										   .multiply(t)
										   .done());
			sum = math.add(sum, math.multiply(coefficients[n], exponential));
		}

		fourierPath.lineTo(new Point(sum.re, sum.im));
	}
}

function onMouseDown(event) {
	drawnPath.lineTo(event.point);
	points.push(event.point);
}

function onKeyDown(event) {
	if (event.key == 'd') {
		renderFourierPath(fourierCoefficients(points, Math.floor(points.length/2) - 1));
	}
}

