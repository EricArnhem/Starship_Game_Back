module.exports = app => {

  const starship = require("../controllers/starship.controller.js");
  var router = require("express").Router();

  // Create a new Starship
  router.post("/", starship.create);

  app.use('/api/starship', router);

};