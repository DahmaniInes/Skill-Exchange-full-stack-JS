const mongoose = require('mongoose');
const { isURL } = require('validator');

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Le titre du cours est obligatoire'],
    trim: true,
    maxlength: [120, 'Le titre ne peut excéder 120 caractères'],
    minlength: [5, 'Le titre doit contenir au moins 5 caractères']
  },
  price: {
    type: Number,
    required: [true, 'Le prix est obligatoire'],
    min: [0, 'Le prix ne peut être négatif'],
    max: [10000, 'Le prix ne peut excéder 10 000']
  },
  instructor: {
    type: String,
    required: [true, "Le nom de l'instructeur est obligatoire"],
    trim: true
  },
  duration: {
    type: String,
    required: [true, 'La durée est obligatoire'],
    match: [/^\d+\s?(h|hrs|hours?)$/i, 'Format de durée invalide (ex: "2h" ou "3hrs")']
  },
  image: {
    type: String,
    required: [true, "L'image est obligatoire"],
    validate: {
      validator: function(value) {
        // Accepte soit les URLs soit les chemins relatifs
        if (isURL(value)) {
          return true;
        }
        // Vérifie le format des chemins locaux
        return /^\/assets\/img\/[a-zA-Z0-9_-]+\.(jpg|jpeg|png|gif|webp)$/i.test(value);
      },
      message: props => `Format d'image invalide. Utilisez soit :
      - Une URL complète (http://...)
      - Un chemin relatif (/assets/img/nom-fichier.jpg)`
    }
  },
  category: {
    type: String,
    required: [true, 'La catégorie est obligatoire'],
    enum: {
      values: ['Web', 'Mobile', 'Data', 'Design', 'Marketing', 'Business'],
      message: 'Catégorie non valide'
    }
  },
  students: {
    type: Number,
    default: 0,
    min: [0, 'Le nombre d\'étudiants ne peut être négatif']
  },
  rating: {
    type: Number,
    default: 0,
    min: [0, 'La note minimale est 0'],
    max: [5, 'La note maximale est 5']
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function(doc, ret) {
      // Transforme automatiquement les chemins en URLs complètes
      if (ret.image && !ret.image.startsWith('http')) {
        ret.image = `http://localhost:${process.env.PORT || 5000}${ret.image.startsWith('/') ? '' : '/'}${ret.image}`;
      }
      delete ret.__v;
      delete ret.createdAt;
      delete ret.updatedAt;
      return ret;
    }
  },
  toObject: {
    virtuals: true,
    transform: function(doc, ret) {
      if (ret.image && !ret.image.startsWith('http')) {
        ret.image = `http://localhost:${process.env.PORT || 5000}${ret.image.startsWith('/') ? '' : '/'}${ret.image}`;
      }
      return ret;
    }
  }
});

// Index pour améliorer les performances de recherche
courseSchema.index({ title: 'text', category: 1 });

module.exports = mongoose.model('Course', courseSchema);