const AVATAR_IMG = document.getElementById("userAvatarImg")
const USERNAME_LABEL = document.getElementById("usernameLabel")
const PUBLIC_AVATARS = ['p1', 'p2', 'p3', 'p4', 'p5']
const urlParams = new URLSearchParams(window.location.search);
const queryPERSISTENTUSERID = urlParams.get("id")

const hostname = window.location.hostname
const SITE_URL = "http://"+hostname+":3000"
const APIH = SITE_URL+"/a/"
const PUBLIC_ASSETS = SITE_URL+"/public/"
const SOCKET = new WebSocket(`ws://${hostname}:3000`)
const IMAGE_AVATAR_MAIN_PATH = PUBLIC_ASSETS+"assets/player-avatars/"
if (queryPERSISTENTUSERID) {
  localStorage.setItem("__token", queryPERSISTENTUSERID)
}
const USER_ID = localStorage.getItem("__token")
let CACHED_PROFILE = {}

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

function setProfileAvatar(id) {
  AVATAR_IMG.src = IMAGE_AVATAR_MAIN_PATH+id+".png"
}

function onProfileGot() {
  setProfileAvatar(CACHED_PROFILE.avatar||"p1")
  USERNAME_LABEL.textContent = CACHED_PROFILE.name||"USERNAME"
}

function showScreen(id) {
  document.querySelectorAll(".screen")
    .forEach(el => el.classList.add("hidden"));

  document.getElementById(id)
    .classList.remove("hidden");
}

AVATAR_IMG.addEventListener("click", () => {
    showScreen("profileSelection")
})

function createSetAvatarBtn(id) {
    const ELEMENT = document.createElement("img")
    ELEMENT.src = IMAGE_AVATAR_MAIN_PATH+id+".png"
    ELEMENT.className="select-avatar-image"
    document.getElementById("profileSelection").appendChild(ELEMENT)
    ELEMENT.addEventListener("click", () => {
      CACHED_PROFILE.avatar = id
      tryPost(APIH+"set-avatar", {uid: CACHED_PROFILE.uid, avatar: id})
      onProfileGot()
      showScreen("profileCard")
    })
}

async function init() {
  const ID = USER_ID||"_j"
  const DOES_PROFILE_EXIST = await getRequest(APIH+"check-profile/"+USER_ID)
  if (!DOES_PROFILE_EXIST) {
    showScreen("Invalid")
    return
  }
  const PROFILE_DATA = await tryPost(APIH+"c-profile", {uid: USER_ID})
  if (PROFILE_DATA) {
    CACHED_PROFILE = PROFILE_DATA
    onProfileGot()
  }else{
    showScreen("Invalid")
    return
  }

  PUBLIC_AVATARS.forEach(id => createSetAvatarBtn(id))
}

init()