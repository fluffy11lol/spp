export interface Snippet {
  id: string;
  title: string;
  content: string;
  language: string;
  syntax_highlighted_html: string;
  is_unlisted: number;
  file_path: string | null;
  file_original_name: string | null;
  file_size: number | null;
  file_mimetype: string | null;
  views_count: number;
  created_at: string;
  expires_at: string | null;
}

export interface SnippetView extends Snippet {
  isExpired: boolean;
  formattedCreated: string;
  formattedExpires: string;
  formattedSize: string | null;
  linesCount?: number;
}

export interface CreateSnippetDTO {
  title?: string;
  content?: string;
  language?: string;
  is_unlisted?: string | boolean;
  expiry?: string;
  custom_expiry_date?: string;
  file?: Express.Multer.File;
}

export interface SnippetFilterQuery {
  search?: string;
  language?: string;
  status?: 'active' | 'expired' | 'all';
}

export interface LanguageInfo {
  id: string;
  name: string;
}

export interface LanguageStat {
  language: string;
  count: number;
}
