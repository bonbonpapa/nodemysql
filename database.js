const config = require("./config.js"),
  Sequelize = require("sequelize");

module.exports = new Sequelize(
  config.db_config.db_name,
  config.db_config.db_user,
  config.db_config.db_password,
  config.db_details
);
