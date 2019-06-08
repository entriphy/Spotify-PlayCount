# Spotify Playcount
Web server API to retrieve play count of all tracks in a Spotify album.

**NOTE:** Much of how this API works is mainly based on my needs and configuration (though, there is a config file included to make certain changes).

Overall, this hasn't been tested thoroughly and it is very possible that you may need to modify the script in order to fit your needs. Documentation may also be inaccurate or missing information. Submit an issue if you run into any problems.

# Requirements
* Node.js 8+
* Spotify desktop client for your operating system
* (Optional) HTTPS Certificate

# Installation
1. To install dependencies:`npm install`
2. Ensure configuration in `config.json` in project directory is correct. (see section below for what each configuration option means)
3. _**Important**_ Before launching the API, you must modify your Spotify client in order for it to connect to the main script. This process may need to be done every time the Spotify client updates or you change `config.json`.
    1. Copy the zlink.spa file from your Spotify installation directory to the project directory. The file is usually located at:
        * Windows: `%appdata%\Spotify\Apps\zlink.spa` (full path: `C:\Users\<username>\AppData\Roaming\Spotify\Apps\zlink.spa`)
        * macOS: `/Applications/Spotify.app/Contents/Resources/Apps/zlink.spa`
        * Linux: The location of this file can vary depending on your distro. Check your package manager to possibly find more info. On my Arch Linux machine, it was located at `/opt/spotify/Apps/zlink.spa`. (In the Spotify install directory, it's always located at `Apps/zlink.spa`)
    2. Run in the root of the project directory: `node spotify_zlink.js`
    3. If the command was successful, copy the file back to the directory where you copied `zlink.spa` from (it is recommended to make a backup of the old `zlink.spa` file in case something goes wrong)
4. _**Important**_ You must launch Spotify with the following arguments:
  `spotify --ignore-certificate-errors --alow-running-insecure-content`
5. Run the server: `node index.js`
6. In the Spotify client, open any album/single page. If everything went well, Spotify should connect to the server and accept requests.
    * If the album page shows an exclamation mark, check your launch arguments for Spotify and your config

# Configuration
The server can be configured in the `config.json` file.

| Option    | Description                                                                                                                                                                  | Data type |
|-----------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------|
| port      | Port on which the web and WebSocket server binds to (TODO: make these separate variables, as this can cause problems and security issues)                                                        | Integer   |
| useSecure | If true, enables https:// and wss://                                                                                                                                         | Boolean   |
| cert      | Location of https certificate file                                                                                                                                           | String    |
| key       | Location of https private key file                                                                                                                                           | String    |
| chain     | Location of https chain file                                                                                                                                                 | String    |
| endpoint  | Endpoint at which the user can send HTTP GET requests to the API                                                                                                             | String    |
| ipAddress | IP Address (preferably a LAN address) at which the Spotify client connects to. This is mainly useful if the web server and the Spotify client are on two different machines. | String    |
