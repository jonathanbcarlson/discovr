/**
 * This is an example of a basic node.js script that performs
 * the Authorization Code oAuth2 flow to authenticate against
 * the Spotify Accounts.
 *
 * For more information, read
 * https://developer.spotify.com/web-api/authorization-guide/#authorization_code_flow
 */

// import SpotifyPlayer from 'react-spotify-web-playback';
// import React from 'react';
// import express from 'express';
// import request from 'request';
// import cors from 'cors';
// import querystring from 'querystring';
// import cookieParser from 'cookieparser';


var express = require('express'); // Express web server framework
var request = require('request'); // "Request" library
var cors = require('cors');
var querystring = require('querystring');
var cookieParser = require('cookie-parser');

//use jsdom to use jquery
var jsdom = require('jsdom');
const { data } = require('jquery');
const { JSDOM } = jsdom;
const { window } = new JSDOM();
const { document } = (new JSDOM('')).window;
global.document = document;

var $ = jQuery = require('jquery')(window);


var client_id = '8c5ec548a1b54161a9dc2df93984bd46'; // my client id
// var client_id = '2102d6bf57714410a8f50dd1ccadc571';    // glitch client id
var client_secret = '72fb5bf689c84b0f9e97174846847c37'; // Your secret
var redirect_uri = 'http://localhost:8888/callback'; // Your redirect uri
// var redirect_uri = 'https://spotify-web-playback.glitch.me'; //glitch redirect_uri


// var script = document.createElement('script');
// script.src = 'https://code.jquery.com/jquery-3.4.1.min.js';
// script.type = 'text/javascript';
// var script = document.createElement('script');
// script.src = 'https://sdk.scdn.co/spotify-player.js';
// script.type = 'text/javascript';
/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
var generateRandomString = function (length) {
    var text = '';
    var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (var i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
};

//random search
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

var stateKey = 'spotify_auth_state';

var app = express();

app.use(express.static(__dirname + '/public'))
    .use(cors())
    .use(cookieParser());


// const csp = require('express-csp-header');
// app.use(csp({
//     policies: {
//         'default-src': [csp.NONE],
//         'img-src': [csp.SELF],
//     }
// }));


app.get('/login', function (req, res) {

    var state = generateRandomString(16);
    res.cookie(stateKey, state);
    // your application requests authorization
    var scope = 'user-read-private user-read-email streaming';
    res.redirect('https://accounts.spotify.com/authorize?' +
        querystring.stringify({
            response_type: 'code',
            client_id: client_id,
            scope: scope,
            redirect_uri: redirect_uri,
            state: state
        }));
});

var access_token = '';

app.get('/callback', function (req, res) {

    // your application requests refresh and access tokens
    // after checking the state parameter
    console.log("/callback");

    var code = req.query.code || null;
    var state = req.query.state || null;
    var storedState = req.cookies ? req.cookies[stateKey] : null;

    if (state === null || state !== storedState) {
        res.redirect('/#' +
            querystring.stringify({
                error: 'state_mismatch'
            }));
        console.log('/callback: state_mismatch error');
    } else {
        res.clearCookie(stateKey);
        var authOptions = {
            url: 'https://accounts.spotify.com/api/token',
            form: {
                code: code,
                redirect_uri: redirect_uri,
                grant_type: 'authorization_code'
            },
            headers: {
                'Authorization': 'Basic ' + (new Buffer.from(client_id + ':' + client_secret).toString('base64'))
            },
            json: true
        };

        request.post(authOptions, function (error, response, body) {
            if (!error && response.statusCode === 200) {

                access_token = body.access_token,
                    refresh_token = body.refresh_token;

                console.log('/callback access_token: ', access_token);
                // var options = {
                //   url: 'https://api.spotify.com/v1/me',
                //   headers: { 'Authorization': 'Bearer ' + access_token },
                //   json: true
                // };

                // // use the access token to access the Spotify Web API
                // request.get(options, function(error, response, body) {
                //   console.log(body);
                //   console.log('test');
                // });

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

                let spotify_uri = '';
                request.get(search, function (error, response, body) {
                    // console.log(body);
                    console.log('track is: ', body.tracks.items[0].uri);
                    spotify_uri = body.tracks.items[0].uri;
                    console.log('error is: ', error);
                    // console.log(response);

                });

                // we can also pass the token to the browser to make requests from there
                res.cookie('spotify_uri', spotify_uri);
                res.cookie('access_token', access_token);
                res.cookie('refresh_token',refresh_token);
                res.redirect('/#' +
                    querystring.stringify({
                        access_token: access_token,
                        refresh_token: refresh_token
                    }));
            } else {
                res.redirect('/#' +
                    querystring.stringify({
                        error: 'invalid_token'
                    }));
            }
        });
    }
});

app.get('/playback', function (req, res) {

    var authOptions = {
        url: 'https://accounts.spotify.com/api/token',
        headers: { 'Authorization': 'Basic ' + (new Buffer.from(client_id + ':' + client_secret).toString('base64')) },
        json: true
    };

    console.log('req in /playback is: ', req);
    spotify_uri = req.cookies['spotify_uri']; //('spotify_uri');
    console.log('playback uri is:', spotify_uri);
    res.statusCode = 200;
    res.send(
        {
            'spotify_uri': spotify_uri
        }
    );
    // request.post(authOptions, function (error, response, body) {
    //     if (!error && response.statusCode === 200) {
    //         // var access_token = body.access_token;
    //         console.log('playback uri is:', uri);
    //         console.log(response);
    //         console.log(body);
    //         console.log(error);
    //         res.send({
    //             'spotify_uri': uri
    //         });
    //     }
    //     else
    //     {
    //         console.log('post in playback was unsuccesful\n');
    //         // console.log(response);           
    //         console.log('Req:', req);
    //         console.log(response.statusCode);
    //         console.log(body);
    //         console.log(error);
    //     }
    // });
});


app.get('/refresh_token', function (req, res) {

    // requesting access token from refresh token
    var refresh_token = req.query.refresh_token;
    var authOptions = {
        url: 'https://accounts.spotify.com/api/token',
        headers: { 'Authorization': 'Basic ' + (new Buffer.from(client_id + ':' + client_secret).toString('base64')) },
        form: {
            grant_type: 'refresh_token',
            refresh_token: refresh_token
        },
        json: true
    };

    request.post(authOptions, function (error, response, body) {
        if (!error && response.statusCode === 200) {
            var access_token = body.access_token;
            res.send({
                'access_token': access_token
            });
        }
    });
});

// ReactDOM.render(
//   <SpotifyPlayer
//     token=""
//     uris={['spotify:artist:6HQYnRM4OzToCYPpVBInuU']}
//   />;
//   document.getElementById('root');
// );

console.log('Listening on 8888');
app.listen(8888);
