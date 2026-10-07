const ICONS = {
  layers: "M12 3l9 5-9 5-9-5 9-5zM3 13l9 5 9-5",
  bridge: "M2 20h4v-6a6 6 0 0 1 12 0v6h4M9 20h6",
  denture: "M4 8c0 6 3 10 8 10s8-4 8-10c-3 2-5 2-8 2S7 10 4 8z",
  sparkle: "M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3zM19 17l.8 2.2L22 20l-2.2.8L19 23l-.8-2.2L16 20l2.2-.8z",
  shield: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3zM9 12l2 2 4-4",
  phone: "M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z",
  pin: "M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11zM12 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
  chat: "M21 12a8 8 0 0 1-11.5 7.2L4 21l1.8-5.4A8 8 0 1 1 21 12z",
  tooth: "M7 3c-2 0-4 2-4 5 0 2 1 3 1.5 5S5 21 7 21c1.5 0 1.5-4 2.5-4h5c1 0 1 4 2.5 4 2 0 1.5-5 2.5-8S21 10 21 8c0-3-2-5-4-5-2 0-3 1-5 1S9 3 7 3z",
  home: "M4 11l8-7 8 7v9a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1v-9z",
  file: "M7 3h7l5 5v13H7zM14 3v5h5",
  bell: "M6 17v-6a6 6 0 0 1 12 0v6l2 2H4l2-2zM10 21h4",
  plus: "M12 5v14M5 12h14",
  car: "M3 15v-3l2-5h14l2 5v3M3 15h18M3 15v3h3v-3M18 15v3h3v-3M7 12h10",
  cal: "M5 5h14v15H5zM5 9h14M9 3v4M15 3v4",
  users: "M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2 20a7 7 0 0 1 14 0M17 4a3.5 3.5 0 0 1 0 7M18 14a6 6 0 0 1 4 6",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0"
};
const svg = n => `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="${ICONS[n] || ""}"/></svg>`;
document.querySelectorAll("[data-i]").forEach(el => el.innerHTML = svg(el.dataset.i));

const w = document.createElement("a");
w.className = "wa-float"; w.target = "_blank"; w.rel = "noopener"; w.setAttribute("aria-label", "واتساب");
w.href = "https://wa.me/" + (typeof CONFIG !== "undefined" ? CONFIG.whatsapp : "963992693384");
w.innerHTML = svg("chat"); document.body.appendChild(w);

// قائمة الهاتف
document.addEventListener("click", e => {
  const b = e.target.closest(".menu-btn"), l = document.querySelector(".links");
  if (!l) return;
  if (b) b.setAttribute("aria-expanded", l.classList.toggle("open"));
  else if (e.target.closest(".links a") || !e.target.closest("nav")) l.classList.remove("open");
});
