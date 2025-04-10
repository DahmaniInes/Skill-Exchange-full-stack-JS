require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const Course = require('./Models/Course');
const User = require('./Models/User');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json());

// Configuration des fichiers statiques
const assetsPath = path.join(__dirname, 'assets');
app.use('/assets', express.static(assetsPath, {
  setHeaders: (res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Cache-Control', 'public, max-age=31536000');
  }
}));

// Connexion MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/skill-exchange', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connecté à MongoDB'))
.catch(err => console.error('Erreur MongoDB:', err));

// Routes API

// Routes d'authentification
app.post('/api/signup', async (req, res) => {
  try {
    const { firstName, lastName, email, password, role, gender } = req.body;

    // Validation des données
    if (!['student', 'teacher'].includes(role)) {
      return res.status(400).json({ message: 'Role must be either student or teacher' });
    }

    if (!['male', 'female'].includes(gender)) {
      return res.status(400).json({ message: 'Gender must be either male or female' });
    }

    // Vérifier si l'email existe déjà
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    // Hacher le mot de passe
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Créer un nouvel utilisateur
    const user = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role,
      gender
    });

    await user.save();

    res.status(201).json({ 
      message: 'User registered successfully',
      user: {
        id: user._id,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 1. GET ALL COURSES
app.get('/api/courses', async (req, res) => {
  try {
    const courses = await Course.find().sort({ createdAt: -1 });
    const formattedCourses = courses.map(course => ({
      ...course.toObject(),
      image: formatImageUrl(course.image, PORT)
    }));
    res.json(formattedCourses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 2. GET SINGLE COURSE
app.get('/api/courses/:id', async (req, res) => {
  try {
    // Vérifie que l'ID est valide
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'ID de cours invalide' });
    }

    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({ message: 'Cours non trouvé' });
    }

    // Formatte la réponse
    const response = {
      ...course.toObject(),
      image: course.image.startsWith('http') 
        ? course.image 
        : `http://localhost:${PORT}${course.image}`
    };

    res.json(response);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 3. CREATE COURSE
app.post('/api/courses', async (req, res) => {
  try {
    const courseData = normalizeCourseData(req.body);
    const course = new Course(courseData);
    const newCourse = await course.save();
    
    res.status(201).json({
      ...newCourse.toObject(),
      image: formatImageUrl(newCourse.image, PORT)
    });
  } catch (err) {
    res.status(400).json({ 
      message: err.message,
      errors: err.errors 
    });
  }
});

// 4. UPDATE COURSE
app.put('/api/courses/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'ID de cours invalide' });
    }

    const courseData = normalizeCourseData(req.body);
    const updatedCourse = await Course.findByIdAndUpdate(
      req.params.id,
      courseData,
      { new: true, runValidators: true }
    );

    if (!updatedCourse) {
      return res.status(404).json({ message: 'Cours non trouvé' });
    }

    res.json({
      ...updatedCourse.toObject(),
      image: formatImageUrl(updatedCourse.image, PORT)
    });
  } catch (err) {
    res.status(400).json({ 
      message: err.message,
      errors: err.errors 
    });
  }
});

// 5. DELETE COURSE
app.delete('/api/courses/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'ID de cours invalide' });
    }

    const deletedCourse = await Course.findByIdAndDelete(req.params.id);
    if (!deletedCourse) {
      return res.status(404).json({ message: 'Cours non trouvé' });
    }

    // Format the response safely
    const response = {
      message: 'Cours supprimé avec succès',
      deletedCourse: {
        ...deletedCourse.toObject()
      }
    };

    // Only add image if it exists
    if (deletedCourse.image) {
      response.deletedCourse.image = formatImageUrl(deletedCourse.image, PORT);
    }

    res.json(response);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Helper functions
function formatImageUrl(imagePath, port) {
  if (!imagePath) return null;
  if (imagePath.startsWith('http')) return imagePath;
  return `http://localhost:${port}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
}

function normalizeCourseData(data) {
  const normalized = { ...data };
  if (normalized.image && !normalized.image.startsWith('http')) {
    normalized.image = `/assets/img/${path.basename(normalized.image)}`;
  }
  return normalized;
}

app.get('/', (req, res) => {
  res.send('Backend is running');
});

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
  console.log(`Accès aux images: http://localhost:${PORT}/assets/img/course-1.jpg`);
});