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


// Importing the models and Sequelize (in db)
const db = require("./app/models");

// Function to test the connection to the database
const testDbConnection = async function () {
  try {
    await db.sequelize.authenticate();
    console.log('Connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
}

// Testing the connection
testDbConnection();

// Synchronizes all the models at once
db.sequelize.sync()
  .then(() => {
    console.log("All models were synchronized successfully.");
  })
  .catch((err) => {
    console.log("Failed to synchronize the models: " + err.message);
  });


// Simple route to test the app
app.get("/", (req, res) => {
  res.json({ message: "The application is working." });
});

// Set port, listen for requests
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});