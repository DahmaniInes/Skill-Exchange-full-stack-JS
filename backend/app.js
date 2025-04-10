require("dotenv").config();
var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var session = require("express-session");
var MongoStore = require("connect-mongo");
var mongoose = require("mongoose");
const http = require('http');
const cors = require("cors");
const { SessionsClient } = require('@google-cloud/dialogflow');

// Import route modules
const authRoutes = require("./Routes/authRoutes");
var indexRouter = require("./routes/index");
var usersRouter = require("./Routes/users");
var loginRouter = require('./Routes/authGOOGLE');
var loginGit = require('./Routes/authGitHub');
var MessengerRoute = require('./Routes/MessengerRoute');
const skillRoutes = require("./Routes/skillRoutes");
const profileRoutes = require("./Routes/profileRoutes");
const storyRoutes = require("./Routes/storyRoutes");
const roadmapRoutes = require('./Routes/roadmapRoutes');
const internshipRoutes = require('./Routes/internshipRoutes');
const authOATH = require('./Routes/oath-totp');

// Initialize Express
const app = express();
const server = http.createServer(app);

// Socket.IO Setup
const { Server } = require('socket.io');
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true
  }
});

const onlineUsers = require("./Utils/onlineUsers");

// Configure Socket.IO with onlineUsers
require("./middleware/messengerSocket")(io, onlineUsers);

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Set up core middleware
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Add io to req
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Configure CORS
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Client-Version',
    'X-Requested-With',
    'X-Session-UserId'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  exposedHeaders: ['Content-Length', 'Authorization']
}));
app.options('*', cors());

// Set up session
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 Days
      httpOnly: true, // Prevent client-side access
      secure: process.env.NODE_ENV === 'production', // Set to true if using HTTPS in production
      sameSite: 'None', // Allow cross-origin requests
    }
  })
);

// Static files
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Dialogflow setup
const sessionClient = new SessionsClient({
  keyFilename: 'path/to/service-account-key.json',
});

const projectId = 'your-project-id';
const sessionId = 'your-session-id';

// Dialogflow chat endpoint
app.post('/chat', async (req, res) => {
  const sessionPath = sessionClient.projectAgentSessionPath(projectId, sessionId);
  const request = {
    session: sessionPath,
    queryInput: {
      text: {
        text: req.body.message,
        languageCode: 'fr-FR',
      },
    },
  };

  try {
    const responses = await sessionClient.detectIntent(request);
    const result = responses[0].queryResult;
    res.json({ response: result.fulfillmentText });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Register all routes
app.use("/api", authRoutes);
app.use("/api/skills", skillRoutes);
app.use("/api/stories", storyRoutes);
app.use("/api/internships", internshipRoutes);
app.use("/api/roadmaps", roadmapRoutes);
app.use("/api", profileRoutes);
app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/loginGit", loginGit);
app.use("/auth", authOATH);
app.use("/MessengerRoute", MessengerRoute);

// Example route to render a view
app.get('/', (req, res) => {
  res.render('index'); // Ensure there is an index.ejs file in the views folder
});

// Production static file handling
if (process.env.NODE_ENV === "production") {
  const frontendPath = path.join(__dirname, "../frontend/dist");
  app.use(express.static(frontendPath));

  app.get("*", (req, res) => {
    res.sendFile(path.join(frontendPath, "index.html"));
  });
}

// Catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// Error handler
app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};
  
  // Send error as JSON if it's an API request
  if (req.path.startsWith('/api')) {
    return res.status(err.status || 500).json({
      error: err.message,
      stack: req.app.get("env") === "development" ? err.stack : undefined
    });
  }
  
  // Otherwise render the error page
  res.status(err.status || 500);
  res.render("error");
});

// Connect to MongoDB and start the server
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Successfully connected to MongoDB");
    server.listen(5000, () => console.log("Server running on port 5000"));
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

module.exports = app;