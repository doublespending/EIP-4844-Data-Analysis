const { sequelize } = require("./models/index.js");

exports.initDB = async (option = {}) => {
  await sequelize.sync(option);
};

sequelize
  .authenticate()
  .then(() => {
    console.log("Connection has been established successfully.");
  })
  .catch((error) => {
    console.error("Unable to connect to the database:", error);
  });
