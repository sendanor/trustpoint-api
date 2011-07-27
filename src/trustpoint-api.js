/* 
 * Trustpoint API client module for Node.js
 * https://github.com/jheusala/trustpoint-api
 * Version 0.0.20110726
 */

/*
 * Copyright (C) 2011 by Jaakko-Heikki Heusala <jheusala@iki.fi>
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy of 
 * this software and associated documentation files (the "Software"), to deal in 
 * the Software without restriction, including without limitation the rights to 
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies 
 * of the Software, and to permit persons to whom the Software is furnished to do 
 * so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all 
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR 
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE 
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, 
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE 
 * SOFTWARE.
 */

var sys = require('sys'),
    https = require('https'),
	fs = require('fs'),
	xml2js = require('xml2js');

/* Foreach every element in an array, object or the element itself if neither */
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
}

/* Get transfer key */
Trustpoint.prototype.requirekey = function(cid, apicode, callback) {
	console.log("Trustpoint.prototype.requirekey(" + sys.inspect(cid) + ", " + sys.inspect(apicode) + ", " + sys.inspect(callback) + ")");
	var trust = this;
	
	// Get fresh transferkey from Trustpoint
	var undefined,
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
};

/* Commit transfer */
Trustpoint.prototype.committransfer = function(data, callback) {
	
	/* */
	function do_parse_xml_response(xml_data, callback) {
		var undefined,
		    parser = new xml2js.Parser();
		
		parser.addListener('end', function(result) {
			console.log(sys.inspect(result));
			callback(result.commonerror, result.row instanceof Array ? result.row : [result.row] );
		});
		
		parser.parseString(xml_data);
	}
	
	console.log("Trustpoint.prototype.committransfer(" + sys.inspect(callback) + ")");
	var trust = this,
	    data = data || {};
	trust.requirekey(trust.cid, trust.apicode, function(err, transferkey) {
		if(err) throw new Error("Error: " + err);
		console.log("transferkey: " + transferkey + "\n");
		
		data.transferkey = transferkey;
		
		var undefined,
			xml_data = trust.do_xml_req(data),
			results = '',
		    options = {
				host: 'www.trustpoint.fi',
				port: 443,
				path: '/API/committransfer.php',
				method: 'POST',
				headers: {'Content-Type': 'application/x-www-form-urlencoded'}
				},
		    req = https.request(options, function(res) { // Handles response
				console.log("statusCode: ", res.statusCode);
				console.log("headers: ", res.headers);
				res.on('data', function(d) {
					results += d;
				});
				res.on('end', function() {
					console.log(results);
					do_parse_xml_response(results, function(commonerror, rows) {
						//if(rows) console.log(sys.inspect(rows));
						if(commonerror) throw new Error(commonerror);
					});
					callback(undefined);
				});
			});
		
		console.log("xml data = " + xml_data);
		
		req.end('datastream='+encodeURIComponent(xml_data)+'&key='+encodeURIComponent(transferkey));
		
		req.on('error', function(e) {
			callback("Trustpoint.prototype.committransfer failed: " + e);
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
	    debug = args.debug ? true : false,
	    operator = args.operator,
	    dataset = args.dataset || [],
	    _dataset_date_keywords = ['billdate', 'paydate', 'noticedate'],
	    _dataset_keywords = ['accountid', 'addaddress', 'addressaddline1', 'addressaddline', 'addresscountry', 
	                         'attachment', 'custnum', 'billnum', 'billcode', 'name', 'address', 'postcode', 
	                         'city', 'customaddress', 'customertype', 'jobtype', 'govid', 'amount', 'operator', 
	                         'cashbill', 'checkbillnum', 'company', 'contry', 'email', 'email2', 'evoice',
	                         'evoiceint', 'freetext', 'language', 'ordernumber', 'ourcode', 'overdueinterest', 
	                         'ownref', 'person', 'phone', 'refundtobillnum', 'refundtojobid', 'salesman',
	                         'salesmanname', 'sendtype', 'sensible', 'servicecode', 'vatid', 'yourcode', 
	                         'claimtext', 'country'],
	    _required_dataset_keys = ['name', 'address', 'postcode', 'city', 'customertype', 'jobtype', 'amount'],
	    xml = '';
	
	// Check keys
	if(!transferkey) throw new Error("No key: transferkey");
	
	// Create XML data
	xml += '<datastream>\n';
	if(debug) xml += ' <debug>true</debug>\n';
	xml += ' <transferkey>'+escape_xml(transferkey)+'</transferkey>\n';
	if(operator) xml += ' <operator>'+escape_xml(operator)+'</operator>\n';
	foreach(dataset).do(function(data) {
		if(!data) throw new Error("No data");
		
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
		
		check_1_2('customertype');
		check_1_2('jobtype');
		
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
	xml += '</datastream>\n';
	return xml;
};

/* Export constructor */
exports.create = function(cid, apicode) {
	return new Trustpoint(cid, apicode);
};

/* EOF */
