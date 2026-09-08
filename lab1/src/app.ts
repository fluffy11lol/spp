import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import snippetRoutes from './routes/snippetRoutes.js';
import { snippetRepository } from './db/snippetRepository.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.resolve(__dirname, '../views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.resolve(__dirname, '../public')));

app.use('/', snippetRoutes);

app.use((_req: Request, res: Response) => {
  res.status(404).render('404', { title: '404 - Not Found' });
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Server error:', err);
  res.status(500).render('error', { 
    title: '500 - Server Error',
    error: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message 
  });
});

setInterval(() => {
  try {
    const result = snippetRepository.deleteExpired();
    if (result.changes > 0) {
      console.log(`[Cleanup] Removed ${result.changes} expired snippets`);
    }
  } catch (e) {
    console.error('[Cleanup Error]:', e);
  }
}, 30 * 60 * 1000);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
