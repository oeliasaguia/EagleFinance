import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from './src/db/index';
import { users, transactions, categories, fixedExpenses, cards, cardPurchases } from './src/db/schema';
import { eq, and, desc } from 'drizzle-orm';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Example API route for transactions
  app.get('/api/transactions', async (req, res) => {
    const { uid, type } = req.query;
    if (!uid) return res.status(400).json({ error: 'Missing uid' });

    try {
      const result = await db.query.transactions.findMany({
        where: and(
          eq(transactions.uid, uid as string),
          type ? eq(transactions.type, type as 'income' | 'expense') : undefined
        ),
        orderBy: [desc(transactions.date)]
      });
      res.json(result);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
