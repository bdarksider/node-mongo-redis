var r = require('request').defaults({
    json: true
});

var async = require('async');
var redis = require('redis');
var client = redis.createClient(6379, '127.0.0.1');

module.exports = function(app) {
    /* Read */
    app.get('/pets', function(req, res) {

        async.parallel({
                cat: function(callback) {
                    client.get('http://localhost:3000/cat', function(error, cat) {
                        if (error) {
                            throw error
                        };
                        if (cat) {
                            callback(null, JSON.parse(cat));
                        } else {
                            r({ uri: 'http://localhost:3000/cat' }, function(error, response, body) {
                                if (error) {
                                    callback({ service: 'cat', error: error });
                                    return;
                                };
                                if (!error && response.statusCode === 200) {
                                    callback(null, body.data);
                                    client.setex('http://localhost:3000/cat', 10, JSON.stringify(body.data), function(error) {
                                        if (error) {
                                            throw error; };
                                    })
                                } else {
                                    callback(response.statusCode);
                                }
                            });
                        }
                    })
                },
                dog: function(callback) {
                    r({ uri: 'http://localhost:3001/dog' }, function(error, response, body) {
                        if (error) {
                            callback({ service: 'dog', error: error });
                            return;
                        };
                        if (!error && response.statusCode === 200) {
                            callback(null, body.data);
                        } else {
                            callback(response.statusCode);
                        }
                    });
                }
            },
            function(error, results) {
                res.json({
                    error: error,
                    results: results
                });
            });
    });
};
