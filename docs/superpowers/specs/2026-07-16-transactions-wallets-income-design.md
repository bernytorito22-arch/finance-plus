# Movimientos, saldos (tarjeta/efectivo) e ingresos en "+" — Design Spec

**Fecha:** 2026-07-16  
**App:** Finance+ (`Prototipo 2/finance+`)  
**Estado:** Aprobado en brainstorm; pendiente de plan de implementación

## Problema

El usuario necesita tres capacidades conectadas:

1. **Ver y editar un gasto en detalle** al tocarlo en la lista de Semanal (nombre, categoría, monto, método de pago, etc.).
2. **Controlar saldos reales** de **tarjeta** y **efectivo** debajo de Ingresos/Gastos en Inicio, con ajuste manual y descuento automático al registrar gastos.
3. **Registrar ingresos** desde la pestaña "+" (además de gastos), eligiendo tarjeta o efectivo, **sin** afectar el presupuesto ni el campo `budget.income`.

Hoy la app ya tiene `paymentMethod` en gastos y estadísticas de efectivo/tarjeta en `MonthlyDashboard`, pero **no hay saldos editables** ni movimientos de ingreso. El ingreso del mes es un número fijo en `MonthlyBudget`.

## Decisiones acordadas

| Tema | Decisión |
|------|----------|
| Enfoque arquitectónico | **Un solo tipo de movimiento** (`gasto` \| `ingreso`) + saldos `wallets` persistidos |
| Fases de implementación | **D:** (1) saldos, (2) ingresos en "+", (3) detalle/editar en Semanal |
| Inicialización de saldos | Al configurar ingreso del mes, el usuario **reparte** entre tarjeta y efectivo (deben sumar el ingreso) |
| Editar ingreso a mitad de ciclo | **No toca saldos** (regla C); el reparto solo aplica al configurar o al reiniciar ciclo |
| Gasto sin saldo suficiente | **Bloquear** guardado; presupuesto **sí** puede quedar negativo, tarjeta/efectivo **no** |
| Ajuste manual de saldos | **Sí**, como corrección; el flujo principal es el "+" |
| Reiniciar ciclo | Borra movimientos del ciclo **y rellena** `wallets` con el reparto del ingreso del presupuesto |
| Ingreso en "+" | Monto + destino (tarjeta/efectivo) obligatorios; **nombre opcional** (default: "Ingreso") |
| Dónde ver ingresos | **Lista única** en Semanal: gastos `-$…`, ingresos `+$…` en verde |
| Detalle/editar | **Solo** desde la lista de transacciones en la pestaña **Semanal** (no Resumen) |
| Totales semanales / presupuesto | Solo cuentan **gastos**; los ingresos no restan del presupuesto semanal |

## Comportamiento

### Modelo de datos

#### Movimiento (`Transaction`, evolución de `Expense`)

| Campo | Gasto | Ingreso |
|-------|-------|---------|
| `id` | sí | sí |
| `type` | `"gasto"` | `"ingreso"` |
| `name` | obligatorio | opcional (default `"Ingreso"`) |
| `amount` | obligatorio > 0 | obligatorio > 0 |
| `category` | obligatorio | no aplica / omitido |
| `description` | opcional | opcional |
| `date` | ISO | ISO |
| `week` | 1–4 | 1–4 |
| `status` | Completado / Rechazado | Completado |
| `paymentMethod` | `efectivo` \| `tarjeta` | `efectivo` \| `tarjeta` (destino) |

**Migración:** registros existentes sin `type` → `"gasto"`; sin `paymentMethod` → `"efectivo"` (comportamiento actual).

#### Saldos (`Wallets`)

```ts
interface Wallets {
  tarjeta: number;
  efectivo: number;
}
```

Persistidos en el snapshot de usuario (`UserSnapshot`).

#### Reparto inicial (`WalletSplit`)

Al configurar o editar el ingreso del presupuesto (modal existente en Inicio), además del monto de ingreso se captura:

```ts
interface WalletSplit {
  tarjeta: number;
  efectivo: number;
}
// Validación: tarjeta + efectivo === budget.income
```

Este reparto se guarda en el snapshot y se usa para **inicializar** wallets al configurar por primera vez y al **reiniciar ciclo**. No se reaplica automáticamente al editar el ingreso a mitad de mes (regla C).

### Reglas de negocio

#### Gasto

1. Resta `amount` del presupuesto (como hoy: `totalBudget - gastos del ciclo`).
2. Resta `amount` del saldo del `paymentMethod` elegido.
3. Si `wallets[method] < amount` → **no guardar**; mostrar error (ej. "No tienes suficiente saldo en efectivo").
4. El presupuesto puede quedar negativo aunque el gasto se haya guardado (no hay bloqueo por presupuesto).

#### Ingreso (desde "+")

1. Suma `amount` al saldo del método elegido.
2. **No** modifica `budget.income` ni `budget.totalBudget`.
3. Aparece en la lista de Semanal con monto positivo (`+$…`, verde).
4. No cuenta para totales de gasto semanal ni para el donut de categorías.

#### Ajuste manual de saldo (Inicio)

1. Tap en fila Tarjeta o Efectivo → editar monto directamente.
2. Validación: saldo **≥ 0** (no permitir negativos).
3. No crea movimiento en el historial (es corrección de caja).

#### Editar movimiento existente

1. Revertir efecto del movimiento original en el saldo del método original.
2. Aplicar efecto del movimiento nuevo.
3. Si el nuevo estado dejaría un saldo negativo → **bloquear** guardado y avisar.
4. Cambiar `type` de gasto a ingreso (o viceversa) fuera de alcance en v1.

#### Borrar movimiento

1. **Gasto:** devolver `amount` al `paymentMethod` del gasto.
2. **Ingreso:** restar `amount` del método destino.
3. Si borrar un ingreso dejaría el saldo **< 0** (por ajustes manuales intermedios) → **bloquear** borrado con aviso; el usuario debe ajustar el saldo manualmente primero.

#### Reiniciar ciclo (extensión del feature existente)

Comportamiento actual conservado para presupuesto, ingreso, week budgets y `monthStartDay`.

**Cambio:** además de eliminar movimientos del ciclo actual:

1. Restablecer `wallets` al reparto guardado (`WalletSplit` derivado del ingreso del presupuesto).
2. Si no hay `walletSplit` guardado (migración), usar `{ tarjeta: 0, efectivo: budget.income }` y el mismo valor en `wallets`.

### Flujos de usuario

#### Fase 1 — Saldos

1. En **Inicio**, debajo de Ingresos/Gastos, aparecen **Tarjeta** y **Efectivo** con saldo actual.
2. Al editar presupuesto/ingreso (botón tune), el modal incluye reparto tarjeta + efectivo que debe sumar el ingreso.
3. Al guardar config nueva (primera vez o tras reinicio), los wallets se inicializan con ese reparto.
4. Al registrar un **gasto** en "+", si no hay saldo en el método elegido, se bloquea con mensaje claro.
5. Tap en saldo → ajuste manual (≥ 0).

#### Fase 2 — Ingresos en "+"

1. Selector superior en la pestaña "+": **Gasto** | **Ingreso**.
2. Formulario de ingreso: monto grande, destino tarjeta/efectivo, nombre opcional.
3. Al guardar, suma al saldo y aparece en Semanal como `+$…`.
4. El título de la pestaña puede pasar a "Añadir" o mantener "+" según UI; el hero cambia según el tipo seleccionado.

#### Fase 3 — Detalle y edición (Semanal)

1. En la lista **Transacciones Semana X**, tap en la fila (no en el basurero) abre modal/pantalla de detalle grande.
2. Muestra: nombre, categoría (gasto), monto, método, fecha, descripción, semana, status.
3. Botón **Editar** → campos editables → **Guardar** (revalida saldos) o **Cancelar**.
4. El ícono de basura sigue borrando desde la lista (o también desde detalle, opcional).
5. Los ingresos también abren detalle; campos editables: monto, método, nombre, descripción.

## Arquitectura

### Responsabilidades

| Pieza | Rol |
|-------|-----|
| `types.ts` | `Transaction` (o `Expense` extendido con `type`), `Wallets`, `WalletSplit`; bump de versión de storage |
| `utils/storage.ts` | Persistir `wallets` y `walletSplit` en `UserSnapshot`; migración de datos v4 → v5 |
| `utils/wallet.ts` (nuevo) | Helpers puros: `applyTransaction`, `revertTransaction`, `canAfford`, `initWalletsFromSplit` |
| `App.tsx` | Estado `wallets`, handlers: save/edit/delete transaction, update wallets, reset cycle extendido |
| `MonthlyDashboard.tsx` | UI de saldos tarjeta/efectivo; reparto en modal de presupuesto |
| `AddExpense.tsx` → `AddTransaction.tsx` (rename opcional) | Toggle gasto/ingreso; validación de saldo en gastos |
| `WeeklyTracking.tsx` | Lista mixta gastos/ingresos; tap → detalle; totales solo gastos |
| `TransactionDetailModal.tsx` (nuevo) | Vista grande + edición |
| `AnalysisDetailed.tsx` | Sin cambios de detalle (solo Resumen); reset cycle actualizado para wallets |
| `exportMonthlyData.ts` | Incluir `wallets`, `walletSplit`, y `type` en export |

### Persistencia

- Bump `STORAGE_VERSION` de `"4"` a `"5"`.
- Nuevos campos en `UserSnapshot`: `wallets`, `walletSplit`.
- Migración v4 → v5: si ausentes, `walletSplit = { tarjeta: 0, efectivo: budget.income }` y `wallets` con el mismo valor (alineado al default histórico de `paymentMethod: efectivo`).
- Sin nuevas keys sueltas de localStorage; todo vía snapshot unificado.

### Casos borde

| Caso | Comportamiento |
|------|----------------|
| Gasto sin saldo | Bloquear; mensaje por método |
| Presupuesto negativo | Permitido |
| Saldo negativo en wallet | Nunca por transacciones; solo ajuste manual bloqueado si < 0 |
| Datos legacy sin `type` | Tratar como gasto |
| Datos legacy sin `paymentMethod` | Efectivo |
| Editar gasto: subir monto | Revalidar saldo del método (revertir + aplicar) |
| Editar gasto: cambiar método | Revertir método viejo, aplicar en método nuevo |
| Borrar ingreso con saldo insuficiente | Bloquear borrado con aviso |
| Reiniciar ciclo sin movimientos | Wallets se rellenan igual con reparto |
| Modo demo | Mismos flujos o deshabilitar mutaciones según patrón actual (`isDemoMode`) |
| Ingreso sin nombre | Guardar como "Ingreso" |
| Export JSON | Incluye `type`, `wallets`, `walletSplit` |

## UI

### Inicio — Saldos (debajo de Ingresos/Gastos)

```
┌─────────────────────────────────┐
│ Ingresos          │ Gastos      │
│ $X,XXX            │ $X,XXX      │
├─────────────────────────────────┤
│ 💳 Tarjeta        │ $XXX.XX  ✎  │
│ 💵 Efectivo       │ $XXX.XX  ✎  │
└─────────────────────────────────┘
```

- Estilo coherente con `glass-card` existente.
- Tap en fila o ícono ✎ → input/modal de ajuste.

### Modal de presupuesto (extendido)

- Campos existentes: presupuesto total, ingreso.
- **Nuevos:** Tarjeta ($) + Efectivo ($) con validación `suma === ingreso`.
- Hint: "Este reparto se usa al iniciar o reiniciar el ciclo."

### Pestaña "+" — Toggle

```
[ Gasto ] [ Ingreso ]
```

- **Gasto:** formulario actual (categoría, semana, etc.) + selector tarjeta/efectivo.
- **Ingreso:** monto, destino, nombre opcional; sin categoría ni semana obligatoria (semana = `activeWeek` por defecto).

### Semanal — Lista mixta

- Gasto: `-$XX.XX` (color actual), ícono categoría.
- Ingreso: `+$XX.XX` en verde (`#4edea3`), ícono genérico (ej. `savings` o `add_circle`).
- Tap fila → `TransactionDetailModal`.

### Detalle / edición

- Modal full-width o bottom sheet (mobile-first).
- Monto grande arriba (como en "+").
- Campos editables según tipo.
- Acciones: **Guardar** | **Cancelar**; opcional **Eliminar** dentro del modal.

## Fases de implementación

| Fase | Entregable | Depende de |
|------|------------|------------|
| **1. Saldos** | `wallets`, UI Inicio, reparto en config, gastos restan saldo, bloqueo, ajuste manual, reset rellena | — |
| **2. Ingresos "+"** | Toggle, formulario ingreso, suma a wallet, lista mixta en Semanal | Fase 1 |
| **3. Detalle/editar** | Modal detalle, editar con revert/apply, borrado seguro de ingresos | Fases 1–2 |

Cada fase debe ser usable y persistible por sí sola.

## Criterios de aceptación

### Fase 1

1. Tarjeta y efectivo visibles en Inicio con saldos actuales.
2. Al configurar ingreso, el reparto tarjeta + efectivo debe sumar el ingreso.
3. Un gasto resta del método elegido y del presupuesto; bloquea si el saldo del método no alcanza.
4. El presupuesto puede quedar negativo; los saldos no.
5. Ajuste manual de saldo funciona y no permite valores negativos.
6. Reiniciar ciclo elimina movimientos del ciclo y rellena wallets con el reparto del ingreso.

### Fase 2

7. En "+", se puede elegir Gasto o Ingreso.
8. Un ingreso suma al método elegido y no cambia `budget.income` ni `totalBudget`.
9. Los ingresos aparecen en Semanal con `+$` en verde en la misma lista.
10. Los totales semanales de gasto no incluyen ingresos.

### Fase 3

11. Tap en una transacción en Semanal abre detalle grande.
12. Se puede editar un gasto (monto, nombre, categoría, método, etc.) con revalidación de saldos.
13. Se puede editar un ingreso (monto, método, nombre).
14. Borrar gasto devuelve saldo; borrar ingreso lo resta (bloqueado si dejaría saldo negativo).

## Fuera de alcance

- Detalle/editar desde Resumen (gastos recientes)
- Sección separada "Ingresos de la semana" (opción C descartada)
- Cambiar `type` gasto ↔ ingreso al editar
- Transferencias entre tarjeta y efectivo como movimiento
- Historial de ajustes manuales de saldo
- Auto-deposito el día 15 (el usuario usa "+" manualmente)
- Regla B (aplicar diferencia al editar ingreso a mitad de ciclo)
- Multi-cuenta / múltiples tarjetas
- Import JSON de movimientos

## Notas de implementación (orientativas)

- Renombrar `Expense` → `Transaction` en types es opcional; mínimo añadir `type?: 'gasto' | 'ingreso'`.
- Centralizar lógica de saldo en `utils/wallet.ts` para que save/edit/delete/reset compartan las mismas reglas.
- `WeeklyTracking.tsx` ya lista gastos y tiene delete; extender con `onEditTransaction` y tap handler.
- Alinear filtro de ciclo en reset con `removeExpensesInCycle` / export (ahora filtrará movimientos, no solo gastos).
- Considerar renombrar `AddExpense` → `AddTransaction` en Fase 2 para claridad (no obligatorio).

## Referencias

- Spec relacionado: `docs/superpowers/specs/2026-07-09-reset-cycle-design.md`
- Tipos actuales: `src/types.ts` (`PaymentMethod`, `Expense`, `MonthlyBudget`)
- UI Semanal: `src/components/WeeklyTracking.tsx`
- Formulario actual: `src/components/AddExpense.tsx`
- Dashboard: `src/components/MonthlyDashboard.tsx`
