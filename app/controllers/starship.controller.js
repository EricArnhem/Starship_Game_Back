const db = require("../models");
const Starship = db.starship;
const Op = db.Sequelize.Op;

// Create a new Starship
exports.create = (req, res) => {

  // Validating request
  if (!req.body.title) { // If there's no title provided (false)
    // Sends an error
    res.status(400).send({
      message: "Content can not be empty!"
    });
    return;
  }

  // Creating a new Starship with the data provided
  const starship = {
    name: req.body.name,
    fuelLeft: 0, // Need to change the value to the fuel capacity of the selected class
    starshipClassId: req.body.starshipClassId
  };

  // Saving the Starship in the database
  Starship.create(starship)
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while creating the Starship."
      });
    });

};

// Find a single Starship by id
exports.findOneById = (req, res) => {

};

// Find a single Starship by name
exports.findOneByName = (req, res) => {

};

// Find all Starships
exports.findAll = (req, res) => {

};

// Find all Starships of a class
exports.findAllOfClass = (req, res) => {

};

// Update a single Starship by id
exports.updateById = (req, res) => {

};

// Delete a single Starship by id
exports.deleteById = (req, res) => {

};