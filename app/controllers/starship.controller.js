const db = require("../models");
const Starship = db.starship;
const StarshipClass = db.starshipClass;
const Op = db.Sequelize.Op;

// Create a new Starship
exports.create = (req, res) => {

  // Validating request
  if (!req.body.name || !req.body.starshipClassId) { // If there's no name or classId provided
    // Sends an error
    res.status(400).send({
      message: "Content can not be empty!"
    });
    return;
  }

  // Function to get the value of the Fuel left which is the Fuel Capacity of the Starship's class
  async function getInitialFuelLeft(starshipClassId) {

    // Retrieving data of the selected class
    const rawStarshipClassData = await StarshipClass.findByPk(starshipClassId);

    // Transforming the data into a JSON object with only the class data
    const starshipClassData = JSON.parse(JSON.stringify(rawStarshipClassData, null, 2));

    // Saving the Fuel Capacity value of the selected class as the Fuel left for the Starship being created
    let initialFuelLeft = starshipClassData['fuelCapacity'];

    return initialFuelLeft;

  }

  // Getting the value for the Fuel Left
  getInitialFuelLeft(req.body.starshipClassId)
    .then(initialFuelLeft => {

      // Creating a new Starship with the data provided
      const starship = {
        name: req.body.name,
        fuelLeft: initialFuelLeft,
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

    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while getting the Fuel Capacity value from the Starship Class."
      });
    });

};

// Find a single Starship by id
exports.findOneById = (req, res) => {

  // Getting starship id from the URL
  const id = req.params.id;

  Starship.findByPk(id)
    .then(data => {
      if (data) {
        res.send(data);
      } else {
        res.status(404).send({
          message: `Cannot find Starship with id=${id}.`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Error retrieving Starship with id=" + id
      });
    });

};

// Find a single Starship by name
exports.findOneByName = (req, res) => {

  // Getting starship name from the URL
  const name = req.params.name;

  Starship.findOne({ where: { name: name } })
    .then(data => {
      if (data) {
        res.send(data);
      } else {
        res.status(404).send({
          message: `Cannot find Starship with name=${name}.`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Error retrieving Starship with name=" + name
      });
    });

};

// Find all Starships
exports.findAll = (req, res) => {

  Starship.findAll()
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving the Starships."
      });
    });

};

// Find all Starships of a class
exports.findAllOfClass = (req, res) => {

  // Getting the starship class id from the URL
  const classId = req.params.id;

  Starship.findAll({ where: { starshipClassId: classId }  })
    .then(data => {
      if (data) {
        res.send(data);
      } else {
        res.status(404).send({
          message: `No Starships found for the class with id=${classId}.`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving the Starships."
      });
    });

};

// Update a single Starship by id
exports.updateById = (req, res) => {

};

// Delete a single Starship by id
exports.deleteById = (req, res) => {

};