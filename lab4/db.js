const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'crossword.db');

class CrosswordDatabase {
  constructor() {
    this.initDriver();
    this.initSchema();
  }

  initDriver() {
    try {
      const { DatabaseSync } = require('node:sqlite');
      this.db = new DatabaseSync(DB_PATH);
      this.type = 'sqlite';
    } catch {
      this.type = 'file_fallback';
      this.fallbackPath = path.join(__dirname, 'crossword_fallback.json');
      this.fallbackData = this.loadFallbackData();
    }
  }

  loadFallbackData() {
    if (fs.existsSync(this.fallbackPath)) {
      try {
        return JSON.parse(fs.readFileSync(this.fallbackPath, 'utf8'));
      } catch {
      }
    }
    return { activeMapId: 1, cells: {}, players: {}, logs: [] };
  }

  saveFallbackData() {
    const tempPath = `${this.fallbackPath}.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify(this.fallbackData, null, 2), 'utf8');
    fs.renameSync(tempPath, this.fallbackPath);
  }

  initSchema() {
    if (this.type === 'sqlite') {
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS meta (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS cells (
          map_id INTEGER NOT NULL,
          cell_key TEXT NOT NULL,
          current_letter TEXT NOT NULL DEFAULT '',
          is_correct INTEGER NOT NULL DEFAULT 0,
          version INTEGER NOT NULL DEFAULT 1,
          author TEXT,
          updated_at INTEGER NOT NULL,
          PRIMARY KEY (map_id, cell_key)
        );

        CREATE TABLE IF NOT EXISTS players (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          color TEXT NOT NULL,
          score INTEGER NOT NULL DEFAULT 0,
          last_seen INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS action_log (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          timestamp INTEGER NOT NULL,
          player_name TEXT NOT NULL,
          action_type TEXT NOT NULL,
          details TEXT NOT NULL
        );
      `);

      const getMeta = this.db.prepare('SELECT value FROM meta WHERE key = ?');
      const row = getMeta.get('active_map_id');
      if (!row) {
        const insertMeta = this.db.prepare('INSERT INTO meta (key, value) VALUES (?, ?)');
        insertMeta.run('active_map_id', '1');
      }
    }
  }

  getActiveMapId() {
    if (this.type === 'sqlite') {
      const stmt = this.db.prepare('SELECT value FROM meta WHERE key = ?');
      const row = stmt.get('active_map_id');
      return row ? parseInt(row.value, 10) : 1;
    }
    return this.fallbackData.activeMapId || 1;
  }

  setActiveMapId(mapId) {
    if (this.type === 'sqlite') {
      const stmt = this.db.prepare(`
        INSERT INTO meta (key, value) VALUES ('active_map_id', ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value
      `);
      stmt.run(String(mapId));
    } else {
      this.fallbackData.activeMapId = mapId;
      this.saveFallbackData();
    }
  }

  getSavedCellsForMap(mapId) {
    if (this.type === 'sqlite') {
      const stmt = this.db.prepare('SELECT * FROM cells WHERE map_id = ?');
      return stmt.all(mapId);
    }
    const result = [];
    const mapCells = this.fallbackData.cells[mapId] || {};
    for (const key in mapCells) {
      result.push(mapCells[key]);
    }
    return result;
  }

  getCell(mapId, cellKey) {
    if (this.type === 'sqlite') {
      const stmt = this.db.prepare('SELECT * FROM cells WHERE map_id = ? AND cell_key = ?');
      return stmt.get(mapId, cellKey);
    }
    const mapCells = this.fallbackData.cells[mapId] || {};
    return mapCells[cellKey] || null;
  }

  updateCellLetterWithVersionCheck(mapId, cellKey, expectedVersion, letter, playerName, isCorrect) {
    const now = Date.now();
    const emptyCell = {
      map_id: mapId,
      cell_key: cellKey,
      current_letter: '',
      is_correct: 0,
      version: 1,
      author: null,
      updated_at: now
    };

    if (this.type === 'sqlite') {
      const existing = this.getCell(mapId, cellKey);
      if (!existing) {
        if (expectedVersion !== 1) {
          return { success: false, conflict: true, cell: emptyCell };
        }
        const insertStmt = this.db.prepare(`
          INSERT INTO cells (map_id, cell_key, current_letter, is_correct, version, author, updated_at)
          VALUES (?, ?, ?, ?, 2, ?, ?)
        `);
        insertStmt.run(mapId, cellKey, letter, isCorrect ? 1 : 0, playerName, now);
        const created = this.getCell(mapId, cellKey);
        return { success: true, conflict: false, cell: created };
      }

      if (existing.version !== expectedVersion) {
        return { success: false, conflict: true, cell: existing };
      }

      const updateStmt = this.db.prepare(`
        UPDATE cells
        SET current_letter = ?, is_correct = ?, version = version + 1, author = ?, updated_at = ?
        WHERE map_id = ? AND cell_key = ? AND version = ?
      `);
      const res = updateStmt.run(letter, isCorrect ? 1 : 0, playerName, now, mapId, cellKey, expectedVersion);
      if (res.changes > 0) {
        const updated = this.getCell(mapId, cellKey);
        return { success: true, conflict: false, cell: updated };
      }
      const fresh = this.getCell(mapId, cellKey);
      return { success: false, conflict: true, cell: fresh || existing };
    }

    this.fallbackData.cells[mapId] = this.fallbackData.cells[mapId] || {};
    const target = this.fallbackData.cells[mapId][cellKey];
    if (!target) {
      if (expectedVersion !== 1) {
        return { success: false, conflict: true, cell: emptyCell };
      }
      const entry = {
        map_id: mapId,
        cell_key: cellKey,
        current_letter: letter,
        is_correct: isCorrect ? 1 : 0,
        version: 2,
        author: playerName,
        updated_at: now
      };
      this.fallbackData.cells[mapId][cellKey] = entry;
      this.saveFallbackData();
      return { success: true, conflict: false, cell: entry };
    }

    if (target.version !== expectedVersion) {
      return { success: false, conflict: true, cell: { ...target } };
    }

    target.current_letter = letter;
    target.is_correct = isCorrect ? 1 : 0;
    target.version += 1;
    target.author = playerName;
    target.updated_at = now;
    this.saveFallbackData();
    return { success: true, conflict: false, cell: { ...target } };
  }

  resetMapCells(mapId) {
    if (this.type === 'sqlite') {
      const stmt = this.db.prepare('DELETE FROM cells WHERE map_id = ?');
      stmt.run(mapId);
    } else {
      if (this.fallbackData.cells[mapId]) {
        delete this.fallbackData.cells[mapId];
        this.saveFallbackData();
      }
    }
  }

  upsertPlayer(id, name, color, scoreDelta = 0) {
    const now = Date.now();
    if (this.type === 'sqlite') {
      const stmt = this.db.prepare(`
        INSERT INTO players (id, name, color, score, last_seen)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          name = excluded.name,
          color = excluded.color,
          score = players.score + ?,
          last_seen = excluded.last_seen
      `);
      stmt.run(id, name, color, Math.max(0, scoreDelta), now, scoreDelta);
      const getStmt = this.db.prepare('SELECT * FROM players WHERE id = ?');
      return getStmt.get(id);
    }

    this.fallbackData.players[id] = this.fallbackData.players[id] || { id, name, color, score: 0 };
    const p = this.fallbackData.players[id];
    p.name = name;
    p.color = color;
    p.score = Math.max(0, p.score + scoreDelta);
    p.last_seen = now;
    this.saveFallbackData();
    return p;
  }

  getLeaderboard(limit = 10) {
    if (this.type === 'sqlite') {
      const stmt = this.db.prepare('SELECT * FROM players ORDER BY score DESC, last_seen DESC LIMIT ?');
      return stmt.all(limit);
    }
    return Object.values(this.fallbackData.players)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  logAction(playerName, actionType, details) {
    const now = Date.now();
    if (this.type === 'sqlite') {
      const stmt = this.db.prepare(`
        INSERT INTO action_log (timestamp, player_name, action_type, details)
        VALUES (?, ?, ?, ?)
      `);
      stmt.run(now, playerName, actionType, details);
    } else {
      this.fallbackData.logs.unshift({
        id: Date.now() + Math.random(),
        timestamp: now,
        player_name: playerName,
        action_type: actionType,
        details
      });
      if (this.fallbackData.logs.length > 50) this.fallbackData.logs.length = 50;
      this.saveFallbackData();
    }
  }

  getRecentLogs(limit = 15) {
    if (this.type === 'sqlite') {
      const stmt = this.db.prepare('SELECT * FROM action_log ORDER BY id DESC LIMIT ?');
      return stmt.all(limit);
    }
    return (this.fallbackData.logs || []).slice(0, limit);
  }
}

module.exports = {
  db: new CrosswordDatabase()
};
