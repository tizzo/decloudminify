'use strict';

const _ = require('lodash');
const express = require('express');
const http = require('http');

const deCloudminify = require('../../index').deCloudminify;
const cloudminify = require('../../index').cloudminify;

class CloudminifyServer {
  constructor(options = {}) {
    const app = express();
    this.mostRecentRequest = {};
    app.use(cloudminify(options));
    const self = this;
    app.use((req, res, next) => {
      self.mostRecentRequest = _.cloneDeep(req.body);
      next();
    });
    app.use(deCloudminify(options));
    app.get('/foo/bar', (req, res) => {
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

module.exports = CloudminifyServer;
