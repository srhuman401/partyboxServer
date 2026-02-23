import { generateCode } from "./utility.js";
import { getProfile } from "./profiles.js";

const rooms = new Map();

function getRoomFromSocket(ws) {
    const roomCode = ws.roomCode
    if (!roomCode) return
    const room = rooms.get(roomCode)
    if (!room) return
    return room
}

export function handleMessage(ws, data) {
    var room = getRoomFromSocket(ws)
    const clientUserId = ws.uid||""
    const isHost = ws.role == "host"
    switch (data.type) {
        case "create_room":
            createRoom(ws, data);
            break;
        case "join_room":
            joinRoom(ws, data);
            break;
        case "start_game":
            if (!isHost) break
            handleGameStart(room)
            break;
        case "send_to_controller_clients":
            if (!isHost) break
            if (data.msg) {
                data.msg.uid = clientUserId
                broadcast(room, data.msg)
            }
            break
        case "tell_game_client": 
            if (isHost) break
            if (data.msg) {
                data.msg.uid = clientUserId
                sendToHost(room, data.msg)
            }
            break
        case "tell_controllers":
            const uids = data.uids||[]
            if (data.msg && room) {
                room.players.forEach(p => {
                    const pid = p.uid||"_none"
                    if (uids.includes(pid)) {
                        p.send(JSON.stringify(data.msg))
                    }
                })
            }
    }
}

function handleGameStart(room) {
    room.locked = true
    setAllDumbClientsToState(room, "game")
    sendToHost(room, {type: "client_start_session"})
}

function createRoom(ws, data) {
    console.log('trying to create room')
    const code = generateCode();

    const room = {
        code,
        host: ws,
        players: [],
        max_players: 4
    }; 

    room.locked = false
    room.gameType = data.gameType;
    room.state = {};
    rooms.set(code, room);

    ws.roomCode = code;
    ws.role = "host";

    console.log('room created,',code)

    ws.send(JSON.stringify({
        type: "room_created",
        code
    }));
}

export function getRoomInfo(code) {
    const room = rooms.get(code);
    if (!room) return;
    return room;
};

export function turnRoomIntoData(room) {
    const NumPlayers = room.players.length
    return {
        players: NumPlayers,
        maxPlayers: room.max_players,
        gameType: room.gameType,
        isRoomFull: (NumPlayers >= room.max_players),
    }
};

function setDumbClientState(ws, state, argument) {
    ws.send(JSON.stringify({
        type: "set_c_state",
        state: state,
        params: argument
    }));
}

function setAllDumbClientsToState(room, state) {
    room.players.forEach( (p) => {
        setDumbClientState(p, state)
    })
}

function isUserIdInRoom(room, uid) {
    room.players.forEach(p => {
        const id = p.uid||"none"
        if (id==uid) return true
    })
    return false
}

function joinRoom(ws, data) {
    const userid = data.uid
    const profile = getProfile(userid)
    if (!profile) return
    const room = rooms.get(data.code);
    if (!room) return
    if (room.locked) return
    if (isUserIdInRoom(room, userid)) return

    ws.roomCode = data.code;
    ws.uid = userid
    ws.nickname = data.nickname;
    setDumbClientState(ws, "waiting")

    room.players.push(ws);
    updatePlayerlistEvent(room)
}

function getPlayerInfoFromWs(ws) {
    console.warn('user id is ',ws.uid)
    return {
        displayname: ws.nickname,
        uid: ws.uid
    }
}

function updatePlayerlistEvent(room) {
    broadcast(room, {
        type: "player_list",
        players: room.players.map(p => getPlayerInfoFromWs(p))
    });
}

function sendStateChangedUpdateEvent(room) {
    broadcast(room, {
        type: "state_changed",
        newstate: room.state
    })
}

function broadcast(room, data) {
    const msg = JSON.stringify(data);

    room.players.forEach(p => p.send(msg));
    room.host.send(msg);
}

function sendToHost(room, data) {
    const msg = JSON.stringify(data)
    room.host.send(msg)
}

export function handleDisconnect(ws) {
    if (!ws.roomCode) return;

    const room = rooms.get(ws.roomCode);
    if (!room) return;

    if (ws == room.host) {
        room.players.forEach(p => p.send(JSON.stringify({
            type: "exit_room",
            reason: "hostLeft",
        })))
        rooms.delete(ws.roomCode)
        return
    }

    room.players = room.players.filter(p => p !== ws);
    updatePlayerlistEvent(room)
}
