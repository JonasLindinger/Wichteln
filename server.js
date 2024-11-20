const express = require('express');
const path = require('path');

const app = express();

// Middleware to serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Set EJS as the view engine
app.set("view engine", "ejs");

app.get("/", (req, res) => {
   res.render("index");
});

const groupRouter = require("./routes/groups");
app.use("/groups", groupRouter);

// Start the server
const PORT = 3001;
app.listen(PORT, () => console.log("Server running on http://localhost:" + PORT));