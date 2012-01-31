//Count by schema format. Count total. Count by creator. Count by submitter. Count by keyword.

var dataTables = {};
var services = ['submitter', 'payload_schema', 'curator', 'keyword'];
var resultCount = 0;
var NODE_URL = "http://127.0.0.1:5984";
var ajaxPool = [];

var charts = {};
var options = {};
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
	$.each(services, function(index, service) {
		options[service] = {
			width : 800,
			height : 500,
			title : 'Learning Registry Usage Stats - ' + service + ', Loading Data...',
			vAxis : {
				title : 'Term',
				titleTextStyle : {
					color : 'red'
				}
			}
		};
		dataTables[service] = new google.visualization.DataTable();
		dataTables[service].addColumn('string', 'Term');
		dataTables[service].addColumn('number', 'Count');
		var div_name = 'chart-'+service;
		$('#charts').append('<div id='+div_name+'></div>');
		charts[service] = new google.visualization.BarChart(document.getElementById(div_name));
		drawChart(service);
		startLoadingData(service);
	});
}


function startLoadingData(service) {
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
		buildData(ajaxData, service);
	};
	callObj.error = function(jqXHR, textStatus, errorThrown) {
		debug("ajax error: " + errorThrown);
		debug("ajax error textStatus: " + textStatus);
		debug("ajax error jqXHR: " + JSON.stringify(jqXHR));
	};
	$.ajax(callObj);
}

function buildData(ajaxData, service) {

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
				if(compare >= 0) {
					insertIndex = index;
					return false;
				}
			} else {
				debug("no next row for index: " + index);
			}
		});
		if(insertIndex >= 0) {
			chartRows.splice(insertIndex, 0, row);
			chartRows = chartRows.slice(0, MAX_ROWS - 1);
		}
	}

	var TEST_MAX = 100000;
	$.each(rows, function(index, row) {
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
	if(rows.length>MAX_ROWS) {
		options[service].title = 'Learning Registry Usage Stats - ' + service + ', Top ' + MAX_ROWS + " of " + rows.length;
	} else {
		options[service].title = 'Learning Registry Usage Stats - ' + service;
	}
	
	chartRows.sort(compareRows);

	$.each(chartRows, function(index, row) {
		dataTables[service].addRow([row.key, row.val]);
	});

	drawChart(service);
}

function drawChart(service) {
	charts[service].draw(dataTables[service], options[service]);
}