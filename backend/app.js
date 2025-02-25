const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const createError = require('http-errors');
const authRoutes = require("./Routes/authRoutes");

dotenv.config(); // Load environment variables from .env file

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware Setup
app.use(cors({
  origin: "http://localhost:5173", // Allow frontend URL
  methods: ['GET', 'POST'], // Allow only specific methods
  credentials: true, // Allow credentials (optional)
}));
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log("Connexion réussie à MongoDB"))
  .catch(err => console.log("Erreur de connexion à MongoDB :", err));

// Session Configuration
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
  cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 }, // 7 Days
}));

// Routes
app.use("/api", authRoutes);

// Error handling
app.use(function (req, res, next) {
  next(createError(404)); // Catch 404 errors
});

app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
