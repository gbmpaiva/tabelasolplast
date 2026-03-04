# Tabela de Preços — Next.js App

## Instalação e execução

```bash
# 1. Instalar dependências
npm install

# 2. Rodar em desenvolvimento
npm run dev

# 3. Abrir no navegador
# http://localhost:3000
```

## Estrutura do projeto

```
tabela-precos/
├── app/
│   ├── api/
│   │   ├── conditions/route.js     → API de Condições (proxy para TOTVS)
│   │   ├── deadlines/route.js      → API de Prazos (proxy para TOTVS)
│   │   ├── sale-types/route.js     → API de Tipos de Venda (proxy para TOTVS)
│   │   └── products/route.js       → API de Produtos (proxy para TOTVS)
│   ├── globals.css                 → Estilos globais
│   ├── layout.jsx                  → Layout raiz
│   └── page.jsx                    → Página principal (tela única)
├── package.json
├── next.config.js
├── tailwind.config.js
└── postcss.config.js
```

## Funcionalidades

- ✅ **Condições** — lista com checkboxes múltiplos, mostra multiplicador
- ✅ **Prazos** — lista com checkboxes múltiplos, mostra fator
- ✅ **Tipo de Venda** — dropdown de seleção única
- ✅ **Produtos** — grid com:
  - Busca por código de barras
  - Modal de pesquisa avançada (por código, descrição ou cód. barras)
  - Drag & drop para reordenar
  - Persistência automática no localStorage
  - Remoção individual
- ✅ **Barra de resumo** — mostra as seleções ativas na parte inferior
- ✅ **Proxy de API** — todas as chamadas passam pelo servidor Next.js (evita CORS)

## Autenticação

As credenciais `admin:6JGtD3QE` estão configuradas nos arquivos de rota da API (`/app/api/*/route.js`).
Para alterar, edite a constante `AUTH` nesses arquivos.
