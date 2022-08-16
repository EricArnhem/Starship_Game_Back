const fetch = require('node-fetch');

// Nano ID to generate the publicId
const { customAlphabet } = require('nanoid');
const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const nanoid = customAlphabet(alphabet, 10);

const appConfig = require("../config/app.config.js");

const db = require("../models");

const Starship = db.starship;
const Op = db.Sequelize.Op;

const requestValidityCheck = require("./requestValidityCheck");

// --- CRUD Functions ---
// Create a new Starship
exports.create = async (req, res) => {

  // Properties accepted for this request
  const validProperties = [
    'name',
    'starshipClassId'
  ];

  // Checking the request validity
  await requestValidityCheck(req, res, validProperties)
    .then(async () => {

      // If a starship class id is provided
      if (req.body.starshipClassId) {

        // Getting the Fuel capacity of the current starship class using the API to use it as a value for the Fuel left
        await fetch(`${appConfig.DOMAIN}/api/starship-class/${req.body.starshipClassId}/fuel-capacity`, { method: 'GET' })
          .then(response => {
            // If response is OK
            if (response.status == 200) {
              // Returns the response in JSON
              return response.json()
            } else {
              throw new Error(`Error while retrieving the Fuel capacity of the Starship class with id=${req.body.starshipClassId}, the Starship class does not exists.`);
            }
          })
          .then(async (jsonResponse) => {

            // Saving the fuel capacity of the starship class
            const classFuelCapacity = jsonResponse[0].fuelCapacity;

            // Generating a 10 characters long unique ID
            let publicId = nanoid();

            // Check if the publicId already exists for another starship and regenerate one if needed
            const checkPublicId = async () => {

              let result = Starship.findAll({ where: { publicId: publicId } })

              // If there's a match for the id, keeps regenerating another one until it's unique
              while (result.length > 0) {
                publicId = nanoid();
                result = Starship.findAll({ where: { publicId: publicId } })
              }

            }

            // Checking id availability
            await checkPublicId()
              .then(() => {

                // Creating a new Starship with the data provided
                const starship = {
                  publicId: publicId,
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
                        err.message || "Error while creating the Starship."
                    });
                  });

              })
          })
          .catch(err => {
            res.status(500).send({
              message:
                err.message || "Error while getting the Fuel Capacity value from the Starship Class."
            });
          });

      } else {
        // If no starship class id is provided
        res.status(400);
        throw new Error('starshipClassId must be provided.');
      }

    })
    .catch(err => {
      // Catches any errors from the request validity function
      res.send({
        message: err.message
      });
    });

};

// Find a single Starship by public id
exports.findOneByPublicId = (req, res) => {

  // Getting starship public id from the URL
  const publicId = req.params.publicId;

  Starship.findOne({
    where: { publicId: publicId },
    attributes: { exclude: ['id', 'createdAt', 'updatedAt'] }
  })
    .then(data => {
      if (data) {
        res.send(data);
      } else {
        res.status(404).send({
          message: `Cannot find a Starship with publicId=${publicId}.`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: `Error while retrieving the Starship with publicId=${publicId}.`
      });
    });

};

// Find a single Starship by name
exports.findOneByName = (req, res) => {

  // Getting starship name from the URL
  const name = req.params.name;

  Starship.findOne({
    attributes: { exclude: ['id', 'createdAt', 'updatedAt'] },
    where: { name: name }
  })
    .then(data => {
      if (data) {
        res.send(data);
      } else {
        res.status(404).send({
          message: `Cannot find a Starship with name=${name}.`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Error while retrieving the Starship with name=" + name
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
          err.message || "Error while retrieving the Starships."
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
          message: `No Starships found for the Starship class with id=${classId}.`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || `Error while retrieving the Starships of the Starship class with id=${classId}.`
      });
    });

};

// Update a single Starship by id (except "fuelLeft" property -> Use updateFuelLeftById() to change it)
exports.updateById = async (req, res) => {

  // Properties accepted for this request
  const validProperties = [
    'name',
    'starshipClassId'
  ];

  // Getting starship id from the URL
  const id = req.params.id;

  // Getting data of the starship we try to update
  const starshipData = await Starship.findByPk(id);

  // Function used to check if we are trying to update the "Starship class ID" and check if the new desired class exists
  const starshipClassIdCheck = async () => {

    // If the starship with the provided id exists
    if (starshipData) {

      // If the "starshipClassId" property is detected in the request body AND if it is not the same currently used class
      if (req.body.starshipClassId && (req.body.starshipClassId != starshipData.starshipClassId)) {

        // Checking if the desired class exists
        const classCount = await db.starshipClass.count({ where: { id: req.body.starshipClassId } });

        if (classCount == 0) {
          res.status(404);
          throw new Error("The specified Starship class does not exists.");
        }

        // Getting the Fuel capacity of the new starship class using the API
        await fetch(`${appConfig.DOMAIN}/api/starship-class/${req.body.starshipClassId}/fuel-capacity`, { method: 'GET' })
          .then(response => {
            // If response is OK
            if (response.status == 200) {
              // Returns the response in JSON
              return response.json()
            } else {
              res.status(500);
              throw new Error(`Error while retrieving the Fuel capacity of the Starship class with id=${req.body.starshipClassId}, the Starship class does not exists.`);
            }
          })
          .then((jsonResponse) => {

            const newClassFuelCapacity = jsonResponse[0].fuelCapacity;

            // Set the value of the fuelLeft property to the fuel capacity of the new class 
            req.body.fuelLeft = newClassFuelCapacity;

          })

      }

    } else {
      // Sends error, if no starship was found with the provided id
      res.status(404);
      throw new Error(`The Starship with id=${id} does not exists.`);
    }
  }

  // Function used to check if the "fuelLeft" property is in the request body
  const fuelLeftCheck = async () => {

    if (req.body.fuelLeft) {

      // Sends error, if the "fuelLeft" property is in the request body
      res.status(400);
      throw new Error("Cannot update the 'fuelLeft' using this route. Use /api/starship/:id/fuel-left to update it.");

    }

  }

  // Checking if the "fuelLeft property is in the request body
  await fuelLeftCheck()
    .then(async () => {

      // Checking the request validity
      await requestValidityCheck(req, res, validProperties)
        .then(async () => {

          // Checking for the presence of the "starshipClassId" property in the request body
          await starshipClassIdCheck()
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
                      message: `Cannot update the Starship with id=${id}. Maybe the Starship was not found.`
                    });
                  }
                })
                .catch(err => {
                  res.status(500).send({
                    message: "Error while updating the Starship with id=" + id
                  });
                });

            })
            .catch(err => {
              res.send({
                message: err.message
              });
            });

        })

    })
    .catch(err => {
      // Catches any errors from the fuel left check or request validity function
      res.send({
        message: err.message
      });
    });

};

// Update the Fuel left of a Starship by id
exports.updateFuelLeftById = async (req, res) => {

  // Properties accepted for this request
  const validProperties = [
    'fuelLeft'
  ];

  // Getting starship id from the URL
  const id = req.params.id;

  // Getting data of the starship we try to update
  const starshipData = await Starship.findByPk(id);

  // Checking the request validity
  await requestValidityCheck(req, res, validProperties)
    .then(async () => {

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
            throw new Error(`Error while retrieving the Fuel capacity of the Starship class with id=${currentStarshipClassId}, the Starship class may not exists.`);
          }
        })
        .then(jsonResponse => {

          // Saving the fuel capacity of the starship class
          const starshipClassFuelCapacity = jsonResponse[0].fuelCapacity;

          // If the value of the Fuel left is below 0 or above the maximum capacity
          if (req.body.fuelLeft < 0 || req.body.fuelLeft > starshipClassFuelCapacity) {
            throw new Error(`The 'fuelLeft' value must be between 0 and ${starshipClassFuelCapacity}.`);
          }

        })
        .then(() => {

          // Then we update the starship
          Starship.update({ fuelLeft: req.body.fuelLeft }, {
            where: { id: id }
          })
            .then(updatedRows => { // updatedRows is the number of rows that have been updated.
              if (updatedRows == 1) { // If updatedRows = 1. One row has been updated -> success
                res.send({
                  message: "The Starship was updated successfully."
                });
              } else {
                res.send({
                  message: `Cannot update the Starship with id=${id}. The Starship may not exists.`
                });
              }
            })
            .catch(err => {
              res.status(500).send({
                message: "Error while updating the Starship with id=" + id
              });
            });

        })
        .catch(err => {
          res.status(500).send({
            message: err.message
          });
        });

    })
    .catch(err => {
      // Catches any errors from the request validity function
      res.send({
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