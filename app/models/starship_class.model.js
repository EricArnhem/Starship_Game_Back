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
      unique: true,
      validate: {
        isAlphanumeric: true,
        notNull: true,
        notEmpty: true
      }
    },
    speed: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        isInt: true,
        notNull: true,
        notEmpty: true
      }
    },
    fuelCapacity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        isInt: true,
        notNull: true,
        notEmpty: true
      }
    },
    color: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        is: ["^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"], // Hexadecimal color code
        notNull: true,
        notEmpty: true
      }
    },
  });
  return StarshipClass;
};