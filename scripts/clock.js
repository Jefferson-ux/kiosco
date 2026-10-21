/* =========================================================
   RELOJ
   ========================================================= */
const DIAS = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];
const MESES = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];

function pad(n) {
  return n.toString().padStart(2, "0");
}

const clockTime = document.getElementById("clockTime");
const clockDate = document.getElementById("clockDate");

function tick() {
  const now = new Date();
  const tz = "America/Lima";

  clockTime.textContent = now
    .toLocaleTimeString("en-US", {
      timeZone: tz,
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    })
    .replace(/\u202f/g, " ");

  const date = now.toLocaleDateString("es-PE", {
    timeZone: tz,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  clockDate.textContent = date.charAt(0).toUpperCase() + date.slice(1);
}

tick();
setInterval(tick, 1000);