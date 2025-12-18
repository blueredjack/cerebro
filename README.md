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
```bash
git add .
git commit -m "feat: sua mensagem"
git push origin main
```
Deploy automático em ~30 segundos → [cerebro-brown-beta.vercel.app](https://cerebro-brown-beta.vercel.app)

---

## 📊 Status Atual

| Item | Valor |
|------|-------|
| **Versão** | 2.1.0 |
| **Última Atualização** | 2025-12-18 |
| **Status** | ✅ Online |
| **Spots 7-MAX** | 829 |
| **Spots HU** | 200+ |
| **Stacks** | 3BB - 100BB (19 níveis) |
| **Modos Disponíveis** | VANILLA (CEV Symmetric), HU |

---

## 📁 Estrutura do Projeto

```
cerebro/
├── index.html          # Página principal
├── css/
│   └── styles.css      # Estilos (dark theme, responsivo)
├── js/
│   └── app.js          # Lógica da aplicação
├── data/
│   ├── spots.js        # Dados 7-MAX (~12MB, 829 spots)
│   └── spots_hu.js     # Dados HU (~453KB, 200+ spots)
├── .gitignore
├── vercel.json
└── README.md
```

---

## 🎯 Funcionalidades

### Tela Home
- [x] Logo animado CEREBRO
- [x] Cards de categoria (PKO, VANILLA, Drill, AULAS)
- [x] VANILLA ativo, outros "Em breve"

### Visualizador 7-MAX
- [x] Mesa 7-max com posições clicáveis
- [x] Badges de ação (OPEN, 3BET, 4BET, FOLD, etc.)
- [x] Range grid 13x13 com cores dinâmicas
- [x] Navegação por sequência de ações
- [x] Modo Melhor EV (GTO)
- [x] Modo Exploit com ajuste de EV
- [x] Painel de frequências com hover filtering
- [x] Painel de histórico de ações
- [x] Detalhes de EV por mão
- [x] Barra de stacks (3BB - 100BB)

### Visualizador HU (Heads-Up)
- [x] Mesa HU com SB e BB
- [x] Escala específica HU (40M)
- [x] Navegação por path
- [x] Modo Melhor EV

---

## 🎨 Sistema de Cores

### Ações Disponíveis (por posição)
| Ação | Cor | Hex |
|------|-----|-----|
| Fold | Cinza | `#4a5568` |
| Call/Limp | Azul | `#3b82f6` |
| 1º Raise | Amarelo | `#ffff00` |
| 2º Raise | Verde | `#00ff00` |
| 3º Raise | Roxo | `#9333ea` |
| 4º+ Raise | Rosa | `#f9a8d4` |
| All-in | Vermelho | `#dc2626` |

**Nota:** A contagem de raises **reinicia para cada posição**. Exemplo:
- CO abre → Amarelo (1º raise do CO)
- BTN 3bet → Amarelo (1º raise do BTN)
- CO 4bet → Verde (2º raise do CO)

### Badges na Mesa (histórico da mão)
| Badge | Cor | Descrição |
|-------|-----|-----------|
| FOLD | Cinza | Jogador foldou |
| CALL | Azul | Call ou check |
| OPEN | Amarelo | Primeiro raise da mão |
| 3BET | Verde | Segundo raise da mão |
| 4BET | Roxo | Terceiro raise da mão |
| 5BET+ | Rosa | Quarto+ raise da mão |
| ALL-IN | Vermelho | All-in (≥90% stack) |

---

## 🔄 Navegação

### Lógica de Navegação
1. Busca por **sequência exata** de ações (tipo + valor)
2. Se não encontrar exato, busca **mais próximo** (mesmo tipo)
3. Indicador ⚠ quando não há continuação disponível

### Tolerância de Sizing
- Match exato: 5% de tolerância
- Match próximo: aceita qualquer sizing do mesmo tipo

---

## 📋 CHANGELOG

### [2.1.0] - 2025-12-18
**🔧 Correções críticas de navegação e dados**

#### Corrigido
- **Erro de sintaxe** no app.js que impedia login
- **Spot CO RFI** - removidos dados incorretos (Call, múltiplos sizings)
- **Sizings RFI** - padronizado Open 2.5BB para todas as posições
- **Sistema de cores** - contagem de raises por posição (não por histórico)
- **Tolerância de navegação** - busca por tipo de ação quando sizing não bate

#### Alterado
- `actionHasContinuation()` - verifica por tipo de ação
- `findSpotBySequence()` - aceita sizing mais próximo
- `getActionCategory()` - conta raises apenas nas ações do spot

---

### [2.0.1] - 2025-12-17
**📦 Estrutura e otimizações**

#### Corrigido
- Estrutura de diretórios organizada
- Caminhos dos arquivos padronizados

#### Adicionado
- vercel.json com cache otimizado
- .gitignore

---

### [2.0.0] - 2025-12-12
**🎯 Badges de ação e navegação por sequência**

#### Adicionado
- Badges de ação acima de cada posição
- Navegação por sequência (diferencia múltiplos sizings)
- Suporte a agregação de dados

---

### [1.5.0] - 2025-12-12
**🃏 Visualizador HU**

#### Adicionado
- Tela HU dedicada
- Escala HU (40M)
- Navegação HU específica

---

## 📊 Estrutura dos Dados

### Formato dos Spots
```javascript
{
  "100BB_B_FFF": {
    "p": 3,           // posição (3=CO)
    "s": [            // sequência anterior
      {"player": 0, "type": "F", "amount": 0},
      {"player": 1, "type": "F", "amount": 0},
      {"player": 2, "type": "F", "amount": 0}
    ],
    "a": [            // ações disponíveis
      {"type": "F", "amount": 0},
      {"type": "R", "amount": 250000}  // Open 2.5BB
    ],
    "h": {            // hands
      "AA": {"played": [0, 1], "evs": [0, 5.59], "weight": 1}
    }
  }
}
```

### Escala de Valores
| Modo | 1 BB |
|------|------|
| 7-MAX | 100,000 |
| HU | 40,000,000 |

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

## 🔧 Funções Principais

### Navegação
- `selectPosition(pos)` - Inicia navegação RFI
- `executeAction(idx)` - Executa ação e navega
- `findSpotBySequence()` - Busca spot por sequência
- `actionHasContinuation()` - Verifica se existe continuação

### Display
- `updateDisplay()` - Atualiza toda a UI
- `updateRangeGrid()` - Atualiza grid de ranges
- `updateActionBadges()` - Atualiza badges na mesa
- `getActionCategory()` - Determina cor da ação

### Modos de Análise
- `toggleMelhorEV()` - Ativa/desativa GTO
- `toggleExploit()` - Ativa/desativa Exploit

---

## 🗺️ Roadmap

### Próximas Funcionalidades
- [ ] PKO (Progressive Knockout)
- [ ] Drill Mode (treino)
- [ ] AULAS (conteúdo educacional)
- [ ] CEV Diamond Symmetric
- [ ] Final Table / ICM

### Melhorias Planejadas
- [ ] Mobile responsivo completo
- [ ] Exportar ranges como imagem
- [ ] Breadcrumb de navegação

---

## 🚀 Deploy

```bash
git add .
git commit -m "feat: descrição"
git push origin main
# Deploy automático em ~30 segundos
```

---

**Última atualização:** 2025-12-18 | **Versão:** 2.1.0
