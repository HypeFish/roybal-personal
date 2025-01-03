//index.js
const express = require("express");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);
const app = express();
const path = require("path");
const fetch = require("node-fetch");
const dotenv = require("dotenv");
const cron = require("node-cron");
const nodemailer = require("nodemailer");
const publicPath = "/assets"; // Set the correct public path
app.use(publicPath, express.static(path.join(__dirname, "assets")));
app.use(express.json());
dotenv.config({ path: "env/user.env" }); // This will read the env/user.env file and set the environment variables
const { MongoClient } = require("mongodb");
const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));
const accountSid = process.env.TWILIO_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const clientTwilio = require("twilio")(accountSid, authToken);


let access_token;
let refresh_token;
let user_id;

let participantsCollection;
let dataCollection;
let adminCollection;
let planCollection;
let usersCollection;
let weeklyPointsCollection;
let healthCollection;
let textCollection;
let tipsCollection;
let surveyCollection;

// Start the server
const port = 50000;

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port} at ${new Date().toUTCString()}`);
  console.log("Press Ctrl+C to quit.");
});

async function connectToDatabase() {
  try {
    await client.connect();
    participantsCollection = client.db("Roybal").collection("participants");
    dataCollection = client.db("Roybal").collection("data");
    adminCollection = client.db("Roybal").collection("admin");
    planCollection = client.db("Roybal").collection("plan");
    usersCollection = client.db("Roybal").collection("users");
    weeklyPointsCollection = client.db("Roybal").collection("weeklyPoints");
    healthCollection = client.db("Roybal").collection("health");
    textCollection = client.db("Roybal").collection("text");
    tipsCollection = client.db("Roybal").collection("tips");
    surveyCollection = client.db("Roybal").collection("surveyContacts");
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    throw error;
  }
}

// Call the connectToDatabase function
connectToDatabase();

const store = new MongoDBStore({
  uri: uri + "Roybal",
  collection: "sessions", // Name of the collection to store sessions
});

store.on("error", (error) => {
  console.error("Session store error:", error);
});

app.use(
  session({
    secret: process.env.SESSION_SECRET, // Replace with your session secret
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
    },
    store: store,
  })
);

app.use((req, res, next) => {
  res.header("Cache-Control", "private, no-cache, no-store, must-revalidate");
  res.header("Pragma", "no-cache");
  res.header("Expires", "-1");
  next();
});

//signout route
app.get("/logout", (req, res) => {
  res.redirect("/home");
  req.session.destroy();
});

// Define the login route
app.get("/login", (req, res) => {
  // Check if the user is already logged in
  if (req.session?.user) {
    if (req.session.user === "cnelab") {
      res.redirect("/admin");
    } else {
      res.redirect("/user_portal");
    }
  } else {
    res.sendFile(path.join(__dirname, "assets/pages/login.html"));
  }
});

app.post("/login", async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  try {
    const admin = await adminCollection.findOne({
      user: username,
      pass: password,
    });
    const user = await usersCollection.findOne({
      user: username,
      pass: password,
    });

    if (admin) {
      req.session.user = username;
      res.redirect("/admin");
    } else if (user) {
      req.session.user = username;
      res.redirect("/user_portal"); // Redirect to the user portal
    } else {
      res
        .status(401)
        .json({ success: false, error: "Invalid username or password" });
    }
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
});

app.get("/login-ema", (req, res) => {
  res.sendFile(path.join(__dirname, "assets/pages/login-ema.html"));
});

app.post("/login-ema", async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  //check if the user and password are correct
  // user is ema-survey and password is TBIlab

  let user = await surveyCollection.findOne({
    id: username,
    password,
  });

  if (user) {
    req.session.user = username;
    res.redirect("/ema");
  } else if (username === "admin" && password === "TBIlab") {
    req.session.user = username;
    res.redirect("/ema-admin");
  } else {
    res
      .status(401)
      .json({ success: false, error: "Invalid username or password" });
  }
});

app.get("/user_portal", (req, res) => {
  const user = req.session.user; // Use the user ID from the session

  usersCollection
    .findOne({ user })
    .then((user) => {
      if (user) {
        //check if user is experimental or control
        if (user.group === "experiment") {
          res.sendFile(path.join(__dirname, "assets/pages/user_portal.html"));
        } else {
          res.sendFile(path.join(__dirname, "assets/pages/user.html"));
        }
      } else {
        res.status(200).sendFile(path.join(__dirname, "home.html"));
      }
    })
    .catch((error) => {
      console.error("Error fetching user:", error);
      res.status(500).sendFile(path.join(__dirname, "404.html"));
    });
});

// Serve the index page
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Define a route for serving the "em.html" file
app.get("/ema", (req, res) => {
  res.sendFile(path.join(__dirname, "assets/pages/ema.html"));
});

app.get("/ema-admin", (req, res) => {
  res.sendFile(path.join(__dirname, "assets/pages/ema-admin.html"));
});

app.get("/home", (req, res) => {
  res.sendFile(path.join(__dirname, "assets/pages/home.html"));
  req.session.destroy();
});

//If the user is not logged in, redirect to the home page
app.get("/", (req, res) => {
  if (req.session?.user) {
    if (req.session.user === "cnelab") {
      res.redirect("/admin");
    } else {
      res.redirect("/user_portal");
    }
  } else {
    res.redirect("/home");
  }
});

app.get("/ema-redirect", (req, res) => {
  if (req.session?.user) {
    if (req.session.user === "admin") {
      res.redirect("/ema-admin");
    } else {
      res.redirect("/ema");
    }
  } else {
    res.redirect("/home");
  }
});

async function storeDataInDatabase(user_id, fitbitData) {
  try {
    const yesterday = new Date(new Date().setDate(new Date().getDate() - 1))
      .toISOString()
      .slice(0, 10);
    const existingDocument = await dataCollection.findOne({
      user_id,
      date: yesterday,
    });

    if (existingDocument) {
      return; // Data already exists, no need to store it again
    }

    // Assign the Fitbit data directly to the corresponding fields in the document
    const document = {
      user_id: user_id,
      date: yesterday,
      activities: fitbitData.activities,
      goals: fitbitData.goals,
      summary: fitbitData.summary,
    };

    await dataCollection.insertOne(document);
  } catch (error) {
    console.error("Error storing data in database:", error);
    throw error; // Rethrow the error so it can be caught by the caller
  }
}

// Route to handle data from Qualtrics survey
// Route to handle data from Qualtrics survey
app.post("/api/save_survey_contact", async (req, res) => {
  const { username, password, email, phone } = req.body;

  if (!username || !password || !email || !phone) {
    return res.status(400).send("All fields are required.");
  }

  try {
    const newContact = {
      id: username,
      password,
      email,
      contact: phone
    };
    await surveyCollection.insertOne(newContact);

    const platformLink = "https://tbilab.vercel.app";

    // Send Email
    const mailOptions = {
      from: process.env.EMAIL,
      to: email,
      subject: 'Welcome to Our Platform',
      text: `Hello ${username},\n\nThank you for registering on our platform! Here are your login details:\n\nUsername: ${username}\nPassword: ${password}\n\nYou can access the platform here: ${platformLink}. Click on the Survey page button at the home page.\n\nBest regards,\nTBI Lab`
    };
    await transporter.sendMail(mailOptions);

    // Send SMS
    await clientTwilio.messages.create({
      body: `Hello ${username}, thank you for registering on our platform! Here are your login details:\nUsername: ${username}\nPassword: ${password}\nAccess the platform here: ${platformLink}. Click on the Survey page button at the home page.`,
      from: process.env.TWILIO_NUMBER,
      to: phone
    });

    res.status(200).send("Survey contact saved successfully and notifications sent.");
  } catch (error) {
    console.error("Error saving survey contact:", error);
    res.status(500).send("Internal Server Error.");
  }
});

// Add a new route to refresh the access token
app.post("/admin/api/refresh-token/:user_id", async (req, res) => {
  console.log("Reached the refresh_token route"); // Add this line

  const user_id = req.params.user_id;

  try {
    const user = await participantsCollection.findOne({ user_id });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const response = await fetch("https://api.fitbit.com/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization:
          "Basic " +
          Buffer.from(
            `${process.env.CLIENT_ID}:${process.env.CLIENT_SECRET}`
          ).toString("base64"),
      },
      body: `grant_type=refresh_token&refresh_token=${user.refresh_token}`,
    });

    const data = await response.json();

    if (data.access_token) {
      const newAccessToken = data.access_token;
      const newRefreshToken = data.refresh_token || user.refresh_token;

      const result = await participantsCollection.updateOne(
        { user_id: user_id },
        {
          $set: {
            access_token: newAccessToken,
            refresh_token: newRefreshToken,
          },
        }
      );

      if (result.modifiedCount > 0) {
        console.log(
          `Updated access token and refresh token for user ${user_id}`
        );
      } else {
        console.log(
          `User ${user_id} not found or access token/refresh token not updated`
        );
      }

      res.json({ newAccessToken, newRefreshToken });
    } else {
      console.log("block 1!");
      console.error("Error refreshing access token:", data.error);
      res.status(500).json({ error: "Internal server error" });
    }
  } catch (error) {
    console.log("block 2!");
    console.error("Error refreshing access token:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Add a new route to fetch all participants
app.get("/admin/api/participants", async (req, res) => {
  try {
    const participants = await participantsCollection
      .find()
      .sort({ number: 1 })
      .toArray();
    const formattedParticipants = participants.map(
      ({ user_id, number, group }, index) => ({
        user_id,
        number,
        name: `Participant ${index}`,
        group,
      })
    );
    res.json({ success: true, data: formattedParticipants });
  } catch (error) {
    console.error("Error fetching participants:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

app.get("/auth/callback", async (req, res) => {
  const state = req.query.state; // Get the state query parameter

  if (state === "experiment") {
    // User is in the experimental group, execute the experimental group action
    res.send("Experimental Group: Action executed");
  } else if (state === "control") {
    // User is in the control group, execute the control group action
    res.send("Control Group: Action executed");
  } else {
    // Handle other cases or errors
    res.send("Unknown group or error occurred");
  }

  // Use the authorization code to obtain access token (your existing code)
  const authorizationCode = req.query.code;
  const response = await fetch("https://api.fitbit.com/oauth2/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(
        `${process.env.CLIENT_ID}:${process.env.CLIENT_SECRET}`
      ).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: `client_id=${process.env.CLIENT_ID}&grant_type=authorization_code&redirect_uri=${process.env.REDIRECT_URI}&code=${authorizationCode}&code_verifier=${process.env.PKCE_CODE_VERIFIER}`,
  });

  const data = await response.json();
  access_token = data.access_token;
  refresh_token = data.refresh_token;
  user_id = data.user_id;
  const participantNumber = await participantsCollection.countDocuments();

  try {
    const result = await participantsCollection.updateOne(
      { user_id: user_id },
      {
        $set: {
          authorization_code: authorizationCode,
          access_token: access_token,
          refresh_token: refresh_token,
          number: participantNumber,
          group: state,
        },
      },
      { upsert: true }
    );

    if (result.modifiedCount > 0) {
      console.log(`Updated record for user ${user_id}`);
    } else if (result.upsertedCount > 0) {
      console.log(`Inserted new record for user ${user_id}`);
    }

    //check if the user is in the user collection
    const user = await usersCollection.findOne({ user_id });
    if (!user) {
      await usersCollection.insertOne({
        user_id,
        number: participantNumber,
        group: state,
        user: user_id,
        pass: "cnelab",
      });
    }
  } catch (error) {
    console.error("Error updating database:", error);
    throw error;
  }
});

// Add a new route to fetch all user IDs
app.get("/admin/api/user_ids", async (req, res) => {
  try {
    const participants = await participantsCollection.find().toArray();
    const userIDs = participants.map((participant) => participant.user_id);
    res.json({ success: true, data: userIDs });
  } catch (error) {
    console.error("Error fetching user IDs:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

app.get("/admin/api/tokens/:user_id", (req, res) => {
  const user_id = req.params.user_id;
  console.log(user_id);
  participantsCollection
    .findOne({ user_id })
    .then((user) => {
      if (user) {
        res.json({
          access_token: user.access_token,
          refresh_token: user.refresh_token,
        });
      } else {
        res.status(404).json({ error: "User not found" });
      }
    })
    .catch((error) => {
      console.error("Error fetching tokens:", error);
      res.status(500).json({ error: "Internal server error" });
    });
});

// Add a new route for collecting Fitbit data
app.post("/admin/api/collect_data/:user_id", async (req, res) => {
  const user_id = req.params.user_id;
  const access_token = req.headers.authorization.split(" ")[1]; // Extract the access token from the Authorization header

  try {
    // Perform Fitbit API call with the obtained access token
    const yesterday = new Date(new Date().setDate(new Date().getDate() - 1))
      .toISOString()
      .slice(0, 10);
    const fitbitDataResponse = await fetch(
      `https://api.fitbit.com/1/user/${user_id}/activities/date/${yesterday}.json`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    if (fitbitDataResponse.ok) {
      const fitbitData = await fitbitDataResponse.json();

      // Assuming you have a function to store the data in your database
      // You can reuse the logic from your button click handler
      await storeDataInDatabase(user_id, fitbitData);
      console.log(
        `Data stored in the database for user ${user_id} successfully.`
      );

      res.json({
        success: true,
        message: "Data collected and stored successfully.",
      });
    } else {
      console.error(`HTTP error! status: ${fitbitDataResponse.status}`);
      res.status(401).json({ success: false, error: "Error collecting data" });
    }
  } catch (error) {
    console.error(`Error fetching data for user ${user_id}:`, error);
    res.status(401).json({ success: false, error: "Internal server error" });
  }
});

// Add a new route to fetch combined Fitbit data for a user
app.get("/admin/api/combined_data/:user_id", async (req, res) => {
  const user_id = req.params.user_id;

  try {
    const userDocuments = await dataCollection.find({ user_id }).toArray();

    if (userDocuments.length === 0) {
      console.log(`No data found for user ${user_id}`);
      res.status(404).json({ error: `No data found for user ${user_id}` });
      return;
    }

    let combinedData = [];
    for (const document of userDocuments) {
      combinedData.push(document);
    }

    res.json({ success: true, data: combinedData });
  } catch (error) {
    console.error(`Error fetching combined data for user ${user_id}:`, error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

app.post("/admin/submit-plan", async (req, res) => {
  const { identifier, selectedDays } = req.body;

  if (identifier && selectedDays) {
    try {
      const updated = await planCollection.updateOne(
        { identifier },
        {
          $addToSet: {
            selectedDays: { $each: selectedDays },
          },
        }
      );

      if (updated.modifiedCount > 0) {
        res.json({ success: true, message: "Plan submitted successfully" });
      } else {
        res.json({ success: false, message: "No matching contact found" });
      }
    } catch (error) {
      console.error("Error updating plan:", error);
      res.status(500).json({ success: false, error: "Internal Server Error" });
    }
  } else {
    res.status(400).json({ success: false, error: "Invalid request" });
  }
});

app.post("/admin/api/call", async (req, res) => {
  //add the date to the calling days array
  const identifier = req.body.identifier;
  const callingDates = req.body.callingDates;

  if (identifier && callingDates) {
    try {
      const updated = await planCollection.updateOne(
        { identifier },
        {
          $addToSet: {
            callingDays: { $each: callingDates },
          },
        }
      );

      if (updated.modifiedCount > 0) {
        res.json({
          success: true,
          message: "Calling days submitted successfully",
        });
      } else {
        res.json({ success: false, message: "No matching contact found" });
      }
    } catch (error) {
      console.error("Error updating plan:", error);
      res.status(500).json({ success: false, error: "Internal Server Error" });
    }
  } else {
    res.status(400).json({ success: false, error: "Invalid request" });
  }
});

app.post("/admin/submit-health-contact", async (req, res) => {
  const { identifier, identifier_type } = req.body;
  if (identifier) {
    const existingContact = await healthCollection.findOne({
      identifier_type,
      identifier,
    });
    if (existingContact) {
      res.json({ success: false, message: "Contact already exists" });
      return;
    }
  }
  try {
    await healthCollection.insertOne({
      identifier,
      identifier_type,
    });
    res.json({ success: true, message: "Contact submitted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

app.post("/admin/submit-contact", async (req, res) => {
  const { identifier, identifier_type, participantNumber } = req.body;

  if (identifier) {
    // Check if the contact already exists
    const existingContact = await planCollection.findOne({
      identifier_type,
      identifier,
    });
    if (existingContact) {
      res.json({ success: false, message: "Contact already exists" });
      return;
    }
  }

  try {
    // Save the data with the desired structure,
    await planCollection.insertOne({
      identifier,
      identifier_type,
      participantNumber: parseInt(participantNumber),
      selectedDays: [],
      completedPlannedActivities: [],
      completedUnplannedActivities: [],
      callingDays: [],
    });
    res.json({ success: true, message: "Contact submitted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

app.post("/admin/submit-ema-contact", async (req, res) => {
  const { contact, id, password } = req.body;

  if (contact) {
    // Check if the contact already exists
    const existingContact = await surveyCollection.findOne({
      contact,
    });
    if (existingContact) {
      res.json({ success: false, message: "Contact already exists" });
      return;
    }
  }
  try {
    // Save the data with the desired structure,
    await surveyCollection.insertOne({
      contact,
      id,
      password,
    });
    res.json({ success: true, message: "Contact submitted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

app.get("/admin/get-contacts", async (req, res) => {
  try {
    const contacts = await planCollection.find().toArray();
    //sort the contacts by participant number
    contacts.sort((a, b) => a.participantNumber - b.participantNumber);
    const identifiers = contacts.map((contact) => contact.identifier);
    res.json({ success: true, data: identifiers });
  } catch (error) {
    console.error("Error fetching contacts:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

// Define a new route handler
app.get("/admin/api/planned_activities/:user_id", async (req, res) => {
  const user_id = req.params.user_id;
  try {
    const user = await participantsCollection.findOne({ user_id });
    const participantNumber = user.number;
    const plan = await planCollection.findOne({ participantNumber });

    if (!plan) {
      res.json({
        success: true,
        plannedActivities: [],
        unplannedActivities: [],
      });
      return;
    }
    const selectedDays = plan.selectedDays;
    const userDocuments = await dataCollection.find({ user_id }).toArray();
    let combinedActivities = [];

    if (userDocuments.length === 0) {
      res.json({
        success: true,
        plannedActivities: [],
        unplannedActivities: [],
      });
      return;
    }

    for (const document of userDocuments) {
      combinedActivities.push(...document.activities);
    }

    if (combinedActivities.length === 0) {
      res.json({
        success: true,
        plannedActivities: [],
        unplannedActivities: [],
      });
      return;
    }

    const plannedActivities = [];
    const unplannedActivities = [];
    const missedPlannedActivities = [];

    const today = new Date();
    const todayISOString = today.toISOString().split("T")[0];

    selectedDays.forEach((day) => {
      const trimmedDay = day.trim();

      if (trimmedDay <= todayISOString && trimmedDay !== todayISOString) {
        const plannedActivityOnDay = combinedActivities.find((activity) => {
          return (
            activity.startDate.split("T")[0] === trimmedDay &&
            !plannedActivities.some(
              (plannedActivity) =>
                plannedActivity.startDate.split("T")[0] === trimmedDay
            )
          );
        });

        if (plannedActivityOnDay) {
          plannedActivities.push(plannedActivityOnDay);
        } else {
          missedPlannedActivities.push(trimmedDay);
        }
      }
    });

    combinedActivities.forEach((activity) => {
      const activityDate = activity.startDate.split("T")[0];
      if (
        !selectedDays.includes(activityDate) &&
        !plannedActivities.includes(activity)
      ) {
        unplannedActivities.push(activity);
      }
    });

    res.json({ success: true, plannedActivities, unplannedActivities });
  } catch (error) {
    console.error("Error fetching planned activities:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

app.post("/admin/api/points/:user_id", async (req, res) => {
  const user_id = req.params.user_id;

  try {
    const user = await participantsCollection.findOne({ user_id });
    //if we find a user there, we can get the participantNumber
    const participantNumber = user.number;

    const plan = await planCollection.findOne({ participantNumber });
    console.log(plan);

    if (updated.modifiedCount > 0) {
      res
        .status(200)
        .json({ success: true, message: "Points updated successfully" });
    } else {
      res.status(300).json({
        success: false,
        message: "No matching planned activity found",
      });
    }
  } catch (error) {
    console.error("Error updating points:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

app.get("/api/get_user_data", async (req, res) => {
  const user_id = req.session.user;
  let data = {};
  usersCollection
    .findOne({ user_id })
    .then(async (user) => {
      if (user) {
        const plan = await planCollection.findOne({
          participantNumber: user.number,
        });
        if (!plan) {
          data = {
            user_id: user.user_id,
            number: user.number,
            start_date: user.start_date,
            selectedDays: [],
            completedPlannedActivities: [],
            completedUnplannedActivities: [],
            missedPlannedActivities: [],
            callingDays: [],
          };
        } else {
          data = {
            user_id: user.user_id,
            number: user.number,
            start_date: user.start_date,
            selectedDays: plan.selectedDays,
            //get the dates of the completed planned activities
            completedPlannedActivities: plan.completedPlannedActivities.map(
              (activity) => activity.startDate.split("T")[0]
            ),
            //get the dates of the completed unplanned activities
            completedUnplannedActivities: plan.completedUnplannedActivities.map(
              (activity) => activity.startDate.split("T")[0]
            ),
            //get the dates of the missed planned activities
            missedPlannedActivities: plan.missedPlannedActivities,
            callingDays: plan.callingDays,
          };
        }
        res.json(data);
      } else {
        res.status(404).json({ error: "User not found" });
      }
    })
    .catch((error) => {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "Internal server error" });
    });
});

app.get("/api/get_weekly_points", async (req, res) => {
  const user_id = req.session.user;

  try {
    const weeklyPoints = await weeklyPointsCollection
      .find({ user_id })
      .sort({ date: -1 })
      .toArray();
    res.json({ success: true, data: weeklyPoints });
  } catch (error) {
    console.error("Error fetching weekly points:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

app.post("/api/text", (req, res) => {
  const { plannedExercise, performedExercise, text } = req.body;
  const id = req.session.user;
  const today = new Date();
  const todayISOString = today.toISOString().split("T")[0];

  // Send the information to the database
  textCollection.insertOne({
    id,
    date: todayISOString,
    plannedExercise,
    performedExercise,
    text,
  });

  // Respond with a success message
  res.json({ message: "Data received successfully!" });
});

// Delete contact route
app.delete("/admin/delete-contact/:identifier", async (req, res) => {
  const identifier = req.params.identifier;
  console.log(identifier);
  try {
    const result = await planCollection.deleteOne({ identifier });

    if (result.deletedCount > 0) {
      res.json({ success: true, message: "Contact deleted successfully" });
    } else {
      res.json({ success: false, message: "No matching contact found" });
    }
  } catch (error) {
    console.error("Error deleting contact:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

// Delete ema contact route
app.delete("/admin/delete-ema-contact/:identifier", async (req, res) => {
  const contact = req.params.identifier;
  console.log(contact);
  try {
    const result = await surveyCollection.deleteOne({ contact });
    if (result.deletedCount > 0) {
      res.json({ success: true, message: "Contact deleted successfully" });
    } else {
      res.json({ success: false, message: "No matching contact found" });
    }
  } catch (error) {
    console.error("Error deleting contact:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

// Delete health contact route
app.delete("/admin/delete-health-contact/:identifier", async (req, res) => {
  const identifier = req.params.identifier;

  try {
    const result = await healthCollection.deleteOne({ identifier });

    if (result.deletedCount > 0) {
      res.json({ success: true, message: "Contact deleted successfully" });
    } else {
      res.json({ success: false, message: "No matching contact found" });
    }
  } catch (error) {
    console.error("Error deleting contact:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

// Serve the error page
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, "404.html"));
});

// Cron stuff

async function fetchDataAndProcess() {
  try {
    const listIDS = await getIds();

    for (const user_id of listIDS) {
      await processUser(user_id);
    }
  } catch (error) {
    console.error("Error fetching data:", error);
  }
}

async function getIds() {
  try {
    const db = client.db("Roybal");
    const usersCollection = db.collection("users");
    const list = await usersCollection.find().toArray();

    const userIDs = list.map((user) => user.user_id);

    return userIDs;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
}

async function processUser(user_id) {
  try {
    const fitbitDataResponse = await collectFitbitData(user_id);

    if (fitbitDataResponse.status === 200) {
      const fitbitData = await fitbitDataResponse.json();
      await storeDataInDatabase(user_id, fitbitData);
    } else {
      console.error(`HTTP error! status: ${fitbitDataResponse.status}`);
    }
  } catch (error) {
    console.error(`Error fetching data for user ${user_id}:`, error);
  }
}

async function processPlans() {
  const db = client.db("Roybal");
  const planCollection = db.collection("plan");
  const currentDate = new Date();
  const formattedDate = currentDate.toISOString().split("T")[0];
  //get every plan
  const plans = await planCollection.find().toArray();
  //trim the dates
  plans.forEach((plan) => {
    plan.selectedDays = plan.selectedDays.map((day) => day.trim());
  });

  const matchingPlans = plans.filter((plan) =>
    plan.selectedDays.includes(formattedDate)
  );
  for (const plan of matchingPlans) {
    await processPlan(plan);
  }
}

async function processReminder() {
  const currentDate = new Date();
  const formattedDate = currentDate.toISOString().split("T")[0];
  //get every plan
  const plans = await planCollection.find().toArray();
  //trim the dates
  plans.forEach((plan) => {
    plan.selectedDays = plan.selectedDays.map((day) => day.trim());
  });

  const matchingPlans = plans.filter((plan) =>
    plan.selectedDays.includes(formattedDate)
  );
  // for each person, send a reminder if they have a planned activity today
  for (const plan of matchingPlans) {
    await sendReminder(plan);
  }
}

async function processPlan(plan) {
  const identifier_type = plan.identifier_type;
  const identifier = plan.identifier;

  console.log(`Sending notification to ${identifier}...`);
  const emailBody =
    "This is a reminder that you have a planned walk today. Have a great day! \n Best, \n TBI Lab";
  const planSMSBody =
    "This is a reminder that you have a planned walk today. Have a great day!";
  try {
    if (identifier_type === "email") {
      await sendEmail(identifier, "Your Planned Activity Today", emailBody);
    } else {
      await sendSMS(identifier, planSMSBody);
    }
  } catch (error) {
    console.error(`Error sending notification to ${identifier}:`, error);
  }
}

async function sendReminder(plan) {
  const identifier_type = plan.identifier_type;
  const identifier = plan.identifier;

  console.log(`Sending reminder to ${identifier}...`);
  const reminderSMSBody =
    "Good Morning! This is a reminder to open your Fit Bit app to sync all of your walking data.";
  const reminderEmailBody =
    "Good Morning! \n This is a reminder to open your Fit Bit app to sync all of your walking data. \nBest, \n TBI Lab";
  try {
    if (identifier_type === "email") {
      await sendEmail(identifier, "Your Daily Reminder", reminderEmailBody);
    } else {
      await sendSMS(identifier, reminderSMSBody);
    }
  } catch (error) {
    console.error(`Error sending reminder to ${identifier}:`, error);
  }
}

// Function to collect Fitbit data
async function collectFitbitData(user_id) {
  // make sure the database is connected
  const db = client.db("Roybal");
  const participantsCollection = db.collection("participants");
  const yesterday = new Date(new Date().setDate(new Date().getDate() - 1))
    .toISOString()
    .slice(0, 10);

  try {
    const tokensResponse = await participantsCollection.findOne({
      user_id,
    });

    if (!tokensResponse) {
      throw new Error(`User ${user_id} not found`);
    }

    const access_token = tokensResponse.access_token;
    const fitbitDataResponse = await fetch(
      `https://api.fitbit.com/1/user/${user_id}/activities/date/${yesterday}.json`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${access_token}`,
        },
      }
    );
    console.log(fitbitDataResponse.status);
    if (fitbitDataResponse.status !== 200) {
      throw new Error(`HTTP error! status: ${fitbitDataResponse.status}`);
    }
    return fitbitDataResponse;
  } catch (error) {
    // Handle 401 error by refreshing the token
    try {
      const user = await participantsCollection.findOne({ user_id });
      const response = await fetch("https://api.fitbit.com/oauth2/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization:
            "Basic " +
            Buffer.from(
              `${process.env.CLIENT_ID}:${process.env.CLIENT_SECRET}`
            ).toString("base64"),
        },
        body: `grant_type=refresh_token&refresh_token=${user.refresh_token}`,
      });

      const data = await response.json();
      console.log(data);

      if (data.access_token) {
        const newAccessToken = data.access_token;
        const newRefreshToken = data.refresh_token || user.refresh_token;

        const result = await participantsCollection.updateOne(
          { user_id: user_id },
          {
            $set: {
              access_token: newAccessToken,
              refresh_token: newRefreshToken,
            },
          }
        );

        if (result.modifiedCount > 0) {
          console.log(
            `Updated access token and refresh token for user ${user_id}`
          );
        } else {
          console.log(
            `User ${user_id} not found or access token/refresh token not updated`
          );
        }

        const fitbitDataResponse = await fetch(
          `https://api.fitbit.com/1/user/${user_id}/activities/date/${yesterday}.json`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${newAccessToken}`,
            },
          }
        );

        if (fitbitDataResponse.status !== 200) {
          throw new Error(`HTTP error! status: ${fitbitDataResponse.status}`);
        }

        return fitbitDataResponse;
      } else {
        console.error("Error refreshing access token:", data.error);
        throw new Error("Error refreshing access token");
      }
    } catch (error) {
      console.error("Error refreshing access token:", error);
      throw error;
    }
  }
}

// Create a transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL, // Your email address
    pass: process.env.PASSWORD, // Your password
  },
});

// Function to send an email
const sendEmail = async (to, subject, body) => {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL, // Sender's email address
      to, // Recipient's email address
      subject, // Email subject
      text: body, // Plain text body
    });
    console.log("Email sent:", info.response);
  } catch (error) {
    console.log("No email sent");
  }
};

const sendSMS = async (to, body) => {
  try {
    const message = await clientTwilio.messages.create({
      body: body,
      from: process.env.TWILIO_NUMBER, // Twilio phone number
      to: to, // Recipient's phone number
    });
    console.log("SMS sent:", message.sid);
  } catch (error) {
    console.log("No SMS sent", error);
  }
};

async function storeWeeklyPoints(user_id, points) {
  const currentDate = new Date();
  const saturday = new Date(currentDate);
  saturday.setDate(currentDate.getDate() - currentDate.getDay());

  const sunday = new Date(currentDate);
  sunday.setDate(currentDate.getDate() - currentDate.getDay() + 6);

  const weekStart = saturday.toISOString().slice(0, 10);
  const weekEnd = sunday.toISOString().slice(0, 10);

  const existingDocument = await weeklyPointsCollection.findOne({
    user_id,
    $and: [{ date: { $gte: weekStart } }, { date: { $lte: weekEnd } }],
  });

  if (existingDocument) {
    // Update the existing document
    await weeklyPointsCollection.updateOne(
      { user_id, date: weekStart },
      { $set: { points } }
    );

    console.log(
      `Updated weekly points for user ${user_id} for the week of ${weekStart} to ${weekEnd}`
    );
  } else {
    // Create a new document
    await weeklyPointsCollection.insertOne({
      user_id,
      date: weekStart,
      points,
    });

    console.log(
      `Stored weekly points for user ${user_id} for the week of ${weekStart} to ${weekEnd}`
    );
  }
}

async function processPoints() {
  try {
    //Check if db is connected
    const db = client.db("Roybal");
    const usersCollection = db.collection("users");
    const users = await usersCollection.find().toArray();
    for (const user of users) {
      const user_id = user.user_id;
      const participantNumber = user.number;
      const plan = await planCollection.findOne({ participantNumber });
      if (!plan) {
        continue;
      }
      const selectedDays = plan.selectedDays;
      const userDocuments = await dataCollection.find({ user_id }).toArray();
      let combinedActivities = [];

      for (const document of userDocuments) {
        combinedActivities.push(...document.activities);
      }

      const plannedActivities = [];
      const unplannedActivities = [];
      const missedPlannedActivities = [];

      const today = new Date();
      const todayISOString = today.toISOString().split("T")[0];

      selectedDays.forEach((day) => {
        const trimmedDay = day.trim();

        if (trimmedDay <= todayISOString && trimmedDay !== todayISOString) {
          const plannedActivityOnDay = combinedActivities.find((activity) => {
            return (
              activity.startDate.split("T")[0] === trimmedDay &&
              !plannedActivities.some(
                (plannedActivity) =>
                  plannedActivity.startDate.split("T")[0] === trimmedDay
              )
            );
          });

          if (plannedActivityOnDay) {
            plannedActivities.push(plannedActivityOnDay);
          } else {
            missedPlannedActivities.push(trimmedDay);
          }
        }
      });

      combinedActivities.forEach((activity) => {
        const activityDate = activity.startDate.split("T")[0];
        if (
          !selectedDays.includes(activityDate) &&
          !plannedActivities.includes(activity)
        ) {
          unplannedActivities.push(activity);
        }
      });

      await planCollection.updateOne(
        { participantNumber },
        {
          $set: {
            completedPlannedActivities: plannedActivities,
            completedUnplannedActivities: unplannedActivities,
            missedPlannedActivities: missedPlannedActivities,
          },
        }
      );

      let points = 0;

      const sunday = new Date(today.setDate(today.getDate() - today.getDay()));
      const saturday = new Date(
        today.setDate(today.getDate() - today.getDay() + 6)
      );

      const plannedActivitiesThisWeek = plannedActivities.filter((activity) => {
        const activityDate = new Date(activity.startDate);
        return (
          // change dates ???
          (activityDate >= sunday && activityDate <= saturday) ||
          activityDate.toISOString().split("T")[0] ===
            sunday.toISOString().split("T")[0]
        );
      });
      const plannedPoints = Math.min(plannedActivitiesThisWeek.length, 5) * 500;
      points = plannedPoints;

      console.log(
        `Points for user ${user_id}: ${points} for the week of ${sunday
          .toISOString()
          .slice(0, 10)} to ${saturday.toISOString().slice(0, 10)}`
      );
      storeWeeklyPoints(user_id, points);
    }
  } catch (error) {
    console.error("Error calculating and storing points:", error);
  }
}

async function sendHealthTips() {
  console.log("Sending health tips...");
  try {
    const db = client.db("Roybal");
    const healthCollection = db.collection("health");
    const tipsCollection = db.collection("tips");
    const dataCollection = db.collection("data");
    const planCollection = db.collection("plan");

    const users = await planCollection.find().toArray();
    const healthContacts = await healthCollection.find().toArray();
    const tips = await tipsCollection.find().toArray();
    const tiplist = tips[0].tips;

    // go down in order of the list depending on what week it is since the user has started
    // find the earliest date that the user has started and then find the difference between that date and the current date
    // divide that difference by 7 and then take the remainder to find the index of the tip

    for (const user of users) {
      const user_id = user.user_id;
      const plan = await planCollection.findOne({ user_id });
      if (!plan) {
        continue;
      }
      const selectedDays = plan.selectedDays;
      const userDocuments = await dataCollection.find({ user_id }).toArray();
      let combinedActivities = [];

      for (const document of userDocuments) {
        combinedActivities.push(...document.activities);
      }

      const plannedActivities = [];
      const unplannedActivities = [];
      const missedPlannedActivities = [];

      const today = new Date();
      const todayISOString = today.toISOString().split("T")[0];

      selectedDays.forEach((day) => {
        const trimmedDay = day.trim();

        if (trimmedDay <= todayISOString && trimmedDay !== todayISOString) {
          const plannedActivityOnDay = combinedActivities.find((activity) => {
            return (
              activity.startDate.split("T")[0] === trimmedDay &&
              !plannedActivities.some(
                (plannedActivity) =>
                  plannedActivity.startDate.split("T")[0] === trimmedDay
              )
            );
          });

          if (plannedActivityOnDay) {
            plannedActivities.push(plannedActivityOnDay);
          } else {
            missedPlannedActivities.push(trimmedDay);
          }
        }
      });

      combinedActivities.forEach((activity) => {
        const activityDate = activity.startDate.split("T")[0];
        if (
          !selectedDays.includes(activityDate) &&
          !plannedActivities.includes(activity)
        ) {
          unplannedActivities.push(activity);
        }
      });

      const sunday = new Date(today.setDate(today.getDate() - today.getDay()));
      const saturday = new Date(
        today.setDate(today.getDate() - today.getDay() + 6)
      );

      const plannedActivitiesThisWeek = plannedActivities.filter((activity) => {
        const activityDate = new Date(activity.startDate);
        return (
          (activityDate >= sunday && activityDate <= saturday) ||
          activityDate.toISOString().split("T")[0] ===
            sunday.toISOString().split("T")[0]
        );
      });
      const plannedPoints = Math.min(plannedActivitiesThisWeek.length, 5) * 500;
      const points = plannedPoints;

      const userHealthContact = healthContacts.find(
        (contact) => contact.identifier === user_id
      );

      if (userHealthContact) {
        const tipIndex = points % tiplist.length;
        const tip = tiplist[tipIndex];
        const identifier = userHealthContact.identifier;
        const identifier_type = userHealthContact.identifier_type;
        const tipSMSBody = `Good Morning! Here is your health tip for today: ${tip}`;
        const tipEmailBody = `Good Morning! \n Here is your health tip for today: ${tip} \n Best, \n TBI Lab`;

        if (identifier_type === "email") {
          await sendEmail(identifier, "Your Daily Health Tip", tipEmailBody);
        }

        if (identifier_type === "phone") {
          await sendSMS(identifier, tipSMSBody);
        }

        console.log(`Sent health tip to ${identifier}`);
      }
    }
  } catch (error) {
    console.error("Error sending health tips:", error);
  }
}

async function processCallReminder() {
  const currentDate = new Date();
  const formattedDate = currentDate.toISOString().split("T")[0];
  //get every plan
  const plans = await planCollection.find().toArray();
  //trim the dates
  plans.forEach((plan) => {
    plan.callingDays = plan.selectedDays.map((day) => day.trim());
  });

  const matchingPlans = plans.filter((plan) =>
    plan.selectedDays.includes(formattedDate)
  );
  for (const plan of matchingPlans) {
    await sendCallReminder(plan);
  }
}

async function sendCallReminder(plan) {
  const identifier_type = plan.identifier_type;
  const identifier = plan.identifier;

  const reminderSMSBody =
    "Good Morning! Here is your reminder that the TBI Lab will be calling you today!";
  const reminderEmailBody =
    "Good Morning! \n Here is your reminder that the TBI Lab will be calling you today! \n Best, \n TBI Lab";
  try {
    if (identifier_type === "email") {
      await sendEmail(identifier, "Your Daily Reminder", reminderEmailBody);
    } else {
      await sendSMS(identifier, reminderSMSBody);
    }
  } catch (error) {
    console.error(`Error sending reminder to ${identifier}:`, error);
  }
}

// Task 1: Data Fetching
// Second task. Runs at 8:55 AM every day
cron.schedule(
  "55 8 * * *",
  async () => {
    console.log("Running scheduled data fetching task...");
    try {
      await client.connect();
      await fetchDataAndProcess();
      await fetchDataAndProcess();
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  },
  null,
  true,
  "America/New_York"
);

// Task 2: Plan Processing
// Third task. Runs at 9:00 AM every day
cron.schedule(
  "0 9 * * *",
  async () => {
    console.log("Running scheduled plan processing task...");
    try {
      await client.connect();
      await processPlans();
    } catch (error) {
      console.error("Error processing plans:", error);
    }
  },
  null,
  true,
  "America/New_York"
);

// Task once a day to send a reminder of the call with another lab member
cron.schedule(
  "0 9 * * *",
  async () => {
    console.log("Running scheduled call reminder task...");
    try {
      await client.connect();
      await processCallReminder();
    } catch (error) {
      console.error("Error sending call reminder:", error);
    }
  },
  null,
  true,
  "America/New_York"
);

// First Task. Runs at 8:30 AM every day
cron.schedule(
  "30 8 * * *",
  async () => {
    console.log("Sending Reminder");
    try {
      await client.connect();
      await processReminder();
    } catch (error) {
      console.error("Error sending reminder", error);
    }
  },
  null,
  true,
  "America/New_Tork"
);

// Task 3: Points Calculation and Storage
// Needs to be delayed to ensure that all data is collected
cron.schedule(
  "10 9 * * *",
  async () => {
    console.log("Running scheduled points calculation task...");
    try {
      await client.connect();
      await processPoints();
    } catch (error) {
      console.error("Error calculating and storing points:", error);
    }
  },
  null,
  true,
  "America/New_York"
);

// Task 4: Weekly Health Tips
// Fourth task. Runs at 9:00 AM every Monday
cron.schedule(
  "0 9 * * 1",
  async () => {
    console.log("Running scheduled health tips task...");
    try {
      await client.connect();
      await sendHealthTips();
    } catch (error) {
      console.error("Error sending health tips:", error);
    }
  },
  null,
  true,
  "America/New_York"
);

async function sendSurveyReminder() {
  const surveyCollection = client.db("Roybal").collection("surveyContacts");

  // Fetch the text message to be sent
  const textMessage =
    "Remember to log in and fill out today's survey at https://tbilab.vercel.app!";
  if (!textMessage) {
    console.log("No EMA reminder message found.");
    return;
  }

  // Fetch the list of contacts
  const contacts = await surveyCollection.find().toArray();

  if (!contacts || contacts.length === 0) {
    console.log("No contacts found to send EMA reminder.");
    return;
  }

  // Send SMS to each contact
  for (const contact of contacts) {
    let identifier = contact.contact;
    await sendSMS(identifier, textMessage);
  }
}

// Task 5: EMA Reminder
// Fifth task. Runs at Noon every day
cron.schedule(
  "0 19 * * *",
  async () => {
    console.log("Running scheduled EMA reminder task...");
    try {
      await client.connect();
      await sendSurveyReminder();
      console.log("EMA reminder sent to all contacts.");
    } catch (error) {
      console.error("Error sending EMA reminder:", error);
    } finally {
      await client.close();
    }
  },
  null,
  true,
  "America/New_York"
);
