module.exports = (sequelize, DataTypes) => {
  const Starship = sequelize.define("starship", {
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
    fuelLeft: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  });
  return Starship;
};