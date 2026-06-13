const userModel = require("../model/user.model");
const JWT = require("jsonwebtoken");
const emailService = require('../services/email.service')

// User Register Controller
// POST /api/auth/register
async function registerUser(req, res) {
  try {
    const { email, password, name } = req.body;

    const isExists = await userModel.findOne({ email });

    if (isExists) {
      return res.status(422).json({
        message: "User already exists",
        status: "failed",
      });
    }

    const user = await userModel.create({
      email,
      password,
      name,
    });

    const token = JWT.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "3d" }
    );

    res.cookie("token", token);

    // sending registration email to user
    try {
      await emailService.sendRegistrationEmail(user.email, user.name);
      console.log("Registration email function called successfully");
    } catch (emailError) {
      console.error("Failed to send registration email:", emailError);
    }

    return res.status(201).json({
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (err) {
    return res.status(500).json({
      message: err.message,
    });
  }
}

// User Login Controller
// POST /api/auth/login
async function loginUser(req, res) {
  try {
    const { email, password } = req.body;

    // because by default in schema we have made password false when we find user
    const user = await userModel.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    const validPass = await user.comparePassword(password);

    if (!validPass) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    const token = JWT.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "3d" }
    );

    res.cookie("token", token);

    return res.status(200).json({
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (err) {
    return res.status(500).json({
      message: err.message,
    });
  }
}


module.exports = {
  registerUser,
  loginUser,
};