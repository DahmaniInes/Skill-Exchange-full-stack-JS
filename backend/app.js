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

const app = express();
const cors = require("cors");
app.use(cors({
    origin: 'http://localhost:5173', // Allow frontend URL
    methods: ['GET', 'POST'], // Allow only specific methods
    credentials: true, // Allow credentials (optional)
  }));
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
app.use("/api", authRoutes);


// Session Configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
    cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 }, // 7 Days
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