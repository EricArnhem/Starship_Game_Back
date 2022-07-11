const fetch = require('node-fetch');

const appConfig = require("../config/app.config.js");

const db = require("../models");

const Starship = db.starship;
const StarshipClass = db.starshipClass;

const Op = db.Sequelize.Op;

// Function to get the Fuel Capacity of the Starship Class
async function getClassFuelCapacity(starshipClassId) {

  // Retrieving data of the selected class
  const rawStarshipClassData = await StarshipClass.findByPk(starshipClassId);

  // Transforming the data into a JSON object with only the class data
  const starshipClassData = JSON.parse(JSON.stringify(rawStarshipClassData, null, 2));

  // Saving the Fuel Capacity value of the selected class as the Fuel left for the Starship being created
  let classFuelCapacity = starshipClassData['fuelCapacity'];

  return classFuelCapacity;

}

// --- CRUD Functions ---
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

  // Getting the value for the Fuel Left
  getClassFuelCapacity(req.body.starshipClassId)
    .then(classFuelCapacity => {

      // Creating a new Starship with the data provided
      const starship = {
        name: req.body.name,
        fuelLeft: classFuelCapacity,
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

  Starship.findAll({ where: { starshipClassId: classId } })
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
exports.updateById = async (req, res) => {

  // Getting starship id from the URL
  const id = req.params.id;

  // Getting data of the starship we try to update
  const starshipData = await Starship.findByPk(id);

  // Function used to check the presence of the 'fuelLeft' and 'starshipClassId' properties and change the fuel left value based on it
  const valuesCheck = async () => {

    // -- If we are trying to change the Fuel left --
    if (req.body.fuelLeft) {

      // Getting the current starship class id
      let currentStarshipClassId = starshipData.starshipClassId;

      // Getting the Fuel capacity of the current starship class using the API
      await fetch(`${appConfig.DOMAIN}/api/starship-class/${currentStarshipClassId}/fuel-capacity`, { method: 'GET' })
        .then(response => response.json())
        .catch(err => {
          throw new Error("Cannot get the fuel capacity of the current starship class.");
        })
        .then((jsonResponse) => {

          const currentClassFuelCapacity = jsonResponse[0].fuelCapacity;

          // If the value of the Fuel left is below 0 or above the maximum capacity
          if (req.body.fuelLeft < 0 || req.body.fuelLeft > currentClassFuelCapacity) {
            throw new Error(`'Fuel left' value must be between 0 and ${currentClassFuelCapacity}.`);
          }

        })
        .catch(err => {
          throw new Error(err);
        })

    }

    // -- If we are trying to change the starship class AND if it's not the same currently used class --
    if (req.body.starshipClassId && (req.body.starshipClassId != starshipData.starshipClassId)) {

      // Checking if the desired class exists using the API
      await fetch(`${appConfig.DOMAIN}/api/starship-class/${req.body.starshipClassId}/`, { method: 'GET' })
        .then(response => {
          if (response.status == 404) {
            throw new Error("The specified starship class does not exists.");
          }
        });

      // Getting the Fuel capacity of the new starship class using the API
      await fetch(`${appConfig.DOMAIN}/api/starship-class/${req.body.starshipClassId}/fuel-capacity`, { method: 'GET' })
        .then(response => response.json())
        .then((jsonResponse) => {

          const newClassFuelCapacity = jsonResponse[0].fuelCapacity;

          // Set the value of the fuelLeft property to the fuel capacity of the new class 
          req.body.fuelLeft = newClassFuelCapacity;

        })
        .catch(err => {
          throw new Error("Cannot get the fuel capacity of the new starship class.");
        })

    }
  }

  // Checking the presence of the fuelLeft or starshipClassId properties
  await valuesCheck()
    .then(() => {

      // Then we update the starship
      Starship.update(req.body, {
        where: { id: id }
      })
        .then(updatedRows => { // updatedRows is the number of rows that have been updated.
          if (updatedRows == 1) { // If updatedRows = 1. One row has been updated -> success
            res.send({
              message: "The Starship was updated successfully."
            });
          } else {
            res.send({
              message: `Cannot update the Starship with id=${id}. Maybe the Starship was not found or req.body is empty!`
            });
          }
        })
        .catch(err => {
          res.status(500).send({
            message: "Error updating the Starship with id=" + id
          });
        });

    })
    .catch(err => {
      res.status(500).send({
        message: err.message
      });
    });

};

// Delete a single Starship by id
exports.deleteById = (req, res) => {

  // Getting starship id from the URL
  const id = req.params.id;

  Starship.destroy({
    where: { id: id }
  })
    .then(updatedRows => { // updatedRows is the number of rows that have been updated.
      if (updatedRows == 1) { // If updatedRows = 1. One row has been updated -> success
        res.send({
          message: `The Starship with id=${id} was deleted successfully!`
        });
      } else {
        res.send({
          message: `Cannot delete Starship with id=${id}. The Starship may not exist.`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Could not delete the Starship with id=" + id
      });
    });

};