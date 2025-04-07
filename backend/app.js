require("dotenv").config();
var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var session = require("express-session");
var MongoStore = require("connect-mongo");
var mongoose = require("mongoose");
const authRoutes = require("./Routes/authRoutes");
var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");
var loginRouter = require('./Routes/authGOOGLE');
var loginGit = require('./Routes/authGitHub');
var MessengerRoute = require('./Routes/MessengerRoute');

const app = express();
const cors = require("cors");

// Socket.IO Setup
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true
  }
});

const onlineUsers = require("./Utils/onlineUsers");

// Configurer Socket.IO avec onlineUsers
require("./middleware/messengerSocket")(io, onlineUsers);

// Middleware pour ajouter io à req (déplacé avant les routes)
app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use(cors({
  origin: 'http://localhost:5173', // Your frontend URL
  credentials: true, // Allow credentials (cookies, authorization headers, etc.)
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Session-UserId'], // Add 'Authorization' to the allowed headers
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Specify allowed methods
}));

// Middleware Setup
app.use(logger("dev"));
app.use(express.json()); // Utilisation unique de express.json() (suppression de la redondance)
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// Session Setup
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
    },
  })
);

// Routes
app.use("/api", authRoutes);
app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/login", loginRouter);
app.use("/loginGit", loginGit);
app.use("/auth", require('./Routes/oath-totp'));
app.use("/MessengerRoute", MessengerRoute);

// 📌 Routes API de test
const profileRoutes = require("./Routes/profileRoutes");
app.use("/api", profileRoutes);

// 📌 Gestion des fichiers statiques en production
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
  res.status(err.status || 500);
  res.render("error");
});

// Set EJS as the template engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Example route to render a view
app.get('/', (req, res) => {
  res.render('index');
});

// Connect to MongoDB and start the server only after successful connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Successfully connected to MongoDB"); // Log pour confirmer la connexion
    startServer(); // Démarrer le serveur après la connexion réussie
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1); // Arrêter le processus si la connexion échoue
  });

// Fonction pour démarrer le serveur après la connexion MongoDB
function startServer() {
  server.listen(5000, () => console.log("Server running on port 5000"));
}

module.exports = app;