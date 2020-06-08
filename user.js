const Sequelize = require("sequelize"),
  bcrypt = require("bcrypt");
const config = require("./config.js"),
  db = require("./database.js");

const modelDefinition = {
  email: {
    type: Sequelize.STRING,
    unique: true,
    allowNull: false,
  },
  password: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  role: {
    type: Sequelize.INTEGER,
    defaultValue: config.userRoles.user,
  },
};

const modelOptions = {
  //   instanceMethods: {
  //     comparePasswords: comparePasswords,
  //   },
  hooks: {
    beforeValidate: hashPassword,
  },
};

const UserModel = db.define("user", modelDefinition, modelOptions);

// function comparePasswords(password, callback) {
//   bcrypt.compare(password, this.password, function (error, isMatch) {
//     if (error) {
//       return callback(error);
//     }
//     return callback(null, isMatch);
//   });
// }

// in newer version of sequelize, add the instance method to the prototype
UserModel.prototype.comparePasswords = function (password, callback) {
  bcrypt.compare(password, this.password, function (error, isMatch) {
    if (error) {
      return callback(error);
    }
    return callback(null, isMatch);
  });
};

function hashPassword(user) {
  console.log("hash password!");
  //  console.log(user);
  if (user.changed("password")) {
    return bcrypt.hash(user.password, 10).then(function (password) {
      user.password = password;
    });
  }
}

module.exports = UserModel;
