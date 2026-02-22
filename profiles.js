import fs from "fs"
import {generateUsername} from "./utility.js"
import { profile } from "console"
const PROFILES_PATH = "./persistent/profiles.json"

// defines what fields profiles should and should not have(1 layer)
const PROFILE_TEMPLATE = {
    uid: "",
    wins: 0,
    avatar: "p1",
    name: "MY-USERNAME"
}

let profiles = {}
if (fs.existsSync(PROFILES_PATH)) {
    const rawloaded = fs.readFileSync(PROFILES_PATH, 'utf-8')
    profiles = JSON.parse(rawloaded)
}

reconcileProfiles()

function doReconcileProfile(profile) {
  const cleanProfile = {}
  for (const key in PROFILE_TEMPLATE) {
    if (profile.hasOwnProperty(key)) {
      cleanProfile[key] = profile[key]
    } else {
      cleanProfile[key] = PROFILE_TEMPLATE[key]
    }
  }

  return cleanProfile
}

function reconcileProfiles() {
    for (const key of Object.keys(profiles)) {
        const profile = profiles[key]
        const cleanedProfile = doReconcileProfile(profile)
        profiles[key] = cleanedProfile
    }
}

export function saveProfiles() {
    fs.writeFileSync(PROFILES_PATH, 
        JSON.stringify(profiles, null, 2)
    )
}

export function generateNewUserId() {
    return crypto.randomUUID()
}

export function getOrCreateProfile(uid) {
    if (!profiles[uid]) {
        profiles[uid] = {
            uid,
            name: generateUsername()
        }
        profiles[uid] = doReconcileProfile(profiles[uid])
    }
    return profiles[uid]
}

export function getProfileAvatarPath(avatarname) {
    return "/public/assets/player-avatars/"+avatarname+".png"
}

export function getProfile(uid) {
    return profiles[uid]
}