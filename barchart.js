var data;
//var terms = ['Math', 'biology', 'adl'];
var terms = ['Early Elementary', 'Kindergarten', 'Grade 1', 'Grade 2', 'Upper Elementary', 'Grade 3', 'Grade 4', 'Grade 5'];
var resultCount = 0;
var NODE_URL = "https://node01.public.learningregistry.net";
var ajaxPool = []; 

google.load("visualization", "1", {
	packages : ["corechart"]
});

$.ajaxSetup({
	dataType : 'jsonp',
	jsonp : 'callback'
});

google.setOnLoadCallback(startLoadingData);


function startLoadingData() {
	data = new google.visualization.DataTable();
	data.addColumn('string', 'Term');
	data.addColumn('number', 'Result Count');

	jQuery.each(terms, function(index, value) {
		callSlice(value);
	});
}


function callSlice(term) {
	var searchTerm = term;
	var sliceData = buildSliceObject({
		"any_tags" : searchTerm,
		"ids_only" : true
	});
	sliceData.success = function(ajaxData) {
		resultCount++;
		var termCount = ajaxData.resultCount;
		data.addRow([term, termCount]);
		if(resultCount == terms.length) drawChart();
	};
	$.ajax(sliceData);
}

function buildSliceObject(dataArg) {
	var sliceObj = {
		url : NODE_URL + "/slice",
		data : dataArg
	};
	return sliceObj;
}	


function drawChart() {
	
	var options = {
		width : 500,
		height : 500,
		title : 'Learning Registry Content Profile',
		vAxis : {
			title : 'Term',
			titleTextStyle : {
				color : 'red'
			}
		}
	};

	var chart = new google.visualization.BarChart(document.getElementById('chart_div'));
	chart.draw(data, options);
}