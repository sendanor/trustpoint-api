var sys = require('sys');

/* Foreach every element in array, object or the element itself if neither */
function foreach(values) {

    if(!values) return do_single();
    if(typeof values != 'object') return do_single();
    if(values instanceof Array) return do_array();
    return do_obj();

    function do_single() {
        return {'do': function(f) { f(values);}};
    }

    function do_array() {
        var i=0, length=values.length;
        return {'do': function(f) { for(; i<length; ++i) f(values[i], i); }};
    }

    function do_obj() {
        var i;
        return {'do': function(f) { for(i in values) if(values.hasOwnProperty(i)) f(values[i], i); }};
    }
}

/* Constructor */
function Trustpoint(cid, apicode) {
	console.log("Trustpoint(" + sys.inspect(cid) + ", " + sys.inspect(apicode) + ")");
	if(!(this instanceof arguments.callee)) return new (arguments.callee)(args);
	var undefined, trust = this;
	trust.cid = cid;
	trust.apicode = apicode;
	trust.transferkey = undefined;
}

/* Get transfer key */
Trustpoint.prototype.requirekey = function(cid, apicode, callback) {
	console.log("Trustpoint.prototype.requirekey(" + sys.inspect(cid) + ", " + sys.inspect(apicode) + ", " + sys.inspect(callback) + ")");
	var trust = this;
	
	// Use cached transferkey if it exists
	if(trust.transferkey) {
		callback(undefined, trust.transferkey);
		return trust;
	}
	
	// Get fresh transferkey from Trustpoint
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
				trust.transferkey = transferkey;
				callback(undefined, transferkey);
			});
		});
	
	req.end('cid='+encodeURIComponent(cid)+'&apicode='+encodeURIComponent(apicode));
	
	req.on('error', function(e) {
		callback("Getting transferkey failed: " + e);
	});
};

/* Commit transfer */
Trustpoint.prototype.committransfer = function(callback) {
	console.log("Trustpoint.prototype.committransfer(" + sys.inspect(callback) + ")");
	
	var trust = this;
	trust.requirekey(trust.cid, trust.apicode, function(err, transferkey) {
		if(err) throw new Error("Error: " + err);
		console.log("transferkey: " + transferkey + "\n");
		
		var undefined,
		    https = require('https'),
			results = '',
		    options = {
				host: 'www.trustpoint.fi',
				port: 443,
				path: '/API/committransfer.php',
				method: 'POST',
				headers: {'Content-Type': 'application/xml'}
				},
		    req = https.request(options, function(res) { // Handles response
				console.log("statusCode: ", res.statusCode);
				console.log("headers: ", res.headers);
				res.on('data', function(d) {
					results += d;
				});
				res.on('end', function() {
					callback(undefined, transferkey);
				});
			});
		
		req.end('');
		
		req.on('error', function(e) {
			callback("Getting transferkey failed: " + e);
		});
	});
	return trust;
};

/* Get XML message from a JSON string */
Trustpoint.prototype.do_xml_req = function(args) {
	
	console.log("Trustpoint.prototype.do_xml_req(" + sys.inspect(args) + ")");
	
	/* Escape string for XML */
	function escape_xml (str) {
	    return (""+str).replace(/&/g, "&amp;")
	               .replace(/"/g, "&quot;")
	               .replace(/"/g, "&quot;")
	               .replace(/</g, "&lt;")
	               .replace(/>/g, "&gt;")
	               .replace(/'/g, "&#039;");
	}
	
	var trust = this,
	    args = args || {},
	    transferkey = args.transferkey,
	    operator = args.operator,
	    dataset = args.dataset || [],
	    _dataset_date_keywords = ['billdate', 'paydate', 'noticedate'],
	    _dataset_keywords = ['custnum', 'billnum', 'billcode', 'name', 'address', 'postcode', 'city', 'customaddress', 'customertype', 'jobtype', 'govid', 'amount', 'operator'],
	    _required_dataset_keys = ['name', 'address', 'postcode', 'city', 'customertype', 'jobtype', 'amount'],
	    xml = '';
	
	// Check keys
	if(!transferkey) throw new Error("No key: transferkey");
	
	// Create XML data
	xml += '<datastream>\n';
	xml += ' <transferkey>'+escape_xml(transferkey)+'</transferkey>\n';
	if(debug) xml += ' <debug>true</debug>\n';
	if(operator) xml += ' <operator>'+escape_xml(operator)+'</operator>\n';
	foreach(operator.dataset).do(function(data) {
		
		// Check required keywords
		foreach(_required_dataset_keys).do(function(key) {
			if(!data[key]) throw new Error("Missing key: " + key);
		});
		
		// Check special values
		function check_1_2(key) {
			var tmp = ""+data[key];
			if( (tmp === "1") || (tmp === "2") ) return;
			throw new Error("key invalid: " + key + ": " + tmp);
		};
		
		check_1_2(data['customertype']);
		check_1_2(data['jobtype']);
		
		if ( (""+data['jobtype'] === "2") && (!data['noticedate']) ) throw new Error("Missing key: noticedate");
		
		// FIXME: Check validity for customaddress
		
		// Write XML dataset
		xml += ' <dataset>\n';
		foreach(_dataset_keywords).do(function(key) {
			if(data[key]) xml += '  <'+key+'>'+escape_xml(data[key])+'</'+key+'>\n';
		});
		foreach(_dataset_date_keywords).do(function(key) {
			function format(value) {
				function format_date(date) {
					function d(n) { return (((""+n).length <= 1) ? "0" : "") + n; }
					return date.getFullYear() + "-" + d(date.getMonth()+1) + "-" + d(date.getDate());
				}
				if(value instanceof Date) return format_date(value);
				if((""+value).match(/^[0-9]{4}\-[0-9]{2}\-[0-9]{2}$/)) {
					return ""+value;
				}
				throw new Error("date value invalid: " + value);
			}
			if(!data[key]) return;
			xml += '  <'+key+'>'+escape_xml(format(data[key]))+'</'+key+'>\n';
		});
		xml += ' </dataset>\n';
	});
	xml += '</datastream>';
	return xml;
};

// Main
(function() {
	var config = require('./config.js'),
	    trust = new Trustpoint(config.cid, config.apicode),
	    data = {'transferkey':'test',
			'debug':true,
			'operator':12345,
			'dataset':[{'custnum':227,
				'billnum':1224,
				'billcode':'2270012240',
				'name':'Teemu Testi',
				'address':'Testikatu 74',
				'postcode':13101,
				'city':'Hämeenlinna',
				'customertype':1,
				'jobtype':2,
				'govid':'12345678-9',
				'billdate':'2009-11-01',
				'paydate':'2009-11-15',
				'noticedate':'2009-11-29',
				'amount':1250.50 }] };
	
	console.log("data = " + sys.inspect(data));
	
	//console.log(trust.do_xml_req(data));
	
})();
