google.load("visualization", "1", { packages: ["corechart"] });

$(document).ready(function () {
	// Define the options for the various charts. 
	var lineOptions = {
		height: 250,
		width: '100%',
		chartArea: {
			left: 40,
			top: 10,
			height: '70%',
			width: '100%'
		},
		legend: { 
			position: 'in'
		},
		titlePosition: 'in', 
		hAxis: { 
			textPosition: 'out'
		}, 
		vAxis: { 
			textPosition: 'out'
		},
		pointSize: 0,
		lineWidth: 3
	};
	
	var percentChartOptions = jQuery.extend(true, {}, lineOptions);
	percentChartOptions.vAxis.format = '#%';
	

    // Build up a Google data object to render a chart    
    var temperatureData = new google.visualization.DataTable();
	temperatureData.addColumn('string', 'Date');
	temperatureData.addColumn('number', 'Temperature');
	temperatureData.addColumn({type:'string', role:'annotation'});
	temperatureData.addColumn({type:'string', role:'annotationText'});
	temperatureData.addColumn({type:'string', role:'tooltip'}); // tooltip col.
	temperatureData.addRows(readings.length);
	
	var percentData = new google.visualization.DataTable();
	percentData.addColumn('string', 'Date');
	percentData.addColumn('number', 'Temperature');
	percentData.addColumn({type:'string', role:'annotation'});
	percentData.addColumn({type:'string', role:'annotationText'});
	percentData.addColumn({type:'string', role:'tooltip'}); // tooltip col.
	percentData.addColumn('number', 'Humidity');
	percentData.addColumn({type:'string', role:'annotation'});
	percentData.addColumn({type:'string', role:'annotationText'});
	percentData.addColumn({type:'string', role:'tooltip'}); // tooltip col.
	percentData.addRows(readingsPercent.length);

	var foundTempHigh, foundTempLow, foundHumidHigh, foundHumidLow;
	
	for (var ii=0; ii < readings.length; ii++) { 	
		temperatureData.setValue(ii, 0, readings[ii].readDate);
		temperatureData.setValue(ii, 1, readings[ii].tempF);
		
		if (readings[ii].tempC == extremes.maxTemp && !foundTempHigh) { 
			temperatureData.setValue(ii, 2, 'High');
			temperatureData.setValue(ii, 3, readings[ii].tempF + ' F');
			percentData.setValue(ii, 2, 'High');
			percentData.setValue(ii, 3, readings[ii].tempF + ' F');
			foundTempHigh = true;
		} else if (readings[ii].tempC == extremes.minTemp && !foundTempLow) {
			temperatureData.setValue(ii, 2, 'Low');
			temperatureData.setValue(ii, 3, readings[ii].tempF + ' F');
			percentData.setValue(ii, 2, 'Low');
			percentData.setValue(ii, 3, readings[ii].tempF + ' F');
			foundTempLow = true;
		} else {
			temperatureData.setValue(ii, 2, null);
			temperatureData.setValue(ii, 3, null);
			percentData.setValue(ii, 2, null);
			percentData.setValue(ii, 3, null);
		}
		
		if (readings[ii].humidity == extremes.maxHumidity && !foundHumidHigh) {
			percentData.setValue(ii, 6, 'High');
			percentData.setValue(ii, 7, readings[ii].humidity + ' %');
			foundHumidHigh = true;
		} else if (readings[ii].humidity == extremes.minHumidity) {
			percentData.setValue(ii, 6, 'Low');
			percentData.setValue(ii, 7, readings[ii].humidity + ' %');
			foundHumidLow = true;
		} else {
			percentData.setValue(ii, 6, null);
			percentData.setValue(ii, 7, null);
		}

		temperatureData.setValue(ii, 4, readings[ii].readDate + '\n' + readings[ii].tempF + ' F, ' + readings[ii].tempC + ' C');
		
		
		percentData.setValue(ii, 0, readingsPercent[ii].readDate);
		percentData.setValue(ii, 1, readingsPercent[ii].tempC);
		
		var tempToolTip = readingsPercent[ii].readDate + '\n' + readings[ii].tempF + ' F, ' + readings[ii].tempC + ' C ('
		if (readingsPercent[ii].tempC > 0) { tempToolTip += '+'; }
		tempToolTip += (Math.round((readingsPercent[ii].tempC*100)*100)/100) + '%)';
		percentData.setValue(ii, 4, tempToolTip);
		
		percentData.setValue(ii, 5, readingsPercent[ii].humidity);
		
		var humidToolTip = readingsPercent[ii].readDate + '\n' + readings[ii].humidity + '% ('
		if (readingsPercent[ii].humidity > 0) { humidToolTip += '+'; }
		humidToolTip += (Math.round((readingsPercent[ii].humidity*100)*100)/100) + '%)';
		percentData.setValue(ii, 8, humidToolTip);
	}
	
	var temperatureChart = new google.visualization.LineChart(document.getElementById('chart1'));
	temperatureChart.draw(temperatureData, lineOptions);
	
	var percentChart = new google.visualization.LineChart(document.getElementById('chart2'));
	percentChart.draw(percentData, percentChartOptions);
	
				
	$(window).resize(function() {
		temperatureChart.draw(temperatureData, lineOptions);
		percentChart.draw(percentData, percentChartOptions);
	});
});