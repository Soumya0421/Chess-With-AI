const express = require("express");
const path = require("path");

const app = express();

// Serve static files from src
app.use(express.static(path.join(__dirname, "src")));

// Default route → index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "src", "index.html"));
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Chess game running at http://localhost:${PORT}`);
});
