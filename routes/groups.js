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

    const validExclusions = exclusions.filter(([user1, user2]) => {
        return users.includes(user1) && users.includes(user2) && user1 !== user2;
    });

    console.log("Users: " + users.toString() + ", exclusions: " + exclusions);
    const pairings = assignPairings(users, validExclusions);

    if (!pairings) {
        return res.status(400).json({ success: false, message: "Impossible to create valid pairings with the exclusions." });
    }

    const groups = readGroupsFile();

    groups[groupName] = { groupName, users, pairings };
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
    const pairings = new Map();
    const pickedUsers = [];
    let shuffledUsers = [...users].sort(() => Math.random() - 0.5);

    exclusions.forEach(([person, dontUse]) => {
        shuffledUsers.remove(person);

        pickedUsers.forEach((user) => {
            shuffledUsers.remove(user);
        });

        exclusions.forEach(([gifter, exeption]) => {
            if (gifter === person) {
                shuffledUsers.remove(exeption);
            }
        });

        const randomUser = shuffledUsers[Math.floor(Math.random() * shuffledUsers.length)];
        pairings.set(person, shuffledUsers[randomUser]);
        pickedUsers.add(randomUser);

        shuffledUsers = [...users].sort(() => Math.random() - 0.5);
    });

    shuffledUsers.forEach(([user]) => {
        if (!pairings.has(user)) {
            shuffledUsers.remove(user);

            pickedUsers.forEach((user) => {
                shuffledUsers.remove(user);
            });

            const randomUser = shuffledUsers[Math.floor(Math.random() * shuffledUsers.length)];
            pairings.set(user, shuffledUsers[randomUser]);
            pickedUsers.add(randomUser);

            shuffledUsers = [...users].sort(() => Math.random() - 0.5);
        }
    });

    if (!validatePairings(pairings, users, exclusions)) {
        return null;
    }

    return Object.fromEntries(pairings);
}

// Validator to check if pairings are valid
function validatePairings(pairings, users, exclusions) {
    const pairedUsers = new Set();

    for (const [gifter, receiver] of pairings) {
        if (pairedUsers.has(gifter) || pairedUsers.has(receiver)) {
            return false; // Duplicate pairing
        }
        if (!users.includes(gifter) || !users.includes(receiver)) {
            return false; // Invalid user
        }
        pairedUsers.add(gifter);
        pairedUsers.add(receiver);

        // Check exclusions
        if (exclusions.some(([user1, user2]) => user1 === gifter && user2 === receiver)) {
            return false; // Exclusion violation
        }
    }

    if (pairedUsers.size !== users.length) {
        return false; // Not all users are paired
    }

    return true;
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