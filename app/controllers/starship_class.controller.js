const db = require("../models");
const StarshipClass = db.starshipClass;
const Op = db.Sequelize.Op;

const requestValidityCheck = require("./requestValidityCheck");

// Create a new Starship Class
exports.create = async (req, res) => {

  // Properties accepted for this request
  const validProperties = [
    'name',
    'speed',
    'fuelCapacity',
    'color'
  ];

  // Checking the request validity
  await requestValidityCheck(req, res, validProperties)
    .then(() => {

      // Creating a new Starship Class with the data provided
      const starship_class = {
        name: req.body.name,
        speed: req.body.speed,
        fuelCapacity: req.body.fuelCapacity,
        color: req.body.color
      };

      // Saving the Starship Class in the database
      StarshipClass.create(starship_class)
        .then(starshipClassData => {
          res.send({
            message: `The Starship class '${starshipClassData.name}' has been successfully created.`
          });
        })
        .catch(err => {
          res.status(500).send({
            message:
              err.message || "Error while creating the Starship class."
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

// Find a single Starship Class by id
exports.findOneById = (req, res) => {

  const id = req.params.id;

  StarshipClass.findByPk(id, { attributes: { exclude: ['createdAt', 'updatedAt'] } })
    .then(data => {
      if (data) {
        res.send(data);
      } else {
        res.status(404).send({
          message: `Cannot find a Starship class with id=${id}.`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Error while retrieving the Starship class with id=" + id
      });
    });

};

// Find a single Starship Class by name
exports.findOneByName = (req, res) => {

  // Getting starship class name from the URL
  const name = req.params.name;

  StarshipClass.findOne({
    attributes: { exclude: ['createdAt', 'updatedAt'] },
    where: { name: name }
  })
    .then(data => {
      if (data) {
        res.send(data);
      } else {
        res.status(404).send({
          message: `Cannot find a Starship class with name=${name}.`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Error while retrieving the Starship class with name=" + name
      });
    });

};

// Find all Starships Classes
exports.findAll = (req, res) => {

  StarshipClass.findAll({
    attributes: { exclude: ['createdAt', 'updatedAt'] }
  })
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Error while retrieving the Starship classes."
      });
    });

};

// Get the fuel capacity by providing the class id
exports.getFuelCapacityById = (req, res) => {

  // Getting the class id from the URL
  const id = req.params.id;

  // Find the starship class with the provided id and retrieves the fuel capacity
  StarshipClass.findAll({
    attributes: ['fuelCapacity'],
    where: { id: id }
  })
    .then(data => {
      // If it returned some data
      if (data.length > 0) {
        res.send(data);
      } else {
        res.status(404).send({
          message: `No Starship class found for the id=${id}.`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Error while retrieving the Starship class."
      });
    });

};

// Update a single Starship Class by id
exports.updateById = async (req, res) => {

  // Getting the starship class id from the URL
  const id = req.params.id;

  // Properties accepted for this request
  const validProperties = [
    'name',
    'speed',
    'fuelCapacity',
    'color'
  ];

  // Checking the request validity
  await requestValidityCheck(req, res, validProperties)
    .then(async () => {

      // We start a transaction and save it into a variable
      const t = await db.sequelize.transaction();

      // Then updating the starship class
      StarshipClass.update(req.body,
        {
          where: { id: id },
          transaction: t // Passing transaction as an option
        })
        .then(async (updatedRows) => { // updatedRows is the number of rows that have been updated.

          if (updatedRows == 1) { // If updatedRows = 1. One row has been updated -> success

            if (req.body.fuelCapacity) {
              // If we updated the fuelCapacity

              // We need to update the fuel left of all the starships of the updated class to the new fuel capacity
              await db.starship.update({ fuelLeft: req.body.fuelCapacity },
                {
                  where: { starshipClassId: id },
                  transaction: t
                })
                .then(async () => {
                  // If the update was successful
                  // Commit the transaction (Apply changes)
                  await t.commit();
                  res.send({
                    message: "The Starship class was updated successfully."
                  });

                })
                .catch(async (err) => {
                  // If error during the starships fuel left update
                  // Rollback the update made to the starship class
                  await t.rollback();
                  // Sends the error message
                  res.send({
                    message: err.message
                  });
                });

            } else {
              // If we did not update the fuel capacity of the starship class
              // Commit the transaction (Apply changes)
              await t.commit();
              res.send({
                message: "The Starship class was updated successfully."
              });

            }

          } else {
            // If no rows were updated
            res.status(404).send({
              message: `Cannot update the Starship class with id=${id}. Maybe the Starship class may not exists.`
            });

          }

        })
        .catch(err => {
          res.status(500).send({
            message: `Error while updating the Starship class with id=${id}.`
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

// Delete a single Starship Class by id
exports.deleteById = (req, res) => {

  // Getting starship id class from the URL
  const id = req.params.id;

  StarshipClass.destroy({
    where: { id: id }
  })
    .then(updatedRows => { // updatedRows is the number of rows that have been updated.
      if (updatedRows == 1) { // If updatedRows = 1. One row has been updated -> success
        res.send({
          message: `The Starship class with id=${id} was deleted successfully!`
        });
      } else {
        res.send({
          message: `Cannot delete Starship class with id=${id}. The Starship class may not exist.`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Could not delete the Starship class with id=" + id
      });
    });

};