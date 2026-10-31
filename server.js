// cPanel / Passenger startup file for Next.js
process.env.NODE_ENV = "production";

const { createServer } = require("http");
const next = require("next");

const port = process.env.PORT || 3000;
const app = next({ dev: false });
const handle = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    createServer((req, res) => handle(req, res)).listen(port, () => {
      console.log("Tvinion running on port " + port);
    });
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
