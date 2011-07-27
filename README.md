
Trustpoint API client module for Node.js
========================================

Description
-----------
This is a client module for [Trustpoint API](https://www.trustpoint.fi).

Installation
------------

Simplest way to install is to use [npm](http://npmjs.org/), just simply `npm 
install /path/to/trustpoint-api`.

License
-------

MIT-style license, see [INSTALL.txt](http://github.com/jheusala/trustpoint-api/blob/master/LICENSE.txt).

Required software
-----------------

* [Node.js](http://www.nodejs.org)
* [xml2js](http://github.com/Leonidas-from-XIV/node-xml2js/)

Example Code
------------

	var config = require('./config.js'),
	    trust = require('trustpoint-api');
	
	var api = trust.create(config.cid, config.apicode);
	
	var data = {
	    'debug':true,
	    'operator':12345,
	    'dataset':[
	        {'custnum':227,
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
	         'amount':1250.50,
	        }],
	};
	
	api.committransfer(data, function(err) {
	    if(err) throw new Error(err);
	});
