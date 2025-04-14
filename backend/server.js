/*const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const authRoutes = require("./Routes/authRoutes");

dotenv.config();

const app = express();
app.use(cors({
    origin: 'http://localhost:5173', // Allow frontend URL
    methods: ['GET', 'POST'], // Allow only specific methods
    credentials: true, // Allow credentials (optional)
  }));
app.use(express.json());

// Connexion à MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log("Connexion réussie à MongoDB"))
  .catch(err => console.log("Erreur de connexion à MongoDB :", err));

// Utilisation des routes d'authentification
app.use("/api", authRoutes);

// Démarrer le serveur
app.listen(5000, () => {
  console.log("Serveur démarré sur http://localhost:5000");
});
*/