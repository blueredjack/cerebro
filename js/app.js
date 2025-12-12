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

// Modos de análise
let melhorEVAtivo = false;
let exploitAtivo = false;
let exploitBonus = 0;

// === CÁLCULO DE STATS DINÂMICOS ===
function calculateAndUpdateStats() {
    if (typeof SPOTS_DATA === 'undefined') {
        console.warn('SPOTS_DATA não carregado ainda');
        return;
    }
    
    const spots = Object.keys(SPOTS_DATA);
    const totalSpots = spots.length;
    
    // Extrair stacks únicos
    const stacks = new Set();
    spots.forEach(key => {
        const match = key.match(/^(\d+)BB_/);
        if (match) {
            stacks.add(parseInt(match[1]));
        }
    });
    const totalStacks = stacks.size;
    
    // Posições são sempre 7 (EP, MP, HJ, CO, BTN, SB, BB)
    const totalPositions = 7;
    
    // Atualizar elementos no DOM
    const statSpots = document.getElementById('statSpots');
    const statStacks = document.getElementById('statStacks');
    const statPositions = document.getElementById('statPositions');
    const phaseBadge = document.getElementById('phaseBadgeSpots');
    
    if (statSpots) statSpots.textContent = totalSpots;
    if (statStacks) statStacks.textContent = totalStacks;
    if (statPositions) statPositions.textContent = totalPositions;
    if (phaseBadge) phaseBadge.textContent = totalSpots + ' spots';
    
    console.log(`Stats: ${totalSpots} spots, ${totalStacks} stacks, ${totalPositions} posições`);
}

// === NAVEGAÇÃO ENTRE TELAS ===
function showHomeScreen() {
    document.getElementById('homeScreen').classList.remove('hidden');
    document.getElementById('phaseScreen').classList.remove('visible');
    document.getElementById('appContainer').classList.remove('visible');
    const huContainer = document.getElementById('appContainerHU');
    if (huContainer) huContainer.classList.remove('visible');
}

function showPhaseScreen() {
    document.getElementById('homeScreen').classList.add('hidden');
    document.getElementById('phaseScreen').classList.add('visible');
    document.getElementById('appContainer').classList.remove('visible');
    const huContainer = document.getElementById('appContainerHU');
    if (huContainer) huContainer.classList.remove('visible');
    calculateAndUpdateStats(); // Atualizar badge de spots
}

function showVisualizer() {
    document.getElementById('homeScreen').classList.add('hidden');
    document.getElementById('phaseScreen').classList.remove('visible');
    document.getElementById('appContainer').classList.add('visible');
    const huContainer = document.getElementById('appContainerHU');
    if (huContainer) huContainer.classList.remove('visible');
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
    calculateAndUpdateStats(); // Calcular stats dinamicamente
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
    
    // Atualizar label do stack na mesa
    const mesaLabel = document.getElementById('mesaStackLabel');
    if (mesaLabel) mesaLabel.textContent = `${currentStack}BB`;
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
        const label = getActionLabel(a, currentStack);
        const amount = a.amount ? formatAmount(a.amount, currentStack) : '';
        const category = getActionCategory(a, i, currentStack);
        const colorHex = ACTION_COLORS[category]?.hex || '#64748b';
        
        return `<div class="hand-ev-item">
            <span class="hand-ev-action" style="color: ${colorHex}">${label}${amount ? ' ' + amount : ''} (${freq}%)</span>
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
    updateHistory();
    document.getElementById('handDetails').classList.remove('visible');
}

function updateRangeGrid() {
    document.querySelectorAll('.hand-cell').forEach(cell => {
        const hand = cell.dataset.hand;
        const hd = currentSpot && currentSpot.h ? currentSpot.h[hand] : null;
        
        if (!hd) {
            // Mão não está no range - cinza escuro
            cell.style.background = '#2d3748';
            cell.style.color = '#4a5568';
            cell.innerHTML = hand;
            return;
        }
        
        const actions = currentSpot.a || [];
        
        // === MODO MELHOR EV (GTO) ===
        // Mostra apenas a ação com maior EV para cada mão (cor sólida)
        if (melhorEVAtivo) {
            const melhor = getMelhorAcao(hand);
            if (!melhor || !melhor.action || melhor.action.type === 'F') {
                cell.style.background = '#2d3748';
                cell.style.color = '#4a5568';
                cell.innerHTML = hand;
                return;
            }
            
            const category = getActionCategory(melhor.action, melhor.idx, currentStack);
            const hex = ACTION_COLORS[category]?.hex || '#f97316';
            cell.style.background = hex;
            cell.style.color = '#000';
            cell.innerHTML = hand;
            return;
        }
        
        // === MODO EXPLOIT ===
        // Ajusta frequências baseado no bônus
        let played = hd.played || [];
        if (exploitAtivo && exploitBonus !== 0) {
            played = aplicarExploit(played, hd.evs);
        }
        
        // Calcular frequência total de ações (não-fold)
        let totalActionFreq = 0;
        let actionColors = [];
        
        played.forEach((freq, idx) => {
            if (freq > 0 && actions[idx]) {
                const actionType = actions[idx].type;
                if (actionType !== 'F') {
                    const category = getActionCategory(actions[idx], idx, currentStack);
                    const hex = ACTION_COLORS[category]?.hex || '#f97316';
                    actionColors.push({ freq, hex, type: actionType });
                    totalActionFreq += freq;
                }
            }
        });
        
        // Se 100% fold ou sem ação, mostrar cinza
        if (totalActionFreq === 0) {
            cell.style.background = '#2d3748';
            cell.style.color = '#4a5568';
            cell.innerHTML = hand;
            return;
        }
        
        // Criar visualização com blocos divididos VERTICALMENTE
        if (actionColors.length === 1) {
            const color = actionColors[0].hex;
            const freq = actionColors[0].freq;
            
            if (freq >= 0.95) {
                cell.style.background = color;
            } else {
                const stopPoint = (1 - freq) * 100;
                cell.style.background = `linear-gradient(90deg, #2d3748 ${stopPoint}%, ${color} ${stopPoint}%)`;
            }
        } else {
            // Múltiplas ações - ordenar por frequência
            actionColors.sort((a, b) => b.freq - a.freq);
            
            let gradientStops = [];
            let currentStop = 0;
            
            const foldFreq = 1 - totalActionFreq;
            if (foldFreq > 0.05) {
                gradientStops.push(`#2d3748 ${foldFreq * 100}%`);
                currentStop = foldFreq * 100;
            }
            
            actionColors.forEach((ac, i) => {
                const startStop = currentStop;
                currentStop += ac.freq * 100;
                gradientStops.push(`${ac.hex} ${startStop}%`);
                gradientStops.push(`${ac.hex} ${currentStop}%`);
            });
            
            cell.style.background = `linear-gradient(90deg, ${gradientStops.join(', ')})`;
        }
        
        cell.style.color = '#000';
        cell.innerHTML = hand;
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
        const label = getActionLabel(a, currentStack);
        const btnClass = getButtonClass(a, i, currentStack);
        const amount = a.amount ? formatAmount(a.amount, currentStack) : '';
        
        return `<button class="action-btn ${btnClass}" onclick="executeAction(${i})">
            <span>${label}</span>
            ${amount ? `<span class="btn-amount">${amount}</span>` : ''}
        </button>`;
    }).join('');
}

// === SISTEMA DE CORES UNIFICADO ===
// Cores padronizadas por tipo de ação (independente de stack)
const ACTION_COLORS = {
    FOLD:     { btn: 'btn-fold',     hex: '#4a5568' },  // Cinza
    CHECK:    { btn: 'btn-check',    hex: '#3b82f6' },  // Azul
    CALL:     { btn: 'btn-call',     hex: '#00bfff' },  // Ciano
    RAISE_1:  { btn: 'btn-raise-1',  hex: '#ffff00' },  // Amarelo (primeiro raise)
    RAISE_2:  { btn: 'btn-raise-2',  hex: '#00ff00' },  // Verde (segundo raise)
    RAISE_3:  { btn: 'btn-raise-3',  hex: '#9333ea' },  // Roxo (terceiro raise)
    RAISE_4:  { btn: 'btn-raise-4',  hex: '#f9a8d4' },  // Rosa bebê (quarto raise)
    ALLIN:    { btn: 'btn-allin',    hex: '#dc2626' }   // Vermelho (All-in)
};

function getActionCategory(action, actionIndex, stack) {
    const bb = action.amount ? action.amount / 100000 : 0;
    const pctStack = stack > 0 ? (bb / stack) * 100 : 0;
    
    if (action.type === 'F') return 'FOLD';
    if (action.type === 'K' || action.type === 'X') return 'CHECK';
    if (action.type === 'C') return 'CALL';
    
    if (action.type === 'R') {
        // All-in: quando o raise é >= 90% do stack
        if (pctStack >= 90) return 'ALLIN';
        
        // Categorizar por índice do raise no spot
        const raiseIndex = actionIndex - countNonRaises(actionIndex);
        if (raiseIndex <= 0) return 'RAISE_1';  // Primeiro raise - Amarelo
        if (raiseIndex === 1) return 'RAISE_2'; // Segundo raise - Verde
        if (raiseIndex === 2) return 'RAISE_3'; // Terceiro raise - Roxo
        return 'RAISE_4';                        // Quarto+ raise - Rosa bebê
    }
    
    return 'FOLD';
}

function countNonRaises(upToIndex) {
    if (!currentSpot || !currentSpot.a) return 0;
    let count = 0;
    for (let i = 0; i < upToIndex; i++) {
        if (currentSpot.a[i].type !== 'R') count++;
    }
    return count;
}

function getActionLabel(a, stack) {
    if (a.type === 'F') return 'Fold';
    if (a.type === 'K' || a.type === 'X') return 'Check';
    if (a.type === 'C') return 'Call';
    if (a.type === 'R') {
        const bb = a.amount ? a.amount / 100000 : 0;
        const pctStack = stack > 0 ? (bb / stack) * 100 : 0;
        if (pctStack >= 90) return 'All-In';
        return 'Raise';
    }
    return a.type;
}

function getButtonClass(action, actionIndex, stack) {
    const category = getActionCategory(action, actionIndex, stack);
    return ACTION_COLORS[category]?.btn || 'btn-fold';
}

function formatAmount(amt, stack) {
    const bb = amt / 100000;
    const pctStack = stack > 0 ? (bb / stack) * 100 : 0;
    
    // Se for all-in, mostrar como "All-In"
    if (pctStack >= 90) return '';
    
    if (bb >= 100) return bb.toFixed(0) + ' BB';
    if (bb >= 10) return bb.toFixed(1) + ' BB';
    return bb.toFixed(2) + ' BB';
}

// === HELPERS DE NAVEGAÇÃO ===
function isRFISpot(key) {
    const match = key.match(/^(\d+)BB_([UHCBSDX])_(.*)$/);
    if (!match) return false;
    const [, , posLetter, history] = match;
    return RFI_HISTORY[posLetter] === history;
}

// Verifica se é o primeiro raise da mão (spot de abertura)
function isOpeningSpot(key) {
    const match = key.match(/^(\d+)BB_([UHCBSDX])_(.*)$/);
    if (!match) return false;
    const [, , , history] = match;
    // É opening se o histórico é só Fs seguidos de R, ou só R
    // Exemplos: R, F, FF, FFF, FFFF, FFFFF
    return /^F*R?$/.test(history);
}

function getNextSpotKey(currentKey, actionType) {
    const match = currentKey.match(/^(\d+)BB_([UHCBSDX])_(.*)$/);
    if (!match) return { key: null, nextPos: null, newHistory: null };
    
    const [, stack, posLetter, history] = match;
    const currentPosIdx = POSITION_LETTERS.indexOf(posLetter);
    
    let newHistory;
    
    // Lógica especial para spots RFI (primeiro a agir)
    if (isRFISpot(currentKey)) {
        if (actionType === 'F') {
            // Fold no RFI: próximo assume RFI, histórico adiciona F
            newHistory = history.replace(/R$/, '') + 'F';
            // Se era só R, vira F. Se era F, vira FF. etc.
            if (history === 'R') {
                newHistory = 'F';
            } else {
                newHistory = history + 'F';
            }
        } else {
            // Raise no RFI: próximo está facing raise
            // O histórico se torna o que tinha + mantém só um R
            // FFF + R = FFFR (não FFFR + R)
            if (history === 'R') {
                // EP abriu, próximo vê só R
                newHistory = 'R';
            } else {
                // CO abriu (FFF), próximo vê FFFR
                newHistory = history + 'R';
            }
        }
    } else {
        // Não é RFI: simplesmente adiciona a ação ao histórico
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
    
    // Não encontrou spot, retorna próxima posição para mostrar tela vazia
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
    
    // Limpar todos os estados e marcar hero
    document.querySelectorAll('.seat').forEach(s => s.classList.remove('hero', 'folded', 'acted'));
    const seat = document.querySelector(`.seat-${heroPos.toLowerCase()}`);
    if (seat) seat.classList.add('hero');
    
    // Marcar posições que foldaram baseado no histórico
    const foldedPositions = getFoldedPositionsFromHistory(history, posIdx);
    foldedPositions.forEach(foldedIdx => {
        const foldedSeat = document.querySelector(`.seat-${POSITIONS[foldedIdx].toLowerCase()}`);
        if (foldedSeat) foldedSeat.classList.add('folded');
    });
    
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
    
    // Atualizar mesa visualmente
    updateTableDisplay(key);
    
    updateDisplay();
}

// Atualiza a visualização da mesa (hero, folded, etc)
function updateTableDisplay(key) {
    if (!key) return;
    
    const match = key.match(/^(\d+)BB_([UHCBSDX])_(.*)$/);
    if (!match) return;
    
    const [, stack, posLetter, history] = match;
    const heroIdx = POSITION_LETTERS.indexOf(posLetter);
    
    // Limpar todos os estados
    document.querySelectorAll('.seat').forEach(s => s.classList.remove('hero', 'folded', 'acted'));
    
    // Marcar hero
    const heroPos = POSITIONS[heroIdx];
    if (heroPos) {
        const seat = document.querySelector(`.seat-${heroPos.toLowerCase()}`);
        if (seat) seat.classList.add('hero');
    }
    
    // Analisar histórico para marcar folded/acted
    // Histórico começa da posição 0 (EP) e avança
    let actionIdx = 0;
    
    // Para spots RFI, o histórico indica quem foldou antes
    if (isRFISpot(key)) {
        // Contar Fs no início = posições que foldaram
        for (let i = 0; i < history.length && history[i] === 'F'; i++) {
            const foldedSeat = document.querySelector(`.seat-${POSITIONS[i].toLowerCase()}`);
            if (foldedSeat) foldedSeat.classList.add('folded');
        }
    } else {
        // Para spots não-RFI, analisar o histórico completo
        // Cada letra representa uma ação de uma posição em sequência
        const foldedPositions = getFoldedPositionsFromHistory(history, heroIdx);
        foldedPositions.forEach(posIdx => {
            const seat = document.querySelector(`.seat-${POSITIONS[posIdx].toLowerCase()}`);
            if (seat) seat.classList.add('folded');
        });
    }
}

// Analisa o histórico e retorna quais posições foldaram
function getFoldedPositionsFromHistory(history, currentPosIdx) {
    const folded = [];
    
    // Primeiro, identificar o padrão base
    // Se começa com R, alguém abriu
    // Cada F subsequente é um fold de quem estava agindo
    
    let posIdx = 0; // Começa do EP
    
    for (let i = 0; i < history.length; i++) {
        const action = history[i];
        
        if (action === 'F') {
            // Esta posição foldou
            if (posIdx < 7 && posIdx !== currentPosIdx) {
                folded.push(posIdx);
            }
            posIdx = (posIdx + 1) % 7;
        } else if (action === 'R') {
            // Raise - posição agiu mas não foldou
            posIdx = (posIdx + 1) % 7;
        } else if (action === 'C') {
            // Call - posição agiu mas não foldou
            posIdx = (posIdx + 1) % 7;
        }
    }
    
    return folded;
}

// === FREQUÊNCIAS E STATS ===
let highlightedActionIndex = null; // Índice da ação em hover

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
        const category = getActionCategory(a, i, currentStack);
        const colorHex = ACTION_COLORS[category]?.hex || '#64748b';
        const label = getActionLabel(a, currentStack);
        const amount = a.amount ? formatAmount(a.amount, currentStack) : '';
        
        return `<div class="freq-item" data-action-index="${i}" 
                     onmouseenter="highlightAction(${i})" 
                     onmouseleave="clearHighlight()">
            <div class="freq-color" style="background: ${colorHex}"></div>
            <span class="freq-label">${label}${amount ? ' ' + amount : ''}</span>
            <span class="freq-value" style="color: ${colorHex}">${pct}%</span>
        </div>`;
    }).join('');
}

// Destaca apenas a ação específica no range
function highlightAction(actionIndex) {
    highlightedActionIndex = actionIndex;
    updateRangeGridFiltered(actionIndex);
}

// Limpa o destaque e mostra todas as ações
function clearHighlight() {
    highlightedActionIndex = null;
    updateRangeGrid(); // Volta ao normal
}

// Atualiza o grid mostrando apenas a ação filtrada
function updateRangeGridFiltered(actionIndex) {
    if (!currentSpot || !currentSpot.a) return;
    
    const action = currentSpot.a[actionIndex];
    const category = getActionCategory(action, actionIndex, currentStack);
    const hex = ACTION_COLORS[category]?.hex || '#64748b';
    
    document.querySelectorAll('.hand-cell').forEach(cell => {
        const hand = cell.dataset.hand;
        const hd = currentSpot.h ? currentSpot.h[hand] : null;
        
        if (!hd || !hd.played || !hd.played[actionIndex]) {
            // Mão não tem essa ação - cinza escuro
            cell.style.background = '#2d3748';
            cell.style.color = '#4a5568';
            cell.innerHTML = hand;
            return;
        }
        
        const freq = hd.played[actionIndex];
        
        if (freq <= 0) {
            // Frequência zero - cinza
            cell.style.background = '#2d3748';
            cell.style.color = '#4a5568';
            cell.innerHTML = hand;
            return;
        }
        
        if (freq >= 0.95) {
            // Quase 100% - bloco inteiro colorido
            cell.style.background = hex;
        } else {
            // Frequência parcial - vertical (esquerda para direita)
            const stopPoint = (1 - freq) * 100;
            cell.style.background = `linear-gradient(90deg, #2d3748 ${stopPoint}%, ${hex} ${stopPoint}%)`;
        }
        
        cell.style.color = '#000';
        cell.innerHTML = hand;
    });
}

function getFreqColorClass(a, idx) {
    // Mantido para compatibilidade, mas não usado mais
    const category = getActionCategory(a, idx, currentStack);
    return category.toLowerCase().replace('_', '');
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

// === HISTÓRICO DE AÇÕES ===
function updateHistory() {
    const content = document.getElementById('historyContent');
    
    if (!currentSpotKey) {
        content.innerHTML = '<div class="history-empty">Selecione uma posição para iniciar</div>';
        return;
    }
    
    // Extrair informações da key: 100BB_U_R ou 100BB_H_RF
    const parts = currentSpotKey.split('_');
    if (parts.length < 3) {
        content.innerHTML = '<div class="history-empty">-</div>';
        return;
    }
    
    const history = parts[2]; // Ex: R, RF, RR, RFF, etc.
    const currentPosLetter = parts[1];
    const currentPosIdx = POS_MAP[currentPosLetter];
    const currentPosName = POSITIONS[currentPosIdx] || currentPosLetter;
    
    // Construir histórico visual
    let html = '';
    let posIdx = 0; // Começa do EP
    
    for (let i = 0; i < history.length; i++) {
        const action = history[i];
        const posName = POSITIONS[posIdx] || `P${posIdx}`;
        
        let actionClass = '';
        let actionText = '';
        
        if (action === 'F') {
            actionClass = 'fold';
            actionText = 'Fold';
        } else if (action === 'R') {
            actionClass = 'raise';
            actionText = 'Raise';
        } else if (action === 'C') {
            actionClass = 'call';
            actionText = 'Call';
        } else if (action === 'K' || action === 'X') {
            actionClass = 'check';
            actionText = 'Check';
        }
        
        html += `<div class="history-item">
            <span class="history-position">${posName}</span>
            <span class="history-action ${actionClass}">${actionText}</span>
        </div>`;
        
        if (i < history.length - 1) {
            html += '<span class="history-arrow">→</span>';
        }
        
        posIdx++;
        if (posIdx >= 7) posIdx = 0;
    }
    
    // Adicionar posição atual (hero)
    html += '<span class="history-arrow">→</span>';
    html += `<div class="history-item history-current">
        <span class="history-position">${currentPosName}</span>
        <span class="history-action" style="background: #f1c40f; color: #000;">?</span>
    </div>`;
    
    content.innerHTML = html;
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
    document.getElementById('historyContent').innerHTML = '<div class="history-empty">Selecione uma posição para iniciar</div>';
    
    document.querySelectorAll('.hand-cell').forEach(c => {
        c.style.background = '#2d3748';
        c.style.color = '#6b7b8a';
        c.classList.remove('selected');
    });
    
    // Reset modos de análise
    melhorEVAtivo = false;
    exploitAtivo = false;
    exploitBonus = 0;
    updateAnalysisButtons();
}

// === MODOS DE ANÁLISE ===

function toggleMelhorEV() {
    melhorEVAtivo = !melhorEVAtivo;
    
    // Desativar exploit se ativar melhor EV
    if (melhorEVAtivo) {
        exploitAtivo = false;
        document.getElementById('exploitControls').style.display = 'none';
    }
    
    updateAnalysisButtons();
    updateRangeGrid();
}

function toggleExploit() {
    exploitAtivo = !exploitAtivo;
    
    // Desativar melhor EV se ativar exploit
    if (exploitAtivo) {
        melhorEVAtivo = false;
        document.getElementById('exploitControls').style.display = 'block';
        exploitBonus = parseInt(document.getElementById('exploitSlider').value) || 1;
    } else {
        document.getElementById('exploitControls').style.display = 'none';
        exploitBonus = 0;
    }
    
    updateAnalysisButtons();
    updateRangeGrid();
}

function updateExploit(value) {
    exploitBonus = parseInt(value) || 0;
    const display = document.getElementById('exploitValueDisplay');
    if (display) {
        display.textContent = (exploitBonus > 0 ? '+' : '') + exploitBonus + '%';
    }
    updateAnalysisButtons();
    updateRangeGrid();
}

function updateAnalysisButtons() {
    const btnMelhorEV = document.getElementById('btnMelhorEV');
    const btnExploit = document.getElementById('btnExploit');
    const statusEl = document.getElementById('analysisStatus');
    
    if (!btnMelhorEV || !btnExploit || !statusEl) return;
    
    // Reset classes
    btnMelhorEV.classList.remove('active', 'active-exploit');
    btnExploit.classList.remove('active', 'active-exploit');
    statusEl.classList.remove('exploit', 'gto');
    
    if (melhorEVAtivo) {
        btnMelhorEV.classList.add('active');
        btnMelhorEV.innerHTML = `
            <span class="analysis-icon-bar">
                <span class="bar bar-green"></span>
                <span class="bar bar-yellow"></span>
                <span class="bar bar-red"></span>
            </span>
            <span>GTO Ativo</span>`;
        statusEl.innerHTML = '<span class="status-icon">📊</span><span>Modo GTO</span>';
        statusEl.classList.add('gto');
    } else {
        btnMelhorEV.innerHTML = `
            <span class="analysis-icon-bar">
                <span class="bar bar-green"></span>
                <span class="bar bar-yellow"></span>
                <span class="bar bar-red"></span>
            </span>
            <span>Melhor EV</span>`;
    }
    
    if (exploitAtivo) {
        btnExploit.classList.add('active-exploit');
        btnExploit.innerHTML = '<span class="analysis-icon-tent">🎪</span><span>Exploit Ativo</span>';
        statusEl.innerHTML = '<span class="status-icon">🎪</span><span>Exploit ' + (exploitBonus > 0 ? '+' : '') + exploitBonus + '%</span>';
        statusEl.classList.add('exploit');
    } else {
        btnExploit.innerHTML = '<span class="analysis-icon-tent">🎪</span><span>Ativar Exploit</span>';
    }
    
    if (!melhorEVAtivo && !exploitAtivo) {
        statusEl.innerHTML = '<span class="status-icon">📊</span><span>Range Original</span>';
    }
}

// Funções do modal de ajuda
function showAnalysisHelp() {
    document.getElementById('helpModal').style.display = 'flex';
}

function closeAnalysisHelp() {
    document.getElementById('helpModal').style.display = 'none';
}

// Fechar modal clicando fora
document.addEventListener('click', function(e) {
    const modal = document.getElementById('helpModal');
    if (modal && e.target === modal) {
        modal.style.display = 'none';
    }
});

// Função para obter a melhor ação (maior EV) de uma mão
function getMelhorAcao(hand) {
    if (!currentSpot || !currentSpot.h || !currentSpot.h[hand]) return null;
    
    const hd = currentSpot.h[hand];
    const evs = hd.evs || [];
    const actions = currentSpot.a || [];
    
    let melhorIdx = 0;
    let melhorEV = -Infinity;
    
    evs.forEach((ev, idx) => {
        if (ev > melhorEV) {
            melhorEV = ev;
            melhorIdx = idx;
        }
    });
    
    return { idx: melhorIdx, ev: melhorEV, action: actions[melhorIdx] };
}

// Função para aplicar exploit às frequências
function aplicarExploit(played, evs) {
    if (!played || !evs || exploitBonus === 0) return played;
    
    const novasFreqs = [...played];
    const bonus = exploitBonus / 100;
    
    // Encontrar ações de raise (mais agressivas)
    const actions = currentSpot.a || [];
    
    actions.forEach((action, idx) => {
        if (action.type === 'R') {
            // Aumentar/diminuir raises baseado no bônus
            novasFreqs[idx] = Math.max(0, Math.min(1, played[idx] + bonus * 0.3));
        } else if (action.type === 'F') {
            // Diminuir/aumentar folds inversamente
            novasFreqs[idx] = Math.max(0, Math.min(1, played[idx] - bonus * 0.2));
        } else if (action.type === 'C') {
            // Calls ficam relativamente estáveis
            novasFreqs[idx] = Math.max(0, Math.min(1, played[idx] - bonus * 0.1));
        }
    });
    
    // Normalizar para somar 1
    const soma = novasFreqs.reduce((a, b) => a + b, 0);
    if (soma > 0) {
        novasFreqs.forEach((f, i) => novasFreqs[i] = f / soma);
    }
    
    return novasFreqs;
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

/* ============================================
   MODO HEADS-UP (HU)
   ============================================ */

// Constantes HU
const HU_POSITIONS = ['SB', 'BB'];
const HU_POSITION_LETTERS = ['U', 'H']; // U = SB (BTN), H = BB (conforme dados HU)

// Estado HU
let currentStackHU = 50; // Stack inicial HU (máx disponível: 50BB)
let currentSpotHU = null;
let currentSpotKeyHU = null;
let selectedHandHU = null;
let navigationPathHU = [];
let melhorEVAtivoHU = false;
let exploitAtivoHU = false;
let exploitBonusHU = 0;

// Stacks disponíveis para HU (diferentes do 7-MAX)
const STACKS_HU = [3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 17, 20, 23, 25, 28, 30, 35, 40, 45, 50];

// === NAVEGAÇÃO HU ===
function showVisualizerHU() {
    document.getElementById('homeScreen').classList.add('hidden');
    document.getElementById('phaseScreen').classList.remove('visible');
    document.getElementById('appContainer').classList.remove('visible');
    document.getElementById('appContainerHU').classList.add('visible');
    initVisualizerHU();
}

function hideVisualizerHU() {
    document.getElementById('appContainerHU').classList.remove('visible');
}

// === INICIALIZAÇÃO HU ===
function initVisualizerHU() {
    calculateAndUpdateStatsHU();
    renderStackBarHU();
    renderRangeGridHU();
    updateStacksHU();
    resetToInitialStateHU();
}

function calculateAndUpdateStatsHU() {
    if (typeof SPOTS_DATA_HU === 'undefined') return;
    
    const spots = Object.keys(SPOTS_DATA_HU);
    const totalSpots = spots.length;
    
    const stacks = new Set();
    spots.forEach(key => {
        const match = key.match(/^(\d+)BB_/);
        if (match) stacks.add(parseInt(match[1]));
    });
    
    const el1 = document.getElementById('statSpotsHU');
    const el2 = document.getElementById('statStacksHU');
    const el3 = document.getElementById('phaseBadgeSpotsHU');
    
    if (el1) el1.textContent = totalSpots;
    if (el2) el2.textContent = stacks.size;
    if (el3) el3.textContent = totalSpots + ' spots';
}

function renderStackBarHU() {
    const bar = document.getElementById('stackBarHU');
    if (!bar) return;
    bar.innerHTML = STACKS_HU.map(s => 
        `<button class="stack-btn ${s === currentStackHU ? 'active' : ''}" onclick="selectStackHU(${s})">${s}BB</button>`
    ).join('');
}

function selectStackHU(stack) {
    currentStackHU = stack;
    renderStackBarHU();
    updateStacksHU();
    resetToInitialStateHU();
}

function updateStacksHU() {
    for (let i = 0; i < 2; i++) {
        const el = document.getElementById(`seat-stack-hu-${i}`);
        if (el) el.textContent = `${currentStackHU}BB`;
    }
    const label = document.getElementById('rangeStackLabelHU');
    if (label) label.textContent = `${currentStackHU}BB`;
    
    const mesaLabel = document.getElementById('mesaStackLabelHU');
    if (mesaLabel) mesaLabel.textContent = `${currentStackHU}BB`;
}

// === RANGE GRID HU ===
function renderRangeGridHU() {
    const grid = document.getElementById('rangeGridHU');
    if (!grid) return;
    grid.innerHTML = '';
    
    for (let i = 0; i < 13; i++) {
        for (let j = 0; j < 13; j++) {
            const cell = document.createElement('div');
            cell.className = 'hand-cell';
            
            let hand;
            if (i === j) {
                hand = RANKS[i] + RANKS[j];
            } else if (i < j) {
                hand = RANKS[i] + RANKS[j] + 's';
            } else {
                hand = RANKS[j] + RANKS[i] + 'o';
            }
            
            cell.dataset.hand = hand;
            cell.innerHTML = hand;
            cell.style.background = '#2d3748';
            cell.style.color = '#4a5568';
            
            cell.addEventListener('click', () => selectHandHU(hand));
            cell.addEventListener('mouseenter', () => showHandDetailsHU(hand));
            
            grid.appendChild(cell);
        }
    }
}

function selectHandHU(hand) {
    selectedHandHU = hand;
    document.querySelectorAll('#rangeGridHU .hand-cell').forEach(cell => {
        cell.classList.toggle('selected', cell.dataset.hand === hand);
    });
    showHandDetailsHU(hand);
}

function showHandDetailsHU(hand) {
    const nameEl = document.getElementById('handNameHU');
    const evListEl = document.getElementById('handEvListHU');
    
    if (!currentSpotHU || !currentSpotHU.h || !currentSpotHU.h[hand]) {
        if (nameEl) nameEl.textContent = hand;
        if (evListEl) evListEl.innerHTML = '<div class="no-data">Sem dados</div>';
        return;
    }
    
    const hd = currentSpotHU.h[hand];
    const actions = currentSpotHU.a || [];
    
    if (nameEl) nameEl.textContent = hand;
    
    if (evListEl) {
        evListEl.innerHTML = actions.map((action, idx) => {
            const ev = hd.evs && hd.evs[idx] !== undefined ? hd.evs[idx] : 0;
            const freq = hd.played && hd.played[idx] !== undefined ? hd.played[idx] : 0;
            const evClass = ev >= 0 ? 'positive' : 'negative';
            const actionName = formatActionNameHU(action);
            
            return `
                <div class="hand-ev-row">
                    <span class="hand-ev-action">${actionName}</span>
                    <span class="hand-ev-freq">${(freq * 100).toFixed(1)}%</span>
                    <span class="hand-ev-value ${evClass}">${ev >= 0 ? '+' : ''}${ev.toFixed(3)}</span>
                </div>
            `;
        }).join('');
    }
}

function formatActionNameHU(action) {
    if (!action) return '?';
    const type = action.type;
    const amount = action.amount || 0;
    const bb = amount / 20000;
    
    if (type === 'F') return 'Fold';
    if (type === 'C') return bb > 0 ? `Call (${bb.toFixed(2)} BB)` : 'Check';
    if (type === 'R') return `Raise (${bb.toFixed(2)} BB)`;
    return type;
}

// === SELEÇÃO DE POSIÇÃO HU ===
function selectPositionHU(posIndex) {
    const posLetter = HU_POSITION_LETTERS[posIndex];
    
    // No HU, SB abre primeiro (RFI)
    // SB = primeiro a agir = padrão _R
    // BB = segundo a agir = padrão vazio (depende do que SB fez)
    
    let historyPattern;
    if (posIndex === 0) {
        // SB - primeiro a agir
        historyPattern = 'R';
    } else {
        // BB - espera ação do SB (por enquanto, usar padrão de limp/raise)
        historyPattern = 'FFFFFC'; // Usar padrão do BB normal por enquanto
    }
    
    const spotKey = `${currentStackHU}BB_${posLetter}_${historyPattern}`;
    
    console.log('HU - Buscando spot:', spotKey);
    
    if (SPOTS_DATA_HU && SPOTS_DATA_HU[spotKey]) {
        currentSpotHU = SPOTS_DATA_HU[spotKey];
        currentSpotKeyHU = spotKey;
        navigationPathHU = [{ key: spotKey, position: posIndex }];
        updateDisplayHU();
        updateHeroBadgeHU(posIndex);
    } else {
        console.log('HU - Spot não encontrado, tentando alternativas...');
        // Tentar encontrar qualquer spot para essa posição
        const prefix = `${currentStackHU}BB_${posLetter}_`;
        const found = Object.keys(SPOTS_DATA_HU).find(k => k.startsWith(prefix));
        if (found) {
            currentSpotHU = SPOTS_DATA_HU[found];
            currentSpotKeyHU = found;
            navigationPathHU = [{ key: found, position: posIndex }];
            updateDisplayHU();
            updateHeroBadgeHU(posIndex);
        } else {
            alert(`Nenhum spot encontrado para ${HU_POSITIONS[posIndex]} em ${currentStackHU}BB`);
        }
    }
}

function updateHeroBadgeHU(posIndex) {
    const badge = document.getElementById('heroBadgeHU');
    if (badge) {
        badge.textContent = HU_POSITIONS[posIndex];
        badge.className = 'position-badge';
    }
}

// === ATUALIZAÇÃO DO DISPLAY HU ===
function updateDisplayHU() {
    updateRangeGridHU();
    updateActionButtonsHU();
    updateFrequencyListHU();
    updateActionHistoryHU();
    updateStatsDisplayHU();
}

function updateRangeGridHU() {
    document.querySelectorAll('#rangeGridHU .hand-cell').forEach(cell => {
        const hand = cell.dataset.hand;
        const hd = currentSpotHU && currentSpotHU.h ? currentSpotHU.h[hand] : null;
        
        if (!hd) {
            cell.style.background = '#2d3748';
            cell.style.color = '#4a5568';
            cell.innerHTML = hand;
            return;
        }
        
        const actions = currentSpotHU.a || [];
        
        // Modo Melhor EV HU
        if (melhorEVAtivoHU) {
            const melhor = getMelhorAcaoHU(hand);
            if (!melhor || !melhor.action || melhor.action.type === 'F') {
                cell.style.background = '#2d3748';
                cell.style.color = '#4a5568';
                cell.innerHTML = hand;
                return;
            }
            
            const category = getActionCategory(melhor.action, melhor.idx, currentStackHU);
            const hex = ACTION_COLORS[category]?.hex || '#f97316';
            cell.style.background = hex;
            cell.style.color = '#000';
            cell.innerHTML = hand;
            return;
        }
        
        // Range normal ou exploit
        let played = hd.played || [];
        if (exploitAtivoHU && exploitBonusHU !== 0) {
            played = aplicarExploitHU(played, hd.evs);
        }
        
        let totalActionFreq = 0;
        let actionColors = [];
        
        played.forEach((freq, idx) => {
            if (freq > 0 && actions[idx]) {
                const actionType = actions[idx].type;
                if (actionType !== 'F') {
                    const category = getActionCategory(actions[idx], idx, currentStackHU);
                    const hex = ACTION_COLORS[category]?.hex || '#f97316';
                    actionColors.push({ freq, hex, type: actionType });
                    totalActionFreq += freq;
                }
            }
        });
        
        if (totalActionFreq === 0) {
            cell.style.background = '#2d3748';
            cell.style.color = '#4a5568';
            cell.innerHTML = hand;
            return;
        }
        
        if (actionColors.length === 1) {
            const color = actionColors[0].hex;
            const freq = actionColors[0].freq;
            
            if (freq >= 0.95) {
                cell.style.background = color;
            } else {
                const stopPoint = (1 - freq) * 100;
                cell.style.background = `linear-gradient(90deg, #2d3748 ${stopPoint}%, ${color} ${stopPoint}%)`;
            }
        } else {
            actionColors.sort((a, b) => b.freq - a.freq);
            let gradientStops = [];
            let currentStop = 0;
            
            const foldFreq = 1 - totalActionFreq;
            if (foldFreq > 0.05) {
                gradientStops.push(`#2d3748 ${foldFreq * 100}%`);
                currentStop = foldFreq * 100;
            }
            
            actionColors.forEach((ac) => {
                const startStop = currentStop;
                currentStop += ac.freq * 100;
                gradientStops.push(`${ac.hex} ${startStop}%`);
                gradientStops.push(`${ac.hex} ${currentStop}%`);
            });
            
            cell.style.background = `linear-gradient(90deg, ${gradientStops.join(', ')})`;
        }
        
        cell.style.color = '#000';
        cell.innerHTML = hand;
    });
}

function getMelhorAcaoHU(hand) {
    if (!currentSpotHU || !currentSpotHU.h || !currentSpotHU.h[hand]) return null;
    
    const hd = currentSpotHU.h[hand];
    const evs = hd.evs || [];
    const actions = currentSpotHU.a || [];
    
    let melhorIdx = 0;
    let melhorEV = -Infinity;
    
    evs.forEach((ev, idx) => {
        if (ev > melhorEV) {
            melhorEV = ev;
            melhorIdx = idx;
        }
    });
    
    return { idx: melhorIdx, ev: melhorEV, action: actions[melhorIdx] };
}

function aplicarExploitHU(played, evs) {
    if (!played || !evs || exploitBonusHU === 0) return played;
    
    const novasFreqs = [...played];
    const bonus = exploitBonusHU / 100;
    const actions = currentSpotHU.a || [];
    
    actions.forEach((action, idx) => {
        if (action.type === 'R') {
            novasFreqs[idx] = Math.max(0, Math.min(1, played[idx] + bonus * 0.3));
        } else if (action.type === 'F') {
            novasFreqs[idx] = Math.max(0, Math.min(1, played[idx] - bonus * 0.2));
        } else if (action.type === 'C') {
            novasFreqs[idx] = Math.max(0, Math.min(1, played[idx] - bonus * 0.1));
        }
    });
    
    const soma = novasFreqs.reduce((a, b) => a + b, 0);
    if (soma > 0) {
        novasFreqs.forEach((f, i) => novasFreqs[i] = f / soma);
    }
    
    return novasFreqs;
}

function updateActionButtonsHU() {
    const container = document.getElementById('actionButtonsHU');
    if (!container || !currentSpotHU) {
        if (container) container.innerHTML = '<button class="action-btn fold">Fold</button>';
        return;
    }
    
    const actions = currentSpotHU.a || [];
    
    container.innerHTML = actions.map((action, idx) => {
        const nextHistory = getHistoryFromKey(currentSpotKeyHU) + action.type;
        const currentPosLetter = currentSpotKeyHU?.split('_')[1] || 'U';
        const nextPosLetter = currentPosLetter === 'U' ? 'H' : 'U';
        const nextKey = `${currentStackHU}BB_${nextPosLetter}_${nextHistory}`;
        const hasNext = action.node && SPOTS_DATA_HU && SPOTS_DATA_HU[nextKey];
        
        const btnClass = getButtonClass(action, idx, currentStackHU);
        const label = formatActionNameHU(action);
        
        return `<button class="action-btn ${btnClass} ${hasNext ? 'has-next' : ''}" 
                        onclick="selectActionHU(${idx})">${label}</button>`;
    }).join('');
}

function getHistoryFromKey(key) {
    if (!key) return '';
    const parts = key.split('_');
    return parts.length > 2 ? parts.slice(2).join('_') : '';
}

function selectActionHU(actionIndex) {
    if (!currentSpotHU || !currentSpotHU.a) return;
    
    const action = currentSpotHU.a[actionIndex];
    if (!action) return;
    
    const currentHistory = getHistoryFromKey(currentSpotKeyHU);
    const newHistory = currentHistory + action.type;
    
    // Determinar próxima posição (HU: U = SB/BTN, X = BB)
    const currentPosLetter = currentSpotKeyHU?.split('_')[1] || 'U';
    const nextPosLetter = currentPosLetter === 'U' ? 'H' : 'U';
    
    const nextKey = `${currentStackHU}BB_${nextPosLetter}_${newHistory}`;
    
    if (SPOTS_DATA_HU && SPOTS_DATA_HU[nextKey]) {
        currentSpotHU = SPOTS_DATA_HU[nextKey];
        currentSpotKeyHU = nextKey;
        navigationPathHU.push({ key: nextKey, action: action.type });
        updateDisplayHU();
        
        const posIndex = nextPosLetter === 'U' ? 0 : 1;
        updateHeroBadgeHU(posIndex);
    } else {
        console.log('HU - Próximo spot não encontrado:', nextKey);
    }
}

function updateFrequencyListHU() {
    const container = document.getElementById('freqListHU');
    if (!container || !currentSpotHU) {
        if (container) container.innerHTML = '';
        return;
    }
    
    const actions = currentSpotHU.a || [];
    const freqs = calculateRangeFrequenciesHU();
    
    container.innerHTML = actions.map((action, idx) => {
        const freq = freqs[idx] || 0;
        const category = getActionCategory(action, idx, currentStackHU);
        const colorHex = ACTION_COLORS[category]?.hex || '#64748b';
        const label = formatActionNameHU(action);
        
        return `
            <div class="freq-row">
                <div class="freq-color" style="background: ${colorHex}"></div>
                <span class="freq-label">${label}</span>
                <span class="freq-value" style="color: ${colorHex}">${(freq * 100).toFixed(1)}%</span>
            </div>
        `;
    }).join('');
}

function calculateRangeFrequenciesHU() {
    if (!currentSpotHU || !currentSpotHU.h) return [];
    
    const actions = currentSpotHU.a || [];
    const totals = new Array(actions.length).fill(0);
    let handCount = 0;
    
    for (const hand in currentSpotHU.h) {
        const hd = currentSpotHU.h[hand];
        if (hd.played) {
            hd.played.forEach((freq, idx) => {
                totals[idx] += freq;
            });
            handCount++;
        }
    }
    
    return totals.map(t => handCount > 0 ? t / handCount : 0);
}

function updateActionHistoryHU() {
    const container = document.getElementById('actionHistoryFlowHU');
    if (!container) return;
    
    if (navigationPathHU.length === 0) {
        container.innerHTML = `
            <span class="action-position">SB</span>
            <span class="action-badge action-unknown">?</span>
            <span class="action-arrow">→</span>
            <span class="action-position">BB</span>
            <span class="action-badge action-unknown">?</span>
        `;
        return;
    }
    
    // Construir histórico baseado na navegação
    let html = '';
    const history = getHistoryFromKey(currentSpotKeyHU) || '';
    
    for (let i = 0; i < history.length; i++) {
        const action = history[i];
        const pos = i % 2 === 0 ? 'SB' : 'BB';
        const colorClass = action === 'F' ? 'action-fold' : action === 'C' ? 'action-call' : 'action-raise';
        const label = action === 'F' ? 'Fold' : action === 'C' ? 'Call' : 'Raise';
        
        html += `<span class="action-position">${pos}</span>`;
        html += `<span class="action-badge ${colorClass}">${label}</span>`;
        if (i < history.length - 1) {
            html += `<span class="action-arrow">→</span>`;
        }
    }
    
    // Adicionar posição atual
    const currentPos = currentSpotKeyHU?.split('_')[1];
    const currentPosName = currentPos === 'U' ? 'SB' : 'BB';
    if (history.length > 0) {
        html += `<span class="action-arrow">→</span>`;
    }
    html += `<span class="action-position">${currentPosName}</span>`;
    html += `<span class="action-badge action-unknown">?</span>`;
    
    container.innerHTML = html;
}

function updateStatsDisplayHU() {
    const posEl = document.getElementById('statsPositionHU');
    const badgesEl = document.getElementById('statsBadgesHU');
    
    if (!currentSpotHU) {
        if (posEl) posEl.textContent = '?';
        if (badgesEl) badgesEl.innerHTML = '<div class="stat-badge fold">F --</div><div class="stat-badge call">C --</div><div class="stat-badge raise">R --</div>';
        return;
    }
    
    const currentPos = currentSpotKeyHU?.split('_')[1];
    const posName = currentPos === 'U' ? 'SB' : 'BB';
    if (posEl) posEl.textContent = posName;
    
    const freqs = calculateRangeFrequenciesHU();
    const actions = currentSpotHU.a || [];
    
    let foldFreq = 0, callFreq = 0, raiseFreq = 0;
    
    actions.forEach((action, idx) => {
        if (action.type === 'F') foldFreq = freqs[idx] || 0;
        else if (action.type === 'C') callFreq = freqs[idx] || 0;
        else if (action.type === 'R') raiseFreq += freqs[idx] || 0;
    });
    
    if (badgesEl) {
        badgesEl.innerHTML = `
            <div class="stat-badge fold">F ${(foldFreq * 100).toFixed(0)}%</div>
            <div class="stat-badge call">C ${(callFreq * 100).toFixed(0)}%</div>
            <div class="stat-badge raise">R ${(raiseFreq * 100).toFixed(0)}%</div>
        `;
    }
}

// === NAVEGAÇÃO HU ===
function goBackHU() {
    if (navigationPathHU.length > 1) {
        navigationPathHU.pop();
        const prev = navigationPathHU[navigationPathHU.length - 1];
        currentSpotKeyHU = prev.key;
        currentSpotHU = SPOTS_DATA_HU[prev.key];
        updateDisplayHU();
        
        const posLetter = prev.key.split('_')[1];
        const posIndex = posLetter === 'U' ? 0 : 1;
        updateHeroBadgeHU(posIndex);
    } else {
        resetToInitialStateHU();
    }
}

function resetToInitialStateHU() {
    currentSpotHU = null;
    currentSpotKeyHU = null;
    selectedHandHU = null;
    navigationPathHU = [];
    
    const badge = document.getElementById('heroBadgeHU');
    if (badge) {
        badge.textContent = '?';
        badge.className = 'position-badge';
    }
    
    const posLabel = document.getElementById('rangePositionHU');
    if (posLabel) posLabel.textContent = '?';
    
    document.querySelectorAll('#rangeGridHU .hand-cell').forEach(cell => {
        cell.style.background = '#2d3748';
        cell.style.color = '#4a5568';
        cell.classList.remove('selected');
    });
    
    const actionBtns = document.getElementById('actionButtonsHU');
    if (actionBtns) actionBtns.innerHTML = '<button class="action-btn fold">Fold</button>';
    
    const freqList = document.getElementById('freqListHU');
    if (freqList) freqList.innerHTML = '';
    
    const historyFlow = document.getElementById('actionHistoryFlowHU');
    if (historyFlow) {
        historyFlow.innerHTML = `
            <span class="action-position">SB</span>
            <span class="action-badge action-unknown">?</span>
            <span class="action-arrow">→</span>
            <span class="action-position">BB</span>
            <span class="action-badge action-unknown">?</span>
        `;
    }
    
    melhorEVAtivoHU = false;
    exploitAtivoHU = false;
    exploitBonusHU = 0;
    updateAnalysisButtonsHU();
}

// === MODOS DE ANÁLISE HU ===
function toggleMelhorEVHU() {
    melhorEVAtivoHU = !melhorEVAtivoHU;
    
    if (melhorEVAtivoHU) {
        exploitAtivoHU = false;
        const controls = document.getElementById('exploitControlsHU');
        if (controls) controls.style.display = 'none';
    }
    
    updateAnalysisButtonsHU();
    updateRangeGridHU();
}

function toggleExploitHU() {
    exploitAtivoHU = !exploitAtivoHU;
    
    if (exploitAtivoHU) {
        melhorEVAtivoHU = false;
        const controls = document.getElementById('exploitControlsHU');
        if (controls) controls.style.display = 'block';
        exploitBonusHU = parseInt(document.getElementById('exploitSliderHU')?.value) || 1;
    } else {
        const controls = document.getElementById('exploitControlsHU');
        if (controls) controls.style.display = 'none';
        exploitBonusHU = 0;
    }
    
    updateAnalysisButtonsHU();
    updateRangeGridHU();
}

function updateExploitHU(value) {
    exploitBonusHU = parseInt(value) || 0;
    const display = document.getElementById('exploitValueDisplayHU');
    if (display) {
        display.textContent = (exploitBonusHU > 0 ? '+' : '') + exploitBonusHU + '%';
    }
    updateAnalysisButtonsHU();
    updateRangeGridHU();
}

function updateAnalysisButtonsHU() {
    const btnMelhorEV = document.getElementById('btnMelhorEVHU');
    const btnExploit = document.getElementById('btnExploitHU');
    const statusEl = document.getElementById('analysisStatusHU');
    
    if (!btnMelhorEV || !btnExploit || !statusEl) return;
    
    btnMelhorEV.classList.remove('active', 'active-exploit');
    btnExploit.classList.remove('active', 'active-exploit');
    statusEl.classList.remove('exploit', 'gto');
    
    if (melhorEVAtivoHU) {
        btnMelhorEV.classList.add('active');
        btnMelhorEV.innerHTML = `
            <span class="analysis-icon-bar">
                <span class="bar bar-green"></span>
                <span class="bar bar-yellow"></span>
                <span class="bar bar-red"></span>
            </span>
            <span>GTO Ativo</span>`;
        statusEl.innerHTML = '<span class="status-icon">📊</span><span>Modo GTO</span>';
        statusEl.classList.add('gto');
    } else {
        btnMelhorEV.innerHTML = `
            <span class="analysis-icon-bar">
                <span class="bar bar-green"></span>
                <span class="bar bar-yellow"></span>
                <span class="bar bar-red"></span>
            </span>
            <span>Melhor EV</span>`;
    }
    
    if (exploitAtivoHU) {
        btnExploit.classList.add('active-exploit');
        btnExploit.innerHTML = '<span class="analysis-icon-tent">🎪</span><span>Exploit Ativo</span>';
        statusEl.innerHTML = '<span class="status-icon">🎪</span><span>Exploit ' + (exploitBonusHU > 0 ? '+' : '') + exploitBonusHU + '%</span>';
        statusEl.classList.add('exploit');
    } else {
        btnExploit.innerHTML = '<span class="analysis-icon-tent">🎪</span><span>Ativar Exploit</span>';
    }
    
    if (!melhorEVAtivoHU && !exploitAtivoHU) {
        statusEl.innerHTML = '<span class="status-icon">📊</span><span>Range Original</span>';
    }
}

console.log('Módulo HU carregado');
