# 🚀 Guia de Deploy - CEREBRO

## Pré-requisitos

- Git instalado
- Conta no GitHub
- Conta no Vercel vinculada ao GitHub

---

## 📦 Deploy via GitHub + Vercel

### 1️⃣ Primeira vez (Setup Inicial)

```bash
# Navegar até a pasta do projeto
cd cerebro

# Inicializar repositório Git (se ainda não iniciou)
git init

# Adicionar remote do GitHub
git remote add origin https://github.com/blueredjack/cerebro.git

# Adicionar todos os arquivos
git add .

# Fazer primeiro commit
git commit -m "feat: setup inicial CEREBRO v2.0.1"

# Push para o GitHub
git push -u origin main
```

### 2️⃣ Conectar com Vercel

1. Acesse [vercel.com](https://vercel.com)
2. Click em "Import Project"
3. Selecione o repositório `cerebro`
4. Configure:
   - **Framework Preset:** Other
   - **Root Directory:** `./`
   - **Build Command:** (deixe vazio)
   - **Output Directory:** (deixe vazio)
5. Click em "Deploy"

### 3️⃣ Atualizações Futuras

```bash
# Adicionar mudanças
git add .

# Commit com mensagem descritiva
git commit -m "feat: adicionar novos spots"
# ou
git commit -m "fix: corrigir navegação HU"

# Push para GitHub (deploy automático)
git push origin main
```

**⏱️ Deploy leva ~30 segundos após o push**

---

## 🔧 Comandos Git Úteis

### Ver status dos arquivos
```bash
git status
```

### Ver histórico de commits
```bash
git log --oneline
```

### Desfazer mudanças não commitadas
```bash
git checkout -- arquivo.js
```

### Ver diferenças antes de commitar
```bash
git diff
```

---

## 📝 Convenções de Commit

Use prefixos semânticos:

- `feat:` - Nova funcionalidade
- `fix:` - Correção de bug
- `docs:` - Mudanças em documentação
- `style:` - Mudanças de estilo/formatação
- `refactor:` - Refatoração de código
- `perf:` - Melhorias de performance
- `test:` - Adição de testes
- `chore:` - Tarefas de manutenção

**Exemplos:**
```bash
git commit -m "feat: adicionar modo PKO"
git commit -m "fix: corrigir badge all-in no HU"
git commit -m "docs: atualizar README com novos spots"
```

---

## 🐛 Troubleshooting

### Build falha no Vercel
1. Verificar console do Vercel para erro específico
2. Confirmar que todos os arquivos foram commitados:
   ```bash
   git status
   ```
3. Verificar se `vercel.json` está correto

### Arquivos grandes (spots.js)
- Git suporta até 100MB por arquivo
- `spots.js` (~12MB) está OK
- Se crescer muito, considerar:
  - Compressão gzip
  - Split em múltiplos arquivos
  - Usar GitHub LFS

### Cache de navegador
- Se mudanças não aparecem, limpar cache:
  - Chrome: `Ctrl + Shift + R`
  - Firefox: `Ctrl + F5`
  - Safari: `Cmd + Shift + R`

---

## ✅ Checklist de Deploy

- [ ] Testar localmente abrindo `index.html`
- [ ] Verificar senha de acesso (`cerebro2025`)
- [ ] Verificar console do navegador (F12) para erros
- [ ] Testar navegação 7-MAX
- [ ] Testar navegação HU
- [ ] Testar modo Melhor EV
- [ ] `git add .`
- [ ] `git commit -m "mensagem"`
- [ ] `git push origin main`
- [ ] Aguardar deploy automático (~30s)
- [ ] Testar em produção: [cerebro-brown-beta.vercel.app](https://cerebro-brown-beta.vercel.app)

---

**Última atualização:** 2025-12-17
