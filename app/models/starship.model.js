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
      unique: true,
      validate: {
        is: /^[^-\s][\p{L}0-9- ]{1,20}$/gu,
        len: [1,20],
        notNull: true,
        notEmpty: true
      }
    },
    fuelLeft: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        isInt: true,
        notNull: true,
        notEmpty: true
      }
    }
  });
  return Starship;
};