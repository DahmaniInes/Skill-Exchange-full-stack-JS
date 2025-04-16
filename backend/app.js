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
const eventRoutes = require('./Routes/eventRoutes');
const reservationRoutes = require('./Routes/reservationRoutes');
const loginRouter = require('./Routes/authGOOGLE');
const loginGit = require('./Routes/authGitHub');
const authOATH = require('./Routes/oath-totp');
const profileRoutes = require("./Routes/profileRoutes");
const usersRouter = require("./Routes/users");

const authMiddleware = require('./middleware/authMiddleware');

var app = express();
const cors = require("cors");

// 📌 CORS Configuration
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Client-Version', // Header personnalisé ajouté ici
    'X-Requested-With'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  exposedHeaders: ['Content-Length', 'Authorization']
}));

// Ajouter un handler global pour les requêtes OPTIONS
app.options('*', cors());

app.use(logger("dev"));
app.use(express.json());  // Juste une fois
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// 📌 Session Configuration
app.use(
    session({
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
      cookie: {
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 Days
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'None',
      },
    })
);

// 📌 Routes
app.use("/api", authRoutes);             // Auth classique (email/mot de passe)
app.use("/loginGit", loginGit);          // Auth GitHub
app.use("/auth", authOATH);              // OTP / Google Auth
app.use('/event', eventRoutes);          // Routes des événements
app.use('/reservation', reservationRoutes); // 💥 Routes de réservation
app.use("/api", profileRoutes);         // Profil utilisateur

// 📌 Routes de test (si nécessaire)
app.use("/", usersRouter);

// 📌 Gestion des fichiers statiques en production
if (process.env.NODE_ENV === "production") {
  const frontendPath = path.join(__dirname, "../frontend/dist");
  app.use(express.static(frontendPath));

  app.get("*", (req, res) => {
    res.sendFile(path.join(frontendPath, "index.html"));
  });
}

// 📌 Catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// 📌 Error handler
app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};
  res.status(err.status || 500);
  res.render("error");
});

// 📌 Set EJS as the template engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views')); // specify the directory for views

// 📌 Example route to render a view
app.get('/', (req, res) => {
  res.render('index'); // Ensure there is an index.ejs file in the views folder
});

// 📌 Server Setup
const http = require('http');
const server = http.createServer(app);

server.listen(5000, () => console.log("Server running on port 5000"));

module.exports = app;
