Grafana PDF Proxy
=================

Connects to a Grafana instance and renders a PDF for the given URL.

This work is based on [a gist by svet-b](https://gist.github.com/svet-b/1ad0656cd3ce0e1a633e16eb20f66425).

Installation
------------

```
npm install
```

Optionally skip installation of `chromium` by puppeteer.

```
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true npm install
```

Environment
-----------

`GRAFANA_PDF_BIND_PORT`: Specify the port on which the proxy is listening. No
default, the operation system will pick a random port if this variable is not
defined.

`GRAFANA_PDF_BIND_HOST`: Specify the IP address on which the proxy is
listening. Defaults to `::1`. Use `::` in order to expose the proxy to the
world.

`GRAFANA_PDF_BACKEND_URL`: URL prefix of grafana. Trailing slash should be
omitted. Defaults to `http://localhost:3000`.

`GRAFANA_PDF_BACKEND_USER`: Name of a user with `view` privileges to the
desired dashboard. No authentication is attempted if omitted.

`GRAFANA_PDF_BACKEND_PASS`: Password of the user. No authentication is
attempted if omitted.

`GRAFANA_PDF_CHROME_PATH`: Path to a chrome/chromium executable. Puppeteer uses
a builtin chrome if omitted.

Running
-------

```
node index.js
```

Test using curl (assuming the server is running on localhost, on port 38269,
and the path to the dashboard is `/d/GN7k2MI3D/nodes?orgId=1`):

```
curl -o /tmp/test.pdf 'http://[::1]:38269/d/GN7k2MI3D/nodes?orgId=1'
```

License
-------
