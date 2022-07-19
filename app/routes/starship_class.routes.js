module.exports = app => {

  const starship_class = require("../controllers/starship_class.controller.js");
  var router = require("express").Router();

  // Create a new Starship class
  router.post("/", starship_class.create);

  // Find a single Starship class by id
  router.get("/:id", starship_class.findOneById);

  // Find a single Starship class by name
  router.get("/name/:name", starship_class.findOneByName);

  // Find the fuel capacity of a Starship class by id
  router.get("/:id/fuel-capacity", starship_class.getFuelCapacityById);

  // Find all Starship classes
  router.get("/", starship_class.findAll);

  app.use('/api/starship-class', router);

};