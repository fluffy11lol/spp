import hljs from 'highlight.js';
import { nanoid } from 'nanoid';
import dayjs from 'dayjs';
import fs from 'fs';
import { snippetRepository } from '../db/snippetRepository.js';
import { SnippetView, CreateSnippetDTO, SnippetFilterQuery, LanguageInfo } from '../types/snippet.js';

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  { id: 'plaintext', name: 'Plain Text' },
  { id: 'go', name: 'Go' },
  { id: 'javascript', name: 'JavaScript' },
  { id: 'typescript', name: 'TypeScript' },
  { id: 'python', name: 'Python' },
  { id: 'json', name: 'JSON' },
  { id: 'yaml', name: 'YAML' },
  { id: 'sql', name: 'SQL' },
  { id: 'bash', name: 'Bash / Shell' },
  { id: 'html', name: 'HTML' },
  { id: 'css', name: 'CSS' },
  { id: 'dockerfile', name: 'Dockerfile' },
  { id: 'c', name: 'C' },
  { id: 'cpp', name: 'C++' },
  { id: 'rust', name: 'Rust' }
];

function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export const snippetService = {
  highlightCode(code: string, language: string): string {
    if (!code) return '';
    try {
      if (language && language !== 'plaintext' && hljs.getLanguage(language)) {
        return hljs.highlight(code, { language }).value;
      }
      return hljs.highlightAuto(code).value;
    } catch {
      return escapeHtml(code);
    }
  },

  calculateExpiration(expiryOption?: string, customDate?: string): string | null {
    if (expiryOption === 'custom' && customDate) {
      const parsed = dayjs(customDate);
      return parsed.isValid() ? parsed.toISOString() : null;
    }

    const now = dayjs();
    switch (expiryOption) {
      case '10m':
        return now.add(10, 'minute').toISOString();
      case '1h':
        return now.add(1, 'hour').toISOString();
      case '1d':
        return now.add(1, 'day').toISOString();
      case '1w':
        return now.add(1, 'week').toISOString();
      case '1m':
        return now.add(1, 'month').toISOString();
      case 'never':
      default:
        return null;
    }
  },

  createSnippet(dto: CreateSnippetDTO): string {
    let finalContent = dto.content ? dto.content.trim() : '';

    if (!finalContent && dto.file) {
      try {
        const fileBuffer = fs.readFileSync(dto.file.path);
        finalContent = fileBuffer.toString('utf-8');
      } catch {
        finalContent = `[Attached Binary File: ${dto.file.originalname}]`;
      }
    }

    if (!finalContent) {
      throw new Error('Snippet content cannot be empty. Please enter code or attach a file.');
    }

    const id = nanoid(10);
    const lang = (dto.language || 'plaintext').toLowerCase();
    const highlightedHtml = this.highlightCode(finalContent, lang);
    const expiresAt = this.calculateExpiration(dto.expiry, dto.custom_expiry_date);

    snippetRepository.create({
      id,
      title: dto.title && dto.title.trim() ? dto.title.trim() : `Snippet ${id}`,
      content: finalContent,
      language: lang,
      syntax_highlighted_html: highlightedHtml,
      is_unlisted: dto.is_unlisted === 'on' || dto.is_unlisted === '1' || dto.is_unlisted === true ? 1 : 0,
      file_path: dto.file ? dto.file.filename : null,
      file_original_name: dto.file ? dto.file.originalname : null,
      file_size: dto.file ? dto.file.size : null,
      file_mimetype: dto.file ? dto.file.mimetype : null,
      expires_at: expiresAt
    });

    return id;
  },

  getSnippet(id: string, isViewAction: boolean = false): SnippetView | null {
    const snippet = snippetRepository.findById(id, isViewAction);
    if (!snippet) return null;

    const isExpired = snippet.expires_at ? dayjs(snippet.expires_at).isBefore(dayjs()) : false;

    return {
      ...snippet,
      isExpired,
      formattedCreated: dayjs(snippet.created_at).format('YYYY-MM-DD HH:mm'),
      formattedExpires: snippet.expires_at ? dayjs(snippet.expires_at).format('YYYY-MM-DD HH:mm') : 'Never',
      formattedSize: snippet.file_size ? (snippet.file_size / 1024).toFixed(1) + ' KB' : null,
      linesCount: snippet.content.split('\n').length
    };
  },

  getFilteredSnippets(filters: SnippetFilterQuery): SnippetView[] {
    const snippets = snippetRepository.findAll(filters);
    return snippets.map(s => {
      const isExpired = s.expires_at ? dayjs(s.expires_at).isBefore(dayjs()) : false;
      return {
        ...s,
        isExpired,
        formattedCreated: dayjs(s.created_at).format('YYYY-MM-DD HH:mm'),
        formattedExpires: s.expires_at ? dayjs(s.expires_at).format('YYYY-MM-DD HH:mm') : 'Never',
        formattedSize: s.file_size ? (s.file_size / 1024).toFixed(1) + ' KB' : null
      };
    });
  },

  deleteSnippet(id: string): void {
    const snippet = snippetRepository.findById(id);
    if (snippet && snippet.file_path) {
      try {
        const filePath = `uploads/${snippet.file_path}`;
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (e) {
        console.error('Failed to delete file:', e);
      }
    }
    snippetRepository.deleteById(id);
  }
};
