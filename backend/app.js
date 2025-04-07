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
var indexRouter = require("./Routes/index");
var usersRouter = require("./Routes/users");
var loginRouter = require('./Routes/authGOOGLE');
var loginGit = require('./Routes/authGitHub');
const app = express();
const cors = require("cors");



app.use(cors({
  origin: 'http://localhost:5173', // Your frontend URL
  credentials: true, // Allow credentials (cookies, authorization headers, etc.)
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Session-UserId'], // Add 'Authorization' to the allowed headers
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Specify allowed methods
}));


app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI);
app.use("/api", authRoutes);


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


// Middleware Setup
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/login", loginRouter);
app.use("/loginGit", loginGit);


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
app.set('views', path.join(__dirname, 'views')); // specify the directory for views

// Example route to render a view
app.get('/', (req, res) => {
  res.render('index'); // Ensure there is an index.ejs file in the views folder
});

app.listen(5000, () => console.log("Server running on port 5000"));

module.exports = app;