import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, 'data.json');

const app = express();
const corsOptions = {
  origin: 'http://localhost:5173', // Explicitly allow your React origin
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json());

// Initialize data.json if missing
const initializeDb = async () => {
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, JSON.stringify({}));
  }
};

// CRUD Endpoints
app.post('/:collection', async (req, res) => {
  const { collection } = req.params;
  const id = uuidv4();
  const db = JSON.parse(await fs.readFile(DATA_FILE));
  db[collection] = db[collection] || [];
  db[collection].push({ ...req.body, id });
  await fs.writeFile(DATA_FILE, JSON.stringify(db, null, 2));
  res.json({ id });
});

app.get('/:collection', async (req, res) => {
  const db = JSON.parse(await fs.readFile(DATA_FILE));
  res.json(db[req.params.collection] || []);
});

app.put('/:collection/:id', async (req, res) => {
  const { collection, id } = req.params;
  const db = JSON.parse(await fs.readFile(DATA_FILE));
  if (db[collection]) {
    db[collection] = db[collection].map(item => 
      item.id === id ? { ...item, ...req.body } : item
    );
    await fs.writeFile(DATA_FILE, JSON.stringify(db, null, 2));
  }
  res.json({ success: true });
});

app.delete('/:collection/:id', async (req, res) => {
  const { collection, id } = req.params;
  const db = JSON.parse(await fs.readFile(DATA_FILE));
  if (db[collection]) {
    db[collection] = db[collection].filter(item => item.id !== id);
    await fs.writeFile(DATA_FILE, JSON.stringify(db, null, 2));
  }
  res.json({ success: true });
});

app.post('/invoices', async (req, res) => {
  const newInvoice = req.body;
  const db = JSON.parse(await fs.readFile(DATA_FILE));
  db.invoices = db.invoices || [];
  const id = uuidv4();
  db.invoices.push({ ...newInvoice, id });
  await fs.writeFile(DATA_FILE, JSON.stringify(db, null, 2));
  res.json({ success: true });
});

app.get('/invoices', async (req, res) => {
  try {
    const db = JSON.parse(await fs.readFile(DATA_FILE));
    res.json(db.invoices || []); // ✅ send array directly
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Start server
initializeDb().then(() => {
  app.listen(5000, () => console.log('Backend running on http://localhost:5000'));
});