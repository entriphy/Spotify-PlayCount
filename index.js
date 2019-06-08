const app = require("./app").app;
const cfg = require("./config.json");
const fs = require("fs");

if (cfg.useSecure) { // Enables/disables https:// and wss://
    if (cfg.secure.cert !== "" && !fs.existsSync(cfg.secure.cert)) { return console.error(`${cfg.secure.cert} does not exist!`)};
    if (cfg.secure.key !== "" &&!fs.existsSync(cfg.secure.key)) { return console.error(`${cfg.secure.key} does not exist!`)};
    if (cfg.secure.chain !== "" && !fs.existsSync(cfg.secure.chain)) { return console.error(`${cfg.secure.chain} does not exist!`)};
}

app.listen(cfg.port, () => {
    console.log(`${cfg.useSecure ? "https" : "http"} and ${cfg.useSecure ? "wss" : "ws"} server listening on port ${cfg.port}!`)
})