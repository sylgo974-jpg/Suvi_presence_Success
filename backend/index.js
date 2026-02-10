const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const attendanceRoutes = require('./routes/attendance');

const app = express();
const PORT = process.env.PORT || 3000;

// Connexion MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'votre_uri_mongodb';

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('✅ Connecté à MongoDB'))
.catch(err => console.error('❌ Erreur MongoDB:', err));

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api/attendance', attendanceRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// ========================================
// 🔧 AJOUT : Modèle et routes Session
// ========================================

// Modèle Session
const sessionSchema = new mongoose.Schema({
    sessionCode: { type: String, required: true, unique: true, index: true },
    formateurNom: { type: String, required: true },
    formateurPrenom: { type: String, required: true },
    formation: { type: String, required: true },
    date: { type: String, required: true },
    creneau: { type: String, required: true },
    creneauLabel: { type: String, required: true },
    createdAt: { type: Date, default: Date.now, expires: 86400 } // Expire après 24h
});

const Session = mongoose.model('Session', sessionSchema);

// Fonction : Générer un code court aléatoire (6 caractères)
function generateSessionCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Route POST : Créer une session
app.post('/api/sessions', async (req, res) => {
    try {
        const { formateurNom, formateurPrenom, formation, date, creneau, creneauLabel } = req.body;
        
        // Validation
        if (!formateurNom || !formateurPrenom || !formation || !date || !creneau) {
            return res.status(400).json({ error: 'Données manquantes' });
        }
        
        // Générer un code unique
        let sessionCode;
        let isUnique = false;
        let attempts = 0;
        
        while (!isUnique && attempts < 10) {
            sessionCode = generateSessionCode();
            const existing = await Session.findOne({ sessionCode });
            if (!existing) isUnique = true;
            attempts++;
        }
        
        if (!isUnique) {
            return res.status(500).json({ error: 'Impossible de générer un code unique' });
        }
        
        // Créer la session
        const session = new Session({
            sessionCode,
            formateurNom,
            formateurPrenom,
            formation,
            date,
            creneau,
            creneauLabel
        });
        
        await session.save();
        
        console.log(`✅ Session créée: ${sessionCode}`);
        res.json({ sessionCode });
        
    } catch (error) {
        console.error('❌ Erreur création session:', error);
        res.status(500).json({ error: 'Erreur serveur', details: error.message });
    }
});

// Route GET : Récupérer une session par son code
app.get('/api/sessions/:code', async (req, res) => {
    try {
        const { code } = req.params;
        
        const session = await Session.findOne({ sessionCode: code });
        
        if (!session) {
            return res.status(404).json({ error: 'Session non trouvée ou expirée' });
        }
        
        res.json(session);
        
    } catch (error) {
        console.error('❌ Erreur récupération session:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// ========================================
// Démarrage du serveur
// ========================================

app.listen(PORT, () => {
    console.log(`✅ Serveur démarré sur le port ${PORT}`);
});
