# 🧠 CEREBRO - Visualizador de Ranges MTT

Sistema de visualização de ranges para MTT (Multi-Table Tournament) de poker.

## 📊 Estatísticas

- **668 spots** de decisão
- **17 stacks** diferentes (5BB - 100BB)
- **7 posições** (EP, MP, HJ, CO, BTN, SB, BB)
- Mesa **7-max**

## 🚀 Deploy

- **Repositório**: github.com/blueredjack/cerebro
- **URL**: cerebro-amber.vercel.app (ou cerebro-brown-beta.vercel.app)

## 📁 Estrutura

```
cerebro/
├── index.html          # Página principal (tudo integrado)
├── data/
│   └── spots.js        # Dados dos spots (668 spots, ~9MB)
└── README.md
```

## 🎨 Layout Visual

O visualizador foi redesenhado com:

- **Layout 3 colunas**: Mesa | Grid de Ranges | Frequências
- **Header**: Logo animado + stats (668/17/7) + menu
- **Stack Selector**: 17 stacks (5BB-100BB)
- **Mesa 7-MAX**: Oval com glow cyan, dealer button, click-to-RFI
- **Range Grid**: 13x13 com cores por frequência
- **Ações**: Botões com borda cyan indicando próximo nó
- **Breadcrumb**: Caminho de navegação colorido

## 🎯 Funcionalidades

1. **Home**: Seleção de modo (VANILLA disponível)
2. **Fases**: CEV Symmetric com 668 spots
3. **Visualizador**:
   - Mesa interativa 7-max
   - Grid de ranges 13x13 com cores dinâmicas
   - Navegação entre spots (RFI → vs 3bet → vs 4bet, etc.)
   - Frequências por ação
   - Detalhes de EV por mão
   - Botão "Voltar" para navegar no histórico

## 📋 CHANGELOG

### [2.0.0] - 2024-12-05

#### Alterado
- **Layout completo** redesenhado para corresponder exatamente à referência visual
- **Cores**: Fundo #0a0e17, Fold #3d4654, Raise coral #e85555, Raise alt #d4a017
- **Fontes**: Orbitron (logo) + Rajdhani (corpo)
- **Mesa**: Oval menor (180x100px), borda 2px cyan com glow
- **Grid**: Gap 2px, células com border-radius 3px
- **Actions**: Gradientes específicos, borda cyan para has-node

#### Adicionado
- **Breadcrumb colorido** mostrando caminho de navegação
- **Detalhes da mão** com EVs por ação
- **Responsivo** básico para telas menores

#### Mantido
- Toda lógica de navegação entre spots
- Cálculo de frequências e stats
- Integração com 668 spots do SPOTS_DATA

## 🛠️ Tecnologias

- HTML5 (arquivo único)
- CSS3 (inline, sem frameworks)
- JavaScript Vanilla
- Google Fonts (Orbitron, Rajdhani)

## 📝 Como Atualizar

1. Edite `index.html` no GitHub
2. Vercel atualiza automaticamente
3. Documente alterações neste README

---

**Projeto privado** • Desenvolvido com Claude (Anthropic)
