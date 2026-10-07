const ST = ["قيد الاستلام", "قيد العمل", "جاهزة", "سُلّمت"];
let all = [];
const openPanel = () => { $("gate").hidden = true; $("panel").hidden = false; run(); };
if (sessionStorage.fl_admin) openPanel();
$("gate").onsubmit = e => { e.preventDefault(); if ($("pw").value === CONFIG.adminPass) { sessionStorage.fl_admin = 1; openPanel(); } else $("bad").textContent = "كلمة السر غير صحيحة"; };
async function run() {
  all = load();
  if (CONFIG.sheetUrl) try { const r = await (await fetch(CONFIG.sheetUrl)).json(), m = new Map(all.map(c => [c.code, c])); r.forEach(c => m.set(c.code, { ...m.get(c.code), ...c })); all = [...m.values()]; } catch {}
  draw();
}
const notify = c => wa(intl(c.phone), `مرحباً د. ${c.doctor}، حالتك رقم ${c.code} (${c.type}) أصبحت جاهزة للاستلام. Friends Lab`);
function draw() {
  $("rows").innerHTML = all.slice().reverse().map(c => `<tr><td dir="ltr">${esc(c.code)}</td><td>${esc(c.doctor)}</td><td>${esc(c.type)}</td><td>${esc(c.due) || "—"}</td><td><select data-c="${esc(c.code)}">${ST.map(s => `<option${s === c.status ? " selected" : ""}>${s}</option>`).join("")}</select></td><td><a class="btn ghost" target="_blank" href="case.html#${enc(c)}">الورقة</a> <a class="btn wa" target="_blank" rel="noopener" href="${notify(c)}">إشعار</a> ${imgIds(c).map((i, n) => `<a class="btn ghost" target="_blank" href="https://drive.google.com/file/d/${i}/view">صورة ${n + 1}</a>`).join(" ")}</td></tr>`).join("") || '<tr><td colspan="6">لا توجد حالات بعد.</td></tr>';
}
$("rows").onchange = e => {
  const c = all.find(x => x.code === e.target.dataset.c); if (!c) return;
  c.status = e.target.value; const l = load(), i = l.findIndex(x => x.code === c.code); if (i > -1) { l[i].status = c.status; save(l); }
  sheet({ kind: "status", code: c.code, status: c.status }); draw();
  if (c.status === "جاهزة" && confirm("إرسال إشعار واتساب للطبيب الآن؟")) window.open(notify(c), "_blank");
};
