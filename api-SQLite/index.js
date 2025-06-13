const express = require('express');
const dotenv = require('dotenv');
const db = require('./database');
const userRoutes = require('./routes/user.routes');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use('/users', userRoutes);

app.get('/', (req, res) => {
  res.send('🚀 API Node.js fonctionne !');
});

const fs = require('fs');
const data = JSON.parse(fs.readFileSync('./SuperHerosComplet.json', 'utf-8'));
const insert = db.prepare(`INSERT INTO heroes (name, publisher, gender, race, power, alignment, height_cm, weight_kg, createdAt)
VALUES (@name, @publisher, @gender, @race, @power, @alignment, @height_cm, @weight_kg, @createdAt)`);

const count = db.prepare('SELECT COUNT(*) as total FROM heroes').get();
if (count.total === 0) {
  const now = new Date().toISOString();
  for (const hero of data.superheros) {
    insert.run({
      name: hero.name,
      publisher: hero.biography.publisher,
      gender: hero.appearance.gender,
      race: hero.appearance.race,
      power: JSON.stringify(hero.powerstats),
      alignment: hero.biography.alignment,
      height_cm: parseInt(hero.appearance.height[1].split(' ')[0]),
      weight_kg: parseInt(hero.appearance.weight[1].split(' ')[0]),
     createdAt: now
    });
  }
  console.log('Données initiales importées.');
}

// GET /heroes & GET /heroes?publisher=DC
app.get('/heroes', (req, res) => {
  if (req.query.publisher) {
    const publisher = `%${req.query.publisher}%`;
    const heroes = db.prepare('SELECT * FROM heroes WHERE publisher LIKE ?').all(publisher);
    return res.json(heroes);
  }
  const heroes = db.prepare('SELECT * FROM heroes').all();
  res.json(heroes);
});

// GET /heroes/search?q=bat
app.get('/heroes/search', (req, res) => {
    if (!req.query.q) return res.status(400).json({ message: 'Paramètre de recherche manquant' });
    const q = req.query.q.toLowerCase();
    const heroes = db.prepare('SELECT * FROM heroes WHERE LOWER(name) LIKE ?').all(`%${q}%`);
    res.json(heroes);
});

// GET /heroes/sorted?by=height_cm ou multichamps 
app.get('/heroes/sorted', (req, res) => {
    const validColumns = ['id', 'name', 'publisher', 'height_cm', 'weight_kg']; // Ajout de 'id'
    const sortBy = req.query.by ? req.query.by.split(',') : [];
    
    const invalidColumns = sortBy.filter(col => !validColumns.includes(col));
    if (invalidColumns.length > 0) {
        return res.status(400).json({ message: 'Paramètre de tri invalide' });
    }
    
    const orderBy = sortBy.length > 0 ? sortBy.join(', ') : 'id';
    const query = `SELECT * FROM heroes ORDER BY ${orderBy}`;
    
    try {
        const heroes = db.prepare(query).all();
        res.json(heroes);
    } catch (err) {
        res.status(422).json({ message: 'Erreur dans la requête de tri' });
    }
});

// GET /heroes/export?publisher=DC
app.get('/heroes/export', (req, res) => {
    let query = 'SELECT * FROM heroes';
    const params = [];
    
    if (req.query.publisher) {
        query += ' WHERE publisher LIKE ?';
        params.push(`%${req.query.publisher}%`);
    }
    
    const heroes = db.prepare(query).all(...params);
    
    // Convertir en CSV
    let csv = 'id,name,publisher,gender,race,power,alignment,height_cm,weight_kg,createdAt\n';
    heroes.forEach(hero => {
        csv += `${hero.id},${hero.name},${hero.publisher},${hero.gender},${hero.race},${hero.power},${hero.alignment},${hero.height_cm},${hero.weight_kg},${hero.createdAt}\n`;
    });
    
    res.header('Content-Type', 'text/csv');
    res.attachment('heroes.csv');
    res.send(csv);
});

// GET /heroes/stats
app.get('/heroes/stats', (req, res) => {
    const stats = {
        countByPublisher: db.prepare('SELECT publisher, COUNT(*) as count FROM heroes GROUP BY publisher').all(),
        avgHeight: db.prepare('SELECT AVG(height_cm) as avg FROM heroes').get().avg,
        avgWeight: db.prepare('SELECT AVG(weight_kg) as avg FROM heroes').get().avg,
        alignmentDistribution: db.prepare('SELECT alignment, COUNT(*) as count FROM heroes GROUP BY alignment').all()
    };
    
    res.json(stats);
});

// GET /heroes/:id
app.get('/heroes/:id', (req, res) => {
  const hero = db.prepare('SELECT * FROM heroes WHERE id = ?').get(req.params.id);
  if (!hero) return res.status(404).json({ message: 'Héros non trouvé' });
  res.json(hero);
});

// POST /heroes
app.post('/heroes', (req, res) => {
    const { name, publisher, gender, race, power, alignment, height_cm, weight_kg } = req.body;
    
    if (!name) return res.status(400).json({ message: 'Le nom est obligatoire' });
    
    const now = new Date().toISOString();
    const stmt = db.prepare(`
        INSERT INTO heroes (name, publisher, gender, race, power, alignment, height_cm, weight_kg, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const info = stmt.run(name, publisher, gender, race, power, alignment, height_cm, weight_kg, now);
    const newHero = db.prepare('SELECT * FROM heroes WHERE id = ?').get(info.lastInsertRowid);
    
    res.status(201).json(newHero);
});

// DELETE /heroes/:id
app.delete('/heroes/:id', (req, res) => {
    const stmt = db.prepare('DELETE FROM heroes WHERE id = ?');
    const result = stmt.run(req.params.id);
    
    if (result.changes === 0) {
        return res.status(404).json({ message: 'Héros non trouvé' });
    }
    
    res.status(204).end();
});

app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});
