# Partybox Local Server
Server for my Jackbox Party Pack inspired game, designed to be hosted locally

## GAME CLIENT
Not released, will be open source when released and made in Godot Engine.

## Guide
Create persistent/profiles.json with empty json: `{}` or it wont work
server logic and routing is in server.js, game logic and websocket message handling is in rooms.js, profile saving and loading is in profiles.js


## How to Host
Open cmd in this dir and run `node server.js`
Will be hosted to [YOUR_IP]:3000 or localhost:3000
Is kind of useless without game client however

## Server
Code is very messy, inexperienced with web development and server
game client is not public yet

## my Goals
Seperate game handling into games/ with js for each game
improve frontend html, javascript, and styles