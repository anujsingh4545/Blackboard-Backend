import { Router } from "express";
import { CreateEvent, DeleteEvent, UpdateEvent, getEvents } from "../Controllers/EventController.js";
import { VerifyUser } from "../Middleware/VerifyUser.js";

const route = Router();

route.post("/create", VerifyUser, CreateEvent);
route.post("/getevents", VerifyUser, getEvents);
route.post("/update", VerifyUser, UpdateEvent);
route.post("/delete", VerifyUser, DeleteEvent);

export default route;
