const jwt = require("jsonwebtoken");
const db = require("./database.js"),
  User = require("./user.js");

const AuthContorller = {};

AuthContorller.signUp = function (req, res) {
  if (!req.body.email || !req.body.password) {
    res.json({ message: "please provide an email and a password" });
  } else {
    console.log(req.body.email);
    console.log(req.body.password);
    db.sync()
      .then(function () {
        const newUser = {
          email: req.body.email,
          password: req.body.password,
        };

        return User.create(newUser).then(function () {
          res.status(201).json({ message: "Account create" });
        });
      })
      .catch(function (error) {
        res.status(403).json({ message: error });
      });
  }
};

AuthContorller.authenticateUser = function (req, res) {
  if (!req.body.email || !req.body.password) {
    res.status(404).json({ message: "email and password are needed" });
  } else {
    const email = req.body.email,
      password = req.body.password,
      potentialUser = { where: { email: email } };

    User.findOne(potentialUser)
      .then(function (user) {
        if (!user) {
          res.status(404).json({ message: "authentication failed" });
        } else {
          //     console.log(user);
          //     console.log(user.email);

          //    console.log(password);
          user.comparePasswords(password, function (error, isMatch) {
            if (isMatch && !error) {
              const token = jwt.sign(
                { email: user.email },
                process.env.ACCESS_TOKEN_SECRET,
                { expiresIn: "30m" }
              );
              res.json({ success: true, accesstoken: token });
            } else {
              res.status(404).json({ message: "login failed!" });
            }
          });
        }
      })
      .catch(function (error) {
        console.log(error);
        res.status(500).json({ message: error });
      });
  }
};

module.exports = AuthContorller;
