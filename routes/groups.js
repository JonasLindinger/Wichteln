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
    const { users } = req.body;
    const groupName = generateGroupName(users);

    if (users.length < 3) {
        return res.status(400).json({ success: false, message: "At least 3 users are required." });
    }


    // Generate pairings
    const pairings = assignPairings(users);

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
function assignPairings(users) {
    const shuffledUsers = [...users].sort(() => Math.random() - 0.5);
    const pairings = new Map();

    for (let i = 0; i < shuffledUsers.length; i++) {
        const gifter = shuffledUsers[i];
        const receiver = shuffledUsers[(i + 1) % shuffledUsers.length];

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

router.get('/:id', (req, res) => {
    const { id } = req.params; // Get the ID from the URL path
    const { name } = req.query; // Get the "name" query parameter, if present
    const groups = readGroupsFile();

    // Check if group exists
    if (!(id in groups)) {
        return res.status(404).render("error", { message: "Group ID not found!" });
    }

    const group = groups[id];

    // If no "name" query parameter, render the group page
    if (!name) {
        return res.render("group", { group });
    }

    // Check if the name exists in the group's "users" array
    if (group.users.includes(name)) {
        return res.render("pairing", { pairing: group.pairings[name] })
    } else {
        return res.status(404).render("error", { message: "User not found in group!" });
    }
});

module.exports = router;