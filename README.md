# wcm-proxy-helper
This a small helper to generate proxy middleware routes.
It is specialized to handle WCM proxy with minimal effort, but it can also be used to generate custom proxy routes.

## Usage

```javascript
var ProxyHelper = require("wcm-proxy-helper");

module.exports = function(app) {
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

## addProxyRoute

'ProxyHelper.addProxyRoute(app, prefix, options);'

### Options

| Option | Default | Required | Description |
|--------|---------|----------|-------------|
| tenant | undefined | false | WCM tenant |
| host | undefined | false | Server host domain (This needs to be set, when setting up a proxy from http to https) |
| headers | undefined | false | Addtional headers |
