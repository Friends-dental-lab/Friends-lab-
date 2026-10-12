const showA = id => ["gate", "panel"].forEach(x => $(x).hidden = x !== id);
let tab = "home", flt = "", CASES = [], QALL = [], rg = 30, drg = 30, CURD = "", frg = 1;
const QST = ["قيد الاستلام", "قيد العمل", "جاهزة", "سُلّمت"];
const today = () => new Date().toISOString().slice(0, 10);
const CSEL = "id,case_number,work_type,status,created_at,requested_delivery_date,ready_date,doctor_id,teeth,price,patients(name_or_code),doctors(name,clinic_name)";
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
  try { $("av").innerHTML = await ({ home: tHome, cases: tCases, doctors: tDoctors, pickups: tPickups, quick: tQuick, invites: tInvites, help: tHelp, accounts: tAccounts, finance: tFinance }[tab])(); } catch (e) { $("av").innerHTML = '<p class="err">تعذر التحميل. أعد المحاولة.</p>'; }
}
async function tHome() {
  const [{ data: cs }, { data: ds }, { data: pk }] = await Promise.all([sb.from("cases").select(CSEL).order("created_at", { ascending: false }), sb.from("doctors").select("id,name,clinic_name,phone,status"), sb.from("pickup_requests").select("*,doctors(name,clinic_name)").eq("status", "new")]);
  const n = (...s) => cs.filter(c => s.includes(c.status)).length, L = cs.filter(late), pend = ds.filter(d => d.status === "pending");
  const body = sec("حسابات بانتظار الاعتماد", pend, d => `<div class="cc"><div class="r"><b>${esc(d.clinic_name) || esc(d.name)}</b></div><p>د. ${esc(d.name)} · <span dir="ltr">${esc(d.phone)}</span></p><div class="btns" style="margin-top:8px"><button class="btn sm" data-ap="${d.id}" data-s="approved">اعتماد</button><button class="btn ghost sm" data-did="${d.id}">عرض</button></div></div>`) +
    sec("حالات جديدة", cs.filter(c => c.status === "sent"), ccA) + sec("حالات متأخرة", L, ccA) +
    sec("طلبات استلام جديدة", pk, r => `<div class="cc"><div class="r"><b>${esc(r.doctors?.clinic_name)}</b><span class="bd pk_new">${PK[r.status]}</span></div><p>${esc(r.address)} · ${r.cases_count} حالة · ${esc(r.preferred_time)}</p></div>`);
  const R = cs.filter(c => c.created_at >= new Date(Date.now() - rg * 864e5).toISOString()), ms = monthsBack(6), bm = cnt(cs, c => c.created_at.slice(0, 7)), top = {};
  R.forEach(c => { (top[c.doctor_id] = top[c.doctor_id] || { l: c.doctors?.clinic_name || c.doctors?.name, v: 0, a: c.doctor_id }).v++; });
  const charts = `<div class="tabs">${[[7, "7 أيام"], [30, "30 يوماً"], [180, "6 أشهر"]].map(([d, t]) => `<button data-rg="${d}" class="${rg === d ? "on" : ""}">${t}</button>`).join("")}</div>
<div class="chart"><h3>توزيع الحالات (اضغط لعرض الحالات)</h3>${stChart(cnt(R, c => c.status), 'data-st="%S"')}</div>
<div class="chart"><h3>الحالات الواردة شهرياً</h3>${bars(ms.map(m => ({ l: MN(m), v: bm[m] || 0 })))}</div>
<div class="chart"><h3>أكثر العيادات نشاطاً (اضغط لفتح العيادة)</h3>${bars(Object.values(top).sort((a, b) => b.v - a.v).slice(0, 5), "data-did")}</div>
<div class="chart"><h3>أنواع الأعمال</h3>${bars(Object.entries(cnt(R, c => c.work_type)).sort((a, b) => b[1] - a[1]).map(([l, v]) => ({ l, v })))}</div>`;
  return `<div class="stats">${st("حالات جديدة", n("sent"))}${st("قيد التنفيذ", n("received", "in_progress", "review"))}${st("جاهزة", n("ready"), "ok")}${st("متأخرة", L.length)}${st("أطباء معتمدون", ds.filter(d => d.status === "approved").length)}${st("حالات هذا الشهر", cs.filter(c => c.created_at.slice(0, 7) === today().slice(0, 7)).length)}</div>${charts}<h2>تحتاج إجراء الآن</h2>` + (body || '<p class="lead">لا يوجد ما يحتاج إجراء الآن.</p>');
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
<form id="stF" data-cid="${c.id}" class="card"><div class="f2"><label>الحالة<select name="s">${ORDER.map(s => `<option value="${s}"${s === c.status ? " selected" : ""}>${ST[s]}</option>`).join("")}</select></label><label>موعد الجاهزية<input type="date" name="r" value="${c.ready_date || ""}"></label><label class="full">السعر (بالعملة المعتمدة)<input type="number" min="0" step="any" name="pr" value="${c.price ?? ""}"></label></div><button class="btn" style="margin-top:12px">تحديث الحالة</button></form>
<h3 class="sh">مراحل الحالة</h3><ul class="tl">${x.tl}</ul><h3 class="sh">المرفقات</h3><div class="files">${x.fl}</div><h3 class="sh">ملاحظات الحالة</h3>${x.nt}<form id="noteF" data-cid="${c.id}"><textarea name="m" required placeholder="اكتب ملاحظة للطبيب"></textarea><button class="btn sm" style="margin-top:8px">إرسال الملاحظة</button></form><button class="btn ghost danger" style="margin-top:22px" data-adel="cases:${c.id}">حذف الحالة نهائياً</button>`;
}
async function tDoctors() {
  const { data } = await sb.from("doctors").select("*").order("created_at", { ascending: false });
  return '<input id="q" placeholder="ابحث عن عيادة أو طبيب" style="margin-bottom:10px">' + (data.map(d => `<div class="cc" data-did="${d.id}" style="cursor:pointer"><div class="r"><b>${esc(d.clinic_name) || esc(d.name)}</b>${dbd(d.status)}</div><p>د. ${esc(d.name)} · ${esc(d.specialty)} · <span dir="ltr">${esc(d.phone)}</span> · ${esc(d.area)}</p>${dBtns(d)}</div>`).join("") || '<p class="lead">لا يوجد أطباء بعد.</p>');
}
async function tDoctor(id) {
  CURD = id;
  const [{ data: d }, { data: cs }, { data: ps }] = await Promise.all([sb.from("doctors").select("*").eq("id", id).single(), sb.from("cases").select(CSEL).eq("doctor_id", id).order("created_at", { ascending: false }), sb.from("lab_payments").select("*").eq("doctor_id", id).order("created_at", { ascending: false })]);
  const L = ledger(cs, ps), since = drg ? new Date(Date.now() - drg * 864e5).toISOString() : "", T = byType(cs.filter(c => c.created_at >= since)), ms = monthsBack(6), bm = {};
  cs.forEach(c => { const k = c.created_at.slice(0, 7); bm[k] = (bm[k] || 0) + pcs(c); });
  return `<button class="btn ghost sm" data-back>رجوع</button><div class="ph-head" style="margin-top:12px"><div class="ph-clinic">${d.logo_url ? `<img src="${esc(d.logo_url)}" alt="">` : '<span class="ph-ph">شعار العيادة</span>'}<div><b>${esc(d.clinic_name)}</b><br><small>د. ${esc(d.name)}</small></div></div>${dbd(d.status)}</div>
<div class="card"><p>الهاتف: <span dir="ltr">${esc(d.phone)}</span></p><p>الاختصاص: ${esc(d.specialty) || "—"}</p><p>العنوان: ${esc(d.address) || "—"} ${esc(d.area)}</p><p>تاريخ التسجيل: ${D(d.created_at)}</p>${dBtns(d)}</div>
<h3 class="sh">الحساب مع المخبر</h3><div class="stats">${st("إجمالي المستحق", money(L.due))}${st("المدفوع", money(L.paid), "ok")}${st("المتبقي عليه", money(L.left))}</div>${L.unpriced ? `<p class="lead">${L.unpriced} حالة بلا سعر بعد. حدّد السعر من تفاصيل كل حالة.</p>` : ""}
<form id="lpF" data-did2="${id}" class="card"><div class="f2"><label>المبلغ المدفوع<input name="a" type="number" min="1" step="any" required></label><label>ملاحظة<input name="n"></label></div><button class="btn sm" style="margin-top:10px">تسجيل دفعة من الطبيب</button></form>
${ps.map(p => `<div class="cc"><div class="r"><b>${money(p.amount)}</b><small>${D(p.created_at)}</small></div><p>${esc(p.note)}</p><div class="btns" style="margin-top:6px"><button class="btn ghost sm danger" data-adel="lab_payments:${p.id}">حذف</button></div></div>`).join("")}
<h3 class="sh">ما أخذه الطبيب</h3><div class="tabs">${[[30, "30 يوماً"], [180, "6 أشهر"], [0, "الكل"]].map(([x, t]) => `<button data-drg="${x}" class="${drg === x ? "on" : ""}">${t}</button>`).join("")}</div>
${T[0] ? `<p class="lead">أكثر ما يطلبه: ${esc(T[0].l)} (${T[0].v} قطعة)</p>` : ""}<div class="chart"><h3>عدد القطع حسب النوع</h3>${bars(T.map(x => ({ l: x.l, v: x.v })))}</div>
${T.map(x => `<div class="cc"><div class="r"><b>${esc(x.l)}</b><span class="bd sent">${x.v} قطعة</span></div><p>${x.n} حالة · القيمة ${money(x.val)}</p></div>`).join("")}
<div class="chart"><h3>القطع شهرياً</h3>${bars(ms.map(m => ({ l: MN(m), v: bm[m] || 0 })))}</div>
<h3 class="sh">حالات العيادة</h3>${cs.map(ccA).join("") || '<p class="lead">لا توجد حالات.</p>'}`;
}
async function tAccounts() {
  const [{ data: cs }, { data: ps }, { data: ds }] = await Promise.all([sb.from("cases").select("doctor_id,work_type,teeth,price,created_at"), sb.from("lab_payments").select("doctor_id,amount"), sb.from("doctors").select("id,name,clinic_name")]);
  const rows = ds.map(d => { const c = cs.filter(x => x.doctor_id === d.id); return { d, L: ledger(c, ps.filter(p => p.doctor_id === d.id)), n: c.reduce((s, x) => s + pcs(x), 0) }; }).filter(r => r.n || r.L.paid).sort((a, b) => b.L.left - a.L.left), T = ledger(cs, ps);
  return `<h2>حسابات الأطباء</h2><div class="stats">${st("إجمالي المستحق", money(T.due))}${st("المدفوع", money(T.paid), "ok")}${st("المتبقي عند الأطباء", money(T.left))}${st("حالات بلا سعر", T.unpriced)}</div>
<div class="chart"><h3>القطع حسب النوع (كل الأطباء)</h3>${bars(byType(cs).map(x => ({ l: x.l, v: x.v })))}</div>
<div class="chart"><h3>المتبقي على كل طبيب (اضغط لفتح الحساب)</h3>${bars(rows.filter(r => r.L.left > 0).slice(0, 8).map(r => ({ l: r.d.clinic_name || r.d.name, v: Math.round(r.L.left), t: money(r.L.left), a: r.d.id })), "data-did")}</div>
<input id="q" placeholder="ابحث عن عيادة أو طبيب" style="margin:10px 0">` + (rows.map(r => `<div class="cc" data-did="${r.d.id}" style="cursor:pointer"><div class="r"><b>${esc(r.d.clinic_name) || esc(r.d.name)}</b><span class="bd ${r.L.left > 0 ? "pk_cancelled" : "ready"}">متبقٍ ${money(r.L.left)}</span></div><p>${r.n} قطعة · مستحق ${money(r.L.due)} · مدفوع ${money(r.L.paid)}</p></div>`).join("") || '<p class="lead">لا توجد حسابات بعد.</p>');
}
const CATS = ["مواد", "رواتب", "إيجار وكهرباء", "معدات وصيانة", "أخرى"];
async function tFinance() {
  const [{ data: ex }, { data: lp }, { data: cs }] = await Promise.all([sb.from("lab_expenses").select("*").order("spent_on", { ascending: false }), sb.from("lab_payments").select("amount,created_at"), sb.from("cases").select("price")]);
  const now = new Date(), from = frg === 0 ? "" : new Date(now.getFullYear(), now.getMonth() - (frg - 1), 1).toISOString().slice(0, 10);
  const E = ex.filter(x => x.spent_on >= from), Pm = lp.filter(x => x.created_at.slice(0, 10) >= from);
  const inc = Pm.reduce((s, x) => s + +x.amount, 0), out = E.reduce((s, x) => s + +x.amount, 0), net = inc - out, due = cs.reduce((s, c) => s + (+c.price || 0), 0) - lp.reduce((s, x) => s + +x.amount, 0);
  const cat = {}, im = {}, em = {}, ms = monthsBack(6);
  E.forEach(x => cat[x.category] = (cat[x.category] || 0) + +x.amount);
  lp.forEach(x => { const k = x.created_at.slice(0, 7); im[k] = (im[k] || 0) + +x.amount; });
  ex.forEach(x => { const k = x.spent_on.slice(0, 7); em[k] = (em[k] || 0) + +x.amount; });
  return `<h2>المالية</h2><p class="lead">ما قبضته من الأطباء، وما صرفته، والصافي. سجّل المبالغ بعملة واحدة ثابتة.</p>
<div class="tabs">${[[1, "هذا الشهر"], [6, "6 أشهر"], [0, "الكل"]].map(([x, t]) => `<button data-frg="${x}" class="${frg === x ? "on" : ""}">${t}</button>`).join("")}</div>
<div class="stats">${st("المقبوض من الأطباء", money(inc), "ok")}${st("المصروفات", money(out))}${st("الصافي", money(net), net >= 0 ? "ok" : "")}${st("المتبقي عند الأطباء", money(due))}</div>
<div class="chart"><h3>المصروفات حسب النوع</h3>${bars(Object.entries(cat).sort((a, b) => b[1] - a[1]).map(([l, v]) => ({ l, v: Math.round(v), t: money(v) })))}</div>
<div class="chart"><h3>المقبوض شهرياً</h3>${bars(ms.map(m => ({ l: MN(m), v: Math.round(im[m] || 0), t: money(im[m] || 0) })))}</div>
<div class="chart"><h3>المصروفات شهرياً</h3>${bars(ms.map(m => ({ l: MN(m), v: Math.round(em[m] || 0), t: money(em[m] || 0) })))}</div>
<h3 class="sh">تسجيل مصروف</h3><form id="exF" class="card"><div class="f2"><label>المبلغ<input name="a" type="number" min="1" step="any" required></label><label>النوع<select name="c">${CATS.map(c => `<option>${c}</option>`).join("")}</select></label><label>التاريخ<input name="d" type="date" value="${today()}"></label><label>ملاحظة<input name="n"></label></div><button class="btn sm" style="margin-top:10px">حفظ المصروف</button></form>
<h3 class="sh">آخر المصروفات</h3>` + (ex.slice(0, 20).map(x => `<div class="cc"><div class="r"><b>${money(x.amount)}</b><span class="bd">${esc(x.category)}</span></div><p>${esc(x.note)} · ${D(x.spent_on)}</p><div class="btns" style="margin-top:6px"><button class="btn ghost sm danger" data-adel="lab_expenses:${x.id}">حذف</button></div></div>`).join("") || '<p class="lead">لا توجد مصروفات مسجلة.</p>');
}
async function tPickups() {
  const { data } = await sb.from("pickup_requests").select("*,doctors(name,clinic_name)").order("created_at", { ascending: false });
  return data.map(r => `<div class="cc"><div class="r"><b>${esc(r.doctors?.clinic_name)}</b><span class="bd pk_${r.status}">${PK[r.status]}</span></div><p>د. ${esc(r.doctors?.name)} · ${esc(r.address)} · <span dir="ltr">${esc(r.phone)}</span></p><p>${r.cases_count} حالة · ${esc(r.preferred_time)} ${esc(r.notes)}</p><select data-pk="${r.id}" style="margin-top:8px">${Object.entries(PK).map(([k, v]) => `<option value="${k}"${k === r.status ? " selected" : ""}>${v}</option>`).join("")}</select> <button class="btn ghost sm danger" data-adel="pickup_requests:${r.id}">حذف الطلب</button></div>`).join("") || '<p class="lead">لا توجد طلبات.</p>';
}
async function tQuick() {
  QALL = load();
  if (CONFIG.sheetUrl) try { const r = await (await fetch(CONFIG.sheetUrl)).json(), m = new Map(QALL.map(c => [c.code, c])); r.forEach(c => m.set(c.code, { ...m.get(c.code), ...c })); QALL = [...m.values()]; } catch {}
  return '<h2>الحالات السريعة (بدون حساب)</h2><p class="lead">الحالات المرسلة من النموذج السريع، من الجدول.</p>' + (QALL.slice().reverse().map(c => `<div class="cc"><div class="r"><b dir="ltr">${esc(c.code)}</b><span class="bd">${esc(c.status)}</span></div><p>${esc(c.doctor)} · ${esc(c.type)} · ${esc(c.due) || "—"}</p><div class="btns" style="margin-top:8px"><select data-q="${esc(c.code)}">${QST.map(s => `<option${s === c.status ? " selected" : ""}>${s}</option>`).join("")}</select><a class="btn ghost sm" target="_blank" href="case.html#${enc(c)}">الورقة</a><a class="btn wa sm" target="_blank" rel="noopener" href="${wa(intl(c.phone), `مرحباً د. ${c.doctor}، حالتك رقم ${c.code} (${c.type}): ${c.status}. Friends Lab`)}">إشعار</a>${imgIds(c).map((i, n) => `<a class="btn ghost sm" target="_blank" href="https://drive.google.com/file/d/${i}/view">صورة ${n + 1}</a>`).join("")}</div></div>`).join("") || '<p class="lead">لا توجد حالات.</p>');
}
async function tHelp() { return chatView("مساعد الإدارة: يلخّص حالاتك الأخيرة ويساعد في صياغة الردود. قد يخطئ، فراجع قبل الإرسال."); }
async function tInvites() {
  const { data } = await sb.from("invites").select("*").order("created_at", { ascending: false });
  return `<h2>رموز الدعوة</h2><p class="lead">أعطِ الطبيب رمزاً أو QR، فيُعتمد حسابه فوراً عند التسجيل. لكل رمز عدد استخدامات محدود.</p><form id="invF" class="card"><div class="f2"><label>الاسم (عيادة أو منطقة)<input name="l" required></label><label>عدد الاستخدامات<input name="m" type="number" min="1" value="5"></label></div><button class="btn sm" style="margin-top:10px">إنشاء رمز</button></form>` +
    (data.map(i => `<div class="cc"><div class="r"><b dir="ltr">${esc(i.code)}</b><span class="bd ${i.active ? "ready" : "pk_cancelled"}">${i.uses}/${i.max_uses}${i.active ? "" : " · معطّل"}</span></div><p>${esc(i.label)}</p><div class="btns" style="margin-top:8px"><button class="btn sm" data-qr="${esc(i.code)}">QR</button><button class="btn ghost sm" data-iv="${esc(i.code)}" data-on="${i.active ? 1 : 0}">${i.active ? "تعطيل" : "تفعيل"}</button><button class="btn ghost sm danger" data-adel="invites:${esc(i.code)}">حذف</button></div><div style="text-align:center;margin-top:8px"></div></div>`).join("") || '<p class="lead">لا توجد رموز بعد.</p>');
}
function showQr(code, box) {
  const url = new URL("doctor.html", location.href).href + "?invite=" + code;
  box.innerHTML = ""; new QRCode(box, { text: url, width: 200, height: 200 });
  setTimeout(() => { const img = box.querySelector("img"); box.insertAdjacentHTML("beforeend", `${img ? `<p><a class="btn sm" download="invite-${code}.png" href="${img.src}">تنزيل صورة QR</a></p>` : ""}<p dir="ltr" style="font-size:12px;word-break:break-all">${url}</p>`); }, 200);
}
const av = $("av");
$("tabs").onclick = e => { const b = e.target.closest("button[data-t]"); if (b) { tab = b.dataset.t; go(); } };
av.oninput = e => { if (e.target.id === "q") document.querySelectorAll("#av .cc").forEach(c => c.hidden = !c.textContent.includes(e.target.value)); };
av.onclick = async e => {
  const t = e.target;
  const adel = t.closest("[data-adel]");
  if (adel) {
    const [tb, id] = adel.dataset.adel.split(":");
    if (!["cases", "invites", "pickup_requests", "lab_payments", "lab_expenses"].includes(tb) || !confirm("هل أنت متأكد من الحذف؟ لا يمكن التراجع.")) return;
    if (tb === "cases") { const { data: f } = await sb.from("case_files").select("file_url").eq("case_id", id); if (f?.length) await sb.storage.from("case-files").remove(f.map(x => x.file_url)); }
    const { data, error } = await sb.from(tb).delete().eq(tb === "invites" ? "code" : "id", id).select();
    if (error || !data?.length) return alert("تعذر الحذف.");
    if (tb === "lab_payments") { av.innerHTML = await tDoctor(CURD); return; }
    return go();
  }
  const dg = t.closest("[data-drg]"); if (dg) { drg = +dg.dataset.drg; av.innerHTML = await tDoctor(CURD); return; }
  const fr = t.closest("[data-frg]"); if (fr) { frg = +fr.dataset.frg; return go(); }
  const rgb = t.closest("[data-rg]"); if (rgb) { rg = +rgb.dataset.rg; return go(); }
  const sgb = t.closest("[data-st]"); if (sgb) { tab = "cases"; flt = sgb.dataset.st; return go(); }
  const iv = t.closest("[data-iv]"); if (iv) { await sb.from("invites").update({ active: iv.dataset.on !== "1" }).eq("code", iv.dataset.iv); return go(); }
  const qr = t.closest("[data-qr]"); if (qr) return showQr(qr.dataset.qr, qr.parentElement.nextElementSibling);
  if (t.closest("[data-exp]")) return exportCsv();
  if (t.closest("[data-back]")) return go();
  const f = t.closest("[data-f]"); if (f) { flt = f.dataset.f; return go(); }
  const a = t.closest("[data-ap]"); if (a) { a.disabled = true; await sb.from("doctors").update({ status: a.dataset.s }).eq("id", a.dataset.ap); return go(); }
  const dd = t.closest("[data-did]"); if (dd) { av.innerHTML = '<p class="lead">جارٍ التحميل...</p>'; av.innerHTML = await tDoctor(dd.dataset.did); return window.scrollTo(0, 0); }
  const c = t.closest("[data-id]"); if (c) { av.innerHTML = '<p class="lead">جارٍ التحميل...</p>'; av.innerHTML = await tCase(c.dataset.id); window.scrollTo(0, 0); }
};
av.onsubmit = async e => {
  e.preventDefault(); const f = e.target, id = f.dataset.cid, d = Object.fromEntries(new FormData(f));
  if (f.id === "lpF") { const r = await sb.from("lab_payments").insert({ doctor_id: f.dataset.did2, amount: +d.a, note: d.n || null }); if (r.error) return alert("تعذر التسجيل."); av.innerHTML = await tDoctor(f.dataset.did2); return; }
  if (f.id === "exF") { const r = await sb.from("lab_expenses").insert({ amount: +d.a, category: d.c, note: d.n || null, spent_on: d.d || today() }); if (r.error) return alert("تعذر الحفظ."); return go(); }
  if (f.id === "chatF") { f.reset(); return chatSend(d.m, async () => { av.innerHTML = await tHelp(); window.scrollTo(0, document.body.scrollHeight); }); }
  if (f.id === "invF") { const code = Array.from(crypto.getRandomValues(new Uint8Array(6)), b => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[b % 32]).join(""), r = await sb.from("invites").insert({ code, label: d.l, max_uses: +d.m || 5 }); if (r.error) return alert("تعذر إنشاء الرمز."); return go(); }
  const r = f.id === "stF" ? await sb.from("cases").update({ status: d.s, ready_date: d.r || null, price: d.pr === "" ? null : +d.pr }).eq("id", id) : await sb.from("case_notes").insert({ case_id: id, author: "lab", message: d.m });
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
