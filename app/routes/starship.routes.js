module.exports = app => {

  const starship = require("../controllers/starship.controller.js");
  var router = require("express").Router();

  // Create a new Starship
  router.post("/", starship.create);

  // Find a single Starship by id
  router.get("/:id", starship.findOneById);

  // Find a single Starship by name
  router.get("/name/:name", starship.findOneByName);

  // Find all Starships
  router.get("/", starship.findAll);

  // Find all Starships by class
  router.get("/class/:id", starship.findAllOfClass);

  // Update a single Starship by id
  router.put("/:id", starship.updateById);

  // Update the Fuel left of a Starship by id
  router.put("/:id/fuel-left", starship.updateFuelLeftById);

  // Delete a single Starship by id
  router.delete("/:id", starship.deleteById);

  app.use('/api/starship', router);

};