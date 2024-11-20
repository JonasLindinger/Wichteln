const express = require("express");
const bodyParser = require('body-parser');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// Path to the groups.json file
const groupsFilePath = path.join("groups.json");

router.use(bodyParser.json());

router.get("/new", (req, res) => {
    res.render("new");
});

router.get("/join", (req, res) => {
    res.render("join");
});

router.post("/new", (req, res) => {
    const { users, exclusions } = req.body;
    const groupName = generateGroupName(users);

    if (users.length < 3) {
        return res.status(400).json({ success: false, message: "At least 3 users are required." });
    }

    // Validate exclusions
    const validExclusions = exclusions.filter(([user1, user2]) => {
        return users.includes(user1) && users.includes(user2) && user1 !== user2;
    });

    // Generate pairings
    const pairings = assignPairings(users, validExclusions);

    if (!pairings) {
        return res.status(400).json({ success: false, message: "Impossible to create valid pairings with the exclusions." });
    }

    // Read the existing groups from the file
    const groups = readGroupsFile();

    // Add the new group to the groups object
    groups[groupName] = { groupName, users, pairings };

    // Save the updated groups object back to the file
    saveGroupsToFile(groups);

    res.json({ success: true, groupName });
});

function generateGroupName(users) {
    // Check if the users array is empty
    if (users.length < 1) {
        console.error("Users array is empty!");
        return;
    }

    // Define an array of characters for the hash
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const charArray = chars.split('');

    // Get the current time in milliseconds
    const currentTime = Date.now().toString();

    // Pick a random user from the users array
    const randomUser = users[Math.floor(Math.random() * users.length)];

    // Generate a random hash of 8 characters
    let hash = '';

    // Use a mix of random characters, the current time, and a random user
    for (let i = 0; i < 8; i++) {
        if (i % 3 === 0) {
            // Include a character from the random user's name or value
            hash += randomUser[i % randomUser.length];
        } else if (i % 2 === 0) {
            // Pick a random character from the array
            hash += charArray[Math.floor(Math.random() * charArray.length)];
        } else {
            // Use a digit from the current time
            hash += currentTime[i % currentTime.length];
        }
    }

    return hash;
}

// Pairing algorithm
function assignPairings(users, exclusions) {
    const shuffledUsers = [...users].sort(() => Math.random() - 0.5);
    const pairings = new Map();

    for (let i = 0; i < shuffledUsers.length; i++) {
        const gifter = shuffledUsers[i];
        const receiver = shuffledUsers[(i + 1) % shuffledUsers.length];

        // Todo: Do better exclusions
        if (false) {
            // Check if the gifter → receiver is in the exclusions list
            if (exclusions.some(([user1, user2]) => user1 === gifter && user2 === receiver)) {
                return null; // Exclusion makes it impossible for gifter to gift receiver
            }
        }

        // If no exclusion, make the pairing
        pairings.set(gifter, receiver);
    }

    return Object.fromEntries(pairings);
}
// Function to read the groups file
function readGroupsFile() {
    if (!fs.existsSync(groupsFilePath)) {
        return {}; // Return an empty object if the file doesn't exist
    }
    const fileData = fs.readFileSync(groupsFilePath);
    return JSON.parse(fileData);
}

// Function to save all groups into the groups.json file
function saveGroupsToFile(groups) {
    fs.writeFileSync(groupsFilePath, JSON.stringify(groups, null, 2));
}

router.get("/:id", (req, res) => {
    const id = req.params.id;
    const groups = readGroupsFile();

    if (!(id in groups)) {
        return res.status(400).json({ success: false, message: "Group id / name not found!" });
    }

    // Pass the specific group to the EJS template
    res.render("group", { group: groups[id] });
});

module.exports = router;