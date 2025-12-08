# 🧠 CEREBRO - Visualizador de Ranges MTT

Sistema de visualização de ranges para MTT (Multi-Table Tournament) de poker.

**🌐 URL Produção:** [cerebro-brown-beta.vercel.app](https://cerebro-brown-beta.vercel.app)  
**📦 Repositório:** [github.com/blueredjack/cerebro](https://github.com/blueredjack/cerebro)

---

## 📊 Status Atual

| Item | Valor |
|------|-------|
| **Versão** | 1.3.0 |
| **Última Atualização** | 2025-12-08 |
| **Status** | ✅ Online |
| **Spots Ativos** | 668 |
| **Modo Disponível** | VANILLA - CEV Symmetric |

---

## 📁 Estrutura do Projeto

```
cerebro/
├── index.html          # Página principal (3 telas: Home, Fases, Visualizador)
├── css/
│   └── styles.css      # Estilos (dark theme, responsivo, mesa dinâmica)
├── js/
│   └── app.js          # Lógica da aplicação (navegação, cores, ações)
├── data/
│   └── spots.js        # Dados dos spots (~9MB, 668 spots)
└── README.md           # Documentação e changelog
```

---

## 🎯 Funcionalidades Implementadas

### Tela 1 - Home
- [x] Logo animado CEREBRO
- [x] Cards de categoria (PKO 🎯, VANILLA ⚔️, Drill 🎮, AULAS 🔍)
- [x] VANILLA ativo, outros "Em breve"

### Tela 2 - Seleção de Fase
- [x] CEV Symmetric (668 spots) - ATIVO
- [x] Fases futuras listadas (SOON)

### Tela 3 - Visualizador de Ranges
- [x] Mesa 7-max com posições clicáveis
- [x] Range grid 13x13 com cores dinâmicas (gradiente vertical)
- [x] Navegação entre spots (RFI → Facing Raise → 3bet, etc.)
- [x] Sistema de cores padronizado para ações
- [x] Atualização dinâmica da mesa (hero amarelo, folded)
- [x] Painel de frequências com hover filtering
- [x] Painel de histórico de ações
- [x] Detalhes de EV por mão
- [x] Barra de stacks (5BB - 100BB) com fonte maior
- [x] Layout responsivo (adapta ao tamanho da janela)
- [x] Dealer button na borda da mesa

---

## 🎨 Sistema de Cores Padronizado

| Ação | Cor | Hex | Classe CSS |
|------|-----|-----|------------|
| Fold | Cinza | `#4a5568` | `btn-fold` |
| Check | Azul | `#3b82f6` | `btn-check` |
| Call | Ciano | `#00bfff` | `btn-call` |
| 1º Raise | Amarelo | `#ffff00` | `btn-raise-1` |
| 2º Raise | Verde | `#00ff00` | `btn-raise-2` |
| 3º Raise | Roxo | `#9333ea` | `btn-raise-3` |
| 4º Raise+ | Rosa bebê | `#f9a8d4` | `btn-raise-4` |
| All-in (≥90% stack) | Vermelho + borda dourada | `#dc2626` | `btn-allin` |

---

## 🔄 Lógica de Navegação

### Padrão de Chaves dos Spots
```
{stack}BB_{posição}_{histórico}

Exemplos:
- 100BB_U_R     = EP RFI (primeiro a agir)
- 100BB_H_R     = MP facing EP raise
- 100BB_C_RF    = HJ facing raise, MP folded
- 100BB_B_FFF   = CO RFI (EP, MP, HJ foldaram)
- 100BB_S_FFFR  = BTN facing CO raise
- 100BB_C_RR    = HJ facing 3bet
```

### Posições
| Letra | Posição | Índice |
|-------|---------|--------|
| U | EP (UTG) | 0 |
| H | MP (HJ-1) | 1 |
| C | HJ | 2 |
| B | CO | 3 |
| S | BTN | 4 |
| D | SB | 5 |
| X | BB | 6 |

### Fluxo de Ações
```
EP RFI (U_R) + Raise → MP facing raise (H_R)
EP RFI (U_R) + Fold  → MP assume RFI (H_F)
CO RFI (B_FFF) + Raise → BTN facing raise (S_FFFR)
MP facing (H_R) + Fold → HJ facing (C_RF)
MP facing (H_R) + 3bet → HJ facing 3bet (C_RR)
```

---

## 📋 CHANGELOG

### [1.3.0] - 2025-12-08
**🎨 Melhorias visuais, responsividade e histórico de ações**

#### Adicionado
- **Histórico de ações** - Painel mostrando sequência de ações do spot atual
- **Hover filtering** - Passar mouse na frequência filtra o range para mostrar apenas aquela ação
- **Card AULAS** - Nova seção na tela inicial (Em breve) com emoji 🔍
- **Layout responsivo** - Elementos se adaptam automaticamente ao tamanho da janela
- **Dealer button** na borda da mesa (entre posição e mesa)

#### Alterado
- **Gradiente dos combos**: Diagonal → Vertical (90deg)
- **Emojis da Home**: PKO=🎯, VANILLA=⚔️, Drill=🎮, AULAS=🔍
- **Cores padronizadas**: 
  - 1º Raise = Amarelo
  - 2º Raise = Verde  
  - 3º Raise = Roxo
  - 4º Raise+ = Rosa bebê
- **Hero destacado em amarelo** (não mais azul)
- **Seats com fundo sólido** (sem transparência)
- **Fonte dos stacks** aumentada em 50%
- **Mesa oval** redesenhada igual à referência
- **Posições distribuídas** simetricamente ao redor da mesa
- **Painel esquerdo** com background mais escuro para destaque

#### Arquivos Modificados
- `js/app.js` - Cores, hover filtering, histórico, gradiente vertical
- `css/styles.css` - Responsividade, cores, layout da mesa
- `index.html` - Painel de histórico, card AULAS, emojis

---

### [1.2.0] - 2025-12-08
**🔧 Correção completa da lógica de navegação + Mesa dinâmica**

#### Corrigido
- Navegação entre spots agora segue ordem correta do poker (EP→MP→HJ→CO→BTN→SB→BB)
- CO raise agora vai para BTN (não volta para EP)
- Lógica de histórico de ações corrigida para todos os stacks

#### Adicionado
- `updateTableDisplay()` - Atualiza mesa visualmente a cada navegação
- `getFoldedPositionsFromHistory()` - Marca posições que foldaram
- Sistema de cores unificado com `ACTION_COLORS` e `getActionCategory()`
- Label de stack no header da mesa (100BB)
- Estilo `.seat.acted` para posições que já agiram

#### Alterado
- `getNextSpotKey()` - Lógica reescrita para manter histórico correto
- `loadSpot()` - Agora chama `updateTableDisplay()`
- `showEmptySpot()` - Agora marca folded seats
- Mesa redesenhada para ficar igual à imagem de referência
- Botões de ação com gradientes e cores consistentes

---

### [1.1.0] - 2025-12-07
**🎨 Novo layout do visualizador**

#### Adicionado
- Layout de 3 colunas (Mesa | Range | Frequências)
- Mesa oval horizontal com posições corretas
- Dealer button no BTN
- Painel de stats (Fold/Call/Raise %)

---

### [1.0.0] - 2025-12-05
**🚀 Lançamento inicial**

#### Adicionado
- Tela Home com categorias
- Tela de seleção de fases
- Visualizador de ranges básico
- 668 spots VANILLA CEV Symmetric
- Deploy automático via Vercel

---

## 🚀 Deploy

### Automático (GitHub → Vercel)
```bash
git add .
git commit -m "feat: descrição da mudança"
git push origin main
# Deploy automático em ~30 segundos
```

### Manual (GitHub Desktop)
1. Abra GitHub Desktop
2. Veja as mudanças em "Changes"
3. Escreva um resumo no campo "Summary"
4. Clique "Commit to main"
5. Clique "Push origin"

---

## 🗺️ Roadmap

### Próximas Funcionalidades
- [ ] PKO (Progressive Knockout)
- [ ] Drill Mode (treino)
- [ ] AULAS (conteúdo educacional)
- [ ] CEV Diamond Symmetric
- [ ] Fases por % do Field (75%, 50%, 40%, Bolha, etc.)
- [ ] Final Table (9-handed → HU)
- [ ] ICM integrado

### Melhorias Planejadas
- [ ] Responsividade mobile completa
- [ ] Exportar ranges como imagem
- [ ] Histórico de navegação visual (breadcrumb)
- [ ] Filtros por tipo de mão

---

## 🔧 Contexto para Novos Chats

Se você está continuando este projeto em um novo chat, aqui está o que precisa saber:

### Arquivos Principais
1. **`js/app.js`** - Toda a lógica JavaScript
2. **`css/styles.css`** - Todos os estilos
3. **`index.html`** - Estrutura HTML (3 telas)
4. **`data/spots.js`** - Dados dos 668 spots (~9MB)

### Funções Críticas em app.js
- `selectPosition(pos)` - Inicia navegação clicando em uma posição
- `executeAction(idx)` - Executa ação (fold, call, raise)
- `getNextSpotKey(key, action)` - Calcula próximo spot
- `loadSpot(key)` - Carrega spot e atualiza UI
- `updateTableDisplay(key)` - Atualiza mesa (hero, folded)
- `updateHistory()` - Atualiza painel de histórico de ações
- `getActionCategory(action, idx, stack)` - Retorna categoria da ação para cor
- `highlightAction(idx)` / `clearHighlight()` - Hover filtering nas frequências
- `updateRangeGridFiltered(idx)` - Mostra apenas uma ação no grid

### Estrutura dos Spots (spots.js)
```javascript
{
  "100BB_U_R": {
    "p": 0,           // posição (0=EP, 1=MP, etc.)
    "a": [            // ações disponíveis
      {"type": "F", "amount": 0},
      {"type": "R", "amount": 250000}  // 2.5BB (amount/100000)
    ],
    "h": {            // hands
      "AA": {"played": [0, 1], "evs": [0, 1.5], "weight": 1},
      ...
    }
  }
}
```

### Padrão de Navegação
- RFI spots: `_R`, `_F`, `_FF`, `_FFF`, `_FFFF`, `_FFFFF`, `_FFFFFC`
- Facing raise: histórico + ação (ex: `R` + `F` = `RF`)
- Sempre avança para próxima posição, nunca volta

### Sistema de Cores (ACTION_COLORS)
```javascript
FOLD:    '#4a5568'  // Cinza
CALL:    '#00bfff'  // Ciano
RAISE_1: '#ffff00'  // Amarelo (1º raise)
RAISE_2: '#00ff00'  // Verde (2º raise)
RAISE_3: '#9333ea'  // Roxo (3º raise)
RAISE_4: '#f9a8d4'  // Rosa bebê (4º raise+)
ALLIN:   '#dc2626'  // Vermelho
```

---

## 📞 Comandos Úteis

```bash
# Clonar repositório
git clone https://github.com/blueredjack/cerebro.git

# Testar localmente
# Abrir index.html no navegador ou usar Live Server no VS Code

# Ver estrutura
ls -la

# Verificar sintaxe JS
node --check js/app.js
```

---

**Última atualização:** 2025-12-08 | **Versão:** 1.3.0
