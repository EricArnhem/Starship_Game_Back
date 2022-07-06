const db = require("../models");
const StarshipClass = db.starshipClass;
const Op = db.Sequelize.Op;

// Create a new Starship Class
exports.create = (req, res) => {

  // Validating request
  if (!req.body.name) { // If there's no name provided (false)
    // Sends an error
    res.status(400).send({
      message: "Content can not be empty!"
    });
    return;
  }

  // Creating a new Starship Class with the data provided
  const starship_class = {
    name: req.body.name,
    speed: req.body.speed,
    fuelCapacity: req.body.fuelCapacity,
    color: req.body.color
  };

  // Saving the Starship Class in the database
  StarshipClass.create(starship_class)
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while creating the Starship Class."
      });
    });

};

// Find a single Starship Class by id
exports.findOneById = (req, res) => {

  const id = req.params.id;

  StarshipClass.findByPk(id)
    .then(data => {
      if (data) {
        res.send(data);
      } else {
        res.status(404).send({
          message: `Cannot find a Starship Class with id=${id}.`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Error retrieving a Starship Class with id=" + id
      });
    });

};

// Find a single Starship Class by name
exports.findOneByName = (req, res) => {

};

// Find all Starships Classes
exports.findAll = (req, res) => {

};

// Update a single Starship Class by id
exports.updateById = (req, res) => {

};

// Delete a single Starship Class by id
exports.deleteById = (req, res) => {

};