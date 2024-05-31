import { Router } from "express";
import { LogOut, Login, getUser } from "../Controllers/UserController.js";
import { VerifyUser } from "../Middleware/VerifyUser.js";

const route = Router();

route.post("/login", Login);

route.get("/logout", LogOut);
route.post("/getuser", VerifyUser, getUser);

export default route;
