const User = require("../Models/User");

// 1. Mise à jour du profil utilisateur
const updateProfile = async (req, res) => {
    try {
      const userId = req.params.id;
      const { firstName, lastName, location, bio, profilePicture } = req.body;
  
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { firstName, lastName, location, bio, profilePicture },
        { new: true, runValidators: true }
      );
  
      if (!updatedUser) return res.status(404).json({ message: "Utilisateur non trouvé" });
      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ message: "Erreur serveur", error });
    }
  };
  

//  2. Récupération du profil utilisateur
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
};

//  3. Récupération du profil public
const getPublicProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("firstName lastName bio skills privacySettings");

    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });
    if (!user.privacySettings.isProfilePublic)
      return res.status(403).json({ message: "Ce profil est privé" });

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
};

//  4. Mise à jour des préférences d’apprentissage
const updatePreferences = async (req, res) => {
  try {
    const { availability, format } = req.body;
    const userId = req.user.id;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { "learningPreferences.availability": availability, "learningPreferences.format": format },
      { new: true, runValidators: true }
    );

    if (!updatedUser) return res.status(404).json({ message: "Utilisateur non trouvé" });

    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
};

// 📌 5. Ajouter une compétence
const addSkill = async (req, res) => {
  try {
    const { name, level } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });

    user.skills.push({ name, level });
    await user.save();

    res.json(user.skills);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
};

// 📌 6. Supprimer une compétence
const removeSkill = async (req, res) => {
  try {
    const { name } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });

    user.skills = user.skills.filter(skill => skill.name !== name);
    await user.save();

    res.json(user.skills);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
};

// 📌 7. Activer/Désactiver le profil public
const toggleProfilePrivacy = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });

    user.privacySettings.isProfilePublic = !user.privacySettings.isProfilePublic;
    await user.save();

    res.json({ isProfilePublic: user.privacySettings.isProfilePublic });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
};


const addUser = async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "L'utilisateur existe déjà !" });
    }

    // Créer un nouvel utilisateur
    const newUser = new User({
      firstName,
      lastName,
      email,
      password, // Assurez-vous de hasher le mot de passe avant de l'enregistrer
    });

    // Sauvegarder dans la base de données
    await newUser.save();

    res.status(201).json({ message: "Utilisateur ajouté avec succès", user: newUser });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
};

module.exports = {
    addUser,
  updateProfile,
  getUserProfile,
  getPublicProfile,
  updatePreferences,
  addSkill,
  removeSkill,
  toggleProfilePrivacy
};
