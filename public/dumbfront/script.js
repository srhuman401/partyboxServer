// i have little experience with web development
// this mess runs the dumb client

// why the hell is it auto adding these???
//const { json, text } = require("express");

//import { Profiler } from "react";

const hostname = window.location.hostname
const SITE_URL = "http://"+hostname+":3000"
const APIH = SITE_URL+"/a/"
const PUBLIC_ASSETS = SITE_URL+"/public/"

const urlParams = new URLSearchParams(window.location.search);
const queryJoinCode = urlParams.get("code")

const JOIN_SCREEN_SUBTEXT_TITLE = document.getElementById("a_JoinSubText")
const GAME_PANEL_DIV = document.getElementById("gamePanel")

const IS_TOUCH_DEVICE = "ontouchstart" in window;

const SOCKET = new WebSocket(`ws://${hostname}:3000`)
let CONTROLLER_NET_LOCK = false
let GAME_STRINGS = {}
getRequest(PUBLIC_ASSETS+"assets/gamelocale.json", p => {
  GAME_STRINGS=p
})

let CACHED_PROFILE = {}

async function generateUserId() {
    const GENERATE_UID = await getRequest(APIH+"uid-generator")
    if (GENERATE_UID && GENERATE_UID.result) {
      const uid = GENERATE_UID.result
      return uid
    }
}

function onProfileCached() {
  console.warn(CACHED_PROFILE)
}

async function reValidateProfile() {
  let USER_ID = localStorage.getItem("__token")
  if (!USER_ID) {
    USER_ID = await generateUserId()
  }
  if (USER_ID) {
      const PROFILE = await tryPost(APIH+"c-profile", {uid: USER_ID})
      const PROFILE_EXISTS_REQ = await getRequest(APIH+"check-profile/"+USER_ID)
      const PROFILE_EXISTS = PROFILE_EXISTS_REQ && PROFILE_EXISTS_REQ.status
      if (PROFILE_EXISTS) {
        CACHED_PROFILE = PROFILE
        onProfileCached()
        localStorage.setItem("__token", PROFILE.uid)
        return true
      }
      localStorage.removeItem("__token")
      return false
  }
  return false
}

async function tryValidating() {
  for (let i = 1; i <= 5; i++) {
    const success = await reValidateProfile()
    if (success) break
  }
}

tryValidating()

async function tryPost(url, data, onsuccess, onfailed) {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    })

    if(!response.ok) {
      if (onfailed) {onfailed()}
      throw new Error(`HTTP POST error, status: ${response.status}`);
    }

    const msg = await response.json()
    console.log(msg)
    if (onsuccess) {
      onsuccess(msg)
    }
    return msg
  } catch (error) {

  }
}

async function getRequest(url, onsuccess, onfailed) {
  try {
    const response = await fetch(url); 
    
    if (!response.ok) {
      if (onfailed) {onfailed()}
      throw new Error(`HTTP error, status: ${response.status}`);
    }

    const data = await response.json(); 
    console.log(data);
    if (onsuccess) {
      onsuccess(data)
    }
    return data
  } catch (error) {
    // if (onfailed) {
    //   onfailed()
    // }
  }
}

function getTextBoxInput(id) {
  const inputbox = document.getElementById(id)
  if (inputbox) {
    return inputbox.target.value||"null"
  }
  return "null"
}

function s_Send(msg) {
  const _STRINGED = JSON.stringify(msg)
  SOCKET.send(_STRINGED)
}

function clearGamePanel() {
  GAME_PANEL_DIV.innerHTML = ''
}

function insertNewGamePanelElement(element) {
  const type = element.type
  const params = element.params || {}
  
  switch (type) {
    case "textbutton":
      const button = document.createElement("button")
      const buttonType = params.buttonType || "printbutton"
      const elementId = params.id
      if (elementId) {button.id = elementId}
      button.className = "panel_button"
      const bText = params.text || "[buttonText]"
      button.textContent = bText
      let onclickFn
      
      switch (buttonType) {
        case "printbutton":
          onclickFn = () => {
            console.log(params.printtext || "Print button pressed")
          }
          break
        case "testGameSubmitMessageBtn":
          onclickFn = () => {
            const INPUT_BOX = document.getElementById("gameMessageInputBox")
            const msg = INPUT_BOX.value
            if (msg.length == 0) return
            SOCKET.send(JSON.stringify({
              type: "tell_game_client",
              msg: {
                type: "update_message",
                text: msg
              }
            }))
          }
          break
        case "twtrSubmitGuess":
          onclickFn = () => {
              s_Send({
                type: "tell_game_client",
                msg: {
                  type: "submit_guess",
                  pos: params.position||-1
                }
              })
          }
          break
        case "twtrSubmitForm":
          break
      }

      button.addEventListener("click", () => {
          if (CONTROLLER_NET_LOCK) {
            return
          }
          if (onclickFn) { onclickFn() }
      })
      GAME_PANEL_DIV.appendChild(button)
      break
    case "textbox":
      const bPlaceholderText = params.placeholder || "Type here..."
      const inputBox = document.createElement("input")
      const elemtId = params.id
      if (elemtId) { inputBox.id = elemtId }
      inputBox.type = "text"
      inputBox.className = "panel_inputbox"
      inputBox.placeholder = bPlaceholderText
      GAME_PANEL_DIV.appendChild(inputBox)
      break
    case "text":
      const labelEmt = document.createElement("label")
      const elmtId = params.id
      if (elmtId) { labelEmt.id = elmtId }
      labelEmt.textContent = params.text||""
      if (params.classes) { params.classes.forEach(i => labelEmt.classList.add(i)) }
      GAME_PANEL_DIV.appendChild(labelEmt)
      break
  }
}

function showScreen(id) {
  document.querySelectorAll(".screen")
    .forEach(el => el.classList.add("hidden"));

  document.getElementById(id)
    .classList.remove("hidden");
}

function exitRoom() {
  clearGamePanel()
  showScreen("joinScreen")
}

function handleMessageData(data) {
  switch (data.type) {
        case "set_c_state":
          switch (data.state) {
            case "waiting":
              JOIN_SCREEN_SUBTEXT_TITLE.textContent = ''
              showScreen("waitingScreen")
              break
            case "game":
              clearGamePanel()
              showScreen("gamePanel")
              break
          }
          break;
        case "exit_room":
          exitRoom()
          alert(`Something went wrong (Error: ${data.reason||"unknown"})`)
          break;
        case "clear_gamepanel":
          clearGamePanel()
          break
        // game specific cases (this code sucks)
        case "testgame_show_input":
          clearGamePanel()
          insertNewGamePanelElement({
            type: "textbox",
            params: {
              placeholder: "Enter a message...",
              id: "gameMessageInputBox",
            }
          })
          insertNewGamePanelElement({
            type: "textbutton",
            params: {
              text: "Submit",
              buttonType: "testGameSubmitMessageBtn"
            }
          })
          break
        // Twisted Truth
        case "twtr_start_submission":
          const numberOfTruths = data.truths || 2
          insertNewGamePanelElement({
            type: "text",
            params: {
              text: `Enter ${numberOfTruths} truths`,
            }
          })
          for (let i = 1; i <= numberOfTruths; i++) {
            insertNewGamePanelElement({
              type: "textbox",
              params: {
                placeholder: "Enter a truth...",
                id: `truthInputBox${i}`
              }
            })
          }
          insertNewGamePanelElement({
            type: "text",
            params: {
              text: `And one lie...`,
            }
          })
          insertNewGamePanelElement({
            type:"textbox",
            params: {
              placeholder: "Enter the lie...",
              id: "lieInputBox"
            }
          })
          insertNewGamePanelElement({
            type: "textbutton",
            params: {
              text: "Submit",
              buttonType: "twtrSubmitForm",
              numtruths: numberOfTruths
            }
          })
          break
        case "twtr_start_guessing":
          const choices = data.choices||[{text: "It failed to load!", pos:1}]
          insertNewGamePanelElement({
            type: "text",
            params: {
              text: "Choose the lie!"
            }
          })
          choices.forEach(c => {
            insertNewGamePanelElement({
              type: "textbutton",
              params: {
                text: c.text,
                position: c.position,
                buttonType: "twtrSubmitGuess"
              }
            })
          })
    };
}

SOCKET.onmessage = (msg) => {
    const data = JSON.parse(msg.data)
    console.log(data.type)
    console.log(msg.data)
    handleMessageData(data)
};

document.getElementById('code').addEventListener('change', (evt) => {
  const newCode = evt.target.value
  getRequest(APIH+`check-room/${newCode}`, (data) => {
    console.log('is success')
    if (data.status == true) {
      const roominfo = data.data
      console.log('true status')
      const canJoin = (!roominfo.isFull)
      const playerFill = `${String(roominfo.players)}/${String(roominfo.maxPlayers)}`
      const gameType = roominfo.gameType || "unknown"
      //const gameText = GAME_STRINGS.get(gameType) || "unknown game"
      JOIN_SCREEN_SUBTEXT_TITLE.textContent = `Game: ${gameType} | Players: ${playerFill}`
    } else {
      JOIN_SCREEN_SUBTEXT_TITLE.textContent = ''
    }
  }, () => {
    console.log('error evil')
    JOIN_SCREEN_SUBTEXT_TITLE.textContent = 'No room found'
  })
})

document.getElementById('joinBtn').addEventListener('click', () => {
  const nickname = document.getElementById('nickname').value;
  const code = document.getElementById('code').value;
  if (code.length<4) return
  if (nickname.length<2) return
  //alert(hostname);
  SOCKET.send(JSON.stringify({
    type: "join_room",
    code: code,
    uid: CACHED_PROFILE.uid||"_none",
    nickname: nickname
  }));
});

const MANAGE_PROFILE_LINK = document.getElementById("manageProfileLink")
if (IS_TOUCH_DEVICE && CACHED_PROFILE.uid) {
  MANAGE_PROFILE_LINK.href = "/view/manage-profile?id="+CACHED_PROFILE.uid
}

// init
if (queryJoinCode) {
  document.getElementById("code").value = queryJoinCode
}

showScreen("joinScreen")
if (false) {
showScreen("gamePanel");
insertNewGamePanelElement({
  type: "textbutton",
  params: {
    text: "Cool",
    printtext: "This button was reallllly pressed"
  }
})
insertNewGamePanelElement({
  type: "textbox",
  params: {
    placeholder: "Enter a lie...",
    id: "lieSubmission",
  }
})
insertNewGamePanelElement({
  type: "textbutton",
  params: {
    text: "Cooler",
    printtext: "This button was pressed... sadly"
  }
})
}