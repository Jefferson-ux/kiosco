<?php require __DIR__ . "/../backend/auth.php"; ?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Marcación de Asistencia</title>
    <link rel="stylesheet" href="./../styles/global.css">
    <link rel="stylesheet" href="./../styles/kiosco.css">
</head>
<body>
<style>
  body {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* Centrado seguro: si el contenido es más alto que la pantalla, se puede hacer scroll */
  .stage { margin: auto; }

  /* ---------- Contenedor de enlaces (escritorio: debajo del reloj) ---------- */
  .form-link-container {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 12px;
    margin-top: 22px;
  }

  .form-link {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 12px 20px;
    font-size: .9rem;
    font-weight: 600;
    text-decoration: none;
    color: var(--ink);
    background: linear-gradient(160deg, var(--panel), #141a35);
    border: 1px solid var(--panel-edge);
    border-radius: 999px;
    transition: border-color .15s ease, box-shadow .15s ease, transform .1s ease;
  }

  .form-link svg { width: 16px; height: 16px; stroke: var(--accent); transition: transform .15s ease; }
  .form-link:hover { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(61, 107, 255, .2); }
  .form-link:hover svg { transform: translateX(3px); }
  .form-link:active { transform: scale(.97); }
  .form-link:focus-visible { outline: none; border-color: var(--accent); box-shadow: 0 0 0 3px rgba(61, 107, 255, .4); }

  /* ---------- Móvil (≤720px): enlaces debajo de la cámara ---------- */
  @media (max-width: 720px) {
    body { overflow-y: auto; }

    /* El panel del reloj "se disuelve" y sus hijos se reordenan en el grid */
    .clock-panel { display: contents; }

    .clock-time { order: -2; text-align: center; }
    .clock-date { order: -1; text-align: center; }
    /* .cam-panel queda en el orden 0: la cámara */
    .form-link-container { order: 1; align-items: center; margin-top: 0; }
    .brand { order: 2; text-align: center; padding-top: 4px; }
  }
</style>

    <main class="stage">

        <!-- Panel izquierdo: formulario -->
         <section>

             <form id="formulario" class="cam-panel" autocomplete="off">
                 <div class="cam-view form-view">
                     <div class="field">
                         <label for="employee_code_input">Código de empleado</label>
                         <input id="employee_code_input" type="text" placeholder="EMP-00000"
                                inputmode="text" autofocus required>
                     </div>

                     <div class="field">
                         <label for="type_select">Tipo de marcación</label>
                         <select id="type_select">
                             <option value="ENTRY">Entrada</option>
                             <option value="BREAK_START">Inicio de descanso</option>
                             <option value="BREAK_END">Fin de descanso</option>
                             <option value="EXIT">Salida</option>
                         </select>
                     </div>
                 </div>

                 <button type="button" id="submitBtn" class="start-btn">Registrar</button>
                
             </form>

         </section>
        <!-- Panel derecho: reloj -->
        <section class="clock-panel">
            <div class="clock-time" id="clockTime">--:--</div>
            <div class="clock-date" id="clockDate">&nbsp;</div>


            <div class="form-link-container">
                <div id="response-container" aria-live="polite"></div>
                <br>
            </div>

            <div class="brand">Control de Asistencia</div>

            
        </section>
            <template id="response-template">
                <article class="response">
                    <p class="response_message"></p>
                    <div class="response_details">
                        <div class="response_employee"><strong>Empleado</strong> <span></span></div>
                        <div class="response_datetime"><strong>Hora marcada</strong> <span></span></div>
                        <div class="response_punctuality"><strong>Puntualidad</strong> <span></span></div>
                        <div class="response_late"><strong>Minutos tarde</strong> <span></span></div>
                    </div>
                </article>
            </template>
    </main>
    <dialog id="confirm-modal" class="modal">
    <form method="dialog">
        <h2>¿Está seguro de marcar?</h2>
        <p>Aún no ha terminado su tiempo. Si marca, la salida quedará como incompleta.</p>
        <div class="modal_actions">
        <button value="no" class="modal_btn modal_btn--no">No</button>
        <button value="yes" class="modal_btn modal_btn--yes">Sí, marcar</button>
        </div>
    </form>
    </dialog>
    <script src="./../scripts/mark.js"></script>
    <script src="./../scripts/clock.js"></script>
</body>
</html>