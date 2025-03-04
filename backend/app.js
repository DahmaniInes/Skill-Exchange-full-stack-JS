const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;


const adminRoutes = require('./Routes/adminRoutes');

var mongoose = require('mongoose');
var mongoconnection = require('./Config/connection.json');


//mongo config
  mongoose.connect( mongoconnection.url , 
  { useNewUrlParser:
  true ,
  useUnifiedTopology: true
  })
  .then(() => console.log("Connected to DB success!!"))
  .catch(err => console.error("Could not connect to DB", err));


// Middleware
app.use(cors());
app.use(express.json());

// Routes API

app.use('/api/admin', adminRoutes);
app.get('/api/test', (req, res) => {
  res.json({ message: 'API fonctionne correctement!' });
});

// En production, servir les fichiers statiques du frontend
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist', 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});


module.exports = app;