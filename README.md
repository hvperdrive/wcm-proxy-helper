# wcm-proxy-helper
This a small helper to generate proxy middleware routes.
It is specialized to handle WCM proxy with minimal effort, but it can also be used to generate custom proxy routes.

## Usage

```javascript
var ProxyHelper = require("wcm-proxy-helper");

module.exports = function(app) {
    app.use("/proxy", ProxyHelper.responseModifier("/content*", contentModifier));
    app.use("/proxy", ProxyHelper.responseModifier("/views*", viewsModifier));

    // Setup proxy for WCM
    ProxyHelper(app, {
        target: "https://target...",
        apikey: "WCM apikey",
        tenant: "WCM tenant name",
        host: "Server host name (needed for http <=> https proxy)",
        prefix: "/route"
    });

    // Setup additional proxy route
    ProxyHelper.addProxyRoute(app, "/route", {
        target: "https://custom-target...",
        changeOrigin: true, // need to be set together with host
        host: "Server host name (needed for http <=> https proxy)"
    });
};
```

## ProxyHelper

`ProxyHelper(app, options);`

### Options

| Option | Default | Required | Description |
|--------|---------|----------|-------------|
| target | undefined | true | Target to proxy to |
| apikey | undefined | false | WCM apikey |
| tenant | undefined | false | WCM tenant |
| host | undefined | false | Server host domain (This needs to be set, when setting up a proxy from http to https) |
| prefix | "/proxy" | false | Route after which should be proxied |
| headers | undefined | false | Addtional headers |

This will proxy the following routes to the WCM:

- `[prefix]/...`
- `/files/...`
- `/file/...`
- `[prefix]/files/...`
- `[prefix]/file/...`
- `/api/1.0.0/files/...`
- `/api/1.0.0/file/...`


## addProxyRoute

`ProxyHelper.addProxyRoute(app, prefix, options);`

### Options

| Option | Default | Required | Description |
|--------|---------|----------|-------------|
| tenant | undefined | false | WCM tenant |
| host | undefined | false | Server host domain (This needs to be set, when setting up a proxy from http to https) |
| headers | undefined | false | Addtional headers |

## responseModifier

`ProxyHelper.responseModifier(globPattern, modifierFn);`

### globPattern

The modifier function will only be called if the pattern matched with the request url using [minimatch](https://github.com/isaacs/minimatch).

The value of the request url will the path after the proxy prefix. <br>
This means that the request `http://someServerurl.com/proxy/content?slug=home&lang=nl` will generate the following request url `/content?slug=home&lang=nl`.

### modifierFn

This is a callback function that is called after de proxy has received a response but before it has sent the response to the client. This means that the response can be modified before it goes to the client. <br>
Only synchronous functionality and request that have the content-type `application/json` are supported for now.

#### Params

| Param  | Description |
|--------|-------------|
| data | Response object |
| req | Express request object |
| res  | Express response object |

#### Response
The ProxyHelper expects a JSON object as a return value. The original response object will be used if no valid result is returned.
