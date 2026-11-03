<p align="center">
  <img src="public/calculadorass.png" alt="PDG Surebet Calculator" width="96" />
</p>

<h1 align="center">PDG Surebet Calculator</h1>

<p align="center">
  Calculadora de arbitragem esportiva (surebet) para calcular stakes e lucros de forma rápida e precisa.
</p>

<p align="center">
  <img alt="React" src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white" />
  <img alt="Vite" src="https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white" />
  <img alt="Tailwind CSS" src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white" />
  <img alt="Supabase" src="https://img.shields.io/badge/Supabase-3ECF8E?logo=supabase&logoColor=white" />
</p>

---

## Sobre o projeto

A **PDG Surebet Calculator** distribui o valor apostado entre várias casas de apostas para garantir o mesmo resultado em qualquer desfecho do evento. A partir de uma **aposta base** (casa e stake definidos por você), a calculadora encontra automaticamente a stake ideal de cada uma das outras entradas e mostra o lucro e o ROI de cada cenário.

## Funcionalidades

- **Várias entradas** — adicione quantas entradas forem necessárias e escolha qual delas é a aposta base.
- **Back e Lay** — suporte a apostas em exchanges, com cálculo automático da responsabilidade (liability) e da stake do apostador.
- **Ajustes por entrada**
  - Aumento de odd (%)
  - Comissão da exchange (%)
  - Cashback (%)
- **Freebets e recompensas**
  - Apostas feitas *com* freebet (sem custo de stake)
  - Apostas que *geram* freebet ou cashback, com condição de vitória, derrota ou sempre
  - Aposta sem risco (freebet devolvida em caso de derrota)
- **Divisão de stake** — divida uma entrada em várias apostas (ex.: mesma seleção em casas diferentes), agrupadas na mesma família.
- **Resumo financeiro** — investimento total, lucro por resultado e ROI global (calculado pelo pior cenário).
- **Compartilhamento** — gere um link curto e um QR Code com a operação completa, salvos no Supabase.
- **Layout flexível** — visualização em grade ou em lista, com cards que podem ser recolhidos.

## Tecnologias

| Camada         | Ferramenta                                                        |
| -------------- | ----------------------------------------------------------------- |
| Interface      | [React 19](https://react.dev) + [Vite](https://vite.dev)          |
| Estilo         | [Tailwind CSS 4](https://tailwindcss.com)                         |
| Ícones         | [lucide-react](https://lucide.dev)                                |
| QR Code        | [qrcode.react](https://github.com/zpao/qrcode.react)              |
| Banco de dados | [Supabase](https://supabase.com) (links de compartilhamento)      |
| Lint           | [Oxlint](https://oxc.rs)                                          |

## Como rodar localmente

### Pré-requisitos

- [Node.js](https://nodejs.org) 20 ou superior
- Um projeto no [Supabase](https://supabase.com) (necessário apenas para o compartilhamento)

### Instalação

```bash
git clone https://github.com/TulioNaves/calculadora-arbitragem-surebet.git
cd calculadora-arbitragem-surebet
npm install
```

### Variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
VITE_SUPABASE_URL=https://<seu-projeto>.supabase.co
VITE_SUPABASE_ANON_KEY=<sua-anon-key>
```

### Banco de dados (Supabase)

O compartilhamento usa uma tabela `saves`. Crie-a no SQL Editor do Supabase:

```sql
create table public.saves (
  id         text primary key,
  state      jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.saves enable row level security;

create policy "Leitura pública" on public.saves
  for select using (true);

create policy "Inserção pública" on public.saves
  for insert with check (true);
```

### Executando

```bash
npm run dev       # servidor de desenvolvimento
npm run build     # build de produção (gera a pasta dist/)
npm run preview   # pré-visualiza o build
npm run lint      # verifica o código com Oxlint
```

## Estrutura do projeto

```
├── public/                 # imagens e ícones estáticos
├── src/
│   ├── components/
│   │   └── CardVia.jsx     # card de cada entrada da operação
│   ├── App.jsx             # interface principal, resumo e compartilhamento
│   ├── engine.js           # motor de cálculo da arbitragem
│   ├── supabase.js         # cliente do Supabase
│   ├── main.jsx            # ponto de entrada do React
│   └── index.css           # estilos globais (Tailwind)
├── index.html
└── vite.config.js
```

## Como o cálculo funciona

Toda a matemática fica em [`src/engine.js`](src/engine.js), na função `calcularArbitragemAvancada(vias, indiceBase)`:

1. **Normaliza cada entrada** — calcula a odd efetiva considerando Back/Lay, aumento de odd, comissão e freebet.
2. **Agrupa as entradas** — divisões de stake ficam na mesma família da entrada principal.
3. **Define a constante de retorno** — a partir da aposta base (incluindo cashback e recompensas).
4. **Calcula as stakes das demais entradas** — para que todos os resultados retornem o mesmo valor, já descontando o cashback.
5. **Fecha o balanço** — lucro e ROI de cada resultado, investimento total e ROI global com base no pior cenário.

## Compartilhamento

Ao clicar em **Compartilhar**, o estado atual (entradas, aposta base e layout) é salvo no Supabase com um ID curto, e é gerado um link no formato:

```
https://<seu-dominio>/?s=ABC123
```

Quem abrir o link recebe a operação já preenchida, e o parâmetro é removido da URL logo após o carregamento.

## Autor

Desenvolvido por **Túlio José Oliveira Naves** — [@TulioNaves](https://github.com/TulioNaves)
