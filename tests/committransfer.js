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
