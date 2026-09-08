import express, { Request, Response, Router } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { snippetService, SUPPORTED_LANGUAGES } from '../services/snippetService.js';
import { snippetRepository } from '../db/snippetRepository.js';
import { upload } from '../middleware/upload.js';
import { SnippetFilterQuery } from '../types/snippet.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router: Router = express.Router();

// GET / - List all snippets with search & filters
router.get('/', (req: Request<{}, {}, {}, SnippetFilterQuery>, res: Response) => {
  const { search = '', language = 'all', status = 'active' } = req.query;

  const snippets = snippetService.getFilteredSnippets({ search, language, status });
  const allLanguages = snippetRepository.getAllLanguages();

  res.render('index', {
    title: 'Explore Snippets',
    snippets,
    search,
    language,
    status,
    supportedLanguages: SUPPORTED_LANGUAGES,
    availableLanguages: allLanguages
  });
});

// GET /snippets/new - New snippet creation form
router.get('/snippets/new', (_req: Request, res: Response) => {
  res.render('new', {
    title: 'New Snippet',
    supportedLanguages: SUPPORTED_LANGUAGES,
    error: null,
    formData: {}
  });
});

// POST /snippets - Handle snippet submission
router.post('/snippets', upload.single('file'), (req: Request, res: Response) => {
  try {
    const { title, content, language, is_unlisted, expiry, custom_expiry_date } = req.body;
    const file = req.file;

    const id = snippetService.createSnippet({
      title,
      content,
      language,
      is_unlisted,
      expiry,
      custom_expiry_date,
      file
    });

    res.redirect(`/snippets/${id}`);
  } catch (err: any) {
    res.status(400).render('new', {
      title: 'New Snippet',
      supportedLanguages: SUPPORTED_LANGUAGES,
      error: err.message || 'Failed to create snippet',
      formData: req.body
    });
  }
});

// GET /snippets/:id - View single snippet
router.get('/snippets/:id', (req: Request<{ id: string }>, res: Response) => {
  const snippet = snippetService.getSnippet(req.params.id, true);
  if (!snippet) {
    return res.status(404).render('404', { title: 'Snippet Not Found' });
  }

  res.render('show', {
    title: snippet.title,
    snippet
  });
});

// GET /snippets/:id/raw - View raw snippet content
router.get('/snippets/:id/raw', (req: Request<{ id: string }>, res: Response) => {
  const snippet = snippetService.getSnippet(req.params.id, false);
  if (!snippet) {
    return res.status(404).send('Snippet not found');
  }

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.send(snippet.content);
});

// GET /snippets/:id/download - Download attached file
router.get('/snippets/:id/download', (req: Request<{ id: string }>, res: Response) => {
  const snippet = snippetService.getSnippet(req.params.id, false);
  if (!snippet || !snippet.file_path) {
    return res.status(404).send('File not found');
  }

  const filePath = path.resolve(__dirname, '../../uploads', snippet.file_path);
  if (!fs.existsSync(filePath)) {
    return res.status(404).send('File not found on disk');
  }

  res.download(filePath, snippet.file_original_name || 'download');
});

// POST /snippets/:id/delete - Delete snippet
router.post('/snippets/:id/delete', (req: Request<{ id: string }>, res: Response) => {
  snippetService.deleteSnippet(req.params.id);
  res.redirect('/');
});

export default router;
