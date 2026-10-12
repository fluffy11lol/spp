const PALETTE = [
  '#3b82f6',
  '#06b6d4',
  '#10b981',
  '#8b5cf6',
  '#f59e0b',
  '#ef4444'
];

const STORAGE_KEYS = {
  PROFILE: 'synchroword_player_profile',
  OFFLINE_CACHE: 'synchroword_offline_cache'
};

class CrosswordClient {
  constructor() {
    this.ws = null;
    this.clientId = null;
    this.gameState = null;
    this.selectedCellKey = null;
    this.conflictCount = 0;
    this.reconnectTimer = null;
    this.reconnectAttempts = 0;

    this.player = this.loadProfile();

    this.initDOM();
    this.renderColorPalette();
    this.setupEventListeners();
    this.setupKeyboardHandler();
    this.connect();
  }

  loadProfile() {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PROFILE);
      if (saved) return JSON.parse(saved);
    } catch {
      
    }
    const suffix = Math.floor(100 + Math.random() * 900);
    const color = PALETTE[Math.floor(Math.random() * PALETTE.length)];
    return {
      name: `User_${suffix}`,
      color
    };
  }

  saveProfile() {
    try {
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(this.player));
    } catch {
      
    }
  }

  initDOM() {
    this.dom = {
      networkBanner: document.getElementById('network-banner'),
      networkBannerText: document.getElementById('network-banner-text'),
      btnForceReconnect: document.getElementById('btn-force-reconnect'),
      mapSelector: document.getElementById('map-selector'),
      connectionBadge: document.getElementById('connection-badge'),
      connectionStatusText: document.getElementById('connection-status-text'),
      onlineCount: document.getElementById('online-count'),
      playerNameInput: document.getElementById('player-name'),
      colorPalette: document.getElementById('color-palette'),
      btnSaveProfile: document.getElementById('btn-save-profile'),
      puzzleTitle: document.getElementById('puzzle-title'),
      puzzleDesc: document.getElementById('puzzle-desc'),
      btnResetMap: document.getElementById('btn-reset-map'),
      crosswordGrid: document.getElementById('crossword-grid'),
      selectedCellInfo: document.getElementById('selected-cell-info'),
      cluesAcross: document.getElementById('clues-across'),
      cluesDown: document.getElementById('clues-down'),
      conflictCount: document.getElementById('conflict-count'),
      btnTestConflict: document.getElementById('btn-test-conflict'),
      leaderboardItems: document.getElementById('leaderboard-items'),
      activityLog: document.getElementById('activity-log'),
      toastContainer: document.getElementById('toast-container')
    };

    this.dom.playerNameInput.value = this.player.name;
  }

  renderColorPalette() {
    this.dom.colorPalette.innerHTML = '';
    PALETTE.forEach(color => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `palette-btn ${color === this.player.color ? 'selected' : ''}`;
      btn.style.backgroundColor = color;
      btn.addEventListener('click', () => {
        this.dom.colorPalette.querySelectorAll('.palette-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        this.player.color = color;
      });
      this.dom.colorPalette.appendChild(btn);
    });
  }

  setupEventListeners() {
    this.dom.btnSaveProfile.addEventListener('click', () => {
      const name = this.dom.playerNameInput.value.trim();
      if (!name) {
        this.showToast('Nickname cannot be empty', 'warning');
        return;
      }
      this.player.name = name;
      this.saveProfile();

      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({
          type: 'join',
          name: this.player.name,
          color: this.player.color
        }));
      }
      this.showToast('Profile updated!', 'success');
    });

    this.dom.mapSelector.addEventListener('change', (e) => {
      const mapId = parseInt(e.target.value, 10);
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({
          type: 'select_map',
          mapId
        }));
      }
    });

    this.dom.btnResetMap.addEventListener('click', () => {
      if (confirm('Clear all answers on this puzzle map?')) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({ type: 'reset_map' }));
        }
      }
    });

    this.dom.btnTestConflict.addEventListener('click', () => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'simulate_concurrent_conflict' }));
      }
    });

    this.dom.btnForceReconnect.addEventListener('click', () => {
      if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
      this.connect();
    });

    
    window.addEventListener('online', () => {
      this.showToast('Network restored. Reconnecting...', 'info');
      this.connect();
    });

    window.addEventListener('offline', () => {
      this.setConnectionState('offline', 'Offline');
      this.dom.networkBanner.classList.remove('hidden');
      this.dom.networkBannerText.textContent = 'Network offline. State cached locally.';
      this.saveOfflineCache();
    });
  }

  setupKeyboardHandler() {
    window.addEventListener('keydown', (e) => {
      if (!this.selectedCellKey || !this.gameState) return;
      if (document.activeElement === this.dom.playerNameInput) return;

      const [x, y] = this.selectedCellKey.split(',').map(Number);
      const cell = this.gameState.cells[this.selectedCellKey];
      if (!cell) return;

      
      if (e.key === 'ArrowRight') {
        this.tryNavigate(x + 1, y);
        e.preventDefault();
        return;
      }
      if (e.key === 'ArrowLeft') {
        this.tryNavigate(x - 1, y);
        e.preventDefault();
        return;
      }
      if (e.key === 'ArrowDown') {
        this.tryNavigate(x, y + 1);
        e.preventDefault();
        return;
      }
      if (e.key === 'ArrowUp') {
        this.tryNavigate(x, y - 1);
        e.preventDefault();
        return;
      }

      
      if (cell.isCorrect) {
        if (e.key === 'Backspace' || e.key === 'Delete' || /^[a-zA-Z]$/.test(e.key)) {
          this.showToast('This cell is verified and locked against edits!', 'info');
          e.preventDefault();
        }
        return;
      }

      
      if (e.key === 'Backspace' || e.key === 'Delete') {
        this.submitLetter(this.selectedCellKey, '', cell.version);
        e.preventDefault();
        return;
      }

      
      if (/^[a-zA-Z]$/.test(e.key)) {
        const char = e.key.toUpperCase();
        this.submitLetter(this.selectedCellKey, char, cell.version);
        e.preventDefault();
      }
    });
  }

  tryNavigate(targetX, targetY) {
    const key = `${targetX},${targetY}`;
    if (this.gameState && this.gameState.cells[key]) {
      this.selectCell(key);
    }
  }

  connect() {
    if (this.ws) {
      try { this.ws.close(); } catch {  }
    }

    this.setConnectionState('reconnecting', 'Connecting...');
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;

    try {
      this.ws = new WebSocket(wsUrl);
    } catch {
      this.scheduleReconnect();
      return;
    }

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      this.setConnectionState('online', 'Connected');
      this.dom.networkBanner.classList.add('hidden');

      this.ws.send(JSON.stringify({
        type: 'join',
        name: this.player.name,
        color: this.player.color
      }));

      this.ws.send(JSON.stringify({ type: 'sync_request' }));
      this.showToast('Connected to server. Puzzles synchronized.', 'success');
    };

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        this.handleMessage(msg);
      } catch {
        
      }
    };

    this.ws.onclose = () => {
      this.setConnectionState('offline', 'Disconnected');
      this.dom.networkBanner.classList.remove('hidden');
      this.saveOfflineCache();
      this.scheduleReconnect();
    };

    this.ws.onerror = () => {
      this.ws.close();
    };
  }

  scheduleReconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectAttempts += 1;
    const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts - 1), 7000);
    const secs = (delay / 1000).toFixed(1);

    this.dom.networkBannerText.textContent = `Connection lost. Retrying in ${secs}s (attempt ${this.reconnectAttempts})...`;
    this.reconnectTimer = setTimeout(() => this.connect(), delay);
  }

  setConnectionState(state, text) {
    this.dom.connectionBadge.className = `connection-badge ${state}`;
    this.dom.connectionStatusText.textContent = text;
  }

  handleMessage(msg) {
    switch (msg.type) {
      case 'init': {
        this.clientId = msg.clientId;
        this.dom.onlineCount.textContent = msg.onlineCount;
        this.initMapSelector(msg.gameState.mapsList, msg.gameState.mapId);
        this.loadGameState(msg.gameState);
        this.renderLeaderboard(msg.leaderboard);
        if (msg.recentLogs) {
          msg.recentLogs.reverse().forEach(l => this.appendLog(`${l.player_name}: ${l.details}`));
        }
        break;
      }

      case 'sync_response': {
        this.dom.onlineCount.textContent = msg.onlineCount;
        this.loadGameState(msg.gameState);
        this.renderLeaderboard(msg.leaderboard);
        break;
      }

      case 'online_count': {
        this.dom.onlineCount.textContent = msg.count;
        break;
      }

      case 'player_joined': {
        this.appendLog(`${msg.player.name} joined`);
        if (msg.onlineCount) this.dom.onlineCount.textContent = msg.onlineCount;
        if (msg.leaderboard) this.renderLeaderboard(msg.leaderboard);
        break;
      }

      case 'player_left': {
        this.appendLog(`${msg.playerName} left`);
        break;
      }

      case 'map_changed': {
        this.dom.mapSelector.value = msg.gameState.mapId;
        this.loadGameState(msg.gameState);
        this.showToast(`Map changed by ${msg.changedBy}!`, 'info');
        break;
      }

      case 'map_reset': {
        this.loadGameState(msg.gameState);
        this.showToast('Puzzle answers cleared!', 'warning');
        break;
      }

      case 'cell_focused': {
        this.updateCellLockUI(msg.cellKey, msg.player.name, msg.player.color);
        break;
      }

      case 'cell_unfocused': {
        this.updateCellLockUI(msg.cellKey, null, null);
        break;
      }

      case 'cell_locked_rejected': {
        this.showToast(msg.message, 'warning');
        break;
      }

      case 'cell_updated': {
        if (this.gameState && this.gameState.cells[msg.cellKey]) {
          const c = this.gameState.cells[msg.cellKey];
          c.currentLetter = msg.letter;
          c.isCorrect = msg.isCorrect;
          c.version = msg.version;
          c.author = msg.author;
          c.lockedBy = null;
          c.lockColor = null;
          this.refreshSingleCell(msg.cellKey);
        }

        if (msg.actionDetail) {
          this.appendLog(msg.actionDetail, false, msg.isCorrect);
        }

        if (msg.solvedWord) {
          this.showToast(`Word "${msg.solvedWord}" solved (+50 pts)!`, 'success');
          this.updateCluesSolvedState();
        }

        if (msg.leaderboard) {
          this.renderLeaderboard(msg.leaderboard);
        }
        break;
      }

      case 'conflict': {
        this.handleConflict(msg);
        break;
      }

      default:
        break;
    }
  }

  initMapSelector(mapsList, activeId) {
    this.dom.mapSelector.innerHTML = '';
    mapsList.forEach(m => {
      const opt = document.createElement('option');
      opt.value = m.id;
      opt.textContent = m.title;
      if (m.id === activeId) opt.selected = true;
      this.dom.mapSelector.appendChild(opt);
    });
  }

  loadGameState(state) {
    this.gameState = state;
    this.dom.puzzleTitle.textContent = state.title;
    this.dom.puzzleDesc.textContent = state.description;
    this.renderGrid(state);
    this.renderClues(state.words);
    this.saveOfflineCache();
  }

  renderGrid(state) {
    this.dom.crosswordGrid.innerHTML = '';
    const size = state.gridSize || 10;
    const fragment = document.createDocumentFragment();

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const key = `${x},${y}`;
        const cellData = state.cells[key];
        const el = document.createElement('div');
        el.className = 'grid-cell';
        el.dataset.key = key;

        if (!cellData) {
          el.classList.add('black');
        } else {
          el.classList.add('playable');
          if (cellData.number) {
            const numSpan = document.createElement('span');
            numSpan.className = 'cell-num';
            numSpan.textContent = cellData.number;
            el.appendChild(numSpan);
          }

          const letterSpan = document.createElement('span');
          letterSpan.className = 'cell-letter';
          letterSpan.textContent = cellData.currentLetter || '';
          el.appendChild(letterSpan);

          if (cellData.isCorrect) el.classList.add('correct');

          el.addEventListener('click', () => this.selectCell(key));
        }

        fragment.appendChild(el);
      }
    }

    this.dom.crosswordGrid.appendChild(fragment);
  }

  renderClues(words) {
    this.dom.cluesAcross.innerHTML = '';
    this.dom.cluesDown.innerHTML = '';

    words.forEach(w => {
      const li = document.createElement('li');
      li.className = `clue-item ${w.isSolved ? 'solved' : ''}`;
      li.dataset.wordId = w.id;
      li.innerHTML = `<span class="clue-num">${w.number || w.id}.</span> <span>${w.clue} <small style="color:var(--text-muted)">(${w.text.length})</small></span>`;
      li.addEventListener('click', () => {
        const startKey = `${w.x},${w.y}`;
        this.selectCell(startKey);
      });

      if (w.direction === 'across') {
        this.dom.cluesAcross.appendChild(li);
      } else {
        this.dom.cluesDown.appendChild(li);
      }
    });
  }

  updateCluesSolvedState() {
    if (!this.gameState) return;
    this.gameState.words.forEach(w => {
      let complete = true;
      for (let i = 0; i < w.text.length; i++) {
        const cx = w.direction === 'across' ? w.x + i : w.x;
        const cy = w.direction === 'down' ? w.y + i : w.y;
        const cell = this.gameState.cells[`${cx},${cy}`];
        if (!cell || !cell.isCorrect) {
          complete = false;
          break;
        }
      }
      w.isSolved = complete;
      const el = document.querySelector(`.clue-item[data-word-id="${w.id}"]`);
      if (el) {
        if (complete) el.classList.add('solved');
        else el.classList.remove('solved');
      }
    });
  }

  selectCell(key) {
    if (this.selectedCellKey && this.selectedCellKey !== key) {
      
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'release_cell', cellKey: this.selectedCellKey }));
      }
    }

    this.selectedCellKey = key;
    this.dom.crosswordGrid.querySelectorAll('.grid-cell').forEach(c => c.classList.remove('focused'));

    const el = this.dom.crosswordGrid.querySelector(`[data-key="${key}"]`);
    if (el) el.classList.add('focused');

    
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'focus_cell', cellKey: key }));
    }

    const cell = this.gameState.cells[key];
    if (cell) {
      this.dom.selectedCellInfo.innerHTML = `Selected cell <strong>(${cell.x}, ${cell.y})</strong> | Version: <code>v${cell.version}</code> | ${cell.isCorrect ? 'Status: <strong style="color:var(--color-success)">VERIFIED</strong>' : 'Type a letter'}`;
    }
  }

  submitLetter(cellKey, letter, expectedVersion) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.showToast('Cannot submit while offline', 'danger');
      return;
    }
    this.ws.send(JSON.stringify({
      type: 'input_letter',
      cellKey,
      letter,
      expectedVersion
    }));
  }

  updateCellLockUI(cellKey, lockedBy, lockColor) {
    const el = this.dom.crosswordGrid.querySelector(`[data-key="${cellKey}"]`);
    if (!el) return;

    const oldBadge = el.querySelector('.cell-badge');
    if (oldBadge) oldBadge.remove();

    if (lockedBy && lockedBy !== this.player.name) {
      el.classList.add('locked-by-other');
      el.style.outlineColor = lockColor || 'var(--border-strong)';
      const badge = document.createElement('span');
      badge.className = 'cell-badge';
      badge.style.backgroundColor = lockColor || 'var(--accent-blue)';
      badge.style.color = '#fff';
      badge.textContent = lockedBy;
      el.appendChild(badge);
    } else {
      el.classList.remove('locked-by-other');
      el.style.outlineColor = '';
    }
  }

  refreshSingleCell(cellKey) {
    const el = this.dom.crosswordGrid.querySelector(`[data-key="${cellKey}"]`);
    const data = this.gameState.cells[cellKey];
    if (!el || !data) return;

    let letterSpan = el.querySelector('.cell-letter');
    if (!letterSpan) {
      letterSpan = document.createElement('span');
      letterSpan.className = 'cell-letter';
      el.appendChild(letterSpan);
    }
    letterSpan.textContent = data.currentLetter || '';

    if (data.isCorrect) el.classList.add('correct');
    else el.classList.remove('correct');

    this.updateCellLockUI(cellKey, data.lockedBy, data.lockColor);
  }

  
  handleConflict(msg) {
    this.conflictCount += 1;
    this.dom.conflictCount.textContent = this.conflictCount;

    if (msg.currentCell && this.gameState && this.gameState.cells[msg.cellKey]) {
      const c = this.gameState.cells[msg.cellKey];
      c.currentLetter = msg.currentCell.current_letter || msg.currentCell.currentLetter || '';
      c.isCorrect = Boolean(msg.currentCell.is_correct || msg.currentCell.isCorrect);
      c.version = msg.currentCell.version;
      c.author = msg.currentCell.author;
      this.refreshSingleCell(msg.cellKey);
    }

    const el = this.dom.crosswordGrid.querySelector(`[data-key="${msg.cellKey}"]`);
    if (el) {
      el.classList.remove('conflict-anim');
      void el.offsetWidth;
      el.classList.add('conflict-anim');
    }

    this.appendLog(msg.message, true);
    this.showToast(msg.message, 'warning');
  }

  renderLeaderboard(board) {
    if (!board || board.length === 0) {
      this.dom.leaderboardItems.innerHTML = '<div class="muted-note">No scores recorded yet</div>';
      return;
    }
    this.dom.leaderboardItems.innerHTML = '';
    board.forEach((p, idx) => {
      const row = document.createElement('div');
      row.className = 'leaderboard-row';
      const isMe = p.name === this.player.name;
      row.innerHTML = `
        <div class="player-ident">
          <span style="color:var(--text-muted)">#${idx + 1}</span>
          <span class="color-dot" style="background-color:${p.color}"></span>
          <strong>${p.name}${isMe ? ' (You)' : ''}</strong>
        </div>
        <strong>${p.score} pts</strong>
      `;
      this.dom.leaderboardItems.appendChild(row);
    });
  }

  appendLog(text, isConflict = false, isSolve = false) {
    const line = document.createElement('div');
    line.className = `log-line ${isConflict ? 'conflict' : ''} ${isSolve ? 'solve' : ''}`;
    const time = new Date().toLocaleTimeString();
    line.textContent = `[${time}] ${text}`;
    this.dom.activityLog.insertBefore(line, this.dom.activityLog.firstChild);
    if (this.dom.activityLog.children.length > 30) {
      this.dom.activityLog.removeChild(this.dom.activityLog.lastChild);
    }
  }

  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    this.dom.toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  saveOfflineCache() {
    try {
      if (this.gameState) {
        localStorage.setItem(STORAGE_KEYS.OFFLINE_CACHE, JSON.stringify(this.gameState));
      }
    } catch {
      
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.gameApp = new CrosswordClient();
});
