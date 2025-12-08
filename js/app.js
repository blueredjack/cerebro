/* ============================================
   CEREBRO - Visualizador de Ranges MTT
   app.js - Lógica principal
   ============================================ */

// === CONSTANTES ===
const POSITIONS = ['EP', 'MP', 'HJ', 'CO', 'BTN', 'SB', 'BB'];
const POSITION_LETTERS = ['U', 'H', 'C', 'B', 'S', 'D', 'X'];
const STACKS = [5, 6, 7, 8, 9, 10, 12, 15, 17, 20, 25, 30, 35, 40, 50, 75, 100];
const RANKS = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];

// === ESTADO GLOBAL ===
let currentStack = 100;
let currentSpot = null;
let selectedHand = null;
let navigationPath = [];

// === NAVEGAÇÃO ENTRE TELAS ===
function showHomeScreen() {
    document.getElementById('homeScreen').classList.remove('hidden');
    document.getElementById('phaseScreen').classList.remove('visible');
    document.getElementById('appContainer').classList.remove('visible');
}

function showPhaseScreen() {
    document.getElementById('homeScreen').classList.add('hidden');
    document.getElementById('phaseScreen').classList.add('visible');
    document.getElementById('appContainer').classList.remove('visible');
}

function showVisualizer() {
    document.getElementById('homeScreen').classList.add('hidden');
    document.getElementById('phaseScreen').classList.remove('visible');
    document.getElementById('appContainer').classList.add('visible');
    initVisualizer();
}

function goBack() {
    if (navigationPath.length > 1) {
        navigationPath.pop();
        const prev = navigationPath[navigationPath.length - 1];
        currentSpot = SPOTS_DATA[prev.key];
        updateDisplay();
    } else {
        resetToInitialState();
    }
}

// === INICIALIZAÇÃO ===
function initVisualizer() {
    renderStackBar();
    renderRangeGrid();
    updateStacks();
    resetToInitialState();
}

function renderStackBar() {
    const bar = document.getElementById('stackBar');
    bar.innerHTML = STACKS.map(s => 
        `<button class="stack-btn ${s === currentStack ? 'active' : ''}" onclick="selectStack(${s})">${s}BB</button>`
    ).join('');
}

function selectStack(stack) {
    currentStack = stack;
    renderStackBar();
    updateStacks();
    resetToInitialState();
}

function updateStacks() {
    for (let i = 0; i < 7; i++) {
        const el = document.getElementById(`seat-stack-${i}`);
        if (el) el.textContent = `${currentStack}BB`;
    }
    document.getElementById('rangeStackLabel').textContent = `${currentStack}BB`;
}

// === RANGE GRID ===
function renderRangeGrid() {
    const grid = document.getElementById('rangeGrid');
    grid.innerHTML = '';
    for (let i = 0; i < 13; i++) {
        for (let j = 0; j < 13; j++) {
            const cell = document.createElement('div');
            cell.className = 'hand-cell';
            let hand;
            if (i === j) hand = RANKS[i] + RANKS[j];
            else if (i < j) hand = RANKS[i] + RANKS[j] + 's';
            else hand = RANKS[j] + RANKS[i] + 'o';
            cell.textContent = hand;
            cell.dataset.hand = hand;
            cell.onclick = () => selectHandCell(hand);
            grid.appendChild(cell);
        }
    }
}

function selectHandCell(hand) {
    document.querySelectorAll('.hand-cell').forEach(c => c.classList.remove('selected'));
    const cell = document.querySelector(`[data-hand="${hand}"]`);
    if (cell) cell.classList.add('selected');
    selectedHand = hand;
    showHandDetails(hand);
}

function showHandDetails(hand) {
    const panel = document.getElementById('handDetails');
    if (!currentSpot || !currentSpot.h || !currentSpot.h[hand]) {
        panel.classList.remove('visible');
        return;
    }
    const hd = currentSpot.h[hand];
    const actions = currentSpot.a || [];
    document.getElementById('handName').textContent = hand;
    document.getElementById('handEvList').innerHTML = actions.map((a, i) => {
        const ev = hd.evs[i];
        const freq = (hd.played[i] * 100).toFixed(0);
        const evClass = ev > 0 ? 'positive' : 'negative';
        return `<div class="hand-ev-item">
            <span class="hand-ev-action">${getActionLabel(a)} (${freq}%)</span>
            <span class="hand-ev-value ${evClass}">${ev > 0 ? '+' : ''}${ev.toFixed(2)} BB</span>
        </div>`;
    }).join('');
    panel.classList.add('visible');
}

// === SELEÇÃO DE POSIÇÃO ===
function selectPosition(pos) {
    resetToInitialState();
    const key = `${currentStack}BB_${POSITION_LETTERS[pos]}_`;
    currentSpot = SPOTS_DATA[key];
    if (!currentSpot) {
        document.getElementById('rangePosition').textContent = 'Não disponível';
        return;
    }
    navigationPath = [{ key, position: pos }];
    
    // Marcar hero e folds
    document.querySelectorAll('.seat').forEach(s => s.classList.remove('hero', 'folded'));
    document.querySelector(`.seat-${POSITIONS[pos].toLowerCase()}`).classList.add('hero');
    for (let i = 0; i < pos; i++) {
        document.querySelector(`.seat-${POSITIONS[i].toLowerCase()}`).classList.add('folded');
    }
    updateDisplay();
}

// === ATUALIZAÇÃO DO DISPLAY ===
function updateDisplay() {
    if (!currentSpot) return;
    const heroPos = POSITIONS[currentSpot.p];
    document.getElementById('heroBadge').textContent = heroPos + ' ?';
    document.getElementById('rangePosition').textContent = heroPos;
    document.getElementById('statsPosition').textContent = heroPos;
    updateRangeGrid();
    updateActions();
    updateFrequencies();
    updateStats();
    document.getElementById('handDetails').classList.remove('visible');
}

function updateRangeGrid() {
    document.querySelectorAll('.hand-cell').forEach(cell => {
        const hand = cell.dataset.hand;
        const hd = currentSpot.h ? currentSpot.h[hand] : null;
        if (!hd) {
            cell.style.background = '#2d333b';
            cell.style.color = '#8b949e';
            return;
        }
        const played = hd.played;
        const actions = currentSpot.a || [];
        let r = 45, g = 51, b = 59;
        played.forEach((freq, idx) => {
            if (freq > 0 && actions[idx]) {
                const t = actions[idx].type;
                if (t === 'F') { r += 82 * freq; g += 89 * freq; b += 82 * freq; }
                else if (t === 'C') { r += -6 * freq; g += 123 * freq; b += 36 * freq; }
                else if (t === 'K') { r += 7 * freq; g += 101 * freq; b += 158 * freq; }
                else if (t === 'R') { r += 179 * freq; g += 69 * freq; b += 36 * freq; }
            }
        });
        cell.style.background = `rgb(${Math.min(255,Math.round(r))}, ${Math.min(255,Math.round(g))}, ${Math.min(255,Math.round(b))})`;
        cell.style.color = '#fff';
    });
}

// === AÇÕES ===
function updateActions() {
    const row = document.getElementById('actionsRow');
    if (!currentSpot || !currentSpot.a) {
        row.innerHTML = '';
        return;
    }
    row.innerHTML = currentSpot.a.map((a, i) => {
        const label = getActionLabel(a);
        const btnClass = getButtonClass(a, i);
        const amount = a.amount ? formatAmount(a.amount) : '';
        return `<button class="action-btn ${btnClass}" onclick="executeAction(${i})">
            ${label}
            ${amount ? `<span class="btn-amount">${amount}</span>` : ''}
        </button>`;
    }).join('');
}

function getActionLabel(a) {
    if (a.type === 'F') return 'Fold';
    if (a.type === 'K') return 'Check';
    if (a.type === 'C') return 'Call';
    if (a.type === 'R') return 'Raise';
    return a.type;
}

function getButtonClass(a, idx) {
    if (a.type === 'F') return 'btn-fold';
    if (a.type === 'K') return 'btn-check';
    if (a.type === 'C') return 'btn-call';
    if (a.type === 'R') return idx > 1 ? 'btn-raise-alt' : 'btn-raise';
    return 'btn-fold';
}

function formatAmount(amt) {
    const bb = amt / 100000;
    return bb >= 100 ? '100.00 BB' : bb.toFixed(2) + ' BB';
}

function executeAction(idx) {
    if (!currentSpot || !currentSpot.a || !currentSpot.a[idx]) return;
    const a = currentSpot.a[idx];
    const node = a.node;
    if (!node) { alert('Fim da árvore'); return; }
    
    let nextKey = Object.keys(SPOTS_DATA).find(k => SPOTS_DATA[k]?.t === node);
    if (!nextKey) {
        const ck = navigationPath[navigationPath.length - 1].key;
        const letter = a.type === 'F' ? 'F' : a.type === 'C' ? 'C' : 'R';
        const pk = ck.slice(0, -1) + letter + '_';
        if (SPOTS_DATA[pk]) { loadSpot(pk); return; }
    }
    if (nextKey) loadSpot(nextKey);
    else alert('Próximo nó não encontrado');
}

function loadSpot(key) {
    currentSpot = SPOTS_DATA[key];
    if (!currentSpot) return;
    navigationPath.push({ key, position: currentSpot.p });
    document.querySelectorAll('.seat').forEach(s => s.classList.remove('hero'));
    document.querySelector(`.seat-${POSITIONS[currentSpot.p].toLowerCase()}`).classList.add('hero');
    updateDisplay();
}

// === FREQUÊNCIAS E STATS ===
function updateFrequencies() {
    if (!currentSpot || !currentSpot.h) {
        document.getElementById('freqList').innerHTML = '';
        return;
    }
    const actions = currentSpot.a || [];
    const totals = actions.map(() => 0);
    let count = 0;
    Object.values(currentSpot.h).forEach(h => {
        const w = h.weight || 1;
        h.played.forEach((f, i) => totals[i] += f * w);
        count += w;
    });
    document.getElementById('freqList').innerHTML = actions.map((a, i) => {
        const pct = count > 0 ? (totals[i] / count * 100).toFixed(1) : '0.0';
        const colorClass = a.type === 'F' ? 'fold' : a.type === 'C' ? 'call' : a.type === 'K' ? 'check' : (i > 1 ? 'raise2' : 'raise');
        return `<div class="freq-item">
            <div class="freq-color freq-color-${colorClass}"></div>
            <span class="freq-label">${getActionLabel(a)}</span>
            <span class="freq-value freq-value-${colorClass}">${pct}%</span>
        </div>`;
    }).join('');
}

function updateStats() {
    if (!currentSpot || !currentSpot.h) {
        document.getElementById('statFold').textContent = '-';
        document.getElementById('statCall').textContent = '-';
        document.getElementById('statRaise').textContent = '-';
        return;
    }
    const actions = currentSpot.a || [];
    const totals = actions.map(() => 0);
    let count = 0;
    Object.values(currentSpot.h).forEach(h => {
        const w = h.weight || 1;
        h.played.forEach((f, i) => totals[i] += f * w);
        count += w;
    });
    let foldPct = 0, callPct = 0, raisePct = 0;
    actions.forEach((a, i) => {
        const pct = count > 0 ? totals[i] / count * 100 : 0;
        if (a.type === 'F') foldPct += pct;
        else if (a.type === 'C') callPct += pct;
        else if (a.type === 'R') raisePct += pct;
    });
    document.getElementById('statFold').textContent = foldPct.toFixed(0) + '%';
    document.getElementById('statCall').textContent = callPct.toFixed(0) + '%';
    document.getElementById('statRaise').textContent = raisePct.toFixed(0) + '%';
}

// === RESET ===
function resetToInitialState() {
    currentSpot = null;
    selectedHand = null;
    navigationPath = [];
    document.querySelectorAll('.seat').forEach(s => s.classList.remove('hero', 'folded'));
    document.getElementById('heroBadge').textContent = '?';
    document.getElementById('rangePosition').textContent = '-';
    document.getElementById('statsPosition').textContent = '-';
    document.getElementById('statFold').textContent = '-';
    document.getElementById('statCall').textContent = '-';
    document.getElementById('statRaise').textContent = '-';
    document.getElementById('actionsRow').innerHTML = '';
    document.getElementById('freqList').innerHTML = '';
    document.getElementById('handDetails').classList.remove('visible');
    document.querySelectorAll('.hand-cell').forEach(c => {
        c.style.background = '#2d333b';
        c.style.color = '#8b949e';
        c.classList.remove('selected');
    });
}
