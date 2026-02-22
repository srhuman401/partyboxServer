const NAME_KEYWORDS = [  "Apple", "River", "Cloud", "Stone", "Forest", "Ocean", "Sky", "Field",
  "Mountain", "Valley", "Sun", "Moon", "Star", "Tree", "Leaf", "Flower",
  "Grass", "Rain", "Snow", "Wind", "Fire", "Light", "Shadow", "Lake",
  "Hill", "Bridge", "Road", "Path", "Meadow", "Garden", "Island", "Beach",
  "Wave", "Stream", "Rock", "Sand", "Shell", "Bird", "Feather", "Wolf",
  "Fox", "Bear", "Lion", "Tiger", "Horse", "Deer", "Frog", "Bee",
  "Stone", "Wood", "Clay", "Glass", "Paper", "Book", "Chair", "Table",
  "Clock", "Door", "Window", "House"]

export function generateUsername() {
    const numWords = 3
    let words = []
    for (let i = 1; i <= numWords; i++) {
        var RandomIdx = Math.floor(Math.random() * NAME_KEYWORDS.length)
        words.push(NAME_KEYWORDS[RandomIdx].toUpperCase())
    }
    var randomNumber = Math.floor(Math.random() * (999 - 100 + 1)) + 100
    words.push(String(randomNumber))
    return words.join('-')
}

export function generateCode() {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let code = "";

    for (let i = 0; i < 4; i++) {
        code += letters[Math.floor(Math.random() * letters.length)];
    }

    return code
}