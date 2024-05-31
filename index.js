import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import UserRoute from "./Routes/UserRoute.js";
import EventRoute from "./Routes/EventRoute.js";
import { DbConnect } from "./Controllers/DbConnect.js";

const app = express();
app.use(
  cors({
    credentials: true,
    origin: "*",
  })
);
app.use(express.json());
app.use(cookieParser());

DbConnect();

app.get("/", (req, res) => {
  res.json("Hello World!");
});

app.use("/api/v1/user", UserRoute);
app.use("/api/v1/event", EventRoute);

app.listen(3000, () => {
  console.log("Hello from server !");
});
