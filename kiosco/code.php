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
    <main class="stage">

        <!-- Panel izquierdo: formulario -->
         <div>

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

                 <button type="submit" class="start-btn">Registrar</button>
             </form>

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
            <div class="form-link-container-desktop">
                <div id="response-container" aria-live="polite"></div>
            </div>

         </div>
        <!-- Panel derecho: reloj -->
        <section class="clock-panel">
            <div class="clock-time" id="clockTime">--:--</div>
            <div class="clock-date" id="clockDate">&nbsp;</div>

            <div class="brand">MARCACIÓN DE ASISTENCIA</div>
        </section>
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
    <script src="./../scripts/api-mark.js"></script>
    <script src="./../scripts/clock.js"></script>
</body>
</html>