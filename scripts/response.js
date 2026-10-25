const RESPONSE_CONFIG = {
  TIMEZONE: "America/Lima",
  LOCALE: "es-PE",

  TEXTS: {
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

  INCOMPLETE_VALUE: "incomplete",
};

function formatDateTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(RESPONSE_CONFIG.LOCALE, {
    timeZone: RESPONSE_CONFIG.TIMEZONE,
    dateStyle: "short",
    timeStyle: "medium",
  });
}

function showResponse({ ok, message, data }) {
  const container = document.getElementById("response-container");
  const template = document.getElementById("response-template");
  if (!template || !container) return;

  const node = template.content.cloneNode(true);
  node.querySelector(".response").classList.add(ok ? "success" : "error");
  node.querySelector(".response_message").textContent = message;

  const details = node.querySelector(".response_details");

  if (ok && data) {
    const { employee, attendance } = data;
    const type = attendance.type;
    const punctuality = attendance.punctuality ?? {};
    const punctRow = node.querySelector(".response_punctuality");
    const nextActionRow = node.querySelector(".response_next_action");
    const lateRow = node.querySelector(".response_late");
    const label = punctRow.querySelector("strong");
    const value = punctRow.querySelector("span");

    node.querySelector(".response_employee span").textContent =
      `${employee.full_name} (${employee.employee_code})`;
    node.querySelector(".response_datetime span").textContent =
      formatDateTime(attendance[RESPONSE_CONFIG.TIME_FIELD[type]]);

    if (nextActionRow) {
      const next = RESPONSE_CONFIG.NEXT_ACTION[attendance.next_action];
      const nextSpan = nextActionRow.querySelector("span");
      nextSpan.textContent = next?.label ?? "—";
      if (next) nextSpan.style.color = next.color;
    }

    if (type === "ENTRY") {
      const info = RESPONSE_CONFIG.PUNCTUALITY[punctuality.status];
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
        punctuality.status === RESPONSE_CONFIG.INCOMPLETE_VALUE;
      label.textContent = RESPONSE_CONFIG.TEXTS.conditionLabel;
      value.textContent = incomplete
        ? RESPONSE_CONFIG.TEXTS.incomplete
        : RESPONSE_CONFIG.TEXTS.completed;
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