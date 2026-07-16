# Finance+ — Handoff

**Fecha:** 2026-07-16  
**Proyecto:** App de finanzas personales (Prototipo 2)  
**Repo:** https://github.com/bernytorito22-arch/finance-plus  
**Deploy:** Cloudflare Pages (proyecto `finance-plus`) — misma cuenta que Via Ditalia (`viaditalia`), proyectos aislados. Render queda como rollback de emergencia (`render.yaml` deprecado).

---

## Resumen

Finance+ es una PWA React para control de gastos personales con ciclos financieros personalizables, vista mensual/semanal, export JSON y modo demo.

**Iteración actual (2026-07-16):** movimientos **gasto | ingreso**, saldos **tarjeta/efectivo**, ingresos desde **+**, detalle/edición en Semanal, y **migración a Cloudflare Pages** (sin cold start de Render).

**Estado:** Código migrado a CF Pages en rama local `main` (4 commits sin push). Verificado: `npm test` (24), `npm run lint`, `npm run build`, `preview:cf` + `POST /api/analyze`. **Deploy a producción pendiente:** requiere `wrangler login` o `CLOUDFLARE_API_TOKEN` en tu máquina.

---

## Features de esta iteración

### 1. Saldos tarjeta / efectivo (Fase 1)

| Decisión | Valor |
|----------|-------|
| Modelo | `wallets: { tarjeta, efectivo }` + `walletSplit` persistidos en snapshot |
| UI | Filas Tarjeta/Efectivo debajo de Ingresos/Gastos en **Inicio** |
| Inicialización | Reparto en modal de presupuesto (`tarjeta + efectivo = ingreso`) |
| Regla C | Editar ingreso a mitad de mes **no** mueve saldos si ya hay dinero |
| Gastos | Restan del método elegido; **bloquean** si no hay saldo |
| Presupuesto | Puede quedar negativo; tarjeta/efectivo no |
| Ajuste manual | Tap en saldo → editar (≥ 0), sin crear movimiento |
| Reiniciar ciclo | Borra movimientos del ciclo **y** `wallets = walletSplit` |

### 2. Ingresos en "+" (Fase 2)

| Decisión | Valor |
|----------|-------|
| UI | Toggle **Gasto** \| **Ingreso** en tab **+** |
| Campos ingreso | Monto + destino (tarjeta/efectivo); nombre opcional (default "Ingreso") |
| Efecto | Suma al saldo del método; **no** toca `budget.income` ni `totalBudget` |
| Lista | Misma lista en **Semanal**: gastos `-$…`, ingresos `+$…` verde |
| Totales | Presupuesto semanal y categorías **solo cuentan gastos** |

### 3. Detalle y edición (Fase 3)

| Decisión | Valor |
|----------|-------|
| Dónde | Solo **Semanal** — tap en fila (no el basurero) |
| Componente | `TransactionDetailModal.tsx` |
| Editar | Monto, nombre, categoría (gasto), método, descripción |
| Lógica | `applyEdit` = `revertTransaction` + `applyTransaction` |
| Borrar | Devuelve saldo (gasto) o resta (ingreso); bloquea si dejaría saldo negativo |

---

## Arquitectura

```
App.tsx (estado global)
├── expenses (movimientos: type gasto | ingreso)
├── budget, weekBudgets, activeWeek, financeCycleConfig
├── wallets, walletSplit
├── dataMode: "demo" | "personal"
├── persistUserSnapshot → localStorage v5 (modo personal)
└── pestañas:
    ├── MonthlyDashboard (saldos + reparto presupuesto)
    ├── WeeklyTracking (lista mixta + detalle/editar)
    ├── AddExpense (gasto | ingreso)
    └── AnalysisDetailed (export + reiniciar ciclo)
```

### Lógica de saldos (`src/utils/wallet.ts`)

| Función | Rol |
|---------|-----|
| `canAfford` | ¿Hay saldo para un gasto? |
| `applyTransaction` | Aplica gasto (resta) o ingreso (suma) |
| `revertTransaction` | Revierte al borrar/editar |
| `applyEdit` | Revert + apply en edición |
| `initWalletsFromSplit` | Inicializa wallets desde reparto |
| `isValidSplit` | Valida `tarjeta + efectivo === ingreso` |
| `getTransactionType` | Default `"gasto"` si ausente |
| `getPaymentMethod` | Default `"efectivo"` si ausente |

**Tests:** `src/utils/wallet.test.ts` — 20 tests (Vitest). Comando: `npm test`.

### Persistencia (`src/utils/storage.ts`)

- **Versión:** `STORAGE_VERSION = "5"`
- **Nuevas keys:** `finanzapro_user_wallets`, `finanzapro_user_wallet_split`
- **Migración v4→v5:** si faltan, `walletSplit = { tarjeta: 0, efectivo: budget.income }` y mismo valor en `wallets`
- Keys existentes sin cambio: expenses, budget, week budgets, active week, cycle config, data mode

### Tipos (`src/types.ts`)

- `TransactionType`, `Wallets`, `WalletSplit`, `MutationResult`
- `Expense.type?: "gasto" | "ingreso"`
- `MonthlyExportPayload` incluye `wallets` y `walletSplit`

### Reinicio de ciclo (`src/utils/resetCycleData.ts` + `App.tsx`)

1. `removeExpensesInCycle()` — elimina movimientos del ciclo (mismo rango que export)
2. `setWallets(initWalletsFromSplit(walletSplit))` — rellena saldos
3. Semana activa → sugerida de hoy; presupuesto/ingreso intactos

### Export (`src/utils/exportMonthlyData.ts`)

- Incluye `wallets`, `walletSplit`, y `type` en movimientos
- `totalExpenses` / `byCategory` solo cuentan **gastos**

### API analyze (Cloudflare Pages Function)

| Pieza | Rol |
|-------|-----|
| `src/utils/analyzeInsight.ts` | Fallback local, prompt, parse JSON, `resolveAnalyze()` |
| `src/utils/callGeminiInsight.ts` | Gemini REST vía `fetch` (Workers-safe) |
| `functions/api/analyze.ts` | Pages Function `POST /api/analyze` |
| `public/_routes.json` | Solo `/api/*` invoca Functions (ahorra cuota Workers) |
| `public/_redirects` | SPA fallback `/* → /index.html` |
| `wrangler.jsonc` | Proyecto `finance-plus`, output `dist/` |

**Local dev UI:** `npm run dev` (Express + Vite, igual que antes).  
**Preview CF:** `npm run preview:cf` → `http://localhost:8788` (static + Function).

---

## Archivos nuevos / modificados (esta iteración)

| Archivo | Cambio |
|---------|--------|
| `src/utils/wallet.ts` | **Nuevo** — lógica pura de saldos |
| `src/utils/wallet.test.ts` | **Nuevo** — tests TDD (20) |
| `vitest.config.ts` | **Nuevo** — runner de tests |
| `src/components/TransactionDetailModal.tsx` | **Nuevo** — detalle/edición Semanal |
| `src/types.ts` | Wallets, WalletSplit, TransactionType, MutationResult |
| `src/utils/storage.ts` | v5, wallets/split en snapshot |
| `src/mockData.ts` | DEMO_WALLET_SPLIT, DEMO_WALLETS, `type: "gasto"` en demos |
| `src/App.tsx` | Estado wallets; save/delete/edit/reset/budget config |
| `src/components/MonthlyDashboard.tsx` | UI saldos + reparto en modal |
| `src/components/AddExpense.tsx` | Toggle gasto/ingreso; bloqueo sin saldo |
| `src/components/WeeklyTracking.tsx` | Lista mixta; tap → modal; delete con validación |
| `src/components/AnalysisDetailed.tsx` | Export con wallets; totales solo gastos |
| `src/utils/exportMonthlyData.ts` | wallets/split en payload |
| `package.json` | Scripts `test`, `test:watch`; devDependency vitest |
| `src/utils/analyzeInsight.ts` | **Nuevo** — lógica analyze + `resolveAnalyze` |
| `src/utils/analyzeInsight.test.ts` | **Nuevo** — 4 tests analyze |
| `src/utils/callGeminiInsight.ts` | **Nuevo** — Gemini REST fetch |
| `functions/api/analyze.ts` | **Nuevo** — Pages Function |
| `public/_routes.json`, `public/_redirects` | **Nuevo** — routing CF |
| `wrangler.jsonc` | **Nuevo** — config Pages `finance-plus` |
| `server.ts` | Delega a `resolveAnalyze` (dev local) |
| `render.yaml` | Marcado DEPRECATED (rollback Render) |
| `docs/superpowers/plans/2026-07-16-transactions-wallets-income.md` | Plan de implementación |

### Commits (migración Cloudflare Pages — local, sin push)

```
a7d9e5b refactor: extract analyze insight helpers for Pages Function
a584e4a refactor: share Gemini fetch helper between Express and Pages
ad732c7 feat: add Pages Function for /api/analyze
f10cf11 chore: configure Cloudflare Pages deploy for finance-plus
```

### Commits (wallets/ingresos — ya en origin/main)

```
0408483 Agregar spec de movimientos, saldos e ingresos en "+".
e04e409 Agregar Vitest, tipos de wallets y helpers TDD.
475ab6f Conectar saldos en App, Inicio y tab +.
6db3d02 Agregar ingresos en +, lista mixta y detalle en Semanal.
```

### Commits previos (reiniciar ciclo, ya en main)

```
dc12331 Documentar el diseño de reinicio seguro del ciclo financiero.
e171777 Agregar helper para borrar gastos del ciclo actual.
b2057ba Conectar reinicio de gastos del ciclo en App.
5034271 Agregar modal de confirmación para reiniciar el ciclo.
```

---

## Cómo ejecutar

### Local

```bash
cd "Prototipo 2/finance+"
npm install
# Opcional: .env o .dev.vars con GEMINI_API_KEY (gitignored)
npm run dev
# → http://localhost:3000
```

### Preview Cloudflare (static + Function local)

```bash
npm run preview:cf
# → http://localhost:8788
curl -s -X POST http://127.0.0.1:8788/api/analyze \
  -H 'Content-Type: application/json' \
  -d '{"expenses":[{"name":"Café","category":"Alimentación","amount":50}],"budget":1000}'
```

### Tests / lint / build

```bash
npm test        # vitest — 24 tests (wallet + analyze)
npm run lint    # tsc --noEmit
npm run build   # vite build → dist/
npm run build:node  # vite + esbuild server (rollback Render)
npm start       # producción local con Express
```

### Detener localhost

```bash
lsof -ti :3000 | xargs kill -9
lsof -ti :8788 | xargs kill -9
```

### Deploy Cloudflare Pages (producción)

**Proyecto:** `finance-plus` (NO tocar `viaditalia`).

```bash
# Primera vez (interactivo):
npx wrangler login

# Secret de producción (interactivo):
npx wrangler pages secret put GEMINI_API_KEY --project-name=finance-plus

# Deploy:
npm run deploy:cloudflare
# equivalente: npm run build && npx wrangler pages deploy dist --project-name=finance-plus
```

URL esperada: `https://finance-plus.pages.dev`

**Rollback Render (emergencia):** `npm run build:node` + servicio en dashboard Render con `render.yaml`.

**Nota:** Via Ditalia sigue en el mismo account CF; proyectos separados; `_routes.json` limita Functions a `/api/*`.

---

## Verificación realizada

### Automática (2026-07-16 — migración CF)

- [x] `npm test` — 24/24 pass
- [x] `npm run lint` — 0 errores
- [x] `npm run build` — exit 0; `dist/_routes.json` + `dist/_redirects` presentes
- [x] `npm run preview:cf` + `curl POST /api/analyze` — 200 JSON (fallback local)
- [ ] `npm run deploy:cloudflare` — pendiente auth CF (`wrangler login`)
- [ ] Smoke test en `https://finance-plus.pages.dev` — pendiente deploy

### Manual (localhost, modo **Mis datos**)

**Saldos (Fase 1)**

- [x] Tarjeta/Efectivo visibles en Inicio
- [x] Reparto en modal presupuesto suma al ingreso
- [x] Gasto resta método; bloquea si no alcanza
- [x] Ajuste manual ≥ 0
- [x] Editar ingreso con saldos > 0: split cambia, wallets no (regla C)
- [x] Reiniciar ciclo: movimientos fuera; wallets = reparto

**Ingresos (Fase 2)**

- [x] Toggle Gasto/Ingreso en "+"
- [x] Ingreso suma saldo; no cambia Ingresos del mes
- [x] Ingresos en Semanal con `+$` verde
- [x] Totales semanales ignoran ingresos

**Detalle (Fase 3)**

- [x] Tap en transacción Semanal abre modal
- [x] Editar gasto/ingreso con revalidación de saldos
- [x] Borrar devuelve/resta saldo correctamente

**Reiniciar ciclo (feature previa, extendida)**

- [x] Modal + checkbox; demo deshabilitado
- [x] Wallets se rellenan tras reinicio

---

## Fuera de alcance (v1)

- Detalle/editar desde Resumen
- Cambiar `type` gasto ↔ ingreso al editar
- Transferencias entre tarjeta y efectivo
- Historial de ajustes manuales de saldo
- Auto-depósito día 15
- Import JSON de movimientos
- Multi-cuenta / múltiples tarjetas

---

## Documentación relacionada

| Documento | Ubicación |
|-----------|-----------|
| Spec movimientos/saldos/ingresos | `docs/superpowers/specs/2026-07-16-transactions-wallets-income-design.md` |
| Plan de implementación | `docs/superpowers/plans/2026-07-16-transactions-wallets-income.md` |
| Spec reiniciar ciclo | `docs/superpowers/specs/2026-07-09-reset-cycle-design.md` |
| Plan migración CF | `docs/superpowers/plans/2026-07-16-cf-pages-migration.md` |
| Config CF | `wrangler.jsonc` |
| Config Render (deprecated) | `render.yaml` |

---

## Próximos pasos sugeridos

1. `npx wrangler login` y `npm run deploy:cloudflare` → verificar `https://finance-plus.pages.dev`.
2. Configurar `GEMINI_API_KEY` en Pages: `wrangler pages secret put GEMINI_API_KEY --project-name=finance-plus`.
3. Cuando confirmes en producción, **push** de los 4 commits locales a `main`.
4. Opcional: desactivar auto-deploy en Render para evitar cold-start duplicado.

---

## Stack

- React 19 + TypeScript + Vite 6
- Tailwind CSS 4
- Vitest 3 (tests unitarios)
- Cloudflare Pages + Pages Functions (`functions/api/analyze.ts`)
- Express (`server.ts`) solo para `npm run dev` / rollback Render
- localStorage para datos del usuario (snapshot v5)
- Cloudflare Pages (hosting primario) + GitHub (repo)
