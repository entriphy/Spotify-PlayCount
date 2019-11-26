chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === "complete" && tab.active) {
        let url = tab.url;
        if (url.startsWith("https://open.spotify.com/album/")) {
            chrome.tabs.sendMessage(tab.id, {album: url.replace("https://open.spotify.com/album/", "")});
        } else if (url.startsWith("https://open.spotify.com/artist/")) {
            chrome.tabs.sendMessage(tab.id, {artist: url.replace("https://open.spotify.com/artist/", "")});
        }
    }
})