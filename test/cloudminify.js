'use strict';

const request = require('request');
const CloudminifyServer = require('./fixtures/cloudminifyServer');

describe('cloudminify', () => {
  it('should provide provide CORS headers in response to an OPTIONS request', (done) => {
    const server = new CloudminifyServer();
    server.listen(() => {
      const options = {
        uri: server.url,
      };
      request.options(options, (error, response, body) => {
        should.not.exist(error);
        response.statusCode.should.equal(200);
        response.headers['access-control-allow-origin'].should.equal('*');
        response.headers['access-control-allow-methods'].should.equal('GET, POST, PUT, DELETE, OPTIONS');
        server.stop(done);
      });
    });
  });
  it('should write request data to the request body payload', (done) => {
    const server = new CloudminifyServer();
    server.listen(() => {
      const options = {
        uri: `${server.url}/v1/app/PaeCe5H5WOOnlez2kUixAAjIkGbxMYLU/run/handler`,
        json: true,
        qs: {
          path: 'foo/bar',
        },
      };
      request.get(options, (error, response, body) => {
        should.not.exist(error);
        response.statusCode.should.equal(200);
        body.foo.should.equal('bar');
        server.stop(done);
      });
    });
  });
  it('should serve a 404 if the expected app pattern is not matched', (done) => {
    const server = new CloudminifyServer();
    server.listen(() => {
      const options = {
        uri: `${server.url}/v1/app`,
        json: true,
        qs: {
          path: 'foo/bar',
        },
      };
      request.get(options, (error, response, body) => {
        should.not.exist(error);
        response.statusCode.should.equal(404);
        body.errors.should.be.instanceof(Array);
        body.errors[0].should.equal('Snippet or backend is missing');
        server.stop(done);
      });
    });
  });
  describe('request.body.config.async', (done) => {
    it('should not be set if a truthy value was not supplied in a query parameter', (done) => {
      const server = new CloudminifyServer();
      server.listen(() => {
        const options = {
          uri: `${server.url}/v1/app/PaeCe5H5WOOnlez2kUixAAjIkGbxMYLU/run/handler`,
          json: true,
          qs: {
            path: 'foo/bar',
          },
        };
        request.get(options, (error, response, body) => {
          should.not.exist(error);
          server.mostRecentRequest.config.async.should.equal(false);
          response.statusCode.should.equal(200);
          server.stop(done);
        });
      });
    })

    it('should properly be set if a truthy value was supplied in the query parameter', (done) => {
      const server = new CloudminifyServer();
      server.listen(() => {
        const options = {
          uri: `${server.url}/v1/app/PaeCe5H5WOOnlez2kUixAAjIkGbxMYLU/run/handler`,
          json: true,
          qs: {
            path: 'foo/bar',
            async: true,
          },
        };
        request.get(options, (error, response, body) => {
          should.not.exist(error);
          server.mostRecentRequest.config.async.should.equal(true);
          response.statusCode.should.equal(200);
          server.stop(done);
        });
      });
    })
  });
  it('should populate originating IP with the appropriate ip', (done) => {
    const server = new CloudminifyServer();
    server.listen(() => {
      const options = {
        uri: `${server.url}/v1/app/PaeCe5H5WOOnlez2kUixAAjIkGbxMYLU/run/handler`,
        json: true,
        headers: {
          'x-forwarded-for': '33.33.33.33, 33.33.33.34, 33.33.33.35',
        },
        qs: {
          path: 'foo/bar',
        },
      };
      request.get(options, (error, response, body) => {
        should.not.exist(error);
        server.mostRecentRequest.request.originating_ip.should.equal('33.33.33.33');
        server.stop(done);
      });
    });
  });
});

