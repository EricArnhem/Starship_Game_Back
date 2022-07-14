const fetch = require('node-fetch');

const appConfig = require("../config/app.config.js");

const db = require("../models");

const Starship = db.starship;

const Op = db.Sequelize.Op;

// --- CRUD Functions ---
// Create a new Starship
exports.create = async (req, res) => {

  // Validating request
  if (!req.body.name || !req.body.starshipClassId) { // If there's no name or classId provided
    // Sends an error
    res.status(400).send({
      message: "Content can not be empty!"
    });
    return;
  }

  // Getting the Fuel capacity of the current starship class using the API to use it as a value for the Fuel left
  await fetch(`${appConfig.DOMAIN}/api/starship-class/${req.body.starshipClassId}/fuel-capacity`, { method: 'GET' })
    .then(response => {
      // If response is OK
      if (response.status == 200) {
        // Returns the response in JSON
        return response.json()
      } else {
        throw new Error(`Error while trying to retrieve the Fuel capacity of the class with id=${req.body.starshipClassId}, the Starship class does not exists.`);
      }
    })
    .then(jsonResponse => {

      // Saving the fuel capacity of the starship class
      const classFuelCapacity = jsonResponse[0].fuelCapacity;

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

  Starship.findByPk(id, { attributes: { exclude: ['createdAt', 'updatedAt'] } })
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

  Starship.findOne({
    attributes: { exclude: ['createdAt', 'updatedAt'] },
    where: { name: name }
  })
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

  Starship.findAll({
    attributes: { exclude: ['createdAt', 'updatedAt'] }
  })
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

  Starship.findAll({
    attributes: { exclude: ['createdAt', 'updatedAt'] },
    where: { starshipClassId: classId }
  })
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

  // -- Function used to check if we are trying to update the "Fuel left" value and if that value is valid --
  const fuelLeftCheck = async () => {
    // If the "fuelLeft" property is detected in the request body
    if (req.body.fuelLeft) {

      // Getting the current starship class id
      let currentStarshipClassId = starshipData.starshipClassId;

      // Getting the Fuel capacity of the current starship class using the API
      await fetch(`${appConfig.DOMAIN}/api/starship-class/${currentStarshipClassId}/fuel-capacity`, { method: 'GET' })
        .then(response => {
          // If response is OK
          if (response.status == 200) {
            // Returns the response in JSON
            return response.json()
          } else {
            throw new Error(`Error while trying to retrieve the Fuel capacity of the class with id=${currentStarshipClassId}, the Starship class does not exists.`);
          }
        })
        .then(jsonResponse => {

          // Saving the fuel capacity of the starship class
          const currentClassFuelCapacity = jsonResponse[0].fuelCapacity;

          // If the value of the Fuel left is below 0 or above the maximum capacity
          if (req.body.fuelLeft < 0 || req.body.fuelLeft > currentClassFuelCapacity) {
            throw new Error(`'Fuel left' value must be between 0 and ${currentClassFuelCapacity}.`);
          }

        })

    }
  }

  // -- Function used to check if we are trying to update the "Starship class ID" and check if the new class is exists --
  const starshipClassIdCheck = async () => {

    // If the "starshipClassId" property is detected in the request body AND if it is not the same currently used class
    if (req.body.starshipClassId && (req.body.starshipClassId != starshipData.starshipClassId)) {

      // Checking if the desired class exists
      const classCount = await db.starshipClass.count({ where: { id: req.body.starshipClassId } });

      if (classCount == 0) {
        throw new Error("The specified starship class does not exists.");
      }

      // Getting the Fuel capacity of the new starship class using the API
      await fetch(`${appConfig.DOMAIN}/api/starship-class/${req.body.starshipClassId}/fuel-capacity`, { method: 'GET' })
        .then(response => {
          // If response is OK
          if (response.status == 200) {
            // Returns the response in JSON
            return response.json()
          } else {
            throw new Error(`Error while trying to retrieve the Fuel capacity of the class with id=${req.body.starshipClassId}, the Starship class does not exists.`);
          }
        })
        .then((jsonResponse) => {

          const newClassFuelCapacity = jsonResponse[0].fuelCapacity;

          // Set the value of the fuelLeft property to the fuel capacity of the new class 
          req.body.fuelLeft = newClassFuelCapacity;

        })

    }
  }

  const propertiesCheck = async () => {
    await fuelLeftCheck(); // Checking for the "fuelLeft" property
    await starshipClassIdCheck(); // Checking for the "starshipClassId" property
  }

  // Checking for the presence of some properties in the request body
  await propertiesCheck()
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