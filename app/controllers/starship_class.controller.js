const db = require("../models");
const StarshipClass = db.starshipClass;
const Op = db.Sequelize.Op;

// Create a new Starship Class
exports.create = (req, res) => {

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