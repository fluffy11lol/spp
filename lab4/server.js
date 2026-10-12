const http = require('http');
const fs = require('fs');
const path = require('path');
const { WebSocketServer, WebSocket } = require('ws');
const { db } = require('./db.js');
const { PUZZLES, buildPuzzleGrid } = require('./puzzles.js');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon'
};

let activeMapId = db.getActiveMapId();
let currentPuzzle = buildPuzzleGrid(PUZZLES.find(p => p.id === activeMapId) || PUZZLES[0]);
const activeLocks = new Map();
const clients = new Map();

function getActiveMapState() {
  const savedCells = db.getSavedCellsForMap(activeMapId);
  const savedMap = new Map();
  savedCells.forEach(sc => {
    savedMap.set(sc.cell_key, sc);
  });

  const now = Date.now();
  const cellsOut = {};

  for (const key in currentPuzzle.cells) {
    const base = currentPuzzle.cells[key];
    const saved = savedMap.get(key);

    const lock = activeLocks.get(key);
    const isLocked = lock && lock.expiresAt > now;

    cellsOut[key] = {
      key: base.key,
      x: base.x,
      y: base.y,
      number: base.number,
      words: base.words,
      currentLetter: saved ? saved.current_letter : '',
      isCorrect: saved ? Boolean(saved.is_correct) : false,
      version: saved ? saved.version : 1,
      author: saved ? saved.author : null,
      lockedBy: isLocked ? lock.playerName : null,
      lockColor: isLocked ? lock.playerColor : null
    };
  }

  const wordsWithStatus = currentPuzzle.words.map(w => {
    let wordComplete = true;
    for (let i = 0; i < w.text.length; i++) {
      const cx = w.direction === 'across' ? w.x + i : w.x;
      const cy = w.direction === 'down' ? w.y + i : w.y;
      const key = `${cx},${cy}`;
      const cell = cellsOut[key];
      if (!cell || !cell.isCorrect) {
        wordComplete = false;
        break;
      }
    }
    return {
      ...w,
      isSolved: wordComplete
    };
  });

  return {
    mapId: activeMapId,
    title: currentPuzzle.title,
    description: currentPuzzle.description,
    gridSize: currentPuzzle.gridSize,
    words: wordsWithStatus,
    cells: cellsOut,
    mapsList: PUZZLES.map(p => ({ id: p.id, title: p.title }))
  };
}

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/' || reqPath === '') {
    reqPath = '/index.html';
  }

  if (reqPath === '/api/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      game: 'Collaborative Crossword',
      activeMapId,
      activeMapTitle: currentPuzzle.title,
      connectedPlayers: clients.size,
      storageEngine: db.type
    }));
    return;
  }

  const safePath = path.normalize(reqPath).replace(/^(\.\.[/\\])+/, '');
  const filePath = path.join(PUBLIC_DIR, safePath);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
});

const wss = new WebSocketServer({ server });

function broadcast(data, excludeWs = null) {
  const payload = typeof data === 'string' ? data : JSON.stringify(data);
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN && client !== excludeWs) {
      client.send(payload);
    }
  }
}

setInterval(() => {
  const now = Date.now();
  for (const [key, lock] of activeLocks.entries()) {
    if (lock.expiresAt <= now) {
      activeLocks.delete(key);
      broadcast({ type: 'cell_unfocused', cellKey: key });
    }
  }
}, 1000);

wss.on('connection', (ws) => {
  const clientId = `u_${Math.random().toString(36).substring(2, 9)}`;
  const clientMeta = {
    id: clientId,
    name: `Player_${clientId.substring(2, 6)}`,
    color: '#3b82f6',
    focusedCellKey: null
  };
  clients.set(ws, clientMeta);

  ws.send(JSON.stringify({
    type: 'init',
    clientId,
    player: clientMeta,
    gameState: getActiveMapState(),
    leaderboard: db.getLeaderboard(),
    recentLogs: db.getRecentLogs(12),
    onlineCount: wss.clients.size
  }));

  broadcast({
    type: 'online_count',
    count: wss.clients.size
  });

  ws.on('message', (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw);
    } catch {
      return;
    }

    const meta = clients.get(ws);
    if (!meta) return;
    const now = Date.now();

    switch (msg.type) {
      case 'join': {
        if (typeof msg.name === 'string' && msg.name.trim()) {
          meta.name = msg.name.trim().substring(0, 20);
        }
        if (typeof msg.color === 'string' && /^#[0-9a-fA-F]{6}$/.test(msg.color)) {
          meta.color = msg.color;
        }

        db.upsertPlayer(meta.id, meta.name, meta.color, 0);

        ws.send(JSON.stringify({
          type: 'player_profile_updated',
          player: meta
        }));

        broadcast({
          type: 'player_joined',
          player: { name: meta.name, color: meta.color },
          onlineCount: wss.clients.size,
          leaderboard: db.getLeaderboard()
        });
        break;
      }

      case 'select_map': {
        const targetId = parseInt(msg.mapId, 10);
        const found = PUZZLES.find(p => p.id === targetId);
        if (found && found.id !== activeMapId) {
          activeMapId = found.id;
          db.setActiveMapId(activeMapId);
          currentPuzzle = buildPuzzleGrid(found);
          activeLocks.clear();

          db.logAction(meta.name, 'switch_map', `switched to ${found.title}`);

          broadcast({
            type: 'map_changed',
            gameState: getActiveMapState(),
            changedBy: meta.name
          });
        }
        break;
      }

      case 'focus_cell': {
        const { cellKey } = msg;
        if (!currentPuzzle.cells[cellKey]) return;

        const currentLock = activeLocks.get(cellKey);
        if (currentLock && currentLock.expiresAt > now && currentLock.playerId !== meta.id) {
          ws.send(JSON.stringify({
            type: 'cell_locked_rejected',
            cellKey,
            lockedBy: currentLock.playerName,
            lockColor: currentLock.playerColor,
            message: `Cell is currently being edited by ${currentLock.playerName}`
          }));
          return;
        }

        if (meta.focusedCellKey && meta.focusedCellKey !== cellKey) {
          activeLocks.delete(meta.focusedCellKey);
          broadcast({ type: 'cell_unfocused', cellKey: meta.focusedCellKey });
        }

        activeLocks.set(cellKey, {
          playerId: meta.id,
          playerName: meta.name,
          playerColor: meta.color,
          expiresAt: now + 4000
        });
        meta.focusedCellKey = cellKey;

        const existingCell = db.getCell(activeMapId, cellKey);
        const cellData = {
          currentLetter: existingCell ? existingCell.current_letter : '',
          isCorrect: existingCell ? Boolean(existingCell.is_correct) : false,
          version: existingCell ? existingCell.version : 1,
          author: existingCell ? existingCell.author : null
        };

        broadcast({
          type: 'cell_focused',
          cellKey,
          player: { id: meta.id, name: meta.name, color: meta.color },
          cell: cellData
        });
        break;
      }

      case 'input_letter': {
        const { cellKey, expectedVersion } = msg;
        const letter = (msg.letter || '').toUpperCase().trim().substring(0, 1);
        const puzzleCell = currentPuzzle.cells[cellKey];

        if (!puzzleCell || typeof expectedVersion !== 'number') return;

        const existingCell = db.getCell(activeMapId, cellKey);
        if (existingCell && existingCell.is_correct) {
          ws.send(JSON.stringify({
            type: 'cell_locked_rejected',
            cellKey,
            message: 'Cannot overwrite: this cell is already correctly solved and locked!'
          }));
          return;
        }

        const currentLock = activeLocks.get(cellKey);
        if (currentLock && currentLock.expiresAt > now && currentLock.playerId !== meta.id) {
          const lockedCellData = existingCell ? {
            currentLetter: existingCell.current_letter,
            isCorrect: Boolean(existingCell.is_correct),
            version: existingCell.version
          } : null;
          ws.send(JSON.stringify({
            type: 'cell_locked_rejected',
            cellKey,
            lockedBy: currentLock.playerName,
            lockColor: currentLock.playerColor,
            cell: lockedCellData,
            message: `Conflict: Cell is currently locked by ${currentLock.playerName}!`
          }));
          return;
        }

        const isHolder = currentLock && currentLock.expiresAt > now && currentLock.playerId === meta.id;
        let actualExpectedVersion = expectedVersion;
        if (isHolder && existingCell) {
          actualExpectedVersion = existingCell.version;
        }

        const isMatch = letter === puzzleCell.solution;
        const result = db.updateCellLetterWithVersionCheck(
          activeMapId,
          cellKey,
          actualExpectedVersion,
          letter,
          meta.name,
          isMatch
        );

        if (result.conflict) {
          const otherAuthor = (result.cell && result.cell.author && result.cell.author !== meta.name)
            ? result.cell.author
            : 'another player';
          ws.send(JSON.stringify({
            type: 'conflict',
            cellKey,
            currentCell: result.cell,
            message: `Conflict on cell (${puzzleCell.x}, ${puzzleCell.y})! Modified concurrently by ${otherAuthor}.`
          }));
          return;
        }

        activeLocks.set(cellKey, {
          playerId: meta.id,
          playerName: meta.name,
          playerColor: meta.color,
          expiresAt: now + 4000
        });
        meta.focusedCellKey = cellKey;

        let scoreBonus = 0;
        let solvedWordText = null;

        if (isMatch) {
          scoreBonus += 10;
          db.upsertPlayer(meta.id, meta.name, meta.color, scoreBonus);

          const savedCells = db.getSavedCellsForMap(activeMapId);
          const solvedKeys = new Set(savedCells.filter(c => c.is_correct).map(c => c.cell_key));
          solvedKeys.add(cellKey);

          for (const w of currentPuzzle.words) {
            let complete = true;
            for (let i = 0; i < w.text.length; i++) {
              const cx = w.direction === 'across' ? w.x + i : w.x;
              const cy = w.direction === 'down' ? w.y + i : w.y;
              if (!solvedKeys.has(`${cx},${cy}`)) {
                complete = false;
                break;
              }
            }
            if (complete) {
              scoreBonus += 40;
              solvedWordText = w.text;
              db.upsertPlayer(meta.id, meta.name, meta.color, 40);
              break;
            }
          }
        }

        const logMsg = isMatch
          ? (solvedWordText ? `solved word "${solvedWordText}" (+50 pts)!` : `entered correct letter "${letter}" (+10 pts)`)
          : `entered letter "${letter}"`;

        db.logAction(meta.name, isMatch ? 'correct_guess' : 'input_letter', logMsg);

        broadcast({
          type: 'cell_updated',
          cellKey,
          letter,
          isCorrect: isMatch,
          version: result.cell.version,
          author: meta.name,
          leaderboard: db.getLeaderboard(),
          actionDetail: `${meta.name} ${logMsg}`,
          solvedWord: solvedWordText
        });
        break;
      }

      case 'reset_map': {
        db.resetMapCells(activeMapId);
        activeLocks.clear();
        db.logAction(meta.name, 'reset_map', `cleared all answers on ${currentPuzzle.title}`);
        broadcast({
          type: 'map_reset',
          gameState: getActiveMapState()
        });
        break;
      }

      case 'sync_request': {
        ws.send(JSON.stringify({
          type: 'sync_response',
          gameState: getActiveMapState(),
          leaderboard: db.getLeaderboard(),
          recentLogs: db.getRecentLogs(12),
          onlineCount: wss.clients.size
        }));
        break;
      }

      default:
        break;
    }
  });

  ws.on('close', () => {
    const meta = clients.get(ws);
    if (meta && meta.focusedCellKey) {
      activeLocks.delete(meta.focusedCellKey);
      broadcast({ type: 'cell_unfocused', cellKey: meta.focusedCellKey });
    }
    clients.delete(ws);
    broadcast({ type: 'online_count', count: wss.clients.size });
    if (meta) {
      broadcast({ type: 'player_left', playerName: meta.name });
    }
  });

  ws.on('error', () => {
    clients.delete(ws);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Crossword server running on http://localhost:${PORT}`);
  console.log(`Database engine: ${db.type}`);
});
