const hostname = window.location.hostname
const SITE_URL = "http://"+hostname+":3000"
const SOCKET = new WebSocket(`ws://${hostname}:3000`)

const CODE_TEXT = document.getElementById("gameCode")
const PLAYERLIST_TEXT = document.getElementById("playerList")

SOCKET.onmessage = (msg) => {
    const data = JSON.parse(msg.data)
    switch (data.type) {
        case "player_list":
            const text = data.players.map(p => p.displayname).join(', ')
            PLAYERLIST_TEXT.textContent = text
            break
        case "room_created":
            CODE_TEXT.textContent = data.code
            break
    }
}

SOCKET.onopen = () => {
    SOCKET.send(JSON.stringify({
        type: "create_room",
        gameType: "testGame"
    }));
}