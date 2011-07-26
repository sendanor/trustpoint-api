
var sys = require('sys');

/* */
function do_parse_xml_response(xml_data, callback) {
	var undefined,
	    sys = require('sys'),
		fs = require('fs'),
		xml2js = require('xml2js');
	    parser = new xml2js.Parser();
	
	parser.addListener('end', function(result) {
		console.log(sys.inspect(result));
		callback(result.commonerror, result.row instanceof Array ? result.row : [result.row] );
	});
	
	parser.parseString(xml_data);
}

/* */
(function() {
	
	var xml_data = '<result>\n'+
		'  <row>\n'+
		'    <billnum>1224</billnum>\n'+
		'    <amount>1250.5</amount>\n'+
		'    <ownref></ownref>\n'+
		'    <receiver>Teemu Testi</receiver>\n'+
		'    <accepted>0</accepted>\n'+
		'    <error>Cannot write row</error>\n'+
		'  </row>\n'+
		'<commonerror>No rows added. Transferkey deleted.</commonerror>\n'+
		'</result>\n';
	
	do_parse_xml_response(xml_data, function(commonerror, rows) {
		if(commonerror) console.log("Error: " + commonerror);
		if(rows) console.log(sys.inspect(rows));
	});

})();
