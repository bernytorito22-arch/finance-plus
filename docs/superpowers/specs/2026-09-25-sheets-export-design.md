# Copiar ciclo a Sheets — Design Spec

**Fecha:** 2026-09-25  
**App:** Finance+ (`finance+`)  
**Estado:** Aprobado en brainstorm; pendiente de plan de implementación

## Problema

Exportar el ciclo como JSON sirve de respaldo, pero no se pega en Google Sheets ni en Excel. Quien quiere ordenar sus movimientos tiene que reescribirlos. Al reiniciar el ciclo, el aviso solo habla de JSON, así que no queda claro que puede guardar una copia en una hoja de cálculo.

## Decisiones acordadas

| Tema | Decisión |
|------|----------|
| Formato para la hoja | TSV (columnas separadas por tabulador) |
| Acción principal | Copiar al portapapeles, no descargar el TSV |
| JSON | Se mantiene como descarga de respaldo |
| Filas | Solo movimientos del ciclo actual (gastos e ingresos) |
| Meses siguientes | Misma hoja: primera copia con títulos; las siguientes, solo filas |
| Explicación | Texto visible junto a los botones, no solo un tooltip |
| Reiniciar ciclo | El modal ofrece las dos copias y la casilla nombra Sheets o Excel |
| Modo demo | Las copias y el JSON siguen desactivados |

## Comportamiento

### Copiar desde Resumen

En **Mis datos**, bajo el título del ciclo en Resumen, hay un bloque de exportación:

1. **Copiar para Sheets** copia el encabezado y una fila por movimiento del ciclo.
2. **Copiar solo filas** copia los mismos movimientos, sin encabezado, para pegarlos debajo en la misma hoja.
3. **Exportar JSON** descarga el mismo archivo que hoy.
4. Debajo, este texto:

   > La primera vez, pega “Copiar para Sheets” en la celda A1. Cada mes siguiente, usa “Copiar solo filas” y pégalo en la primera fila vacía. Las columnas no cambian, así que los ciclos se apilan en la misma hoja.

**Reiniciar ciclo** sigue en la cabecera de Resumen, separado de ese bloque.

Al copiar con éxito, el botón pulsado muestra **Copiado** durante 2 segundos y vuelve a su etiqueta. Si el portapapeles falla, bajo ese grupo de botones (el de Resumen o el del modal) se muestra: **No se pudo copiar. Intenta de nuevo.**

Si el ciclo no tiene movimientos:

- **Copiar para Sheets** copia solo la fila de títulos.
- **Copiar solo filas** no escribe en el portapapeles y muestra: **Este ciclo no tiene movimientos.**

Copiar no marca sola la casilla del modal de reinicio. La persona tiene que marcarla.

### Reiniciar ciclo

El modal sigue explicando que se borran los movimientos de ese ciclo y que el presupuesto y el ingreso se mantienen. El conteo usa la misma lista que se copia y que se borra (gastos e ingresos dentro del rango), y dice **movimiento** o **movimientos**.

El aviso pasa a ser:

> Para guardarlos, copia los movimientos y pégalos en Excel o Google Sheets. También puedes descargar el JSON.

Dentro del modal están **Copiar para Sheets** y **Copiar solo filas**, con el mismo resultado y los mismos avisos que en Resumen. No hace falta cerrar el modal para copiar.

La casilla, obligatoria para habilitar **Reiniciar**, dice:

> Ya copié mis datos a Sheets o Excel, o entiendo que al reiniciar no podré recuperarlos.

Cancelar, cerrar o pulsar fuera no borra nada. Al volver a abrir, la casilla empieza desmarcada.

### Tabla

Columnas, siempre en este orden:

`Ciclo | Fecha | Tipo | Nombre | Monto | Categoría | Método | Semana | Nota`

| Columna | Valor |
|---------|--------|
| Ciclo | `cycleRange.label`, el mismo texto que ya muestra Resumen |
| Fecha | `YYYY-MM-DD` |
| Tipo | `gasto` o `ingreso` |
| Nombre | Nombre del movimiento |
| Monto | Número con punto decimal y dos decimales, sin símbolo ni separador de miles (`1250.50`) |
| Categoría | Categoría |
| Método | `efectivo` o `tarjeta`; si falta, `efectivo` |
| Semana | Semana del ciclo cuyo rango contiene la fecha (la misma regla que el JSON). Si ninguna la contiene, `sin semana`. No usa el campo `week` guardado en el movimiento |
| Nota | Descripción; vacía si no hay |

La fila de títulos es exactamente:

`Ciclo	Fecha	Tipo	Nombre	Monto	Categoría	Método	Semana	Nota`

Orden de filas: fecha ascendente. Si dos movimientos comparten fecha, por nombre.

Un tabulador, salto de línea o retorno de carro dentro del nombre o la nota se sustituye por un espacio. Así una celda no se parte en columnas de más.

Cada fila termina en salto de línea. Las columnas van separadas por tabulador.

### Qué no hace

- No descarga un `.tsv` ni un `.csv`.
- No importa la hoja de vuelta a la app.
- No recuerda si la persona ya pegó los títulos.
- No cambia el contenido ni el nombre del JSON.
- No borra presupuesto, ingreso, presupuestos semanales ni la configuración del ciclo.
- No copia en modo demo.

## Arquitectura

| Pieza | Rol |
|-------|-----|
| Utilidad pura de TSV | Arma el texto con o sin encabezado a partir de los movimientos del ciclo, el rango y las semanas. No toca el portapapeles. |
| `AnalysisDetailed` | Botones, texto de ayuda, aviso de copiado o error, y el modal de reinicio |
| `exportMonthlyData` | El JSON y su descarga se quedan igual |
| `App` | El reinicio sigue igual: quita los movimientos del ciclo y persiste el snapshot personal |

La utilidad recibe los datos ya filtrados al ciclo. Resumen y el modal llaman a la misma función.

## Casos borde

| Caso | Comportamiento |
|------|----------------|
| Modo demo | En Resumen, copiar y exportar JSON están desactivados. Reiniciar ciclo también, así que el modal no se abre |
| Ciclo vacío, con títulos | Solo se copia el encabezado |
| Ciclo vacío, solo filas | No se copia; aviso de que no hay movimientos |
| Ingreso | Entra en la tabla con tipo `ingreso` y también se borra al reiniciar |
| Portapapeles rechazado | Aviso de error; no se muestra **Copiado** |
| Nombre o nota con tabulador o salto de línea | Esos caracteres pasan a espacio |

## Pruebas

Pruebas unitarias de la utilidad de TSV:

- Encabezado exacto y una fila de gasto.
- Un ingreso, y un gasto sin método de pago, salen como `ingreso` y `efectivo`.
- Monto `10` sale como `10.00`.
- Tabulador y salto de línea en nombre o nota no crean columnas extra.
- Sin encabezado, el texto no incluye la fila de títulos.
- Sin movimientos, con encabezado solo va esa fila; sin encabezado el texto está vacío.
- La semana usa el rango del ciclo, no un número suelto si la fecha no cae en ninguna semana.

No hay pruebas de componente hoy para Resumen. Esas pantallas se comprueban al implementar, en el navegador.

## Relación con el spec de reinicio

Este spec sustituye, en el modal de reinicio, el recordatorio de “exporta el JSON” y el texto de la casilla definidos en `docs/superpowers/specs/2026-07-09-reset-cycle-design.md`. El resto de ese flujo no cambia.
