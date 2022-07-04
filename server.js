// Importing Express and Cors
const express = require("express");
const cors = require("cors");

// Creating a new Express app
const app = express();

var corsOptions = {
  origin: "http://localhost:3001"
};

// Make the app use cors with the options provided
app.use(cors(corsOptions));

// Parse requests of content-type - application/json
app.use(express.json());

// Parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

// Simple route to test the app
app.get("/", (req, res) => {
  res.json({ message: "The application is working." });
});

// Set port, listen for requests
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});