const express = require("express");
const cors = require("cors");
const path = require("path");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// 📌 Connexion à MongoDB
const mongoconnection = require("./Config/connection.json");

mongoose
  .connect(mongoconnection.url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ Connecté à MongoDB avec succès!"))
  .catch((err) => {
    console.error("❌ Erreur de connexion à MongoDB :", err);
    process.exit(1); // Quitter l'application si MongoDB ne démarre pas
  });

// 📌 Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Ajouté pour supporter les requêtes `x-www-form-urlencoded`

// 📌 Routes API de test
const profileRoutes = require("./Routes/profileRoutes");
app.use("/api", profileRoutes); // Assure-toi que ce middleware est bien ajouté


// 📌 Gestion des fichiers statiques en production
if (process.env.NODE_ENV === "production") {
  const frontendPath = path.join(__dirname, "../frontend/dist");
  app.use(express.static(frontendPath));

  app.get("*", (req, res) => {
    res.sendFile(path.join(frontendPath, "index.html"));
  });
}

// 📌 Démarrage du serveur
app.listen(PORT, () => {
  console.log(`✅ Serveur démarré sur : http://localhost:${PORT}`);
});

module.exports = app;
