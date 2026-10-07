const showA = id => ["gate", "panel"].forEach(x => $(x).hidden = x !== id);
let tab = "cases", flt = "";
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
  try { $("av").innerHTML = await ({ cases: tCases, doctors: tDoctors, pickups: tPickups }[tab])(); } catch (e) { $("av").innerHTML = '<p class="err">تعذر التحميل. أعد المحاولة.</p>'; }
}
async function tCases() {
  const [{ data }, pk] = await Promise.all([sb.from("cases").select("id,case_number,work_type,status,created_at,patients(name_or_code),doctors(name,clinic_name)").order("created_at", { ascending: false }), sb.from("pickup_requests").select("id", { count: "exact", head: true }).eq("status", "new")]);
  const n = (...s) => data.filter(c => s.includes(c.status)).length, st = (t, x) => `<div class="stat"><b>${x}</b><span>${t}</span></div>`;
  const chips = `<div class="tabs" style="flex-wrap:wrap"><button data-f="" class="${flt ? "" : "on"}">الكل</button>${ORDER.map(s => `<button data-f="${s}" class="${flt === s ? "on" : ""}">${ST[s]}</button>`).join("")}</div>`;
  return `<div class="stats">${st("حالات جديدة", n("sent"))}${st("قيد التنفيذ", n("received", "in_progress", "review"))}${st("جاهزة", n("ready"))}${st("طلبات استلام جديدة", pk.count || 0)}</div>${chips}` +
    (data.filter(c => !flt || c.status === flt).map(c => `<div class="cc" data-id="${c.id}" style="cursor:pointer"><div class="r"><b dir="ltr">${c.case_number}</b>${bd(c.status)}</div><p>${esc(c.doctors?.clinic_name)} · د. ${esc(c.doctors?.name)} · ${esc(c.work_type)} · ${esc(c.patients?.name_or_code)}</p><small>${D(c.created_at)}</small></div>`).join("") || '<p class="lead">لا توجد حالات.</p>');
}
async function tCase(id) {
  const { data: c } = await sb.from("cases").select("*,patients(name_or_code,phone),doctors(name,clinic_name,phone,address,logo_url)").eq("id", id).single();
  const x = caseHtml(c, await caseParts(id)), d = c.doctors || {};
  return `<button class="btn ghost sm" data-back>رجوع</button>
<div class="ph-head" style="margin-top:12px"><div class="ph-clinic">${d.logo_url ? `<img src="${esc(d.logo_url)}" alt="">` : '<span class="ph-ph">شعار العيادة</span>'}<div><b>${esc(d.clinic_name)}</b><br><small>د. ${esc(d.name)} · <span dir="ltr">${esc(d.phone)}</span></small></div></div><img class="ph-lab" src="assets/logo.jpg" alt="Friends Dental Lab"></div>
<h2 dir="ltr" style="text-align:right">${c.case_number}</h2>${bd(c.status)} <a class="btn ghost sm" href="case.html?id=${c.id}" target="_blank">ورقة الحالة A5</a>${info(c)}
<form id="stF" data-id="${c.id}" class="card"><div class="f2"><label>الحالة<select name="s">${ORDER.map(s => `<option value="${s}"${s === c.status ? " selected" : ""}>${ST[s]}</option>`).join("")}</select></label><label>موعد الجاهزية<input type="date" name="r" value="${c.ready_date || ""}"></label></div><button class="btn" style="margin-top:12px">تحديث الحالة</button></form>
<h3 class="sh">مراحل الحالة</h3><ul class="tl">${x.tl}</ul><h3 class="sh">المرفقات</h3><div class="files">${x.fl}</div><h3 class="sh">ملاحظات الحالة</h3>${x.nt}<form id="noteF" data-id="${c.id}"><textarea name="m" required placeholder="اكتب ملاحظة للطبيب"></textarea><button class="btn sm" style="margin-top:8px">إرسال الملاحظة</button></form>`;
}
async function tDoctors() {
  const { data } = await sb.from("doctors").select("*").order("created_at", { ascending: false });
  return data.map(d => `<div class="cc"><div class="r"><b>${esc(d.clinic_name) || esc(d.name)}</b><span class="bd ${d.status === "approved" ? "ready" : d.status === "pending" ? "sent" : "pk_cancelled"}">${ST_AR[d.status]}</span></div><p>د. ${esc(d.name)} · ${esc(d.specialty)} · <span dir="ltr">${esc(d.phone)}</span> · ${esc(d.area)}</p><div class="btns" style="margin-top:8px">${d.status !== "approved" ? `<button class="btn sm" data-ap="${d.id}" data-s="approved">اعتماد</button>` : ""}${d.status !== "suspended" ? `<button class="btn ghost sm" data-ap="${d.id}" data-s="suspended">إيقاف</button>` : ""}</div></div>`).join("") || '<p class="lead">لا يوجد أطباء بعد.</p>';
}
async function tPickups() {
  const { data } = await sb.from("pickup_requests").select("*,doctors(name,clinic_name)").order("created_at", { ascending: false });
  return data.map(r => `<div class="cc"><div class="r"><b>${esc(r.doctors?.clinic_name)}</b><span class="bd pk_${r.status}">${PK[r.status]}</span></div><p>د. ${esc(r.doctors?.name)} · ${esc(r.address)} · <span dir="ltr">${esc(r.phone)}</span></p><p>${r.cases_count} حالة · ${esc(r.preferred_time)} ${esc(r.notes)}</p><select data-pk="${r.id}" style="margin-top:8px">${Object.entries(PK).map(([k, v]) => `<option value="${k}"${k === r.status ? " selected" : ""}>${v}</option>`).join("")}</select></div>`).join("") || '<p class="lead">لا توجد طلبات.</p>';
}
const av = $("av");
$("tabs").onclick = e => { const b = e.target.closest("button[data-t]"); if (b) { tab = b.dataset.t; go(); } };
av.onclick = async e => {
  const t = e.target;
  if (t.closest("[data-back]")) return go();
  const f = t.closest("[data-f]"); if (f) { flt = f.dataset.f; return go(); }
  const a = t.closest("[data-ap]"); if (a) { a.disabled = true; await sb.from("doctors").update({ status: a.dataset.s }).eq("id", a.dataset.ap); return go(); }
  const c = t.closest("[data-id]"); if (c) { av.innerHTML = '<p class="lead">جارٍ التحميل...</p>'; av.innerHTML = await tCase(c.dataset.id); window.scrollTo(0, 0); }
};
av.onsubmit = async e => {
  e.preventDefault(); const f = e.target, id = f.dataset.id, d = Object.fromEntries(new FormData(f));
  const r = f.id === "stF" ? await sb.from("cases").update({ status: d.s, ready_date: d.r || null }).eq("id", id) : await sb.from("case_notes").insert({ case_id: id, author: "lab", message: d.m });
  if (r.error) return alert("تعذر الحفظ. حاول مرة أخرى.");
  av.innerHTML = await tCase(id);
};
av.onchange = async e => { const s = e.target; if (s.dataset.pk) { const r = await sb.from("pickup_requests").update({ status: s.value }).eq("id", s.dataset.pk); if (r.error) alert("تعذر الحفظ."); } };
$("gate").onsubmit = async e => {
  e.preventDefault(); $("bad").textContent = ""; const f = new FormData(e.target);
  const { error } = await sb.auth.signInWithPassword({ email: toEmail(f.get("phone")), password: f.get("password") });
  error ? $("bad").textContent = "تعذر الدخول: " + error.message : boot();
};
$("outA").onclick = async () => { await sb.auth.signOut(); boot(); };
boot();
