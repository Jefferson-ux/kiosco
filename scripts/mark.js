/* =========================================================
    CONFIGURACIÓN
    ========================================================= */
const CONFIG = {
  API_URL: "/backend/mark_attendance.php",
  TIMEZONE: "America/Lima",
  LOCALE: "es-PE",

  TEXTS: {
    loading: "Registrando…",
    networkError: "No se pudo conectar con el servidor. Inténtalo de nuevo.",
    internalError: "Error interno de la página. Revisa la consola (F12).",
    genericError: (status) =>
      `Error ${status}: no se pudo registrar la marcación.`,
    conditionLabel: "Condición",
    completed: "Completado",
    incomplete: "Incompleto",
  },

  TIME_FIELD: {
    ENTRY: "check_in_at",
    BREAK_START: "break_start_at",
    BREAK_END: "break_end_at",
    EXIT: "check_out_at",
  },

  PUNCTUALITY: {
    present: { label: "A tiempo", color: "#2fce8f" },
    on_time: { label: "A tiempo", color: "#2fce8f" },
    late: { label: "Tarde", color: "#ffb347" },
  },

  NEXT_ACTION: {
    ENTRY: { label: "ENTRADA", color: "#10B981" },
    BREAK_START: { label: "INICIO DEL DESCANSO", color: "#F59E0B" },
    BREAK_END: { label: "FINAL DEL DESCANSO", color: "#3B82F6" },
    EXIT: { label: "SALIDA", color: "#EF4444" },
    COMPLETED: { label: "COMPLETADO", color: "#B2FFFF" },
  },

  getCondition: (attendance) => attendance?.punctuality?.status,
  INCOMPLETE_VALUE: "incomplete",
};

/* =========================================================
    ELEMENTOS DEL DOM (Alineados con code.php)
    ========================================================= */
const submitBtn = document.getElementById("submitBtn");
const employeeCodeInput = document.getElementById("employee_code_input");
const typeSelect = document.getElementById("type_select");

const container = document.getElementById("response-container");
const template = document.getElementById("response-template");

let pending = null;

/* =========================================================
    UTILIDADES
    ========================================================= */
function uuid() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function formatDateTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(CONFIG.LOCALE, {
    timeZone: CONFIG.TIMEZONE,
    dateStyle: "short",
    timeStyle: "medium",
  });
}

/* =========================================================
    MOSTRAR RESPUESTA
    ========================================================= */
function showResponse({ ok, message, data, type }) {
  if (!template || !container) return;

  const node = template.content.cloneNode(true);
  node.querySelector(".response").classList.add(ok ? "success" : "error");
  node.querySelector(".response_message").textContent = message;

  const details = node.querySelector(".response_details");

  if (ok && data) {
    const { employee, attendance } = data;
    const punctuality = attendance.punctuality ?? {};
    const punctRow = node.querySelector(".response_punctuality");
    const nextActionRow = node.querySelector(".response_next_action");
    const lateRow = node.querySelector(".response_late");
    const label = punctRow.querySelector("strong");
    const value = punctRow.querySelector("span");

    node.querySelector(".response_employee span").textContent =
      `${employee.full_name} (${employee.employee_code})`;
    node.querySelector(".response_datetime span").textContent =
      formatDateTime(attendance[CONFIG.TIME_FIELD[type]]);


    const next = CONFIG.NEXT_ACTION[attendance.next_action];
    nextActionRow.querySelector("span").textContent =
      next.label;
    nextActionRow.querySelector("span").style.color = next.color;

    if (type === "ENTRY") {
      const info = CONFIG.PUNCTUALITY[punctuality.status];
      value.textContent = info?.label ?? punctuality.status ?? "—";
      if (info) value.style.color = info.color;

      if (punctuality.status === "late") {
        lateRow.querySelector("span").textContent =
          `${punctuality.late_minutes} min`;
      } else {
        lateRow.remove();
      }
    } else if (type === "EXIT") {
      const incomplete =
        CONFIG.getCondition(attendance) === CONFIG.INCOMPLETE_VALUE;
      label.textContent = CONFIG.TEXTS.conditionLabel;
      value.textContent = incomplete
        ? CONFIG.TEXTS.incomplete
        : CONFIG.TEXTS.completed;
      value.style.color = incomplete ? "#ffb347" : "#2fce8f";
      lateRow.remove();
    } else {
      punctRow.remove();
      lateRow.remove();
    }
  } else {
    details.remove();
  }

  container.replaceChildren(node);
}

/* =========================================================
    ENVÍO AL BACKEND (PHP)
    ========================================================= */
function requestIdFor(code, type) {
  if (!(pending && pending.code === code && pending.type === type)) {
    pending = { code, type, id: uuid() };
  }
  return pending.id;
}

async function markAttendance(employeeCode, type) {
  let res;
  try {
    res = await fetch(CONFIG.API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        employee_code: employeeCode,
        type: type,
        request_id: requestIdFor(employeeCode, type),
      }),
    });
  } catch {
    throw new Error("NETWORK");
  }

  let body = null;
  try {
    body = await res.json();
  } catch {
    /* respuesta sin JSON */
  }
  return { res, body };
}

async function handleFormSubmit() {
  const employeeCode = employeeCodeInput?.value.trim();
  const type = typeSelect?.value;

  if (!employeeCode) {
    alert("Por favor, ingresa el código del empleado.");
    return;
  }

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = CONFIG.TEXTS.loading;
  }

  try {
    const { res, body } = await markAttendance(employeeCode, type);
    pending = null;

    if (res.ok && body?.success) {
      showResponse({ ok: true, message: body.message, data: body.data, type });
      employeeCodeInput.value = ""; // Limpiar el input tras un éxito opcionalmente
    } else {
      showResponse({
        ok: false,
        message: body?.message ?? CONFIG.TEXTS.genericError(res.status),
      });
    }
  } catch (err) {
    console.error(err);
    showResponse({
      ok: false,
      message:
        err.message === "NETWORK"
          ? CONFIG.TEXTS.networkError
          : CONFIG.TEXTS.internalError,
    });
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = "Registrar";
    }
    if (employeeCodeInput) {
      employeeCodeInput.focus();
    }
  }
}

/* =========================================================
    EVENTOS
    ========================================================= */
if (submitBtn) {
  submitBtn.addEventListener("click", handleFormSubmit);
}

// Opcional: Permitir enviar también presionando la tecla "Enter" dentro del input
if (employeeCodeInput) {
  employeeCodeInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleFormSubmit();
    }
  });
}