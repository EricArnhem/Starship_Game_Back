module.exports = (sequelize, DataTypes) => {
  const StarshipClass = sequelize.define("starship_class", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    speed: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    fuelCapacity: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    color: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
  });
  return StarshipClass;
};