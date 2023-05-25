const User = require("../models/user");
const { validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");

exports.signUp = async (req, res) => {
  if (req.cookies && req.cookies.token) {
    return res.status(403).json({ message: "User is already logged in" });
  }
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ error: errors.array()[0].msg });
  }

  try {
    const newUser = new User(req.body);
    await newUser.save();
    res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    res.status(500).json({ error: `An error occurred:${error}` });
  }
};

exports.signIn = (req, res) => {
  const { email, password } = req.body;

  if (req.cookies && req.cookies.token) {
    return res.status(403).json({ message: "User is already logged in" });
  }

  User.findOne({ email })
    .then((user) => {
      if (!user) {
        return res.status(404).json({ message: "Email not found" });
      }
      if (!user.authenticate(password)) {
        return res
          .status(401)
          .json({ error: "Email and password do not match" });
      }

      const token = jwt.sign({ _id: user._id }, process.env.SECRET);
      res.cookie("token", token, { expire: new Date() + 30 });

      const { _id, username, email } = user;
      return res.json({
        token,
        user: { _id, username, email },
        message: "Login success",
      });
    })
    .catch((error) => {
      console.log(error);
      res.status(500).json({ message: "Internal server error" });
    });
};

exports.signOut = (req, res) => {
  res.clearCookie("token");
  return res.json({
    message: "Logout success",
  });
};

exports.dashboard
