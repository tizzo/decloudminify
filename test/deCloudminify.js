'use stict';

const should = require('should');
const request = require('request');

const DeCloudminifyServer = require('./fixtures/deCloudminifyServer');

describe('decloudminify', () => {
  it('should serve a list of names at the `/names` route', (done) => {
    const server = new DeCloudminifyServer();
    server.listen(() => {
      request.get({uri: `${server.url}/names`, json: true}, (error, response, body) => {
        should.not.exist(error);
        response.statusCode.should.equal(200);
        body.should.be.instanceof(Array).and.have.lengthOf(1);
        body[0].should.equal('handler');
        server.stop(done);
      });
    });
  });
  it('should rewrite a cloudmine request payload into a vanilla Request', (done) => {
    const server = new DeCloudminifyServer();
    server.listen(() => {
      const port = server.port;
      const options = {
        uri: server.url,
        json: true,
        body: {
          request: {
            method: 'GET',
            body: '',
            headers: {
              host: 'api.cloudmine.io',
              'x-ssl-version': 'TLSv1.2',
            },
          },
          params: {
            path: '/foo',
          },
        },
        headers: 'abc',
      };
      request(options, (error, response, body) => {
        should.exist(body);
        body.foo.should.equal('bar');
        server.stop(done);
      });
    });
  });
  it('should gracefully handle missing required attributes', (done) => {
    let history = [];
    const logFunction = function(input) {
      history.push(input);
    }
    const server = new DeCloudminifyServer({logFunction});
    server.listen(() => {
      const port = server.port;
      const options = {
        uri: server.url,
        json: true,
        body: {
          request: {
            method: 'GET',
            body: '',
            headers: {
              host: 'api.cloudmine.io',
              'x-ssl-version': 'TLSv1.2',
            },
          },
        },
        headers: 'abc',
      };
      request(options, (error, response, body) => {
        should.exist(body);
        response.statusCode.should.equal(400);
        body.should.equal('Invalid request');
        history.length.should.equal(1);
        history[0].message.should.containEql('missing required property params.path');
        //history[0].message.should.contain('missing required property params.path');
        //logFunction.input.should.equal('blah');
        server.stop(done);
      });
    });
  });
});
