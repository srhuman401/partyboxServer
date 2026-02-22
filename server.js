import express from "express";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import { WebSocketServer } from "ws";
import { handleMessage, handleDisconnect, getRoomInfo, turnRoomIntoData } from "./rooms.js";
import { saveProfiles, getOrCreateProfile, generateNewUserId, getProfile } from "./profiles.js"
//import { settings } from "cluster";

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const PORT = 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function serveMainPage(res) {
    res.sendFile('index.html', { root: 'public/dumbfront' });
}

app.use(express.json())

// open
app.use('/public', express.static(path.join(__dirname, 'public')));
// app.get('*', (req, res) => {
  
// });

// testing
app.get("/", (req, res) => {
    serveMainPage(res)
    //res.send("partybox server running");
});
app.get("/join", (req, res) => {
    serveMainPage(res)
}) // redirect to main page
app.get("/view/manage-profile", (req, res) => {
    res.sendFile('index.html', { root: 'public/manageprofile' });
})
app.get("/a/uid-generator", (req,res) => {
    res.json({result: generateNewUserId()})
})
app.post("/a/c-profile", (req, res) => {
    console.log(req.body)
    const {uid} = req.body
    const profile = getOrCreateProfile(uid)
    res.json(profile)
})
app.get("/a/check-profile/:uid", (req,res) => { 
    const uid = req.params.uid
    if (getProfile(uid)) {
        res.send({status: true})
        return
    }
    res.status(400).send({status: false})
})
app.get("/a/user-avatar/:uid", (req, res) => {
    const uidParam = req.params.uid.split('.')[0]
    const profile = getProfile(uidParam)
    if (profile) {
        const avatarId = profile.avatar || "p1"
        res.sendFile(avatarId+".png", { root: 'public/assets/player-avatars' })
        return
    }
    res.status(400)
})
app.post("/a/set-avatar/", (req, res) => {
    const {uid, avatar} = req.body
    const profile = getProfile(uid)
    if (profile) {
        profile.avatar = avatar
        res.status(200)
        return
    }
    res.status(400)
})

wss.on("connection", (ws) => {
    console.log("New client connected");

    ws.on("message", (message) => {
        const data = JSON.parse(message.toString());
        console.log("[Message recieved]: ", data)
        handleMessage(ws, data);
    });

    ws.on("close", () => {
        console.log('Client disconnected')
        handleDisconnect(ws);
    });
});

// api methods
app.get('/a/status', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'services are up' });
});
app.get('/a/check-room/:rc', (req, res) => {
    const roomCode = req.params.rc;
    const room = getRoomInfo(roomCode);
    if (room) {
        res.status(200).json({
            status: true,
            data: turnRoomIntoData(room)
        });
    };
    if (!room) {
        res.status(400).json({
            status: false,
            message: "noRoomFound"
        });
    };
});
app.get('/a/fuck-you', (req, res) => {
    res.send('my name is xobytrap and im evil')
});
app.get('/a/get-user-avatar/:uid', (req, res) => {
    res.sendFile()
})

// error pages
app.use("/a", (req, res) => {
  res.status(404).json({ error: "API not found" });
})
app.use((req, res) => {
    res.status(404).send("404: Page not found")
  //res.status(404).sendFile(__dirname + "/public/404.html");
})

setInterval(saveProfiles, 20);

server.listen(PORT, '0.0.0.0', () => {
    console.log("Server running at port 3000")
});