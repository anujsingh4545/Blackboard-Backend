import { z } from "zod";
import User from "../Model/User.js";
import Events from "../Model/Events.js";
import UserEvents from "../Model/UserEvents.js";
import { google } from "googleapis";
import "dotenv/config";

const oauth2Client = new google.auth.OAuth2(process.env.GOOGLE_CLINET_ID, process.env.GOOGLE_CLIENT_SECRET, "https://blackboard-evallo.vercel.app");

const verifyData = z.object({
  title: z.string().min(5, { message: "Title should be of minimum 5 letters!" }),
  time: z.string(),
  duration: z.string().min(1, { message: "Duration should be of minimum 1 hrs" }),
  description: z.string().min(5, { message: "Description should be of minimum 5 letters!" }),
  notes: z.string().min(5, { message: "Notes should be of minimum 5 letters!" }),
  date: z.string(),
});

export const CreateEvent = async (req, res) => {
  const { title, time, duration, description, notes, date, userId } = req.body;

  try {
    verifyData.parse(req.body);
  } catch (error) {
    console.log("hello");
    return res.json({ message: error.issues[0].message, success: false });
  }

  try {
    const parsedDate = new Date(date);
    const [hours, minutes] = time.split(":").map(Number);
    const combinedDateTime = new Date(parsedDate);
    const combinedDateTime2 = new Date(parsedDate);

    combinedDateTime.setHours(hours, minutes, 0, 0);
    combinedDateTime2.setHours(hours + parseInt(duration), minutes, 0, 0);

    const startTime = new Date(combinedDateTime);
    const endTime = new Date(combinedDateTime2);

    if (startTime < new Date()) {
      return res.json({ message: "Please add Meetings for the future !", success: false });
    }

    const getUser = await User.findById(userId);

    oauth2Client.setCredentials({ refresh_token: getUser.RToken });

    const calendar = google.calendar("v3");
    const response = await calendar.events.insert({
      auth: oauth2Client,
      calendarId: "primary",
      requestBody: {
        summary: title,
        description: description,
        colorId: "4",

        start: {
          dateTime: startTime,
        },
        end: {
          dateTime: endTime,
        },
      },
    });
    const eventId = response.data.id;

    const Event = await Events.create({
      title,
      time,
      startTime,
      endTime,
      eventId,
      duration,
      startTime,
      duration,
      description,
      notes,
      expiresAt: endTime,
    });

    await Event.save();

    const cDate = new Date(date);
    console.log(cDate);

    const UserEvent = await UserEvents.create({
      userid: userId,
      date: cDate,
      event: Event._id,
      expiresAt: endTime,
    });

    await UserEvent.save();

    return res.json({ message: "Event sucessfully added !", success: true });
  } catch (error) {
    console.log(error);

    return res.status(403).send({
      message: "Something went wrong",
      success: false,
    });
  }
};

export const getEvents = async (req, res) => {
  const { userId, Udate } = req.body;

  const date = new Date(Udate);

  try {
    const events = await UserEvents.find({
      userid: userId,
      date: date,
    }).populate("event"); // to get event details

    return res.status(200).send({
      events,
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

export const UpdateEvent = async (req, res) => {
  const { title, time, duration, description, notes, date, userId, id } = req.body;

  try {
    verifyData.parse(req.body);
  } catch (error) {
    return res.json({ message: error.issues[0].message, success: false });
  }

  try {
    const verifyEvent = await Events.findById(id);

    if (!verifyEvent) {
      return res.status(200).send({
        message: "No such event found !",
        success: false,
      });
    }

    const parsedDate = new Date(date);
    const [hours, minutes] = time.split(":").map(Number);
    const combinedDateTime = new Date(parsedDate);
    const combinedDateTime2 = new Date(parsedDate);

    combinedDateTime.setHours(hours, minutes, 0, 0);
    combinedDateTime2.setHours(hours + parseInt(duration), minutes, 0, 0);

    const startTime = new Date(combinedDateTime);
    const endTime = new Date(combinedDateTime2);

    if (endTime < new Date()) {
      return res.json({ message: "Please add Meetings with end time in future !", success: false });
    }

    const getUser = await User.findById(userId);

    oauth2Client.setCredentials({ refresh_token: getUser.RToken });

    const calendar = google.calendar("v3");
    const response = await calendar.events.update({
      auth: oauth2Client,
      calendarId: "primary",
      eventId: verifyEvent.eventId,
      requestBody: {
        summary: title,
        description: description,
        colorId: "6",

        start: {
          dateTime: startTime,
        },
        end: {
          dateTime: endTime,
        },
      },
    });

    // Update the event
    verifyEvent.title = title;
    verifyEvent.time = time;
    verifyEvent.startTime = startTime;
    verifyEvent.endTime = endTime;
    verifyEvent.duration = duration;
    verifyEvent.description = description;
    verifyEvent.notes = notes;
    verifyEvent.expiresAt = endTime;

    await verifyEvent.save();

    return res.json({ message: "Event sucessfully Updated !", success: true });
  } catch (error) {
    console.log(error);

    return res.status(403).send({
      message: "Something went wrong",
      success: false,
    });
  }
};

export const DeleteEvent = async (req, res) => {
  const { id, userId } = req.body;

  try {
    const checkEvent = await UserEvents.findOne({ event: id, userid: userId });

    if (!checkEvent)
      return res.status(200).send({
        message: "No such event found !",
        success: false,
      });

    const getUser = await User.findById(userId);

    oauth2Client.setCredentials({ refresh_token: getUser.RToken });

    const getEvent = await Events.findById(id);

    const calendar = google.calendar("v3");

    await calendar.events.delete({
      auth: oauth2Client,
      calendarId: "primary",
      eventId: getEvent.eventId,
    });

    await UserEvents.deleteOne({ event: id, userid: userId });

    await Events.deleteOne({ _id: id });

    return res.status(200).send({
      message: "Event deleted Successfully !",
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
