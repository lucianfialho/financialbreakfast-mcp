# Branch Protection Setup

Para configurar proteção da branch `main` no GitHub:

## 🔒 Configurações Recomendadas

### 1. Acessar Settings
1. Vá para o repositório no GitHub
2. **Settings** → **Branches**
3. **Add rule** para `main`

### 2. Proteções Obrigatórias

✅ **Require a pull request before merging**
- ✅ Require approvals: `1`
- ✅ Dismiss stale PR approvals when new commits are pushed
- ✅ Require review from code owners

✅ **Require status checks to pass before merging**
- ✅ Require branches to be up to date before merging
- **Required checks:**
  - `test (🧪 Test & Validate)`
  - `security (🔒 Security Scan)` (para PRs)

✅ **Require conversation resolution before merging**

✅ **Require signed commits** (opcional, mas recomendado)

✅ **Require linear history**

✅ **Include administrators** (força as regras para admins também)

### 3. Configurações Avançadas

✅ **Allow force pushes** → ❌ **DESABILITADO**

✅ **Allow deletions** → ❌ **DESABILITADO**

## 🚀 Workflow de Desenvolvimento

### Para desenvolvedores:

1. **Criar branch:**
```bash
git checkout -b feature/nova-funcionalidade
```

2. **Fazer alterações e commit:**
```bash
git add .
git commit -m "feat: adiciona nova funcionalidade"
```

3. **Push e PR:**
```bash
git push origin feature/nova-funcionalidade
# Criar PR no GitHub
```

4. **Após aprovação:** Merge é feito automaticamente

### Para releases:

1. **Atualizar versão:**
```bash
npm version patch  # ou minor/major
```

2. **Commit da versão:**
```bash
git add .
git commit -m "chore: bump version to v2.0.1"
```

3. **Push:**
```bash
git push origin main
```

4. **Tag automática:** CI cria tag e triggera release

## 🤖 Automações Ativas

- ✅ **CI/CD** roda em todas as branches
- ✅ **Security scan** em PRs
- ✅ **Auto-tagging** quando versão muda na main
- ✅ **Auto-release** quando tag é criada
- ✅ **DXT build** automático

## 🔧 Comandos Administrativos

Para emergências (admins only):

```bash
# Força push (quebra proteção temporariamente)
git push --force-with-lease origin main

# Release manual
gh workflow run release.yml -f tag=v2.0.1
```

⚠️ **Nota:** Mesmo admins devem seguir o workflow normal na maioria dos casos.