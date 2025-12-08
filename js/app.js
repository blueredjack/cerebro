/* ============================================
   CEREBRO - Visualizador de Ranges MTT
   app.js - Lógica principal CORRIGIDA
   ============================================ */

// === CONSTANTES ===
const POSITIONS = ['EP', 'MP', 'HJ', 'CO', 'BTN', 'SB', 'BB'];
const POSITION_LETTERS = ['U', 'H', 'C', 'B', 'S', 'D', 'X'];
const STACKS = [5, 6, 7, 8, 9, 10, 12, 15, 17, 20, 25, 30, 35, 40, 50, 75, 100];
const RANKS = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];

// Mapeamento de letra para índice de posição
// U=EP(0), H=MP(1), C=HJ(2), B=CO(3), S=BTN(4), D=SB(5), X=BB(6)
const POS_MAP = { 'U': 0, 'H': 1, 'C': 2, 'B': 3, 'S': 4, 'D': 5, 'X': 6 };

// Padrões RFI por letra de posição
const RFI_HISTORY = {
    'U': 'R',       // EP: primeiro a agir (RFI)
    'H': 'F',       // MP: EP foldou
    'C': 'FF',      // HJ: EP+MP foldaram
    'B': 'FFF',     // CO: EP+MP+HJ foldaram
    'S': 'FFFF',    // BTN: todos antes foldaram
    'D': 'FFFFF',   // SB: todos antes foldaram
    'X': 'FFFFFC'   // BB: vs SB complete
};

// Versão antiga para compatibilidade
const RFI_PATTERNS = {
    0: '_R', 1: '_F', 2: '_FF', 3: '_FFF', 4: '_FFFF', 5: '_FFFFF', 6: '_FFFFFC'
};

// === ESTADO GLOBAL ===
let currentStack = 100;
let currentSpot = null;
let currentSpotKey = null;
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
        currentSpotKey = prev.key;
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
        const ev = hd.evs && hd.evs[i] !== undefined ? hd.evs[i] : 0;
        const freq = ((hd.played[i] || 0) * 100).toFixed(0);
        const evClass = ev > 0 ? 'positive' : 'negative';
        return `<div class="hand-ev-item">
            <span class="hand-ev-action">${getActionLabel(a)} (${freq}%)</span>
            <span class="hand-ev-value ${evClass}">${ev > 0 ? '+' : ''}${ev.toFixed(2)} BB</span>
        </div>`;
    }).join('');
    panel.classList.add('visible');
}

// === BUSCA DE SPOTS ===
function findRFISpot(stack, posIndex) {
    // Padrão RFI depende da posição
    const posLetter = POSITION_LETTERS[posIndex];
    const pattern = RFI_PATTERNS[posIndex];
    
    if (!pattern) return null;
    
    const key = `${stack}BB_${posLetter}${pattern}`;
    
    if (SPOTS_DATA[key]) {
        console.log(`Encontrado RFI: ${key}`);
        return key;
    }
    
    console.log(`RFI não encontrado: ${key}`);
    return null;
}

// === SELEÇÃO DE POSIÇÃO ===
function selectPosition(pos) {
    resetToInitialState();
    
    const spotKey = findRFISpot(currentStack, pos);
    
    if (!spotKey || !SPOTS_DATA[spotKey]) {
        document.getElementById('rangePosition').textContent = 'Não disponível';
        console.log(`Spot RFI não encontrado para posição ${POSITIONS[pos]} em ${currentStack}BB`);
        return;
    }
    
    currentSpotKey = spotKey;
    currentSpot = SPOTS_DATA[spotKey];
    navigationPath = [{ key: spotKey, position: pos }];
    
    // Marcar hero e folds
    document.querySelectorAll('.seat').forEach(s => s.classList.remove('hero', 'folded'));
    document.querySelector(`.seat-${POSITIONS[pos].toLowerCase()}`).classList.add('hero');
    
    // Marcar posições anteriores como folded (porque é RFI)
    for (let i = 0; i < pos; i++) {
        const seat = document.querySelector(`.seat-${POSITIONS[i].toLowerCase()}`);
        if (seat) seat.classList.add('folded');
    }
    
    updateDisplay();
}

// === ATUALIZAÇÃO DO DISPLAY ===
function updateDisplay() {
    if (!currentSpot) return;
    
    // Determinar posição do hero
    const heroIdx = currentSpot.p !== undefined ? currentSpot.p : 0;
    const heroPos = POSITIONS[heroIdx] || 'EP';
    
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
        const hd = currentSpot && currentSpot.h ? currentSpot.h[hand] : null;
        
        if (!hd) {
            cell.style.background = '#3a4a5a';
            cell.style.color = '#7a8a9a';
            return;
        }
        
        const played = hd.played || [];
        const actions = currentSpot.a || [];
        
        // Cores IDÊNTICAS à imagem de referência
        // Base: cinza escuro azulado
        let r = 58, g = 74, b = 90;
        
        played.forEach((freq, idx) => {
            if (freq > 0 && actions[idx]) {
                const t = actions[idx].type;
                if (t === 'F') {
                    // Fold: cinza médio (aumenta levemente)
                    r += 50 * freq;
                    g += 60 * freq;
                    b += 65 * freq;
                } else if (t === 'C') {
                    // Call: verde
                    r += -30 * freq;
                    g += 150 * freq;
                    b += 50 * freq;
                } else if (t === 'K') {
                    // Check: azul
                    r += 30 * freq;
                    g += 120 * freq;
                    b += 170 * freq;
                } else if (t === 'R') {
                    // Raise: cores da imagem de referência
                    if (idx <= 1) {
                        // Primeiro raise: coral/salmon (#e07a5f)
                        r += 166 * freq;
                        g += 48 * freq;
                        b += 5 * freq;
                    } else {
                        // Raise alternativo: amarelo/laranja (#f0b030)
                        r += 182 * freq;
                        g += 102 * freq;
                        b += -42 * freq;
                    }
                }
            }
        });
        
        cell.style.background = `rgb(${Math.min(255,Math.max(0,Math.round(r)))}, ${Math.min(255,Math.max(0,Math.round(g)))}, ${Math.min(255,Math.max(0,Math.round(b)))})`;
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
        const hasNode = a.node ? 'has-node' : '';
        
        return `<button class="action-btn ${btnClass} ${hasNode}" onclick="executeAction(${i})">
            <span>${label}</span>
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
    if (bb >= 100) return '100.00 BB';
    if (bb >= 10) return bb.toFixed(2) + ' BB';
    return bb.toFixed(2) + ' BB';
}

// === HELPERS DE NAVEGAÇÃO ===
function isRFISpot(key) {
    const match = key.match(/^(\d+)BB_([UHCBSDX])_(.*)$/);
    if (!match) return false;
    const [, , posLetter, history] = match;
    return RFI_HISTORY[posLetter] === history;
}

function getNextSpotKey(currentKey, actionType) {
    const match = currentKey.match(/^(\d+)BB_([UHCBSDX])_(.*)$/);
    if (!match) return { key: null, nextPos: null, newHistory: null };
    
    const [, stack, posLetter, history] = match;
    const currentPosIdx = POSITION_LETTERS.indexOf(posLetter);
    
    let newHistory;
    
    if (isRFISpot(currentKey)) {
        // Em spot RFI:
        // F = não abre, passa o RFI pro próximo
        // R = abre, próximo está facing raise
        if (actionType === 'F') {
            const nextPosIdx = (currentPosIdx + 1) % 7;
            const nextPosLetter = POSITION_LETTERS[nextPosIdx];
            newHistory = RFI_HISTORY[nextPosLetter];
        } else {
            newHistory = 'R';
        }
    } else {
        // Não é RFI: adiciona ação ao histórico
        newHistory = history + actionType;
    }
    
    // Tentar encontrar próximo spot em ordem de posições
    for (let offset = 1; offset <= 7; offset++) {
        const nextPosIdx = (currentPosIdx + offset) % 7;
        const nextPosLetter = POSITION_LETTERS[nextPosIdx];
        const candidateKey = `${stack}BB_${nextPosLetter}_${newHistory}`;
        
        if (SPOTS_DATA[candidateKey]) {
            return { key: candidateKey, nextPos: nextPosIdx, newHistory };
        }
    }
    
    // Não encontrou spot, mas retorna info para mostrar tela vazia
    const nextPosIdx = (currentPosIdx + 1) % 7;
    return { key: null, nextPos: nextPosIdx, newHistory };
}

function executeAction(idx) {
    if (!currentSpot || !currentSpot.a || !currentSpot.a[idx]) return;
    
    const action = currentSpot.a[idx];
    const actionType = action.type;
    
    const result = getNextSpotKey(currentSpotKey, actionType);
    
    if (result.key) {
        // Spot existe, carregar normalmente
        loadSpot(result.key);
    } else if (actionType === 'F' && isRFISpot(currentSpotKey)) {
        // Fold no RFI: próxima posição assume RFI
        const nextPosIdx = result.nextPos;
        showEmptySpot(nextPosIdx, result.newHistory, 'RFI');
    } else if (actionType === 'F') {
        // Fold normal: fim da mão para este jogador
        showEndOfTree('Fold');
    } else {
        // Spot não existe mas ação não é fold: mostrar tela vazia
        showEmptySpot(result.nextPos, result.newHistory, actionType);
    }
}

function showEmptySpot(posIdx, history, context) {
    // Limpar spot atual
    currentSpot = null;
    currentSpotKey = null;
    
    const heroPos = POSITIONS[posIdx];
    
    // Atualizar UI
    document.querySelectorAll('.seat').forEach(s => s.classList.remove('hero'));
    const seat = document.querySelector(`.seat-${heroPos.toLowerCase()}`);
    if (seat) seat.classList.add('hero');
    
    document.getElementById('heroBadge').textContent = heroPos + ' ?';
    document.getElementById('rangePosition').textContent = heroPos;
    document.getElementById('statsPosition').textContent = heroPos;
    
    // Limpar grid (mostrar vazio)
    document.querySelectorAll('.hand-cell').forEach(cell => {
        cell.style.background = '#3a4a5a';
        cell.style.color = '#7a8a9a';
    });
    
    // Limpar ações e stats
    document.getElementById('actionsRow').innerHTML = `
        <div style="color: #7a8a9a; text-align: center; padding: 20px;">
            Dados não disponíveis para este spot<br>
            <small>Histórico: ${history}</small>
        </div>`;
    document.getElementById('freqList').innerHTML = '';
    document.getElementById('statFold').textContent = '-';
    document.getElementById('statCall').textContent = '-';
    document.getElementById('statRaise').textContent = '-';
    document.getElementById('handDetails').classList.remove('visible');
}

function showEndOfTree(actionName) {
    const msg = actionName === 'Fold' 
        ? 'Você foldou. Selecione outra posição para continuar.'
        : 'Fim da árvore de decisão para esta linha.';
    
    const notification = document.createElement('div');
    notification.className = 'end-notification';
    notification.innerHTML = `<span>${msg}</span>`;
    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0,0,0,0.85);
        color: #fff;
        padding: 12px 24px;
        border-radius: 8px;
        z-index: 1000;
        font-size: 14px;
    `;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 2500);
}

function loadSpot(key) {
    currentSpot = SPOTS_DATA[key];
    currentSpotKey = key;
    
    if (!currentSpot) return;
    
    navigationPath.push({ key, position: currentSpot.p });
    
    // Atualizar hero na mesa
    document.querySelectorAll('.seat').forEach(s => s.classList.remove('hero'));
    const heroIdx = currentSpot.p !== undefined ? currentSpot.p : 0;
    const heroPos = POSITIONS[heroIdx];
    if (heroPos) {
        const seat = document.querySelector(`.seat-${heroPos.toLowerCase()}`);
        if (seat) seat.classList.add('hero');
    }
    
    updateDisplay();
}

// === FREQUÊNCIAS E STATS ===
function updateFrequencies() {
    const list = document.getElementById('freqList');
    
    if (!currentSpot || !currentSpot.h || !currentSpot.a) {
        list.innerHTML = '';
        return;
    }
    
    const actions = currentSpot.a;
    const totals = actions.map(() => 0);
    let count = 0;
    
    Object.values(currentSpot.h).forEach(h => {
        const w = h.weight || 1;
        if (h.played) {
            h.played.forEach((f, i) => {
                if (i < totals.length) totals[i] += f * w;
            });
        }
        count += w;
    });
    
    list.innerHTML = actions.map((a, i) => {
        const pct = count > 0 ? (totals[i] / count * 100).toFixed(1) : '0.0';
        const colorClass = getFreqColorClass(a, i);
        return `<div class="freq-item">
            <div class="freq-color freq-color-${colorClass}"></div>
            <span class="freq-label">${getActionLabel(a)}</span>
            <span class="freq-value freq-value-${colorClass}">${pct}%</span>
        </div>`;
    }).join('');
}

function getFreqColorClass(a, idx) {
    if (a.type === 'F') return 'fold';
    if (a.type === 'C') return 'call';
    if (a.type === 'K') return 'check';
    if (a.type === 'R') return idx > 1 ? 'raise2' : 'raise';
    return 'fold';
}

function updateStats() {
    if (!currentSpot || !currentSpot.h || !currentSpot.a) {
        document.getElementById('statFold').textContent = '-';
        document.getElementById('statCall').textContent = '-';
        document.getElementById('statRaise').textContent = '-';
        return;
    }
    
    const actions = currentSpot.a;
    const totals = actions.map(() => 0);
    let count = 0;
    
    Object.values(currentSpot.h).forEach(h => {
        const w = h.weight || 1;
        if (h.played) {
            h.played.forEach((f, i) => {
                if (i < totals.length) totals[i] += f * w;
            });
        }
        count += w;
    });
    
    let foldPct = 0, callPct = 0, raisePct = 0;
    
    actions.forEach((a, i) => {
        const pct = count > 0 ? totals[i] / count * 100 : 0;
        if (a.type === 'F') foldPct += pct;
        else if (a.type === 'C') callPct += pct;
        else if (a.type === 'R' || a.type === 'K') raisePct += pct;
    });
    
    document.getElementById('statFold').textContent = foldPct.toFixed(0) + '%';
    document.getElementById('statCall').textContent = callPct.toFixed(0) + '%';
    document.getElementById('statRaise').textContent = raisePct.toFixed(0) + '%';
}

// === RESET ===
function resetToInitialState() {
    currentSpot = null;
    currentSpotKey = null;
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
        c.style.background = '#2d3748';
        c.style.color = '#6b7b8a';
        c.classList.remove('selected');
    });
}

// === DEBUG ===
function debugSpots() {
    console.log('=== DEBUG SPOTS ===');
    console.log('Total spots:', Object.keys(SPOTS_DATA).length);
    
    // Listar primeiros 20 spots
    const keys = Object.keys(SPOTS_DATA).slice(0, 20);
    keys.forEach(k => console.log(k));
    
    // Testar busca
    POSITION_LETTERS.forEach((letter, idx) => {
        const key = `${currentStack}BB_${letter}_`;
        const found = SPOTS_DATA[key] ? 'FOUND' : 'NOT FOUND';
        console.log(`${POSITIONS[idx]} (${letter}): ${key} - ${found}`);
    });
}

// Chamar debug quando carregar
if (typeof SPOTS_DATA !== 'undefined') {
    console.log('SPOTS_DATA carregado com', Object.keys(SPOTS_DATA).length, 'spots');
}
