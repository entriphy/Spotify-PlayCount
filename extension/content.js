// This is the dumbest thing I've ever made. God send help.

const config = {
    "hermes": "http://localhost:8080/hermes"
}

function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function waitUntilTrue(func, inter, tries) {
    return new Promise((resolve, reject) => {
        let _try = 0;
        
        const interval = setInterval(() => {
            if (func()) {
                clearInterval(interval);
                resolve();
            } else if (++_try === tries) {
                clearInterval(interval);
                reject();
            }
        }, inter);
    });
}

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
    if (request.artist) {
        await waitUntilTrue(() => document.getElementsByClassName("tracklist").length > 0, 50, 20).catch(() => console.log("Unable to load page in time."));
        await waitUntilTrue(() => document.getElementsByClassName("tracklist")[0].children.length > 0, 50, 20).catch(() => console.log("Unable to load page in time."));
        const xhr = new XMLHttpRequest();
        xhr.onreadystatechange = () => {
            if (xhr.readyState > 3 && xhr.status == 200) {
                const res = JSON.parse(xhr.responseText);
                if (res.success) {
                    let tracklist = document.getElementsByClassName("tracklist")[0];
                    
                    let topTracks = res.data.top_tracks.tracks;
                    for (let i = 5; i < topTracks.length; i++) {
                        let topTrack = topTracks[i];
                        let elm = document.createElement("div");
                        elm.innerHTML = `<div class="react-contextmenu-wrapper"><div draggable="true"><li class="tracklist-row${!topTrack.explicit ? ' tracklist-row--oneline' : ''}" role="button" tabindex="0"><div class="tracklist-col position-outer"><div class="tracklist-play-pause tracklist-${topTrack.explicit ? 'top' : 'middle'}-align"><svg class="icon-play" viewBox="0 0 85 100"><path fill="currentColor" d="M81 44.6c5 3 5 7.8 0 10.8L9 98.7c-5 3-9 .7-9-5V6.3c0-5.7 4-8 9-5l72 43.3z"><title>PLAY</title></path></svg></div><div class="position tracklist-${topTrack.explicit ? 'top' : 'middle'}-align"><span class="spoticon-track-16"></span></div></div><div class="tracklist-col tracklist-col-cover-art-thumb"><div class="cover-art shadow tracklist-${topTrack.explicit ? 'top' : 'middle'}-align cover-art--with-auto-height" aria-hidden="true" style="width: 50px; height: auto;"><div><div class="icon"><svg width="80" height="81" viewBox="0 0 80 81" xmlns="http://www.w3.org/2000/svg"><title>Playlist Icon</title><path d="M25.6 11.565v45.38c-2.643-3.27-6.68-5.37-11.2-5.37-7.94 0-14.4 6.46-14.4 14.4s6.46 14.4 14.4 14.4 14.4-6.46 14.4-14.4v-51.82l48-10.205V47.2c-2.642-3.27-6.678-5.37-11.2-5.37-7.94 0-14.4 6.46-14.4 14.4s6.46 14.4 14.4 14.4S80 64.17 80 56.23V0L25.6 11.565zm-11.2 65.61c-6.176 0-11.2-5.025-11.2-11.2 0-6.177 5.024-11.2 11.2-11.2 6.176 0 11.2 5.023 11.2 11.2 0 6.174-5.026 11.2-11.2 11.2zm51.2-9.745c-6.176 0-11.2-5.024-11.2-11.2 0-6.174 5.024-11.2 11.2-11.2 6.176 0 11.2 5.026 11.2 11.2 0 6.178-5.026 11.2-11.2 11.2z" fill="currentColor" fill-rule="evenodd"></path></svg></div><div class="_60a28f9bc4e6da8926e466ec2cd3304c-scss _62dbfd36511d6e3ae95fb3c6bbc86edc-scss"><div class="cover-art-image" style="background-image: url(&quot;${topTrack.release.cover.uri}&quot;);"></div></div></div></div></div><div class="tracklist-col name"><div class="track-name-wrapper tracklist-${topTrack.explicit ? 'top' : 'middle'}-align"><div class="tracklist-name ellipsis-one-line" dir="auto">${topTrack.name}</div>${topTrack.explicit ? '<div class="second-line"><span class="TrackListRow__explicit-label">Explicit</span></div>' : ''}</div></div><div class="tracklist-col more"><div class="tracklist-${topTrack.explicit ? 'top' : 'middle'}-align"><div class="react-contextmenu-wrapper"><button class="btn btn-transparent btn--narrow btn--no-margin btn--no-padding"><div class="spoticon-ellipsis-16"></div></button></div></div></div><div class="tracklist-col tracklist-col-duration"><div class="tracklist-duration tracklist-${topTrack.explicit ? 'top' : 'middle'}-align"><span>${''}</span></div></div></li></div></div>`
                        tracklist.appendChild(elm);
                    }

                    let tracks = document.getElementsByClassName("track-name-wrapper");
                    for (let i = 0; i < tracks.length; i++) {
                        const track = tracks[i];
                        if (track.classList.contains("tracklist-middle-align")) { // Track is not explicit
                            const trackName = track.firstChild.innerText;
                            track.innerHTML = `<div class="tracklist-name ellipsis-one-line" dir="auto">${trackName}</div><div class="second-line"><span class="TrackListRow__explicit-label">Plays: ${numberWithCommas(topTracks[i].playcount)}</span></div>`
                        } else { // Track is explicit
                            track.children[1].firstChild.innerText += ", Plays: " + numberWithCommas(topTracks[i].playcount);
                        }
                    }
                }
            }
        }
        xhr.open("GET", encodeURI(`${config.hermes}?uri=hm://artist/v1/${request.artist}/desktop?format=json`));
        xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
        xhr.send();
    } else if (request.album) {
        await waitUntilTrue(() => document.getElementsByClassName("tracklist").length > 0, 50, 20).catch(() => console.log("Unable to load page in time."));
        await waitUntilTrue(() => document.getElementsByClassName("tracklist")[0].children.length > 0, 50, 20).catch(() => console.log("Unable to load page in time."));
        const xhr = new XMLHttpRequest();
        xhr.onreadystatechange = () => {
            if (xhr.readyState > 3 && xhr.status == 200) {
                const res = JSON.parse(xhr.responseText);
                if (res.success) {
                    const trackPlays = res.data.discs[0].tracks;
                    let tracks = document.getElementsByClassName("tracklist-row");
                    for (let i = 0; i < tracks.length; i++) {
                        let track = tracks[i];
                        let secondLine = track.children[1].firstChild.children[1];
                        if (secondLine.firstChild.classList.contains("TrackListRow__explicit-label")) { // Track is explicit
                            secondLine.firstChild.innerText += ", Plays: " + numberWithCommas(trackPlays[i].playcount); // Add playcount to explicit label
                        } else { // Track is not explicit
                            let elm = document.createElement("span");
                            elm.innerHTML = `<span class="TrackListRow__explicit-label">Plays: ${numberWithCommas(trackPlays[i].playcount)}</span>`; // Create "explicit" label with playcount
                            secondLine.insertBefore(elm, secondLine.firstChild); // Insert element into page
                        }
                    }
                }
            }
        }
        xhr.open("GET", encodeURI(`${config.hermes}?uri=hm://album/v1/album-app/album/spotify:album:${request.album}/desktop?catalogue=free&locale=en`));
        xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
        xhr.send();
    }
});