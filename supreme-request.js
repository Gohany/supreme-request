var BigInteger = require("./biginteger.js"),
        sjcl = require("sjcl"),
        sha1 = require("./sha1.js"),
        http = require("http"),
        greatjson = require('greatjson'),
        rest = require('./rest.js');
        q = require('q');

module.exports = (function () {

        SRequest = function (type, requester, environment, controller, location)
        {
                
                var inArray = false;
                for (var i = 0; i < this.types.length; i++) {
                        if (this.types[i] == type)
                        {
                                inArray = true;
                        }
                }
                
                if (!inArray)
                {
                        throw 'Request type not supported';
                }
                
                this.type = type;
                this.url = this.ADDRESS;
                this.uri = '/' + requester + '/' + environment + '/' + controller + '/' + location;

        }

        SRequest.post = function (requester, environment, controller, location)
        {
                return new SRequest('post', requester, environment, controller, location);
        }

        SRequest.put = function (requester, environment, controller, location)
        {
                return new SRequest('put', requester, environment, controller, location);
        }

        SRequest.get = function (requester, environment, controller, location)
        {
                return new SRequest('get', requester, environment, controller, location);
        }

        SRequest.delete = function (requester, environment, controller, location)
        {
                return new SRequest('delete', requester, environment, controller, location);
        }

        SRequest.prototype = {
                ADDRESS: 'localhost',
                HEADER_DELIMITER: ' ',
                PROTOCOL: 'http',
                types: [
                        'post',
                        'get',
                        'put',
                        'delete',
                ],
                hashFn: 'sha-256',
                
                setParams: function (params)
                {
                        this.params = params;
                },

                setAuthRequester: function (requester)
                {
                        this.authRequester = requester;
                },

                setAuthID: function (authID)
                {
                        this.authID = authID;
                },

                setAuthSession: function (authSession)
                {
                        this.authSession = authSession;
                },

                setAuthEnvironment: function (environment)
                {
                        this.authEnvironment = environment;
                },

                setAuthIteration: function (iteration, salt)
                {
                        this.iterateSignature = true;
                        this.authIteration = iteration;
                        this.iterationSalt = salt;
                },
                
                //if (utility::hash($this->sessionKey . $this->sessionData['validatedRequests'] . static::ITERATION_SALT) != $signature)
                getSignature: function ()
                {
                        if (this.authSession)
                        {

                                this.authToken = this.uri;
                                if (this.input)
                                {
                                        this.authToken += querystring.stringify(this.input);
                                }

                                this.authToken = this.uri.replace(/\?+$/g,"");
                                this.authToken = this.uri.replace(/\/+$/g,"");
                                if (this.params)
                                {
                                        this.authToken += '?';
                                        this.authToken += querystring.stringify(this.params);
                                }

                                signature = this.hmac(this.authSession, this.authToken);

                                if ((this.authRequester == 'a' || this.iterateSignature) && this.authIteration && this.iterationSalt)
                                {
                                        return this.hash(signature + this.authIteration + this.iterationSalt);
                                }
                                else
                                {
                                        return signature;
                                }

                        }
                },
                
                generateAuthHeader: function()
                {
                        if (!this.authHeader)
                        {
                                this.authHeader = this.authRequester + this.HEADER_DELIMITER + this.authEnvironment + this.HEADER_DELIMITER + this.authID + this.HEADER_DELIMITER + this.getSignature();
                        }
                        return this.authHeader;
                },

                send: function()
                {
                        this.generateAuthHeader();
                        var headerList = {'X_AUTHORIZATION': this.authHeader};
                        
                        self = this;
                        var promise = rest[this.type](this.url, this.uri, this.params, headerList).then(function(returned)
                        {
                                self.response = returned;
                                if (self.response.rawMessage)
                                {
                                        self.response.message = greatjson.parse(self.response.rawMessage);
                                        if (self.response.message.body)
                                        {
                                                return self;
                                        }
                                }
                                
                        },
                        function()
                        {
                                throw 'Failure';
                                return false;
                        });
                        
                        return promise;
                        
                },
                
                hash: function (str) {

                        switch (this.hashFn.toLowerCase()) {

                                case 'sha-256':
                                        var s = sjcl.codec.hex.fromBits(
                                                sjcl.hash.sha256.hash(str));
                                        return this.nZeros(64 - s.length) + s;

                                case 'sha-1':
                                default:
                                        return calcSHA1(str);

                        }
                },
                
                hmac: function (str1, str2) {

                        switch (this.hashFn.toLowerCase()) {

                                case 'sha-256':
                                        var hmac = new sjcl.misc.hmac(sjcl.codec.utf8String.toBits(str2), sjcl.hash.sha256);
                                        var signature = sjcl.codec.hex.fromBits(hmac.encrypt(str1)); 
                                        return this.nZeros(64 - signature.length) + signature;
                                case 'sha-1':
                                default:
                                        var key = sjcl.codec.utf8String.toBits(str2);
                                        var out = (new sjcl.misc.hmac(key, sjcl.hash.sha1)).mac(str1);
                                        var hmac = sjcl.codec.hex.fromBits(out)
                                        return this.nZeros(40 - hmac.length) + hmac;

                        }
                },
                
                /* Return a string with N zeros. */
                nZeros: function (n) {

                        if (n < 1)
                                return '';
                        var t = this.nZeros(n >> 1);

                        return ((n & 1) == 0) ?
                                t + t : t + t + '0';

                },
                
        }

})();