const express = require('express');
const dotenv = require('dotenv');
const userRoutes = require('./routes/user.routes');
const fs = require('fs').promises;

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use('/users', userRoutes);

app.get('/', (req, res) => {
  res.send('🚀 API Node.js fonctionne !');
});

// Etape 2 : Charger données du fichier JSON
let heroes = [];
async function loadHeroes() {
    try {
        const data = await fs.readFile('./SuperHerosComplet.json', 'utf-8');
        const parsed = JSON.parse(data)
        heroes = parsed.superheros;
    } catch (err) {
        console.error('Erreur de lecture du fichier JSON:', err);
    }
}
loadHeroes();

// Etape 3
// GET /heroes & GET heroes?publisher=Marvel
app.get('/heroes', (req, res) => {
    if (req.query.publisher) {
        const filtered = heroes.filter(h => 
            h.biography &&
            h.biography.publisher &&
            h.biography.publisher.toLowerCase().includes(req.query.publisher.toLowerCase())
        );
        return res.json(filtered);
    }
    res.json(heroes);
});

// GET /heroes/search?q=man
app.get('/heroes/search', (req, res) => {
    if (!req.query.q) return res.status(400).json({ message: 'Paramètre de recherche manquant' });
    const query = req.query.q.toLowerCase();
    const results = heroes.filter(h => 
        h.name.toLowerCase().includes(query)
    );
    res.json(results);
});

// GET /heroes/:id
app.get('/heroes/:id', (req, res) => {
    const hero = heroes.find(h => h.id === parseInt(req.params.id));
    if (!hero) {
        return res.status(404).json({ message: 'Héros non trouvé' });
    }
    res.json(hero);
});

// POST /heroes
app.post('/heroes', (req, res) => {
    const newHero = {
        id: heroes.length > 0 ? Math.max(...heroes.map(h => h.id)) + 1 : 1,
        ...req.body
    };
    heroes.push(newHero);
    res.status(201).json(newHero);
});

// DELETE /heroes/:id
app.delete('/heroes/:id', (req, res) => {
    const heroIndex = heroes.findIndex(h => h.id === parseInt(req.params.id));
    if (heroIndex === -1) {
        return res.status(404).json({ message: 'Héros non trouvé' });
    }
    heroes.splice(heroIndex, 1);
    res.status(204).send();
});

app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});