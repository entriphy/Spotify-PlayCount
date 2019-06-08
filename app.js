const express = require("express");
const WebSocket = require("ws");
const fs = require("fs");
const http = require("http");
const https = require("https");
const uuid = require("uuid/v4");
const cfg = require("./config.json");
const app = express();
app.use(express.urlencoded({extended: true}));

let client; // Spotify client

app.get(cfg.http.endpoint, (req, res) => {
    let params = req.query; // Parse url encoded query in request
    if (!client) return res.json({success: false, data: "Spotify client could not be found."});
    if (!params.albumid) return res.json({success: false, data: "albumid is not defined in the query"});
    if (params.albumid.length !== 22) return res.json({success: false, data: "albumid is invalid; wanted 22 characters, found " + params.albumid.length});
    const requuid = uuid(); // UUID is used to tell which response from the Spotify client is supposed to go to which request from the user
    const listener = (msg) => {
        try {
            msg = JSON.parse(msg); // Parse JSON response
            if (msg.uuid !== requuid) return; // Return if the response's UUID does not match the UUID
            client.removeListener("message", listener); // Probably prevents memory leaks or something, idk
            if (msg.success !== true) {
                if (msg.data.response.status === 404) { return res.json({success: false, data: "albumid is invalid; couldn't find album"}); }
                else { console.error(msg.data); return res.json({success: false, data: "An unknown error has occurred; logged to server console"}); }
            }
            msg = msg.data;
            let resArr = [] // Data to send to user, is an array because some albums have multiple discs, might change in the future
            for (let d = 0; d < msg.discs.length; d++) {
                const disc = msg.discs[d];
                for (let t = 0; t < disc.tracks.length; t++) {
                    const track = disc.tracks[t];
                    resArr.push({name: track.name, playcount: track.playcount, disc: d + 1, number: track.number, uri: track.uri})
                }
            }
            res.json({success: true, data: resArr});
        } catch (e) {
            console.error(e);
            return res.json({success: false, data: "An unknown error has occurred; logged to server console"});
        }
    }
    client.on("message", listener);
    client.json({uuid: requuid, id: params.albumid}); // Send data to user
});

const server = cfg.secure.useHttps ? https.createServer({
    cert: fs.readFileSync(cfg.secure.cert, "utf8"),
    key: fs.readFileSync(cfg.secure.key, "utf8"),
    ca: fs.readFileSync(cfg.secure.chain, "utf8")
}, app) : http.createServer(app);

const wss = new WebSocket.Server({
    server: server
});

wss.on("connection", (ws) => {
    console.log("o_> quack (client connected)");
    ws.json = function(data) { return ws.send(JSON.stringify(data)); }
    client = ws;
});

module.exports.app = server;