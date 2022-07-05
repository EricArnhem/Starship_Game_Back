const dbConfig = require("../config/db.config.js");
const { Sequelize, DataTypes } = require('sequelize');

// Initializing Sequelize
const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
  host: dbConfig.HOST,
  dialect: dbConfig.dialect
});

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;
// Models
db.starship = require("./starship.model.js")(sequelize, DataTypes);
db.starshipClass = require("./starship_class.model.js")(sequelize, DataTypes);

// Associating the starship table and the starship_class table
db.starshipClass.hasMany(db.starship, {
  foreignKey: 'starshipClassId'
});
db.starship.belongsTo(db.starshipClass);


module.exports = db;