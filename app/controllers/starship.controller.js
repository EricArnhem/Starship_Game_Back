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

        // Getting reference data of the starship class from the API
        await fetch(`${appConfig.DOMAIN}/api/starship-class/${req.body.starshipClassId}`, { method: 'GET' })
          .then(response => {
            // If response is OK
            if (response.status == 200) {
              // Returns the response in JSON
              return response.json()
            } else {
              throw new Error(`Error while retrieving data for the Starship class with id=${req.body.starshipClassId}, the Starship class does not exists.`);
            }
          })
          .then(async (jsonResponse) => {

            // Saving the fuel capacity and hull points of the starship class
            const classFuelCapacity = jsonResponse.fuelCapacity;
            const classHullPoints = jsonResponse.hullPoints;

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
                  hullPoints: classHullPoints,
                  starshipClassId: req.body.starshipClassId
                };

                // Saving the Starship in the database
                Starship.create(starship)
                  .then(starshipData => {
                    res.send({
                      message: `The Starship '${starshipData.name}' has been successfully created.`
                    });
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
                err.message || "Error while getting Starship Class data."
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

// Check the availability of a Starship name
exports.checkNameAvailability = (req, res) => {

  // Getting starship name to check from the URL
  const name = req.params.name;

  Starship.findOne({
    attributes: { exclude: ['id', 'createdAt', 'updatedAt'] },
    where: { name: name }
  })
    .then(data => {
      // If we get data from a Starship
      if (data) {
        // Name is not available
        return res.json({ available: false });
      } else {
        // Name is available
        return res.json({ available: true });
      }
    })
    .catch(err => {
      return res.status(500).send({
        message: "Error while checking for the Starship name"
      });
    });

};

// Find all Starships
exports.findAll = (req, res) => {

  Starship.findAll({
    attributes: { exclude: ['id', 'createdAt', 'updatedAt'] }
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
  const classId = req.params.classId;

  Starship.findAll({
    attributes: { exclude: ['id', 'createdAt', 'updatedAt'] },
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

// Update a single Starship by public id (except "fuelLeft")
exports.updateByPublicId = async (req, res) => {

  // Properties accepted for this request
  const validProperties = [
    'name',
    'starshipClassId'
  ];

  // Getting starship public id from the URL
  const publicId = req.params.publicId;

  // Getting data of the starship we try to update
  const starshipData = await Starship.findOne({ where: { publicId: publicId } });

  // Function used to check if we are trying to update the "Starship class ID" and check if the new desired class exists
  const starshipClassIdCheck = async () => {

    // If the starship with the provided public id exists
    if (starshipData) {

      // If the "starshipClassId" property is detected in the request body AND if it is not the same currently used class
      if (req.body.starshipClassId && (req.body.starshipClassId != starshipData.starshipClassId)) {

        // Checking if the desired class exists
        const classCount = await db.starshipClass.count({ where: { id: req.body.starshipClassId } });

        if (classCount == 0) {
          res.status(404);
          throw new Error("The specified Starship class does not exists.");
        }

        // Getting the data of the new starship class from the API
        await fetch(`${appConfig.DOMAIN}/api/starship-class/${req.body.starshipClassId}`, { method: 'GET' })
          .then(response => {
            // If response is OK
            if (response.status == 200) {
              // Returns the response in JSON
              return response.json()
            } else {
              res.status(500);
              throw new Error(`Error while retrieving data for the Starship class with id=${req.body.starshipClassId}, the Starship class does not exists.`);
            }
          })
          .then((jsonResponse) => {

            const newClassFuelCapacity = jsonResponse.fuelCapacity;
            const newClassHullPoints = jsonResponse.hullPoints;

            // Set the value of the fuelLeft property to the fuel capacity of the new class 
            req.body.fuelLeft = newClassFuelCapacity;
            // Set the value of the hullPoints property to the hull points stat of the new class
            req.body.hullPoints = newClassHullPoints;

          })

      }

    } else {
      // Sends error, if no starship was found with the provided public id
      res.status(404);
      throw new Error(`The Starship with publicId=${publicId} does not exists.`);
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

  // Function used to check if the "hullPoints" property is in the request body
  const hullPointsCheck = async () => {

    if (req.body.hullPoints) {

      // Sends error, if the "hullPoints" property is in the request body
      res.status(400);
      throw new Error("Cannot update the 'hullPoints' using this route. Use /api/starship/:id/hull-points to update it.");

    }

  }

  // Checking if the "fuelLeft property is in the request body
  await fuelLeftCheck()
    .then(async () => {

      await hullPointsCheck()
        .then(async () => {

          // Checking the request validity
          await requestValidityCheck(req, res, validProperties)
            .then(async () => {

              // Checking for the presence of the "starshipClassId" property in the request body
              await starshipClassIdCheck()
                .then(() => {

                  // Then we update the starship
                  Starship.update(req.body, {
                    where: { publicId: publicId }
                  })
                    .then(updatedRows => { // updatedRows is the number of rows that have been updated.
                      if (updatedRows == 1) { // If updatedRows = 1. One row has been updated -> success
                        res.send({
                          message: "The Starship was updated successfully."
                        });
                      } else {
                        res.status(500).send({
                          message: `Cannot update the Starship with publicId=${publicId}. Maybe the Starship was not found.`
                        });
                      }
                    })
                    .catch(err => {
                      res.status(500).send({
                        message: `Error while updating the Starship with publicId=${publicId}`
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
          // Catches error from the hull points check or request validity function
          res.send({
            message: err.message
          });
        });
    })
    .catch(err => {
      // Catches any errors from the fuel left check
      res.send({
        message: err.message
      });
    });

};

// Update the Fuel left of a Starship by public id
exports.updateFuelLeftByPublicId = async (req, res) => {

  // Properties accepted for this request
  const validProperties = [
    'fuelLeft'
  ];

  // Getting starship public id from the URL
  const publicId = req.params.publicId;

  // Getting data of the starship we try to update
  const starshipData = await Starship.findOne({ where: { publicId: publicId } });

  // Checking the request validity
  await requestValidityCheck(req, res, validProperties)
    .then(async () => {

      // Getting the current starship class id
      let currentStarshipClassId = starshipData.starshipClassId;

      // Getting the data of the current starship class from the API
      await fetch(`${appConfig.DOMAIN}/api/starship-class/${currentStarshipClassId}`, { method: 'GET' })
        .then(response => {
          // If response is OK
          if (response.status == 200) {
            // Returns the response in JSON
            return response.json()
          } else {
            throw new Error(`Error while retrieving data of the Starship class with id=${currentStarshipClassId}, the Starship class may not exists.`);
          }
        })
        .then(jsonResponse => {

          // Saving the fuel capacity of the starship class
          const starshipClassFuelCapacity = jsonResponse.fuelCapacity;

          // If the value of the Fuel left is below 0 or above the maximum capacity
          if (req.body.fuelLeft < 0 || req.body.fuelLeft > starshipClassFuelCapacity) {
            throw new Error(`The 'fuelLeft' value must be between 0 and ${starshipClassFuelCapacity}.`);
          }

        })
        .then(() => {

          // Then we update the starship
          Starship.update({ fuelLeft: req.body.fuelLeft }, {
            where: { publicId: publicId }
          })
            .then(updatedRows => { // updatedRows is the number of rows that have been updated.
              if (updatedRows == 1) { // If updatedRows = 1. One row has been updated -> success
                res.send({
                  message: "The Starship was updated successfully."
                });
              } else {
                res.send({
                  message: `Cannot update the Starship with publicId=${publicId}. The Starship may not exists.`
                });
              }
            })
            .catch(err => {
              res.status(500).send({
                message: `Error while updating the Starship with publicId=${publicId}.`
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

// Delete a single Starship by public id
exports.deleteByPublicId = (req, res) => {

  // Getting starship id from the URL
  const publicId = req.params.publicId;

  Starship.destroy({
    where: { publicId: publicId }
  })
    .then(updatedRows => { // updatedRows is the number of rows that have been updated.
      if (updatedRows == 1) { // If updatedRows = 1. One row has been updated -> success
        res.send({
          message: `The Starship with publicId=${publicId} was deleted successfully!`
        });
      } else {
        res.status(404).send({
          message: `Cannot delete Starship with publicId=${publicId}. The Starship may not exist.`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: `Could not delete the Starship with publicId=${publicId}.`
      });
    });

};