module.exports = app => {

  const starship_class = require("../controllers/starship_class.controller.js");
  var router = require("express").Router();

  // Create a new Starship Class
  router.post("/", starship_class.create);

  // Retrieve a single Starship class by id
  router.get("/:id", starship_class.findOneById);

  // Retrieve a single Starship class by name
  router.get("/name/:name", starship_class.findOneByName);

  // Retrieve the fuel capacity of a Starship class by id
  router.get("/:id/fuel-capacity", starship_class.getFuelCapacityById);

  app.use('/api/starship-class', router);

};