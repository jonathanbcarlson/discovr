var access_token = '';

const play = ({
    spotify_uri,
    playerInstance: {
        _options: {
            getOAuthToken,
            id
        }
    }
}) => {
    getOAuthToken(access_token => {
        fetch(`https://api.spotify.com/v1/me/player/play?device_id=${id}`, {
            method: 'PUT',
            body: JSON.stringify({ uris: [spotify_uri] }),
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${access_token}`
            },
        });
    });
};

function playSafe(spotify_uri)
{
    if(spotifyPlayerParams.sdkInit == false)
    {
        initializeSpotifyPlayer();
    }
    if (spotifyPlayerParams.playerReady == true)
    {
        play({spotify_uri: spotify_uri,
            playerInstance: player});
    }
}

async function playRandomSong()
{
    var song = await getRandomSong();
    playSafe(song);
}


//leave out of function scope to provide visibility to access_token
var auth = {
    url: 'https://accounts.spotify.com/en/authorize',
    // headers: {
    //     'Content-Type': 'application/json',
    //     //'Authorization': `Bearer ${access_token}`
    // },
    qs: {
        responseType: 'token',
        spotifyClienetId: '4934dfba9b1f4124918b14b0c038088a',
        redirectUri: 'http://localhost:8888/', //lvh.me
        scope: "streaming user-read-email user-modify-playback-state user-read-private",
    },
    json: true,
};

async function getAccessToken ()
{
    var authUrl = new URL(auth.url);
    authUrl.search = new URLSearchParams(auth.qs).toString();
    var response = await fetch(authUrl, {
        method: 'GET',
        //mode: 'no-cors',
        // headers: {
        //     'Content-Type': 'application/json',
        // },
    });
    var data = response.json;
    console.log(data);
    return 'acb';
}


const randomOffset = Math.floor(Math.random() * 100);

function getRandomSearch() {
    // A list of all characters that can be chosen.
    const characters = 'abcdefghijklmnopqrstuvwxyz';

    // Gets a random character from the characters string.
    const randomCharacter = characters.charAt(Math.floor(Math.random() * characters.length));
    let randomSearch = '';

    // Places the wildcard character at the beginning, or both beginning and end, randomly.
    switch (Math.round(Math.random())) {
        case 0:
            randomSearch = randomCharacter + '%';
            break;
        case 1:
            randomSearch = '%' + randomCharacter + '%';
            break;
    }

    return randomSearch;
}

var search = {
    url: 'https://api.spotify.com/v1/search',
    headers: { 'Authorization': 'Bearer ' + access_token },
    qs: {
        q: String(getRandomSearch()),
        type: 'track',
        offset: randomOffset
    },
    json: true,
};


async function getRandomSong(){
    search.qs.q = String(getRandomSearch());
    let spotify_uri = '';
    var searchURL = new URL(search.url);
    searchURL.search = new URLSearchParams(search.qs).toString();
    response = await fetch(searchURL, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${access_token}`
        },
        // request.get(search, function (error, response, body) {
        //     // console.log(body);
        //console.log('track is: ', body.tracks.items[0].uri);
        //     spotify_uri = body.tracks.items[0].uri;
        //     console.log('error is: ', error);
        //     // console.log(response);

    })
    var data = await response.json();
    var song = data.tracks.items[0].uri;

    console.log(data);
    $('#song-title').text(data.tracks.items[0].name);
    $('#song-art').attr('src', data.tracks.items[0].album.images[0].url);
    $('#song-artist').text(data.tracks.items[0].artists[0].name);
    //var title = data.tracks.items[0].name;
    //var art = data.tracks.items[0].album.images[0].url;
    //var artist = data.tracks.items[0].artists[0].name;
    //console.log(title);
    //console.log(art);
    //console.log(artist);
    return song;
    //.then(response => { response.json() })
    //    .then(data => { console.log(data) });
}


function getURLParam(paramName)
{
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const param = urlParams.get(param);
    return param;
}

var spotifyPlayerParams =
{
    sdkReady: false,
    playerReady: false,
    sdkInit: false,
}

function initializeSpotifyPlayer(){
    if (spotifyPlayerParams.sdkReady == false)
    {
        console.log("SDK not ready");
        return;
    }
    player = new Spotify.Player({
        name: 'Web Playback SDK Quick Start Player',
        getOAuthToken: cb => { cb(access_token); }
    });

    // Error handling
    player.addListener('initialization_error', ({ message }) => { console.error(message); });
    player.addListener('authentication_error', ({ message }) => { console.error(message); });
    player.addListener('account_error', ({ message }) => { console.error(message); });
    player.addListener('playback_error', ({ message }) => { console.error(message); });

    // Playback status updates
    player.addListener('player_state_changed', state => { console.log(state); });

    // Ready
    player.addListener('ready', ({ device_id }) => {
        spotifyPlayerParams.playerReady = true;
        playRandomSong();
        console.log('Ready with Device ID', device_id);
    });

    // Not Ready
    player.addListener('not_ready', ({ device_id }) => {
        console.log('Device ID has gone offline', device_id);
    });

    // Connect to the player!
    player.connect();
    spotifyPlayerParams.sdkInit = true;
}