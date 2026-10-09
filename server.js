const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const db = require('./database');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// جلب جميع الألغاز مرتبة حسب المستوى
app.get('/api/game', (req, res) => {
    db.all("SELECT * FROM riddles ORDER BY level ASC, RANDOM()", (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// حفظ نتيجة لاعب
app.post('/api/players', (req, res) => {
    const { name, score } = req.body;
    if (!name || score === undefined) return res.status(400).json({ error: 'بيانات ناقصة' });
    db.run("INSERT INTO players (name, score) VALUES (?, ?)", [name, score], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, name, score });
    });
});

// جلب لوحة المتصدرين
app.get('/api/leaderboard', (req, res) => {
    db.all("SELECT name, score FROM players ORDER BY score DESC LIMIT 10", (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// ===== إدارة الألغاز (Admin) =====
app.get('/api/riddles', (req, res) => {
    db.all("SELECT * FROM riddles ORDER BY level, id", (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/riddles', (req, res) => {
    const { question, answer, level, reward } = req.body;
    db.run(`INSERT INTO riddles (question, answer, level, reward) VALUES (?, ?, ?, ?)`,
        [question, answer, level || 1, reward || 50],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID });
        });
});

app.delete('/api/riddles/:id', (req, res) => {
    db.run(`DELETE FROM riddles WHERE id = ?`, req.params.id, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Deleted" });
    });
});

app.listen(PORT, () => {
    console.log(`🎮 Server running on http://localhost:${PORT}`);
});