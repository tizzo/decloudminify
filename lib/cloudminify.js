'use strict';

const url = require('url');
const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();
const _ = require('lodash');

/**
 * @param {Response} res - The response object to write an OPTIONS response to.
 */
function handleOptionsRequests(res) {
  // These values copied exactly from an options request against the Cloudmine
  // API on January 29, 2018.
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-CloudMine-ApiKey, X-Requested-With, Authorization, X-CloudMine-SessionToken, X-CloudMine-Agent, X-CloudMine-UT',
    'Content-Type': 'text/plain; charset=UTF-8',
    'Access-Control-Max-Age': '1728001',
    'Content-Length': '0',
    'X-XSS-Protection': '1; mode=block',
    'X-Content-Type-Options': 'nosniff',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  };
  res.writeHead(200, headers);
  res.end();
}

/**
 * Gets the originating IP.
 *
 * @param {Request} - A node.js request object.
 * @return {String|null} - A string if a remote address can be found or null if not.
 */
function getOriginatingIp(req) {
  if (req.headers['x-forwarded-for']) {
    return req.headers['x-forwarded-for']
      .split(',')[0]
      .trim();
  }
  return null;
}

/**
 *
 */
function requestIsAsync(req) {
  const truthyValues = ['true', 't', '1', 'yes']
  if (req.query && req.query.async) {
    const asyncParam = req.query.async
      .toString()
      .toLowerCase()
    return truthyValues.includes(asyncParam);
  }
  return false;
}

/**
 *
 */
function cloudminifyRequest(req) {
  const body = req.body;
  const params = url
    .parse(req.url, true)
    .query;
  req.body = {
    request: {
      body: body ? body : '',
      'content-type': req.headers['content-type'],
      headers: req.headers,
      method: req.method.toUpperCase(),
      originating_ip: getOriginatingIp(req),
    },
    response: {
      body: {
        request: {
          method: req.method.toUpperCase(),
          'content-type': req.headers['content-type'],
        },
      },
    },
    session: {
      api_key: req.headers['x-cloudmine-apikey'] || req.query.apikey,
      app_id: req.path.split('/')[2],
      session_token: req.headers['x-cloudmine-sessiontoken'] || null,
      user_id: '[User ID not populated in local deployments]',
    },
    params,
    config: {
      // This strange logic copied from the cloudmine coderunner.
      async: requestIsAsync(req),
      timeout: 30,
      version: 2,
      type: 'post',
    },
    code: undefined,
  };
}

/**
 * Check whether this is a route match for our Cloudmine app.
 *
 * Our code only registers a single snippet in Cloudmine and for consistency
 * we should 404 any other path.
 *
 * @param {String} path - A path 
 * @return {Boolean} - W@ 
 */
function isRouteMatch(path) {
  const parts = path
    .split('/')
    .filter(part => part !== '');
  if (parts.length == 5 && parts[0] == 'v1' && parts[1] == 'app' && parts[3] == 'run') {
    return true;
  }
  return false;
}

/**
 * @param {Object} options - .
 * @return {Function} - 
 */
function createCloudminifyMiddleware(options = {logFunction: false}) {

  /**
   * @param {Request} req -  
   * @param {Response} res -  
   * @param {Function} next -  
   */
  return function cloudminify(req, res, next) {
    if (req.method.toLowerCase() === 'options') {
      return handleOptionsRequests(res);
    }
    if (isRouteMatch(req.path)) {
      jsonParser(req, res, () => {
        cloudminifyRequest(req);
        next();
      });
    } else {
      if (options.logFunction) {
        options.logFunction(`404 error for ${req.path}${getOriginatingIp(req) ? ' from ' + getOriginatingIp(req) : ''}`);
      }
      res.writeHead(404, {'Content-Type': 'application/json; charset=utf-8'});
      res.end(JSON.stringify({
        errors: ['Snippet or backend is missing'],
      }));
      return;
    }
  }
}

module.exports = createCloudminifyMiddleware;
