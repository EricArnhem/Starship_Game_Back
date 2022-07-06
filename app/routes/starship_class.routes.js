module.exports = app => {

  const starship_class = require("../controllers/starship_class.controller.js");
  var router = require("express").Router();

  // Create a new Starship Class
  router.post("/", starship_class.create);

  // Retrieve a single Starship class by id
  router.get("/:id", starship_class.findOneById);

  app.use('/api/starship-class', router);

};