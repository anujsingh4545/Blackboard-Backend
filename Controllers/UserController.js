import User from "../Model/User.js";
import jwt from "jsonwebtoken";
import { google } from "googleapis";
import "dotenv/config";

const oauth2Client = new google.auth.OAuth2(process.env.GOOGLE_CLINET_ID, process.env.GOOGLE_CLIENT_SECRET, "https://blackboard-evallo.vercel.app/");

export const Login = async (req, res) => {
  const { accessToken } = req.body;

  if (!accessToken) {
    return res.status(400).json({ message: "Access token is required", success: false });
  }

  try {
    const { tokens } = await oauth2Client.getToken(accessToken);
    oauth2Client.setCredentials(tokens);

    // Fetch user info using access token
    const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();

    const CheckExists = await User.findOne({ email: userInfo.data.email });
    if (CheckExists) {
      CheckExists.RToken = tokens.refresh_token;

      await CheckExists.save();

      const token = jwt.sign({ id: CheckExists._id }, process.env.JWTSECRET);
      res.cookie("token", token);

      return res.status(200).send({
        message: `Welcome back ${CheckExists.name} !`,
        user: CheckExists,
        success: true,
      });
    }

    const createUser = new User({
      name: userInfo.data.name,
      email: userInfo.data.email,
      profile: userInfo.data.picture,
      RToken: tokens.refresh_token,
    });
    await createUser.save();

    const token = jwt.sign({ id: createUser._id }, process.env.JWTSECRET);
    res.cookie("token", token);

    return res.status(200).send({
      message: `Welcome ${createUser.name} !`,
      user: createUser,
      success: true,
    });
  } catch (error) {
    console.log(error);

    return res.status(403).send({
      message: "Something went wrong",
      success: false,
    });
  }
};

export const getUser = async (req, res) => {
  const { userId } = req.body;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(200).send({
        message: "No user found !",
        success: false,
      });
    }

    return res.status(200).send({
      user: user,
      success: true,
    });
  } catch (error) {
    console.log(error);

    return res.status(403).send({
      message: "Something went wrong",
      success: false,
    });
  }
};

export const LogOut = async (req, res) => {
  try {
    res.cookie("token", "ads");

    return res.status(200).send({ message: "Sucessfully logged out !", success: true });
  } catch (error) {
    console.log(error);

    return res.status(403).send({
      message: "Something went wrong",
      success: false,
    });
  }
};
