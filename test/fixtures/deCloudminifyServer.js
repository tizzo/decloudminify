'use strict';

const express = require('express');
const http = require('http');

const decloudminify = require('../../index').deCloudminify;

class deCloudminifyServer {
  constructor(options) {
    const app = express();
    app.use(decloudminify(options));
    app.get('/foo', (req, res) => {
      res.send({foo: 'bar'});
    });
    this.server = http.createServer(app);
  }

  get port() {
    return this.server.address().port;
  }

  get url() {
    return `http://localhost:${this.port}`;
  }

  listen() {
    return this.server.listen.apply(this.server, arguments);
  }

  stop() {
    return this.server.close.apply(this.server, arguments);
  }
}

module.exports = deCloudminifyServer;
