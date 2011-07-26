
/* Get transfer key */
function get_transferkey(cid, apicode, callback) {
	var undefined,
	    https = require('https'),
		transferkey = '',
	    options = {
			host: 'www.trustpoint.fi',
			port: 443,
			path: '/API/requirekey.php',
			method: 'POST',
			headers: {'Content-Type': 'application/x-www-form-urlencoded'}
			},
	    req = https.request(options, function(res) { // Handles response
			console.log("statusCode: ", res.statusCode);
			console.log("headers: ", res.headers);
			res.on('data', function(d) {
				transferkey += d;
			});
			res.on('end', function() {
				callback(undefined, transferkey);
			});
		});
	
	req.end('cid='+encodeURIComponent(cid)+'&apicode='+encodeURIComponent(apicode));
	
	req.on('error', function(e) {
		callback("Getting transferkey failed: " + e);
	});
}

// Main
(function() {
	var config = require('./config.js');
	get_transferkey(config.cid, config.apicode, function(err, transferkey) {
		if(err) throw new Error("Error: " + err);
		process.stdout.write("received transferkey: " + transferkey + "\n");
	});
})();
