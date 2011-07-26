
var config = require('./config.js');

function get_transferkey() {
	// https://www.trustpoint.fi/API/requirekey.php 

	var https = require('https'),
	    options = {
			host: 'www.trustpoint.fi',
			port: 443,
			path: '/API/requirekey.php',
			method: 'POST'
		},
	    req = https.request(options, function(res) {
			console.log("statusCode: ", res.statusCode);
			console.log("headers: ", res.headers);
			res.on('data', function(d) {
				process.stdout.write(d);
			});
		});
	
	req.end();
	
	req.on('error', function(e) {
		console.error(e);
	});
}
