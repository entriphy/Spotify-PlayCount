const express = require("express");
const WebSocket = require("ws");
const fs = require("fs");
const http = require("http");
const https = require("https");
const uuid = require("uuid/v4");
const cfg = require("./config.json");
const cors = require("cors");
const app = express();
app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use(cors());

let client; // Spotify client

app.get(cfg.http.endpoint, (req, res) => {
    let params = req.query; // Parse url encoded query in request
    if (!client) return res.status(503).json({success: false, data: "Spotify client could not be found."});
    if (!params.albumid) return res.status(400).json({success: false, data: "albumid is not defined in the query"});
    if (params.albumid.length !== 22) return res.status(400).json({success: false, data: "albumid is invalid; wanted 22 characters, found " + params.albumid.length});
    const requuid = uuid(); // UUID is used to tell which response from the Spotify client is supposed to go to which request from the user
    const listener = (msg) => {
        try {
            msg = JSON.parse(msg); // Parse JSON response
            if (msg.uuid !== requuid) return; // Return if the response's UUID does not match the UUID
            client.removeListener("message", listener); // Probably prevents memory leaks or something, idk
            if (msg.success !== true) {
                if (msg.data.response.status === 404) { return res.status(404).json({success: false, data: "albumid is invalid; couldn't find album"}); }
                else { console.error(msg.data); return res.status(500).json({success: false, data: "An unknown error has occurred; logged to server console"}); }
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
            res.status(200).json({success: true, data: resArr}); // Send data to user
        } catch (e) {
            console.error(e);
            return res.status(500).json({success: false, data: "An unknown error has occurred; logged to server console"});
        }
    }
    client.on("message", listener); // Register message listener
    client.json({req: "playcount", uuid: requuid, id: params.albumid}); // Send request to Spotify client
    setTimeout(() => {
        if (!res.headersSent) {
            res.status(500).json({success: false, data: "Response from Spotify client timed out; this is most likely an error from the server."});
            client.removeListener("message", listener);
        }
    }, cfg.http.requestTimeout * 1000) // If Spotify fails to send a response back within a given amount of time, send an error response to the user. 
});

app.get("/hermes", (req, res) => {
    if (!cfg.http.enableHermes) return res.status(501).json({success: false, data: "The Hermes endpoint is disabled."});
    let params = req.query; // Get parameters from URL query
    if (Object.keys(req.body).length > 0) params = req.body; // If there is a JSON body, use that instead
    if (!client) return res.status(503).json({success: false, data: "Spotify client could not be found."});
    if (!params.uri) return res.status(400).json({success: false, data: "Invalid request: must specify Hermes uri"});
    const requuid = uuid(); // UUID is used to tell which response from the Spotify client is supposed to go to which request from the user
    const listener = (msg) => {
        try {
            msg = JSON.parse(msg); // Parse JSON response
            if (msg.uuid !== requuid) return; // Return if the response's UUID does not match the UUID
            client.removeListener("message", listener); // Probably prevents memory leaks or something, idk
            res.status(200).json({success: true, data: msg.data}); // Send data to user
        } catch (e) {
            console.error(e);
            return res.status(500).json({success: false, data: "An unknown error has occurred; logged to server console"});
        }
    }
    client.on("message", listener); // Register message listener
    client.json({req: "hermes", uuid: requuid, uri: params.uri}); // Send request to Spotify client
});

const server = cfg.useSecure ? https.createServer({
    cert: cfg.secure.cert !== "" ? fs.readFileSync(cfg.secure.cert, "utf8") : undefined,
    key: cfg.secure.key !== "" ? fs.readFileSync(cfg.secure.key, "utf8") : undefined,
    ca: cfg.secure.chain !== "" ? fs.readFileSync(cfg.secure.chain, "utf8") : undefined
}, app) : http.createServer(app);

const wss = new WebSocket.Server({
    server: server
});

wss.on("connection", (ws) => {
    console.log("o_> quack (client connected)");
    ws.json = function(data) { return ws.send(JSON.stringify(data)); }
    client = ws;
    client.on("close", (code, reason) => {
        console.log(`Client disconnected (${code}): ${reason}`);
        client = undefined;
    });
});

module.exports.app = server;