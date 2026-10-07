const showA = id => ["gate", "panel"].forEach(x => $(x).hidden = x !== id);
let tab = "home", flt = "", CASES = [], QALL = [];
const QST = ["قيد الاستلام", "قيد العمل", "جاهزة", "سُلّمت"];
const today = () => new Date().toISOString().slice(0, 10);
const CSEL = "id,case_number,work_type,status,created_at,requested_delivery_date,ready_date,patients(name_or_code),doctors(name,clinic_name)";
const st = (t, x, c = "") => `<div class="stat ${c}"><b>${x}</b><span>${t}</span></div>`;
const late = c => c.requested_delivery_date && c.requested_delivery_date < today() && !["ready", "delivered"].includes(c.status);
const sec = (t, l, f) => l.length ? `<h3 class="sh">${t} (${l.length})</h3>${l.map(f).join("")}` : "";
const ccA = c => `<div class="cc" data-id="${c.id}" style="cursor:pointer"><div class="r"><b dir="ltr">${c.case_number}</b>${bd(c.status)}</div><p>${esc(c.doctors?.clinic_name)} · د. ${esc(c.doctors?.name)} · ${esc(c.work_type)} · ${esc(c.patients?.name_or_code)}</p><small>${D(c.created_at)}${c.requested_delivery_date ? " · مطلوبة " + D(c.requested_delivery_date) : ""}${late(c) ? " · متأخرة" : ""}</small></div>`;
const dbd = s => `<span class="bd ${s === "approved" ? "ready" : s === "pending" ? "sent" : "pk_cancelled"}">${ST_AR[s]}</span>`;
const dBtns = d => `<div class="btns" style="margin-top:8px">${d.status !== "approved" ? `<button class="btn sm" data-ap="${d.id}" data-s="approved">اعتماد</button>` : ""}${d.status !== "suspended" ? `<button class="btn ghost sm" data-ap="${d.id}" data-s="suspended">إيقاف</button>` : ""}</div>`;

async function boot() {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) return showA("gate");
  const { data: ok, error: e2 } = await sb.rpc("is_admin");
  if (!ok) { $("bad").textContent = "هذا الحساب ليس حساب إدارة." + (e2 ? " (" + e2.message + ")" : ""); await sb.auth.signOut(); return showA("gate"); }
  showA("panel"); go();
}
async function go() {
  document.querySelectorAll("#tabs button").forEach(b => b.className = b.dataset.t === tab ? "on" : "");
  $("av").innerHTML = '<p class="lead">جارٍ التحميل...</p>';
  try { $("av").innerHTML = await ({ home: tHome, cases: tCases, doctors: tDoctors, pickups: tPickups, quick: tQuick }[tab])(); } catch (e) { $("av").innerHTML = '<p class="err">تعذر التحميل. أعد المحاولة.</p>'; }
}
async function tHome() {
  const [{ data: cs }, { data: ds }, { data: pk }] = await Promise.all([sb.from("cases").select(CSEL).order("created_at", { ascending: false }), sb.from("doctors").select("id,name,clinic_name,phone,status"), sb.from("pickup_requests").select("*,doctors(name,clinic_name)").eq("status", "new")]);
  const n = (...s) => cs.filter(c => s.includes(c.status)).length, L = cs.filter(late), pend = ds.filter(d => d.status === "pending");
  const body = sec("حسابات بانتظار الاعتماد", pend, d => `<div class="cc"><div class="r"><b>${esc(d.clinic_name) || esc(d.name)}</b></div><p>د. ${esc(d.name)} · <span dir="ltr">${esc(d.phone)}</span></p><div class="btns" style="margin-top:8px"><button class="btn sm" data-ap="${d.id}" data-s="approved">اعتماد</button><button class="btn ghost sm" data-did="${d.id}">عرض</button></div></div>`) +
    sec("حالات جديدة", cs.filter(c => c.status === "sent"), ccA) + sec("حالات متأخرة", L, ccA) +
    sec("طلبات استلام جديدة", pk, r => `<div class="cc"><div class="r"><b>${esc(r.doctors?.clinic_name)}</b><span class="bd pk_new">${PK[r.status]}</span></div><p>${esc(r.address)} · ${r.cases_count} حالة · ${esc(r.preferred_time)}</p></div>`);
  return `<div class="stats">${st("حالات جديدة", n("sent"))}${st("قيد التنفيذ", n("received", "in_progress", "review"))}${st("جاهزة", n("ready"), "ok")}${st("متأخرة", L.length)}${st("أطباء معتمدون", ds.filter(d => d.status === "approved").length)}${st("حالات هذا الشهر", cs.filter(c => c.created_at.slice(0, 7) === today().slice(0, 7)).length)}</div><h2>تحتاج إجراء الآن</h2>` + (body || '<p class="lead">لا يوجد ما يحتاج إجراء الآن.</p>');
}
async function tCases() {
  const { data } = await sb.from("cases").select(CSEL).order("created_at", { ascending: false }); CASES = data;
  const chips = `<div class="tabs" style="flex-wrap:wrap"><button data-f="" class="${flt ? "" : "on"}">الكل</button>${ORDER.map(s => `<button data-f="${s}" class="${flt === s ? "on" : ""}">${ST[s]}</button>`).join("")}</div>`;
  return chips + '<div class="row" style="margin:10px 0"><input id="q" placeholder="ابحث برقم الحالة أو العيادة أو الطبيب أو المريض"><button class="btn ghost sm" data-exp>تصدير Excel</button></div>' + (data.filter(c => !flt || c.status === flt).map(ccA).join("") || '<p class="lead">لا توجد حالات.</p>');
}
function exportCsv() {
  const q = v => `"${String(v ?? "").replace(/"/g, '""')}"`, h = ["رقم الحالة", "التاريخ", "العيادة", "الطبيب", "المريض", "نوع العمل", "الحالة", "التسليم المطلوب", "الجاهزية"];
  const rows = CASES.map(c => [c.case_number, D(c.created_at), c.doctors?.clinic_name, c.doctors?.name, c.patients?.name_or_code, c.work_type, ST[c.status], c.requested_delivery_date, c.ready_date]);
  const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob(["\uFEFF" + [h, ...rows].map(r => r.map(q).join(",")).join("\n")], { type: "text/csv;charset=utf-8" })); a.download = "friends-cases.csv"; a.click();
}
async function tCase(id) {
  const { data: c } = await sb.from("cases").select("*,patients(name_or_code,phone),doctors(id,name,clinic_name,phone,address,logo_url)").eq("id", id).single();
  const x = caseHtml(c, await caseParts(id)), d = c.doctors || {};
  return `<button class="btn ghost sm" data-back>رجوع</button>
<div class="ph-head" style="margin-top:12px"><div class="ph-clinic">${d.logo_url ? `<img src="${esc(d.logo_url)}" alt="">` : '<span class="ph-ph">شعار العيادة</span>'}<div><b>${esc(d.clinic_name)}</b><br><small>د. ${esc(d.name)} · <span dir="ltr">${esc(d.phone)}</span></small></div></div><img class="ph-lab" src="assets/logo.jpg" alt="Friends Dental Lab"></div>
<h2 dir="ltr" style="text-align:right">${c.case_number}</h2>${bd(c.status)} <a class="btn ghost sm" href="case.html?id=${c.id}" target="_blank">ورقة الحالة A5</a> <button class="btn ghost sm" data-did="${d.id}">ملف العيادة</button>${info(c)}
<form id="stF" data-id="${c.id}" class="card"><div class="f2"><label>الحالة<select name="s">${ORDER.map(s => `<option value="${s}"${s === c.status ? " selected" : ""}>${ST[s]}</option>`).join("")}</select></label><label>موعد الجاهزية<input type="date" name="r" value="${c.ready_date || ""}"></label></div><button class="btn" style="margin-top:12px">تحديث الحالة</button></form>
<h3 class="sh">مراحل الحالة</h3><ul class="tl">${x.tl}</ul><h3 class="sh">المرفقات</h3><div class="files">${x.fl}</div><h3 class="sh">ملاحظات الحالة</h3>${x.nt}<form id="noteF" data-id="${c.id}"><textarea name="m" required placeholder="اكتب ملاحظة للطبيب"></textarea><button class="btn sm" style="margin-top:8px">إرسال الملاحظة</button></form>`;
}
async function tDoctors() {
  const { data } = await sb.from("doctors").select("*").order("created_at", { ascending: false });
  return '<input id="q" placeholder="ابحث عن عيادة أو طبيب" style="margin-bottom:10px">' + (data.map(d => `<div class="cc" data-did="${d.id}" style="cursor:pointer"><div class="r"><b>${esc(d.clinic_name) || esc(d.name)}</b>${dbd(d.status)}</div><p>د. ${esc(d.name)} · ${esc(d.specialty)} · <span dir="ltr">${esc(d.phone)}</span> · ${esc(d.area)}</p>${dBtns(d)}</div>`).join("") || '<p class="lead">لا يوجد أطباء بعد.</p>');
}
async function tDoctor(id) {
  const [{ data: d }, { data: cs }] = await Promise.all([sb.from("doctors").select("*").eq("id", id).single(), sb.from("cases").select(CSEL).eq("doctor_id", id).order("created_at", { ascending: false })]);
  const n = (...s) => cs.filter(c => s.includes(c.status)).length;
  return `<button class="btn ghost sm" data-back>رجوع</button><div class="ph-head" style="margin-top:12px"><div class="ph-clinic">${d.logo_url ? `<img src="${esc(d.logo_url)}" alt="">` : '<span class="ph-ph">شعار العيادة</span>'}<div><b>${esc(d.clinic_name)}</b><br><small>د. ${esc(d.name)}</small></div></div>${dbd(d.status)}</div>
<div class="card"><p>الهاتف: <span dir="ltr">${esc(d.phone)}</span></p><p>الاختصاص: ${esc(d.specialty) || "—"}</p><p>العنوان: ${esc(d.address) || "—"} ${esc(d.area)}</p><p>تاريخ التسجيل: ${D(d.created_at)}</p>${dBtns(d)}</div>
<div class="stats">${st("كل الحالات", cs.length)}${st("قيد التنفيذ", n("sent", "received", "in_progress", "review"))}${st("جاهزة", n("ready"), "ok")}${st("مسلّمة", n("delivered"))}</div><h3 class="sh">حالات العيادة</h3>${cs.map(ccA).join("") || '<p class="lead">لا توجد حالات.</p>'}`;
}
async function tPickups() {
  const { data } = await sb.from("pickup_requests").select("*,doctors(name,clinic_name)").order("created_at", { ascending: false });
  return data.map(r => `<div class="cc"><div class="r"><b>${esc(r.doctors?.clinic_name)}</b><span class="bd pk_${r.status}">${PK[r.status]}</span></div><p>د. ${esc(r.doctors?.name)} · ${esc(r.address)} · <span dir="ltr">${esc(r.phone)}</span></p><p>${r.cases_count} حالة · ${esc(r.preferred_time)} ${esc(r.notes)}</p><select data-pk="${r.id}" style="margin-top:8px">${Object.entries(PK).map(([k, v]) => `<option value="${k}"${k === r.status ? " selected" : ""}>${v}</option>`).join("")}</select></div>`).join("") || '<p class="lead">لا توجد طلبات.</p>';
}
async function tQuick() {
  QALL = load();
  if (CONFIG.sheetUrl) try { const r = await (await fetch(CONFIG.sheetUrl)).json(), m = new Map(QALL.map(c => [c.code, c])); r.forEach(c => m.set(c.code, { ...m.get(c.code), ...c })); QALL = [...m.values()]; } catch {}
  return '<h2>الحالات السريعة (بدون حساب)</h2><p class="lead">الحالات المرسلة من النموذج السريع، من الجدول.</p>' + (QALL.slice().reverse().map(c => `<div class="cc"><div class="r"><b dir="ltr">${esc(c.code)}</b><span class="bd">${esc(c.status)}</span></div><p>${esc(c.doctor)} · ${esc(c.type)} · ${esc(c.due) || "—"}</p><div class="btns" style="margin-top:8px"><select data-q="${esc(c.code)}">${QST.map(s => `<option${s === c.status ? " selected" : ""}>${s}</option>`).join("")}</select><a class="btn ghost sm" target="_blank" href="case.html#${enc(c)}">الورقة</a><a class="btn wa sm" target="_blank" rel="noopener" href="${wa(intl(c.phone), `مرحباً د. ${c.doctor}، حالتك رقم ${c.code} (${c.type}): ${c.status}. Friends Lab`)}">إشعار</a>${imgIds(c).map((i, n) => `<a class="btn ghost sm" target="_blank" href="https://drive.google.com/file/d/${i}/view">صورة ${n + 1}</a>`).join("")}</div></div>`).join("") || '<p class="lead">لا توجد حالات.</p>');
}
const av = $("av");
$("tabs").onclick = e => { const b = e.target.closest("button[data-t]"); if (b) { tab = b.dataset.t; go(); } };
av.oninput = e => { if (e.target.id === "q") document.querySelectorAll("#av .cc").forEach(c => c.hidden = !c.textContent.includes(e.target.value)); };
av.onclick = async e => {
  const t = e.target;
  if (t.closest("[data-exp]")) return exportCsv();
  if (t.closest("[data-back]")) return go();
  const f = t.closest("[data-f]"); if (f) { flt = f.dataset.f; return go(); }
  const a = t.closest("[data-ap]"); if (a) { a.disabled = true; await sb.from("doctors").update({ status: a.dataset.s }).eq("id", a.dataset.ap); return go(); }
  const dd = t.closest("[data-did]"); if (dd) { av.innerHTML = '<p class="lead">جارٍ التحميل...</p>'; av.innerHTML = await tDoctor(dd.dataset.did); return window.scrollTo(0, 0); }
  const c = t.closest("[data-id]"); if (c) { av.innerHTML = '<p class="lead">جارٍ التحميل...</p>'; av.innerHTML = await tCase(c.dataset.id); window.scrollTo(0, 0); }
};
av.onsubmit = async e => {
  e.preventDefault(); const f = e.target, id = f.dataset.id, d = Object.fromEntries(new FormData(f));
  const r = f.id === "stF" ? await sb.from("cases").update({ status: d.s, ready_date: d.r || null }).eq("id", id) : await sb.from("case_notes").insert({ case_id: id, author: "lab", message: d.m });
  if (r.error) return alert("تعذر الحفظ. حاول مرة أخرى.");
  av.innerHTML = await tCase(id);
};
av.onchange = async e => {
  const s = e.target;
  if (s.dataset.pk) { const r = await sb.from("pickup_requests").update({ status: s.value }).eq("id", s.dataset.pk); if (r.error) alert("تعذر الحفظ."); }
  if (s.dataset.q) {
    const c = QALL.find(x => x.code === s.dataset.q); c.status = s.value;
    const l = load(), i = l.findIndex(x => x.code === c.code); if (i > -1) { l[i].status = c.status; save(l); }
    sheet({ kind: "status", code: c.code, status: c.status });
  }
};
$("gate").onsubmit = async e => {
  e.preventDefault(); $("bad").textContent = ""; const f = new FormData(e.target);
  const { error } = await sb.auth.signInWithPassword({ email: toEmail(f.get("phone")), password: f.get("password") });
  error ? $("bad").textContent = "تعذر الدخول: " + error.message : boot();
};
$("outA").onclick = async () => { await sb.auth.signOut(); boot(); };
boot();
