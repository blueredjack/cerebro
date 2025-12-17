# 🧠 CEREBRO - Visualizador de Ranges MTT

Sistema avançado de visualização de ranges para MTT (Multi-Table Tournament) de poker.

**🌐 URL Produção:** [cerebro-brown-beta.vercel.app](https://cerebro-brown-beta.vercel.app)  
**📦 Repositório:** [github.com/blueredjack/cerebro](https://github.com/blueredjack/cerebro)

---

## 🚀 Quick Start

### Desenvolvimento Local
1. Clone o repositório
2. Abra `index.html` diretamente no navegador
3. Senha de acesso: `cerebro2025`

### Deploy no Vercel via GitHub
1. Faça push das alterações:
```bash
git add .
git commit -m "feat: sua mensagem"
git push origin main
```
2. Deploy automático em ~30 segundos
3. Acesse: [cerebro-brown-beta.vercel.app](https://cerebro-brown-beta.vercel.app)

---

## 📊 Status Atual

| Item | Valor |
|------|-------|
| **Versão** | 2.0.1 |
| **Última Atualização** | 2025-12-17 |
| **Status** | ✅ Online |
| **Spots 7-MAX** | 700+ |
| **Spots HU** | 200+ |
| **Modos Disponíveis** | VANILLA (CEV Symmetric), HU |

---

## 📁 Estrutura do Projeto

```
cerebro/
├── index.html          # Página principal (Home, Fases, 7-MAX, HU)
├── css/
│   └── styles.css      # Estilos (dark theme, responsivo, mesa dinâmica)
├── js/
│   └── app.js          # Lógica da aplicação
├── data/
│   ├── spots.js        # Dados 7-MAX (~12MB, 700+ spots)
│   └── spots_hu.js     # Dados HU (~453KB, 200+ spots)
├── .gitignore          # Arquivos ignorados pelo Git
├── vercel.json         # Configuração de deploy Vercel
└── README.md           # Documentação e changelog
```

---

## 🎯 Funcionalidades Implementadas

### Tela Home
- [x] Logo animado CEREBRO
- [x] Cards de categoria (PKO 🎯, VANILLA ⚔️, Drill 🎮, AULAS 🔍)
- [x] VANILLA ativo, outros "Em breve"

### Tela Seleção de Fase
- [x] CEV Symmetric 7-MAX - ATIVO
- [x] Heads-Up (HU) - ATIVO
- [x] Fases futuras listadas (SOON)

### Visualizador 7-MAX
- [x] Mesa 7-max com posições clicáveis
- [x] **Badges de ação** acima de cada posição (OPEN, 3BET, 4BET, FOLD, etc.)
- [x] Range grid 13x13 com cores dinâmicas
- [x] **Navegação por sequência** (diferencia múltiplos sizings de raise)
- [x] **Modo Melhor EV** - mostra apenas a ação de maior EV
- [x] **Modo Exploit** - ajusta ranges com bonus de EV
- [x] Painel de frequências com hover filtering
- [x] Painel de histórico de ações
- [x] Detalhes de EV por mão
- [x] Barra de stacks (5BB - 100BB)
- [x] Dealer button na borda da mesa

### Visualizador HU (Heads-Up)
- [x] Mesa HU com SB e BB
- [x] Badges de ação (OPEN, 3BET, 4BET, ALL-IN)
- [x] Escala específica HU (40M vs 100K do 7-MAX)
- [x] Navegação por path (U_R, H_C, H_R, U_CR, U_RR)
- [x] Modo Melhor EV
- [x] Painel de histórico de ações
- [x] Detecção automática de All-in (≥90% stack)

---

## 🏷️ Badges de Ação

Cada posição mostra a ação tomada com badge colorido:

| Ação | Cor | Exemplo |
|------|-----|---------|
| FOLD | Cinza | `FOLD` |
| OPEN | Amarelo | `OPEN 2.5` |
| CALL | Ciano | `CALL 8.75` |
| 3BET | Verde | `3BET 11.25` |
| 4BET | Laranja | `4BET 28` |
| 5BET+ | Vermelho | `5BET+ 60` |
| ALL-IN | Vermelho pulsante | `ALL-IN` |

---

## 🎨 Sistema de Cores

| Ação | Cor | Hex | Uso |
|------|-----|-----|-----|
| Fold | Cinza | `#4a5568` | Grid e botões |
| Check | Azul | `#3b82f6` | Botões |
| Call | Ciano | `#00bfff` | Grid e botões |
| 1º Raise | Amarelo | `#ffff00` | Open raise |
| 2º Raise | Verde | `#00ff00` | 3bet |
| 3º Raise | Roxo | `#9333ea` | 4bet |
| 4º Raise+ | Rosa | `#f9a8d4` | 5bet+ |
| All-in | Vermelho | `#dc2626` | ≥90% stack |

---

## 🔄 Navegação por Sequência

A navegação usa a **sequência completa de ações** (tipo + valor) para encontrar o próximo spot:

```javascript
// Exemplo: SB tem opções de 3bet 8.75BB e 11.25BB
// Ao clicar em cada um, navega para spots DIFERENTES do BB

SB escolhe Raise 8.75BB:
  Sequência: [F, F, F, F, R 2.5BB, R 8.75BB]
  → Encontra: 100BB_X_FFFFRR (com 3bet 8.75BB)

SB escolhe Raise 11.25BB:
  Sequência: [F, F, F, F, R 2.5BB, R 11.25BB]
  → Encontra: spot diferente ou "não disponível"
```

### Funções de Navegação
- `findSpotBySequence()` - Busca spot pela sequência exata
- `sequencesMatch()` - Compara sequências com tolerância de 5%
- `executeAction()` - Executa ação e navega

---

## 📋 CHANGELOG

### [2.0.1] - 2025-12-17
**🔧 Correções de estrutura e otimizações de deploy**

#### Corrigido
- **Estrutura de diretórios** - Arquivos organizados em `css/`, `js/`, `data/`
- **Caminhos dos arquivos** - HTML agora aponta corretamente para subdiretórios
- **Nomenclatura de arquivos** - `spots.js` e `spots_hu.js` padronizados

#### Adicionado
- **vercel.json** - Configuração otimizada de cache e headers
- **.gitignore** - Exclusão de arquivos desnecessários do repositório
- **Quick Start** - Guia rápido de desenvolvimento e deploy no README

---

### [2.0.0] - 2025-12-12
**🎯 Badges de ação, navegação por sequência e melhorias críticas**

#### Adicionado
- **Badges de ação** acima de cada posição na mesa
  - Mostra: FOLD, OPEN X, 3BET X, 4BET X, 5BET+ X, ALL-IN
  - Cores diferenciadas por tipo de ação
  - Animação pulsante no ALL-IN
- **Navegação por sequência** - diferencia múltiplos sizings de raise
  - `findSpotBySequence()` - busca por sequência exata
  - `sequencesMatch()` - comparação com tolerância de 5%
- **Suporte a agregação de dados** - spots podem vir de diferentes uploads/datas

#### Corrigido
- Navegação agora diferencia corretamente entre raises de tamanhos diferentes
- Mesma ação (R) com valores diferentes vai para spots diferentes

---

### [1.5.0] - 2025-12-12
**🃏 Visualizador HU (Heads-Up) completo**

#### Adicionado
- **Tela HU** - visualizador dedicado para Heads-Up
- **Escala HU** - 40M (vs 100K do 7-MAX)
- **Navegação HU** - paths específicos (U_R, H_C, H_R, U_CR, U_RR)
- **Cores HU** - sistema de cores adaptado
- **Modo Melhor EV HU** - toggle independente
- **Histórico HU** - painel de ações separado

---

### [1.4.0] - 2025-12-11
**⚡ Modo Melhor EV e Exploit**

#### Adicionado
- **Modo Melhor EV** - mostra apenas a ação de maior EV para cada mão
- **Modo Exploit** - ajusta EVs com bonus configurável
- Toggle buttons para ativar/desativar modos
- Indicador visual quando modos estão ativos

---

### [1.3.0] - 2025-12-08
**🎨 Melhorias visuais, responsividade e histórico de ações**

#### Adicionado
- Histórico de ações - Painel mostrando sequência do spot
- Hover filtering - Mouse na frequência filtra o range
- Layout responsivo
- Dealer button na borda da mesa

---

### [1.2.0] - 2025-12-08
**🔧 Correção da lógica de navegação**

#### Corrigido
- Navegação segue ordem correta (EP→MP→HJ→CO→BTN→SB→BB)
- Lógica de histórico corrigida

---

### [1.1.0] - 2025-12-07
**🎨 Novo layout do visualizador**

- Layout de 3 colunas
- Mesa oval horizontal
- Dealer button no BTN

---

### [1.0.0] - 2025-12-05
**🚀 Lançamento inicial**

- Tela Home com categorias
- Visualizador de ranges básico
- 668 spots VANILLA CEV Symmetric
- Deploy via Vercel

---

## 🔧 Estrutura dos Dados

### Formato dos Spots
```javascript
{
  "100BB_D_FFFFR": {
    "p": 5,           // posição (5=SB)
    "s": [            // sequência de ações anteriores
      {"player": 0, "type": "F", "amount": 0},
      {"player": 1, "type": "F", "amount": 0},
      {"player": 2, "type": "F", "amount": 0},
      {"player": 3, "type": "F", "amount": 0},
      {"player": 4, "type": "R", "amount": 250000}  // BTN open 2.5BB
    ],
    "a": [            // ações disponíveis
      {"type": "F", "amount": 0},
      {"type": "C", "amount": 200000},
      {"type": "R", "amount": 875000},   // 3bet 8.75BB
      {"type": "R", "amount": 1125000},  // 3bet 11.25BB
      {"type": "R", "amount": 10000000}  // All-in
    ],
    "h": {            // hands
      "AA": {"played": [0, 0, 0.3, 0.7, 0], "evs": [...], "weight": 1}
    }
  }
}
```

### Escalas
| Modo | Escala | 1 BB |
|------|--------|------|
| 7-MAX | 100,000 | 100000 |
| HU | 40,000,000 | 40000000 |

### Posições 7-MAX
| Letra | Posição | Índice |
|-------|---------|--------|
| U | EP (UTG) | 0 |
| H | MP | 1 |
| C | HJ | 2 |
| B | CO | 3 |
| S | BTN | 4 |
| D | SB | 5 |
| X | BB | 6 |

---

## 🗺️ Roadmap

### Próximas Funcionalidades
- [ ] PKO (Progressive Knockout)
- [ ] Drill Mode (treino)
- [ ] AULAS (conteúdo educacional)
- [ ] CEV Diamond Symmetric
- [ ] Fases por % do Field
- [ ] Final Table
- [ ] ICM integrado

### Melhorias Planejadas
- [ ] Mobile responsivo completo
- [ ] Exportar ranges como imagem
- [ ] Breadcrumb de navegação
- [ ] Filtros por tipo de mão

---

## 🚀 Deploy

```bash
git add .
git commit -m "feat: descrição"
git push origin main
# Deploy automático em ~30 segundos
```

---

## 📞 Funções Críticas

### Navegação
- `selectPosition(pos)` - Inicia navegação RFI
- `executeAction(idx)` - Executa ação e navega
- `findSpotBySequence()` - Busca spot por sequência
- `loadSpot(key)` - Carrega spot e atualiza UI

### Display
- `updateDisplay()` - Atualiza toda a UI
- `updateActionBadges()` - Atualiza badges de ação
- `updateTableDisplay()` - Atualiza mesa (hero, folded)
- `updateHistory()` - Atualiza painel de histórico

### Modos
- `toggleMelhorEV()` - Ativa/desativa Melhor EV
- `toggleExploit()` - Ativa/desativa Exploit
- `getMelhorAcao(hand)` - Retorna melhor ação para mão

---

**Última atualização:** 2025-12-17 | **Versão:** 2.0.1
