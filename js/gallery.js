// أضف صورك في assets/ ثم أضف سطراً هنا
const WORKS = [
  { src: "assets/work1.jpg", title: "تاج زركون", cat: "تيجان" },
  { src: "assets/work2.jpg", title: "جسر خزفي", cat: "ثابتة" },
  { src: "assets/work3.jpg", title: "طقم متحرك", cat: "متحركة" },
  { src: "assets/work4.jpg", title: "فينير تجميلي", cat: "تجميلية" },
  { src: "assets/work5.jpg", title: "تاج على زرعة", cat: "تيجان" },
  { src: "assets/work6.jpg", title: "جسر ثابت", cat: "ثابتة" }
];
const grid = document.getElementById("works"), fl = document.getElementById("filters"), lb = document.getElementById("lb");
const cats = ["الكل", ...new Set(WORKS.map(w => w.cat))];
fl.innerHTML = cats.map((c, i) => `<button class="${i ? "" : "on"}">${c}</button>`).join("");
function draw(cat) {
  grid.innerHTML = WORKS.filter(w => cat === "الكل" || w.cat === cat).map(w =>
    `<div class="work" data-src="${w.src}"><img src="${w.src}" alt="${w.title}" loading="lazy" onerror="this.remove()"><span>${w.title}</span></div>`).join("");
}
fl.onclick = e => { if (e.target.tagName !== "BUTTON") return; [...fl.children].forEach(b => b.classList.remove("on")); e.target.classList.add("on"); draw(e.target.textContent); };
grid.onclick = e => { const w = e.target.closest(".work"); if (!w || !w.querySelector("img")) return; lb.querySelector("img").src = w.dataset.src; lb.classList.add("on"); };
lb.onclick = () => lb.classList.remove("on");
draw("الكل");
