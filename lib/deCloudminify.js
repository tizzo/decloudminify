'use strict';

const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();

/**
 * Validate the payload for required fields that we extract and pass to express.
 */
function validatePayload(payload) {
  const requiredKeys = [
    'params.path',
    'request.method',
    'request.body',
    'request.headers',
  ];
  requiredKeys.forEach((key) => {
    let parts = key.split('.');
    let match = JSON.parse(JSON.stringify(payload));
    let part = null;
    while (part = parts.shift()) {
      if (match[part] === undefined) {
        throw new Error(`Invalid request body, missing required property ${key}`);
      }
      match = match[part]
    }
  });
}

/**
 * Rewrite the request objects from Cloudmine.
 *
 * @param {Request} req - A request object 
 */
function deCloudminifyRequest(req) {
  const payload = req.body;
  validatePayload(payload);
  req.cloudminePayload = payload;
  req.params = payload.params;
  req.method = payload.request.method;
  req.body = payload.request.body;
  req.headers = payload.request.headers
  const prefix = payload.params.path[0] === '/' ? '' : '/';
  req.url = `${prefix}${payload.params.path}`;
};


/**
 * @param {Object} options - An object containing configuration options.
 */
function createDeCloudminifyMiddleware(options = {logFunction: false}) {

  /**
   * Try 
   *
   * Cloudmine's code runner 
   *
   * @param {Request} req - The request object for this request.
   * @param {Response} res - The response object for this request.
   * @param {Function} next - The next function to call after this middleware.
   */
  return function deCloudminifyMiddleware(req, res, next) {
    if (req.url === '/names') {
      res.writeHead(200);
      res.end('["handler"]');
      return;
    }
    jsonParser(req, res, () => {
      try {
        deCloudminifyRequest(req);
        next();
      }
      catch (error) {
        if (options.logFunction) {
          options.logFunction(error);
        }
        res.writeHead(400);
        res.end('Invalid request');
      }
    });
  }
}

module.exports = createDeCloudminifyMiddleware;
