var http = require("http"),
        querystring = require('querystring');

module.exports = (function () {

        rest = function (options, body)
        {
                var deferred = q.defer();
                
                this.options = options;
                var self = this;
                var req = http.request(options, function (res) {
                        
                        if (res.statusCode >= '400')
                        {
                                deferred.reject();
                                return false;
                        }
                        
                        self.statusCode = res.statusCode;
                        
                        res.setEncoding('utf8');
                        res.on('data', function (chunk) {
                                self.rawMessage = chunk
                                deferred.resolve(self);
                                return true;
                        });
                });
                
                req.on('error', function (e) {
                        console.log('problem with request: ' + e.message);
                        deferred.reject();
                });
                if (body)
                {
                        req.write(body);
                }
                req.end();
                
                return deferred.promise;
        }
        
        rest.put = function (url, uri, fieldList, headerList)
        {
                var postData = querystring.stringify(fieldList);
                var options = {
                        hostname: url,
                        port: 80,
                        path: uri,
                        method: 'PUT',
                        headers: {
                                'Content-Type': 'application/x-www-form-urlencoded',
                                'Content-Length': postData.length
                        }
                };

                if (headerList)
                {
                        for (var i in headerList)
                        {
                                options.headers[i] = headerList[i];
                        }
                }
                
                return new rest(options, postData);
        }

        rest.post = function (url, uri, fieldList, headerList)
        {
                var postData = querystring.stringify(fieldList);
                var options = {
                        hostname: url,
                        port: 80,
                        path: uri,
                        method: 'POST',
                        headers: {
                                'Content-Type': 'application/x-www-form-urlencoded',
                                'Content-Length': postData.length
                        }
                };

                if (headerList)
                {
                        for (var i in headerList)
                        {
                                options.headers[i] = headerList[i];
                        }
                }
                
                return new rest(options, postData);
        }

        rest.get = function (url, uri, fieldList, headerList)
        {
                
                var options = {
                        hostname: url,
                        port: 80,
                        path: uri + querystring.stringify(fieldList),
                        method: 'GET',
                        headers: {
                                'User-Agent': 'Node.js - HRS Enterprise',
                                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                        }
                };

                if (headerList)
                {
                        for (var i in headerList)
                        {
                                options.headers[i] = headerList[i];
                        }
                }
                
                return new rest(options);

        }
        
        rest.delete = function (url, uri, fieldList, headerList)
        {

                var options = {
                        hostname: url,
                        port: 80,
                        path: uri + querystring.stringify(fieldList),
                        method: 'DELETE',
                        headers: {
                                'User-Agent': 'Node.js - HRS Enterprise',
                                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                        }
                };

                if (headerList)
                {
                        for (var i in headerList)
                        {
                                options.headers[i] = headerList[i];
                        }
                }
                
                return new rest(options);

        }

        return rest;

})();