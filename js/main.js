// ===== إعدادات =====
const CONFIG = { whatsapp: "963992693384", country: "963", sheetUrl: "https://script.google.com/macros/s/AKfycbwoFgnWiTv0Xvs2y_B7jg54wJGJ3GaFsArTIAoktZILvMcwKVEXgivWwmZGPUSTfzY_/exec", currency: "ل.س" };
const REVIEWS = []; // تقييمات معتمدة: {name:"د. ...", stars:5, text:"..."}
const KEY = "fl_cases", $ = id => document.getElementById(id);
const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; } };
const save = a => localStorage.setItem(KEY, JSON.stringify(a));
const esc = s => String(s ?? "").replace(/[&<>"']/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
const enc = o => btoa(unescape(encodeURIComponent(JSON.stringify(o))));
const dec = s => JSON.parse(decodeURIComponent(escape(atob(s))));
const sheet = o => CONFIG.sheetUrl && fetch(CONFIG.sheetUrl, { method: "POST", mode: "no-cors", body: JSON.stringify(o) }).catch(() => {});
const wa = (num, msg) => `https://wa.me/${num}?text=${encodeURIComponent(msg)}`;
const intl = p => { p = String(p).replace(/\D/g, ""); return p.startsWith("0") ? CONFIG.country + p.slice(1) : p; };
const sheetLink = c => new URL("case.html", location.href).href + "#" + enc(c);
const imgIds = c => c.imgs || String(c.images || "").match(/[\w-]{25,}/g) || [];
const shrink = f => new Promise(res => {
  const im = new Image(), u = URL.createObjectURL(f);
  im.onload = () => { const k = Math.min(1, 1280 / Math.max(im.width, im.height)), cv = document.createElement("canvas"); cv.width = im.width * k; cv.height = im.height * k; cv.getContext("2d").drawImage(im, 0, 0, cv.width, cv.height); URL.revokeObjectURL(u); res(cv.toDataURL("image/jpeg", .72).split(",")[1]); };
  im.onerror = () => res(null); im.src = u;
});

// نموذج الحالة السريع (الجدول + واتساب)
const form = $("caseForm");
if (form) form.addEventListener("submit", async e => {
  e.preventDefault();
  const btn = form.querySelector("button"), label = btn.textContent; btn.disabled = true; btn.textContent = "جارٍ الحفظ...";
  const fd = new FormData(form), c = Object.fromEntries(fd);
  c.att = fd.getAll("att").join("، "); delete c.im; c.status = "قيد الاستلام"; c.createdAt = new Date().toLocaleDateString("en-GB");
  const files = (await Promise.all([...$("im").files].slice(0, 4).map(shrink))).filter(Boolean);
  if (CONFIG.sheetUrl) try { const r = await fetch(CONFIG.sheetUrl, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ ...c, files }) }); const j = await r.json(); c.code = j.code; c.imgs = j.ids || []; } catch {}
  if (!c.code) { const d = new Date(); c.code = `FL-${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}-T${Math.floor(100 + Math.random() * 900)}`; if (CONFIG.sheetUrl) alert("تعذر الاتصال بالجدول، سُجّل كود مؤقت."); }
  const all = load(); all.push(c); save(all);
  const link = sheetLink(c), imgTxt = (c.imgs || []).length ? "\nصور الحالة:\n" + c.imgs.map(i => `https://drive.google.com/file/d/${i}/view`).join("\n") : "";
  const msg = `حالة جديدة - Friends Lab\nالكود: ${c.code}\nالطبيب: ${c.doctor}\nالعيادة: ${c.clinic || "-"}\nالهاتف: ${c.phone}\nنوع الحالة: ${c.type}\nاللون: ${c.shade || "-"}\nالتسليم: ${c.due || "-"}\nالمريض: ${c.patient || "-"}${c.age ? " (" + c.age + " سنة)" : ""}\nالمرفقات: ${c.att || "-"}\nملاحظات: ${c.notes || "-"}${imgTxt}\nورقة الحالة: ${link}`;
  $("codeOut").textContent = c.code; $("sheetLink").href = link; $("waLink").href = wa(CONFIG.whatsapp, msg); $("done").classList.add("on");
  form.reset(); btn.disabled = false; btn.textContent = label;
});
const tf = $("trackForm");
if (tf) tf.addEventListener("submit", async e => {
  e.preventDefault(); const q = $("trackCode").value.trim().toUpperCase();
  let s = (load().find(x => x.code === q) || {}).status;
  if (CONFIG.sheetUrl) try { s = (await (await fetch(`${CONFIG.sheetUrl}?code=${encodeURIComponent(q)}`)).json()).status || s; } catch {}
  $("trackOut").textContent = s ? `الحالة ${q}: ${s}` : "لم نجد حالة بهذا الكود. تأكد منه أو تواصل معنا.";
});
const ex = $("exportBtn");
if (ex) ex.addEventListener("click", () => {
  const all = load(); if (!all.length) return alert("لا توجد حالات محفوظة بعد.");
  const cols = ["code", "createdAt", "doctor", "clinic", "phone", "patient", "age", "gender", "type", "shade", "due", "att", "notes", "status"];
  const head = ["الكود", "التاريخ", "الطبيب", "العيادة", "الهاتف", "المريض", "العمر", "الجنس", "النوع", "اللون", "التسليم", "المرفقات", "ملاحظات", "الحالة"];
  const q = v => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob(["\uFEFF" + [head.map(q).join(","), ...all.map(r => cols.map(k => q(r[k])).join(","))].join("\n")], { type: "text/csv;charset=utf-8" }));
  a.download = "friends-lab-cases.csv"; a.click();
});
const rv = $("reviews");
if (rv) rv.innerHTML = REVIEWS.length ? REVIEWS.map(r => `<div class="card"><div class="stars">${"★".repeat(r.stars)}${"☆".repeat(5 - r.stars)}</div><p>${esc(r.text)}</p><h3 style="margin-top:8px">${esc(r.name)}</h3></div>`).join("") : '<p class="lead">كن أول طبيب يقيّم تجربته معنا.</p>';
const rf = $("reviewForm");
if (rf) rf.addEventListener("submit", e => {
  e.preventDefault(); const r = Object.fromEntries(new FormData(rf));
  if (CONFIG.sheetUrl) sheet({ kind: "review", ...r }); else window.open(wa(CONFIG.whatsapp, `تقييم Friends Lab\n${r.name} - ${r.stars} نجوم\n${r.text}`), "_blank");
  $("rthanks").textContent = "شكراً لك! سيظهر تقييمك بعد مراجعته."; rf.reset();
});
