# Reiniciar ciclo — Design Spec

**Fecha:** 2026-07-09  
**App:** Finance+ (`Prototipo 2/finance+`)  
**Estado:** Aprobado en brainstorm; pendiente de plan de implementación

## Problema

Al terminar un ciclo financiero, el usuario quiere empezar el siguiente desde cero (sin gastos). Borrar datos es riesgoso: debe haber confirmación explícita y un recordatorio de exportar el JSON antes de perder los gastos.

## Decisiones acordadas

| Tema | Decisión |
|------|----------|
| Alcance del borrado | Solo **gastos del ciclo actual** (mismo rango que Exportar JSON) |
| Se conserva | Presupuesto mensual, ingreso, presupuestos semanales, `monthStartDay` |
| Semana activa tras reinicio | Semana sugerida para hoy (`getSuggestedWeekOfMonth`) |
| Ubicación UI | Pestaña **Resumen** (`AnalysisDetailed`), cerca de Exportar JSON |
| Confirmación | Modal + **checkbox obligatorio** antes de habilitar Reiniciar |
| Enfoque | Modal de confirmación (sin wizard ni export forzado dentro del modal) |
| Modo demo | Botón deshabilitado / mismo criterio que Exportar |

## Comportamiento

### Flujo del usuario

1. En **Mis datos**, en Resumen, toca **Reiniciar ciclo**.
2. Se abre un modal que:
   - Explica que se borrarán solo los gastos del ciclo actual (label del ciclo visible).
   - Muestra cuántos gastos se eliminarán (`N`).
   - Indica que presupuesto e ingreso se mantienen.
   - Recuerda exportar el JSON si quiere guardarlos.
   - Incluye checkbox: *Ya exporté mis datos / entiendo que no podré recuperarlos.*
3. **Cancelar**, cerrar (X) o clic fuera: no cambia nada; al reabrir, checkbox en `false`.
4. **Reiniciar** solo se habilita con el checkbox marcado.
5. Al confirmar: se eliminan los gastos del ciclo actual (se conservan los de fuera del ciclo, si existen), se actualiza la semana activa a la sugerida de hoy, se cierra el modal.

### Qué no hace

- No borra presupuesto, ingreso, week budgets ni config del ciclo.
- No borra gastos cuya fecha está **fuera** del ciclo actual.
- No fuerza la descarga del export (solo lo recuerda; Exportar sigue disponible al lado).
- No añade historial multi-ciclo ni “última exportación” en storage (fuera de alcance).

## Arquitectura

### Responsabilidades

| Pieza | Rol |
|-------|-----|
| `AnalysisDetailed` | Botón, modal, checkbox, conteo de gastos del ciclo; llama a callback al confirmar |
| `App` | Dueño del estado: aplica el filtrado de `expenses`, actualiza `activeWeek`, deja que el `useEffect` existente persista el snapshot en modo personal |
| Utilidades de ciclo | Reutilizar `getFinanceCycleRange` + `isDateInRange` (misma definición que export/resumen). Opcional: helper puro `resetCycleExpenses(expenses, cycleRange)` si mantiene el filtrado testeable y claro |

### Persistencia

- Sin nuevas keys de `localStorage`.
- Tras el cambio de estado en modo `personal`, `persistUserSnapshot` (ya cableado en `App`) guarda el snapshot actualizado.

### Casos borde

| Caso | Comportamiento |
|------|----------------|
| 0 gastos en el ciclo | Modal permitido; confirmar es no-op sobre gastos (lista ya vacía); semana activa igual se actualiza a la sugerida |
| Modo demo | Botón deshabilitado (o equivalente a Exportar); no muta datos demo |
| Gastos fuera del ciclo | Permanecen |
| Cerrar / Cancelar | Sin mutaciones |

## UI

### Botón

- Texto: **Reiniciar ciclo**
- Estilo secundario / destructivo suave (no compite con Exportar)
- Solo usable en modo personal

### Modal

- Título: **¿Reiniciar el ciclo?**
- Cuerpo: label del ciclo, conteo `N`, nota de presupuesto/ingreso, aviso de exportar
- Checkbox obligatorio (texto acordado arriba)
- Acciones: **Cancelar** | **Reiniciar** (destructivo, disabled hasta checkbox)

### Post-confirmación

- Modal cerrado
- Resumen / Weekly reflejan 0 gastos del ciclo
- Semana activa = sugerida de hoy
- Sin toast obligatorio en v1

## Criterios de aceptación

1. En modo personal, con checkbox marcado, Reiniciar elimina solo gastos del ciclo actual.
2. Presupuesto, ingreso, week budgets y `monthStartDay` no cambian.
3. Semana activa pasa a la sugerida para la fecha actual y el `monthStartDay` configurado.
4. En demo, el botón está deshabilitado y no muta el estado (ni demo ni personal).
5. Cancelar o cerrar el modal no modifica datos; reabrir resetea el checkbox.
6. Tras reiniciar, un export del ciclo tiene `transactionCount: 0` (o lista de expenses vacía).

## Fuera de alcance

- Importar JSON de un ciclo anterior
- Archivar ciclos en la app
- Forzar export dentro del modal
- Soft-delete / deshacer
- Tracking de “ya exportó” en storage

## Notas de implementación (orientativas)

- Archivos probables: `src/components/AnalysisDetailed.tsx`, `src/App.tsx`, posiblemente un helper en `src/utils/` junto a `exportMonthlyData.ts` o `week.ts`
- Mantener el filtro de fechas alineado con `buildMonthlyExportPayload` para no divergir “ciclo” entre export y reset
