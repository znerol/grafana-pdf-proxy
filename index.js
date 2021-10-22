'use strict';

const http = require('http');
const puppeteer = require('puppeteer');

/**
 * Create a readable PDF stream by fetching the given URL with puppeteer.
 *
 * @param {string} url The URL to to the grafana dashboard
 * @param {object} options
 * @returns
 */
async function streamPdf(url, options) {
  const {
    backendUser,
    backendPass,
    executablePath,
    width = 1200,
    height = parseInt(1200 * Math.sqrt(2)),
  } = options;

  console.log('Launching chromium:', executablePath || '(puppeteer builtin)');
  const browser = await puppeteer.launch({
    executablePath,
  });

  const page = await browser.newPage();
  await page.setViewport({
    width,
    height,
    deviceScaleFactor: 2,
    isMobile: false
  });

  console.log('Fetching url');
  if (backendUser && backendPass) {
    const authHeader = 'Basic ' + new Buffer.from(`${backendUser}:${backendPass}`).toString('base64');
    await page.setExtraHTTPHeaders({ 'Authorization': authHeader });
  }
  await page.goto(url, { waitUntil: 'networkidle0' });

  // Hide all panel description (top-left "i") pop-up handles and, all panel
  // resize handles. Annoyingly, it seems you can't concatenate the two object
  // collections into one.
  await page.evaluate(() => {
    const infoCorners = document.getElementsByClassName('panel-info-corner');
    for (el of infoCorners) { el.hidden = true; };
    const resizeHandles = document.getElementsByClassName('react-resizable-handle');
    for (el of resizeHandles) { el.hidden = true; };
  });

  console.log('Rendering PDF');
  return (await page.createPDFStream({
    width: width,
    height: height,
    scale: 1,
    displayHeaderFooter: false,
    margin: {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    },
    printBackground: true,
  })).on('close', () => {
    console.log('Finished rendering PDF');
    browser.close();
    console.log('Terminated chromium');
  });
}

function startServer(options) {
  const {
    port,
    host,
    backendUrl,
    backendUser,
    backendPass,
    executablePath
  } = options;

  return http.createServer(async (request, response) => {
    const kioskParam = request.url.indexOf('?') ? '&kiosk' : '?kiosk';
    const url = `${backendUrl}${request.url}${kioskParam}`;
    console.log(`Trying: ${url}`);

    try {
      const pdf = await streamPdf(url, { backendUser, backendPass, executablePath });
      response.setHeader('Content-Type', 'application/pdf');
      pdf.pipe(response);
    }
    catch (e) {
      console.error(e);
      response.setHeader('Content-Type', 'text/html');
      response.statusCode = 500;
      response.end('<h1>Internal Server Error 500</h>');
    }
  }).listen(port, host);
}

const server = startServer({
  port: process.env.GRAFANA_PDF_BIND_PORT,
  host: process.env.GRAFANA_PDF_BIND_HOST || '::1',
  backendUrl: process.env.GRAFANA_PDF_BACKEND_URL || 'http://[::1]:3000',
  backendUser: process.env.GRAFANA_PDF_BACKEND_USER,
  backendPass: process.env.GRAFANA_PDF_BACKEND_PASS,
  executablePath: process.env.GRAFANA_PDF_CHROME_PATH,
});

server.on('listening', () => {
  const { family, address, port } = server.address();
  const url = family == 'IPv6' ? `http://[${address}]:${port}`
                               : `http://${address}:${port}`;
  console.log(`Server running at ${url}`);
});
