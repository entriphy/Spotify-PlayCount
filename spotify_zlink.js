const AdmZip = require("adm-zip");
const fs = require("fs-extra");
const path = require("path");
const readline = require("readline");
const cfg = require("./config.json");
const query = '=`hm://album/v1/album-app/album/spotify:album:${e}/desktop?${[`catalogue=${encodeURIComponent(t.catalogue)}`,`locale=${encodeURIComponent(t.locale)}`,`username=${encodeURIComponent(t.username)}`].join("&")}`;' // What to look for in each line to inject code
const splice = `if(!wSocket){console.log("Connecting to server...");wSocket=new WebSocket("${cfg.useSecure ? "wss" : "ws"}://${cfg.websocket.ipAddress}:${cfg.port}");wSocket.onopen=(event)=>{wSocket.onmessage=(msg)=>{msg=JSON.parse(msg.data);console.log(msg);switch(msg.req){case "playcount":if(msg.id.length!==22)return;const uri=\`hm://album/v1/album-app/album/spotify:album:\${msg.id}/desktop?\${[\`catalogue=\${encodeURIComponent(t.catalogue)}\`, \`locale=\${encodeURIComponent(t.locale)}\`].join("&")}\`;console.log(uri);i.default.resolver.get(uri,(e,t)=>{console.log(e,t);if(e){return wSocket.send(JSON.stringify({uuid:msg.uuid,success:!1,data:e}))}else{return wSocket.send(JSON.stringify({uuid:msg.uuid,success:!0,data:t.getJSONBody()}))}});break;case "hermes":const _uri=msg.uri;console.log(_uri);a.default.resolver.get(_uri,(e,t)=>{console.log(e,t);if(e){return wSocket.send(JSON.stringify({uuid:msg.uuid,success:!1,data:e}))}else{return wSocket.send(JSON.stringify({uuid:msg.uuid,success:!0,data:t.getJSONBody()}))}});break}}}}` // Inject with this string
const zipAFolder = require("zip-a-folder"); // This is the only zip package that works with Spotify for some reason; AdmZip doesn't work :(
const process = require("process");

String.prototype.insertAt=function(index, string) { 
    return this.substr(0, index) + string + this.substr(index);
}

if (!fs.existsSync("zlink.spa")) { 
    console.error("ERROR: zlink.spa does not exist in the project directory.");
    switch (process.platform) {
        case "win32":
            console.log("On Windows machines, the zlink.spa file is usually located at %appdata%\\Spotify\\Apps\\zlink.spa (full path: C:\\Users\\<username>\\AppData\\Roaming\\Spotify\\Apps\\zlink.spa)");
            break;
        case "darwin":
            console.log("On macOS machines, the zlink.spa file is usually located at /Applications/Spotify.app/Contents/Resources/Apps/zlink.spa");
            break;
        case "linux":
            console.log("On Linux machines, the location of this file can vary depending on your distro. Check your package manager to possibly find more info. (In the Spotify install directory, it's located in Apps/zlink.spa)");
            break;
    }
    return;
}
const zip = new AdmZip("zlink.spa"); // Create zip object of zlink.spa
if (zip.getEntry(".zlinkignore")) return console.error("ERROR: zlink.spa has already been modified by this script."); // Check if zlink.spa contains .zlinkignore

console.log("[1/7] Extracting zlink.spa to zlink...");
zip.extractAllTo(path.join(__dirname, "zlink"), true); // Extract to zlink directory

console.log("[2/7] Reading zlink/zlink.bundle.js...");
const lineReader = readline.createInterface(fs.createReadStream("zlink/zlink.bundle.js"));
let lines = []; // Gets written to new file at the end
let firstLine = true; // Tracks whether or not the first line is being read; immediately gets set to false after first line is read. (It sounds dumb, but it works, ok?)
let injectionSuccessful = false; // Tracks if the code injection was successful
lineReader.on("line", (line) => {
    line = line.replace(/^\s+|\s+$/g, ''); // Remove line endings from string
    if (firstLine) {
        firstLine = false;
        lines.push("let wSocket;"); // Add global WebSocket variable
        lines.push(line); // Add line to array
    } else if (line.includes(query)) {
        console.log("[3/7] Attempting to inject code into script...");
        const idx = line.indexOf(query) + query.length; // Calculation of where to insert the splice variable at
        line = line.insertAt(idx, splice); // Insert splice at position
        lines.push(line);
        injectionSuccessful = true;
    } else {
        lines.push(line);
    }
});

lineReader.on("close", () => {
    if (!injectionSuccessful) console.error("@@@ It appears that the code injection was unsuccessful :( (If possible, submit an issue on GitHub with your zlink_old_***** file that was generated)")
    console.log("[4/7] Writing new script to file...");
    fs.writeFileSync("zlink/zlink.bundle.js", lines.join("\n")); // Write to file
    console.log("[5/7] Adding contents of zlink/ to zip...");
    fs.writeFileSync("zlink/.zlinkignore", ""); // Add ignore file so this script doesn't somehow modify the script twice
    console.log("[6/7] Backing up old zlink.spa...")
    fs.renameSync("zlink.spa", "zlink_old_" + Math.floor(new Date().getTime() / 1000) + ".spa"); // Rename original .spa file
    console.log("[7/7] Zipping new zlink.spa...");
    zipAFolder.zip("./zlink", "zlink.spa"); // Zip zlink directory
    console.log("Finished!")
});
