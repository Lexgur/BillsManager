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

app.put('/invoices/:id', async (req, res) => {
  const { id } = req.params.id;
  const db = JSON.parse(await fs.readFile(DATA_FILE));
  const index = db.invoices.findIndex(item => item.id === id);
  if (index !== -1) {
    db.invoices[index] = { ...db.invoices[index], ...req.body };
    await fs.writeFile(DATA_FILE, JSON.stringify(db, null, 2));
    res.json({ success: true });
  } else {
    res.status(404).json({ message: 'Invoice not found' });
  }
});

app.delete('/invoices/:id', async (req, res) => {
  const { id } = req.params.id;
  const db = JSON.parse(await fs.readFile(DATA_FILE));
  db.invoices = db.invoices.filter(item => item.id !== id);
  await fs.writeFile(DATA_FILE, JSON.stringify(db, null, 2));
  res.json({ success: true });
});

// Start server
initializeDb().then(() => {
  app.listen(5000, () => console.log('Backend running on http://localhost:5000'));
});