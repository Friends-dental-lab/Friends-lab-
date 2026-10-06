document.addEventListener("click", e => {
  const b = e.target.closest(".menu-btn"), l = document.querySelector(".links");
  if (!l) return;
  if (b) b.setAttribute("aria-expanded", l.classList.toggle("open"));
  else if (e.target.closest(".links a") || !e.target.closest("nav")) l.classList.remove("open");
});
