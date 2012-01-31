//Count by schema format. Count total. Count by creator. Count by submitter. Count by keyword.

var dataTable;
var service = "submitter";
var resultCount = 0;
var NODE_URL = "http://127.0.0.1:5984";
var ajaxPool = [];

var chart;
var options;
var MAX_ROWS = 15;

$.ajaxSetup({
	dataType : 'jsonp',
	jsonp : 'callback'
});

google.load("visualization", "1", {
	packages : ["corechart"]
});

google.setOnLoadCallback(init);

function debug2(msg) {
	$('#debug2').html(msg + "<br>");
}

function debug(msg) {
	$('#debug').append(msg + "<br>");
}

function init() {
	options = {
		width : 800,
		height : 500,
		title : 'Learning Registry Usage Stats - ' + service,
		vAxis : {
			title : 'Term',
			titleTextStyle : {
				color : 'red'
			}
		}
	};
	dataTable = new google.visualization.DataTable();
	dataTable.addColumn('string', 'Term');
	dataTable.addColumn('number', 'Count');
	chart = new google.visualization.BarChart(document.getElementById('chart_div'));
	drawChart();
	startLoadingData();
}

function startLoadingData() {
	callStats(service);
}

// http://127.0.0.1:5984/resource_data/_design/lrstats-payload_schema/_view/docs?reduce=true&group=true&group_level=2
function callStats(service) {
	var callObj = {
		url : NODE_URL + '/resource_data/_design/lrstats-' + service + '/_view/docs',
		dataType : 'jsonp',
		jsonp : 'callback',
		data : {
			"reduce" : true,
			"group" : true,
			"group_level" : 1,
		}
	};
	callObj.success = function(ajaxData) {
		buildData(ajaxData);
	};
	callObj.error = function(jqXHR, textStatus, errorThrown) {
		debug("ajax error: " + errorThrown);
		debug("ajax error textStatus: " + textStatus);
		debug("ajax error jqXHR: " + JSON.stringify(jqXHR));
	};
	$.ajax(callObj);
}

function buildData(ajaxData) {

	var rows = ajaxData.rows;
	var chartRows = [];

	//reverse sort by val
	function compareRows(row1, row2) {
		return row1.val - row2.val;
	}

	function insertRow(row) {
		var nextRow = chartRows[MAX_ROWS - 2];
		if(!nextRow) {
			debug("last row does not exist");
			return;
		}
		if(row.val < nextRow.val) {
			return;
		}
		var insertIndex = -1;
		$.each(chartRows, function(index, row) {
			nextRow = chartRows[index];
			if(nextRow) {
				var compare = compareRows(row, nextRow);
				//debug("compare: " + compare);
				if(compare >= 0) {
					insertIndex = index;
					return false;
				}
			} else {
				debug("no next row for index: " + index);
			}
		});
		if(insertIndex >= 0) {
			//debug("insert row: " + JSON.stringify(row) + " at index: " + insertIndex);
			chartRows.splice(insertIndex, 0, row);
			chartRows = chartRows.slice(0, MAX_ROWS - 1);
		}
	}

	var TEST_MAX = 100000;
	$.each(rows, function(index, row) {
		debug2("row: " + index);
		if(row.key && row.value) {
			if(index < MAX_ROWS) {
				chartRows.push({
					key : row.key[0],
					val : row.value
				});
			} else if(index == MAX_ROWS) {
				chartRows.push({
					key : row.key[0],
					val : row.value
				});
				//debug("about to do first sort...");
				chartRows.sort(compareRows);
			} else if(index < TEST_MAX) {
				insertRow({
					key : row.key[0],
					val : row.value
				});
			} else {
				return false;
			}
		}
	});
	options.title = options.title + ", Top " + MAX_ROWS + " of " + rows.length;
	chartRows.sort(compareRows);

	//debug("finished inserting rows, about to add to data: result is: " + JSON.stringify(chartRows));
	$.each(chartRows, function(index, row) {
		//debug("adding data row: " + JSON.stringify(row));
		//debug("adding data row: " + row.key + ", " + row.val);
		dataTable.addRow([row.key, row.val]);
	});
	//debug("finished adding rows, abotu to draw chart. data table is: " + dataTable.toJSON());

	drawChart();
}

function drawChart() {
	chart.draw(dataTable, options);
}