# deCloudminify

This module allows you to write a service that can be run in three different ways:

1. Run Express apps on Cloudmine substituting paths passed as a `?path=/blah` query parameter for the express path (this is the [deCloudminify middleware](#deCloudminify-middleware))
2. Run Express apps locally as though they were on Cloudmine providing request rewriting similar to the rewrites performed by the Cloudmine proxying layers (this is the [cloudminify middleware](#cloudminify-middleware))
3. Remove the middleware and run that same Express app outside of cloudmine with normal routing

[Cloudmine](https://cloudmineinc.com/) offers a code hosting environment
called [logic engine](https://cloudmine.io/docs/#/server_code#node-js-snippets-on-logic-engine)
where you are expected to build your application atop their
[coderunner](https://github.com/cloudmine/node-coderunner) which is built atop hapi
but only supports a flat namespace `/v1/app/[some_app_id]/run/[your_path_here]`. You cannot support
normal rest routing (you can have `/run/user` but not `/run/user/1` or `/run/user/1/friends`). This application
works around that limitation by moving the path into a query parameter `?path=user/1` and unpacking the original
request information into the request object via a middleware before it is processed by the express router.

## deCloudminify middleware

``` javascript
const express = require('express');
const app = express();
const deCloudminify = require('deCloudminify').deCloudminify;
app.use(deCloudminify());
app.get('/foo/bar', (req, res) => {
  res.send({foo: 'bar'});
});
```

## cloudminify middleware

If you want to run the app locally and test your clients in the way you would against 
Cloudmine, just use `cloudminify()` before `decloudminify()` and it will emulate the
request rewiriting performed by the Cloudmine servers. 

``` javascript
const express = require('express');
const app = express();
const cloudminify = require('deCloudminify').cloudminify;
app.use(cloudminify());
app.get('/foo/bar', (req, res) => {
  res.send({foo: 'bar'});
});
```
