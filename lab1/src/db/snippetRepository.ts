import db from './database.js';
import { Snippet, SnippetFilterQuery, LanguageStat } from '../types/snippet.js';

export const snippetRepository = {
  create(snippet: Omit<Snippet, 'views_count' | 'created_at'>): void {
    const stmt = db.prepare(`
      INSERT INTO snippets (
        id, title, content, language, syntax_highlighted_html,
        is_unlisted, file_path, file_original_name, file_size, file_mimetype,
        expires_at
      ) VALUES (
        @id, @title, @content, @language, @syntax_highlighted_html,
        @is_unlisted, @file_path, @file_original_name, @file_size, @file_mimetype,
        @expires_at
      )
    `);
    stmt.run(snippet);
  },

  findById(id: string, incrementView: boolean = false): Snippet | undefined {
    if (incrementView) {
      db.prepare('UPDATE snippets SET views_count = views_count + 1 WHERE id = ?').run(id);
    }
    const stmt = db.prepare('SELECT * FROM snippets WHERE id = ?');
    return stmt.get(id) as Snippet | undefined;
  },

  findAll(filters: SnippetFilterQuery = {}): Snippet[] {
    let sql = `
      SELECT * FROM snippets 
      WHERE is_unlisted = 0
    `;
    const params: string[] = [];

    const status = filters.status || 'active';
    if (status === 'active') {
      sql += ` AND (expires_at IS NULL OR datetime(expires_at) > datetime('now'))`;
    } else if (status === 'expired') {
      sql += ` AND (expires_at IS NOT NULL AND datetime(expires_at) <= datetime('now'))`;
    }

    if (filters.language && filters.language !== 'all') {
      sql += ` AND language = ?`;
      params.push(filters.language.toLowerCase());
    }

    if (filters.search && filters.search.trim() !== '') {
      sql += ` AND (title LIKE ? OR content LIKE ? OR file_original_name LIKE ?)`;
      const term = `%${filters.search.trim()}%`;
      params.push(term, term, term);
    }

    sql += ` ORDER BY created_at DESC LIMIT 100`;

    const stmt = db.prepare(sql);
    return stmt.all(...params) as Snippet[];
  },

  deleteById(id: string): void {
    const stmt = db.prepare('DELETE FROM snippets WHERE id = ?');
    stmt.run(id);
  },

  getAllLanguages(): LanguageStat[] {
    const stmt = db.prepare(`
      SELECT language, COUNT(*) as count 
      FROM snippets 
      WHERE is_unlisted = 0 
      GROUP BY language 
      ORDER BY count DESC
    `);
    return stmt.all() as LanguageStat[];
  },

  deleteExpired(): { changes: number } {
    const stmt = db.prepare(`
      DELETE FROM snippets 
      WHERE expires_at IS NOT NULL AND datetime(expires_at) <= datetime('now')
    `);
    const result = stmt.run();
    return { changes: result.changes };
  }
};
