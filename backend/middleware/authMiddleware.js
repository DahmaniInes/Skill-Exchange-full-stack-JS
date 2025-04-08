const jwt = require("jsonwebtoken");
const User = require("../Models/User");

const authMiddleware = async (req, res, next) => {
  try {
    // Récupérer le token depuis le header
    const token = req.header("Authorization");

    // Vérifier que le token est présent et commence par "Bearer "
    if (!token || !token.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Accès non autorisé, token manquant ou invalide" });
    }

    // Extraire uniquement le token sans "Bearer "
    const jwtToken = token.split(" ")[1];
    console.log("Token reçu :", jwtToken);

    // Vérifier et décoder le token
    const decoded = jwt.verify(jwtToken, process.env.JWT_SECRET);
    console.log("Décodage JWT :", decoded);

    // Rechercher l'utilisateur dans la base de données
    const user = await User.findById(decoded.id).select("-password");
    console.log("Utilisateur trouvé :", user);

    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    // Ajouter l'utilisateur à la requête
    req.user = user;
    next();
  } catch (error) {
    console.log("Erreur JWT :", error.message);
    return res.status(401).json({ message: "Token invalide ou expiré" });
  }
};

module.exports = authMiddleware;
