const WORK = ["تاج", "جسر", "زيركون", "فينير", "متحرك", "تعويض آخر", "أخرى"];
const TEETH = { "أعلى يمين": [18, 17, 16, 15, 14, 13, 12, 11], "أعلى يسار": [21, 22, 23, 24, 25, 26, 27, 28], "أسفل يمين": [48, 47, 46, 45, 44, 43, 42, 41], "أسفل يسار": [31, 32, 33, 34, 35, 36, 37, 38] };
let me, draft = null, done = null, pre = "", inst = null;
addEventListener("beforeinstallprompt", e => { e.preventDefault(); inst = e; });
const show = id => ["authBox", "statusBox", "appBox"].forEach(x => $(x).hidden = x !== id);
const err = m => $("msg").textContent = m || "";
const BAD = "تعذر التحميل. تحقق من اتصال الإنترنت وحاول مرة أخرى.";
const empty = () => '<div class="card"><h3>لا توجد حالات حالياً</h3><p>أرسل أول حالة إلى Friends وابدأ بمتابعتها من هنا.</p><a class="btn" href="#/new" style="margin-top:12px">إرسال حالة جديدة</a></div>';
const SEL = "id,case_number,work_type,teeth,status,created_at,patients(name_or_code),ready_date";
const cc = c => `<a class="cc" href="#/case/${c.id}"><div class="r"><b dir="ltr">${c.case_number}</b>${bd(c.status)}</div><p>${esc(c.patients?.name_or_code)} · ${esc(c.work_type)}${c.teeth?.length ? " · " + c.teeth.join("، ") : ""}</p><small>${D(c.created_at)}${c.ready_date ? " · جاهزة " + D(c.ready_date) : ""}</small></a>`;

async function boot() {
  document.body.classList.remove("app-mode");
  const { data: { session } } = await sb.auth.getSession();
  if (!session) return show("authBox");
  const { data: d, error: e1 } = await sb.from("doctors").select("*").eq("id", session.user.id).maybeSingle();
  if (!d) { await sb.auth.signOut(); show("authBox"); return err(e1 ? "تعذر تحميل الحساب: " + e1.message : "الحساب بلا ملف طبيب. أبلغ الإدارة."); }
  me = d;
  if (d.status !== "approved") { $("stMsg").textContent = d.status === "pending" ? "حسابك بانتظار اعتماد Friends. سنتواصل معك قريباً." : "هذا الحساب موقوف. تواصل مع Friends."; return show("statusBox"); }
  $("clinicName").textContent = d.clinic_name || ""; $("docName").textContent = "د. " + d.name;
  if (d.logo_url) { $("clinicLogo").src = d.logo_url; $("clinicLogo").hidden = false; $("logoPh").hidden = true; }
  document.body.classList.add("app-mode"); show("appBox"); route(); badge();
}
async function badge() {
  const { count } = await sb.from("notifications").select("id", { count: "exact", head: true }).eq("read", false);
  $("nb").textContent = count || ""; $("nb").hidden = !count;
}
async function route() {
  const [r, a] = (location.hash.slice(2) || "home").split("/"), v = $("view");
  document.querySelectorAll(".bn a").forEach(x => x.classList.toggle("on", x.dataset.r === ({ case: "cases", new: "cases", patient: "patients", accounts: "profile", notes: "profile", pickup: "profile" }[r] || r)));
  v.innerHTML = '<p class="lead">جارٍ التحميل...</p>';
  try { v.innerHTML = await ({ home: vHome, cases: vCases, case: () => vCase(a), new: vNew, notes: vNotes, pickup: vPickup, patients: vPatients, patient: () => vPatient(a), appts: vAppts, accounts: vAccounts, profile: vProfile }[r] || vHome)(); } catch (e) { v.innerHTML = `<p class="err">${BAD}</p>`; }
  window.scrollTo(0, 0); pre = "";
}
window.onhashchange = () => me && route();

async function vHome() {
  const { data: cs } = await sb.from("cases").select(SEL).order("created_at", { ascending: false });
  const n = (...s) => cs.filter(c => s.includes(c.status)).length, st = (t, x, c = "") => `<div class="stat ${c}"><b>${x}</b><span>${t}</span></div>`;
  return `<h2>مرحباً د. ${esc(me.name)}</h2><p class="lead">مرحباً بك في بوابة Friends Dental Lab</p>
<div class="stats">${st("الحالات الحالية", cs.length - n("delivered"))}${st("قيد التنفيذ", n("received", "in_progress", "review"))}${st("جاهزة", n("ready"), "ok")}${st("مكتملة", n("delivered"))}</div>
<div class="quick"><a href="#/new">${svg("plus")}حالة جديدة</a><a href="#/patients">${svg("users")}مريض جديد</a><a href="#/appts">${svg("cal")}موعد جديد</a><a href="#/pickup">${svg("car")}طلب استلام</a><a href="#/accounts">${svg("file")}الحسابات</a><a href="#/notes">${svg("bell")}الإشعارات</a></div>
<h3 class="sh">آخر الحالات</h3>${cs.length ? cs.slice(0, 3).map(cc).join("") : empty()}`;
}
async function vCases() {
  const { data } = await sb.from("cases").select(SEL).order("created_at", { ascending: false });
  if (!data.length) return "<h2>الأعمال مع المخبر</h2>" + empty();
  const sec = (t, f) => { const l = data.filter(f); return l.length ? `<h3 class="sh">${t} (${l.length})</h3>${l.map(cc).join("")}` : ""; };
  return `<h2>الأعمال مع المخبر</h2><p class="lead">متابعة كل حالة بينك وبين Friends: ما يحتاج مراجعتك، وما جهز، وما هو قيد العمل.</p><input id="q" placeholder="ابحث برقم الحالة أو اسم المريض أو نوع العمل" style="margin-bottom:6px">` +
    sec("بانتظار مراجعتك", c => c.status === "review") + sec("جاهزة للاستلام", c => c.status === "ready") + sec("قيد العمل عند المخبر", c => ["sent", "received", "in_progress"].includes(c.status)) + sec("تم التسليم", c => c.status === "delivered");
}
async function vCase(id) {
  const [{ data: c }, p] = await Promise.all([sb.from("cases").select("*,patients(name_or_code)").eq("id", id).single(), caseParts(id)]), x = caseHtml(c, p);
  return `<h2 dir="ltr" style="text-align:right">${c.case_number}</h2>${bd(c.status)} <a class="btn ghost sm" href="case.html?id=${c.id}" target="_blank">ورقة الحالة A5</a>${info(c)}<h3 class="sh">مراحل الحالة</h3><ul class="tl">${x.tl}</ul><h3 class="sh">المرفقات</h3><div class="files">${x.fl}</div><h3 class="sh">ملاحظات الحالة</h3>${x.nt}<form id="noteF" data-id="${c.id}"><textarea name="m" required placeholder="اكتب ملاحظة للمخبر"></textarea><button class="btn sm" style="margin-top:8px">إرسال الملاحظة</button></form>`;
}
async function vNew() {
  if (done) { const d = done; done = null; return `<div class="card"><h3>تم إرسال الحالة بنجاح</h3><p>رقم الحالة:</p><div class="code">${d.case_number}</div><p>احتفظ بهذا الرقم لاستخدامه في التواصل مع المخبر.</p><a class="btn" href="#/case/${d.id}">عرض الحالة</a></div>`; }
  if (draft?.review) return `<h2>تأكيد الحالة</h2><div class="card"><p>المريض: ${esc(draft.patient)}</p><p>نوع العمل: ${esc(draft.work)}</p><p>الأسنان: ${draft.teeth.join("، ") || "—"}</p><p>اللون: ${esc(draft.shade) || "—"}</p><p>موعد التسليم: ${draft.due || "—"}</p><p>المرفقات: ${draft.files.length}</p></div><div class="btns" style="margin-top:14px"><button class="btn" data-act="send">إرسال الحالة إلى Friends</button><button class="btn ghost" data-act="edit">تعديل</button></div><p class="err" id="nmsg"></p>`;
  const { data: ps } = await sb.from("patients").select("name_or_code").order("created_at", { ascending: false }), d = draft || { teeth: [] };
  return `<h2>إرسال حالة جديدة</h2><form id="newF"><label>المريض (اسم أو رمز)<input name="patient" list="pl" value="${esc(d.patient || pre)}" required></label><datalist id="pl">${ps.map(p => `<option value="${esc(p.name_or_code)}">`).join("")}</datalist>
<label style="margin-top:12px">نوع العمل<select name="work" required><option value="">اختر</option>${WORK.map(w => `<option${w === d.work ? " selected" : ""}>${w}</option>`).join("")}</select></label>
<label style="margin-top:12px">الأسنان المطلوبة (ترقيم FDI)</label><div class="teeth">${Object.entries(TEETH).map(([k, a]) => `<div><small>${k}</small><div class="tr">${a.map(t => `<button type="button" class="tooth${d.teeth.includes(t) ? " on" : ""}">${t}</button>`).join("")}</div></div>`).join("")}</div>
<div class="f2"><label>اللون<input name="shade" value="${esc(d.shade)}"></label><label>المادة<input name="material" value="${esc(d.material)}"></label><label class="full">موعد التسليم المطلوب<input type="date" name="due" value="${esc(d.due)}"></label></div>
<label style="margin-top:12px">تعليمات الطبيب وملاحظات<textarea name="notes">${esc(d.notes)}</textarea></label>
<label style="margin-top:12px">مرفقات (صور أو PDF، حتى 8 ميغابايت للملف)<input type="file" name="files" accept="image/jpeg,image/png,application/pdf" multiple></label>${d.files?.length ? `<p class="lead">تم اختيار ${d.files.length} ملف.</p>` : ""}
<button class="btn" style="width:100%;margin-top:16px">مراجعة الحالة</button></form>`;
}
async function send(btn) {
  btn.disabled = true; btn.textContent = "جاري إرسال الحالة...";
  try {
    const d = draft; let { data: ps } = await sb.from("patients").select("id").eq("name_or_code", d.patient).limit(1), p = ps[0];
    if (!p) { const r = await sb.from("patients").insert({ doctor_id: me.id, name_or_code: d.patient }).select("id").single(); if (r.error) throw r.error; p = r.data; }
    const { data: c, error } = await sb.from("cases").insert({ doctor_id: me.id, patient_id: p.id, work_type: d.work, teeth: d.teeth.map(String), shade: d.shade || null, material: d.material || null, notes: d.notes || null, requested_delivery_date: d.due || null }).select("id,case_number").single();
    if (error) throw error;
    for (const f of d.files) {
      const path = `${me.id}/${c.id}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${f.name.split(".").pop().toLowerCase()}`;
      const up = await sb.storage.from("case-files").upload(path, f);
      if (!up.error) await sb.from("case_files").insert({ case_id: c.id, file_url: path, file_type: f.type });
    }
    draft = null; done = c; route();
  } catch (e) { btn.disabled = false; btn.textContent = "إرسال الحالة إلى Friends"; $("nmsg").textContent = "تعذر إرسال الحالة. تحقق من اتصال الإنترنت وحاول مرة أخرى."; }
}
async function vNotes() {
  const { data } = await sb.from("notifications").select("*").order("created_at", { ascending: false }).limit(50);
  sb.from("notifications").update({ read: true }).eq("doctor_id", me.id).eq("read", false).then(badge);
  return "<h2>الإشعارات</h2>" + (data.length ? data.map(n => `<a class="nt${n.read ? "" : " un"}" href="${n.case_id ? "#/case/" + n.case_id : "#/notes"}"><b>${esc(n.title)}</b><p>${esc(n.message)}</p><small>${DT(n.created_at)}</small></a>`).join("") : '<div class="card"><h3>لا توجد إشعارات</h3><p>ستصلك هنا تحديثات حالاتك وطلبات الاستلام.</p></div>');
}
async function vPickup() {
  const { data } = await sb.from("pickup_requests").select("*").order("created_at", { ascending: false });
  return `<h2>طلب استلام من العيادة</h2><form id="pkF"><div class="f2"><label class="full">العنوان<input name="address" value="${esc(me.address)}" required></label><label>رقم الهاتف<input name="phone" value="${esc(me.phone)}" required></label><label>عدد الحالات<input name="n" type="number" min="1" value="1"></label><label class="full">الوقت المفضل<input name="t" placeholder="مثال: غداً بعد الظهر"></label><label class="full">ملاحظات<input name="notes"></label></div><button class="btn" style="width:100%;margin-top:14px">إرسال الطلب</button></form><p class="err" id="pmsg"></p><h3 class="sh">طلباتي</h3>` + (data.length ? data.map(r => `<div class="cc"><div class="r"><b>${D(r.created_at)}</b><span class="bd pk_${r.status}">${PK[r.status]}</span></div><p>${r.cases_count} حالة · ${esc(r.preferred_time)}</p></div>`).join("") : '<p class="lead">لا توجد طلبات استلام.</p>');
}

const fmtN = n => Number(n).toLocaleString("en");
async function pid(name) {
  const { data: ps } = await sb.from("patients").select("id").eq("name_or_code", name).limit(1);
  if (ps[0]) return ps[0].id;
  const r = await sb.from("patients").insert({ doctor_id: me.id, name_or_code: name }).select("id").single();
  if (r.error) throw r.error; return r.data.id;
}
const plist = ps => `<datalist id="pl">${ps.map(p => `<option value="${esc(p.name_or_code)}">`).join("")}</datalist>`;
const bal = py => py.reduce((s, x) => s + (x.kind === "charge" ? 1 : -1) * +x.amount, 0);
async function vPatients() {
  const [{ data: ps }, { data: cs }, { data: py }] = await Promise.all([sb.from("patients").select("*").order("created_at", { ascending: false }), sb.from("cases").select("patient_id"), sb.from("payments").select("patient_id,kind,amount")]);
  return `<h2>مرضاي</h2><form id="ptF" class="card"><div class="f2"><label>اسم المريض أو رمزه<input name="n" required></label><label>رقم الهاتف (اختياري)<input name="p" type="tel"></label></div><button class="btn sm" style="margin-top:10px">إضافة مريض</button></form><p class="err" id="pmsg"></p>` +
    (ps.length ? `<input id="q" placeholder="ابحث عن مريض" style="margin:12px 0">` + ps.map(p => { const b = bal(py.filter(x => x.patient_id === p.id)); return `<a class="cc" href="#/patient/${p.id}"><div class="r"><b>${esc(p.name_or_code)}</b>${b > 0 ? `<span class="bd pk_cancelled">دين ${fmtN(b)}</span>` : ""}</div><p>${cs.filter(c => c.patient_id === p.id).length} حالة${p.phone ? " · " + esc(p.phone) : ""}</p></a>`; }).join("") : '<div class="card"><h3>لا يوجد مرضى بعد</h3><p>أضف مريضك الأول، أو أرسل حالة وسيُضاف تلقائياً.</p></div>');
}
const apCard = a => `<div class="cc"><div class="r"><b>${DT(a.starts_at)}</b><span class="bd ${a.status === "done" ? "ready" : a.status === "cancelled" ? "pk_cancelled" : "sent"}">${{ scheduled: "محجوز", done: "تم", cancelled: "ملغى" }[a.status]}</span></div><p>${esc(a.patients?.name_or_code)} ${esc(a.reason)}</p>${a.status === "scheduled" ? `<div class="btns" style="margin-top:8px"><button class="btn sm" data-apx="${a.id}" data-s="done">تم</button><button class="btn ghost sm" data-apx="${a.id}" data-s="cancelled">إلغاء</button></div>` : ""}</div>`;
async function vPatient(id) {
  const [{ data: p }, { data: cs }, { data: ap }, { data: py }] = await Promise.all([sb.from("patients").select("*").eq("id", id).single(), sb.from("cases").select(SEL).eq("patient_id", id).order("created_at", { ascending: false }), sb.from("appointments").select("*,patients(name_or_code)").eq("patient_id", id).order("starts_at", { ascending: false }), sb.from("payments").select("*").eq("patient_id", id)]);
  const b = bal(py), n = esc(p.name_or_code);
  return `<a class="btn ghost sm" href="#/patients">رجوع</a><h2 style="margin-top:10px">${n}</h2><p class="lead">${esc(p.phone) || "بدون رقم هاتف"}</p>
<div class="quick"><a href="#/new" data-pt="${n}">${svg("plus")}حالة جديدة</a><a href="#/appts" data-pt="${n}">${svg("cal")}موعد</a><a href="#/accounts" data-pt="${n}">${svg("file")}دفعة</a></div>
<form id="ptEF" data-id="${p.id}"><label style="margin-top:14px">ملاحظات المريض<textarea name="notes">${esc(p.notes)}</textarea></label><button class="btn sm" style="margin-top:8px">حفظ الملاحظات</button></form>
<h3 class="sh">الحساب</h3><div class="stat ${b > 0 ? "" : "ok"}"><b>${fmtN(b)}</b><span>${b > 0 ? "دين مستحق على المريض" : "لا توجد ديون"}</span></div>
<h3 class="sh">الأعمال مع المخبر</h3>${cs.map(cc).join("") || '<p class="lead">لا توجد حالات.</p>'}<h3 class="sh">المواعيد</h3>${ap.map(apCard).join("") || '<p class="lead">لا توجد مواعيد.</p>'}`;
}
async function vAppts() {
  const [{ data: ap }, { data: ps }] = await Promise.all([sb.from("appointments").select("*,patients(name_or_code)").order("starts_at"), sb.from("patients").select("name_or_code")]);
  const today = new Date().toISOString().slice(0, 10), up = ap.filter(a => a.status === "scheduled" && a.starts_at >= today), past = ap.filter(a => !up.includes(a)).reverse();
  return `<h2>مواعيد العيادة</h2><form id="apF" class="card"><label>المريض<input name="p" list="pl" value="${esc(pre)}" required></label>${plist(ps)}<div class="f2" style="margin-top:10px"><label>التاريخ<input type="date" name="d" required></label><label>الوقت<input type="time" name="t" required></label></div><label style="margin-top:10px">سبب الموعد<input name="r"></label><button class="btn" style="width:100%;margin-top:12px">حجز الموعد</button></form><p class="err" id="amsg"></p><h3 class="sh">القادمة</h3>${up.map(apCard).join("") || '<p class="lead">لا توجد مواعيد قادمة.</p>'}<h3 class="sh">السابقة</h3>${past.slice(0, 20).map(apCard).join("")}`;
}
async function vAccounts() {
  const [{ data: py }, { data: ps }] = await Promise.all([sb.from("payments").select("*,patients(name_or_code)").order("created_at", { ascending: false }), sb.from("patients").select("name_or_code")]);
  const sum = k => py.filter(x => x.kind === k).reduce((s, x) => s + +x.amount, 0), owed = {};
  py.forEach(x => { const n = x.patients?.name_or_code || "—"; owed[n] = (owed[n] || 0) + (x.kind === "charge" ? 1 : -1) * +x.amount; });
  return `<h2>حسابات العيادة</h2><p class="lead">سجّل المبالغ بالعملة التي تعتمدها في عيادتك. هذه الحسابات خاصة بك ولا يراها المخبر.</p><div class="stats"><div class="stat"><b>${fmtN(sum("charge"))}</b><span>إجمالي الرسوم</span></div><div class="stat ok"><b>${fmtN(sum("payment"))}</b><span>المقبوض</span></div><div class="stat"><b>${fmtN(sum("charge") - sum("payment"))}</b><span>المتبقي (ديون)</span></div></div>
<form id="pyF" class="card"><label>المريض<input name="p" list="pl" value="${esc(pre)}" required></label>${plist(ps)}<div class="f2" style="margin-top:10px"><label>النوع<select name="k"><option value="charge">رسوم علاج</option><option value="payment">دفعة مقبوضة</option></select></label><label>المبلغ<input name="a" type="number" min="1" step="any" required></label></div><label style="margin-top:10px">ملاحظة<input name="n"></label><button class="btn" style="width:100%;margin-top:12px">تسجيل</button></form><p class="err" id="ymsg"></p>
<h3 class="sh">الديون</h3>${Object.entries(owed).filter(([, b]) => b > 0).map(([n, b]) => `<div class="cc"><div class="r"><b>${esc(n)}</b><span class="bd pk_cancelled">${fmtN(b)}</span></div></div>`).join("") || '<p class="lead">لا توجد ديون.</p>'}
<h3 class="sh">آخر الحركات</h3>${py.slice(0, 20).map(x => `<div class="cc"><div class="r"><b>${esc(x.patients?.name_or_code)}</b><span class="bd ${x.kind === "payment" ? "ready" : "sent"}">${x.kind === "payment" ? "دفعة" : "رسوم"} ${fmtN(x.amount)}</span></div><p>${esc(x.note)} · ${D(x.created_at)}</p></div>`).join("")}`;
}
async function vProfile() {
  return `<h2>حسابي</h2><div class="card"><h3>تثبيت التطبيق على هاتفك</h3><p>${inst ? "اضغط الزر لإضافة التطبيق إلى شاشتك الرئيسية." : "من قائمة المتصفح اختر «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية»."}</p>${inst ? '<button class="btn sm" data-act="install">تثبيت التطبيق</button>' : ""}</div><div class="quick"><a href="#/accounts">${svg("file")}الحسابات</a><a href="#/notes">${svg("bell")}الإشعارات</a><a href="#/pickup">${svg("car")}طلب استلام</a></div><h3 class="sh">هوية العيادة</h3>
<div class="ph-head"><div class="ph-clinic">${me.logo_url ? `<img src="${esc(me.logo_url)}" alt="">` : '<span class="ph-ph">شعار العيادة</span>'}<div><b>${esc(me.clinic_name)}</b></div></div><img class="ph-lab" src="assets/logo.jpg" alt="Friends Dental Lab"></div>
<form id="prF"><div class="f2"><label class="full">الاسم الكامل<input name="name" value="${esc(me.name)}" required></label><label>رقم الهاتف<input name="phone" value="${esc(me.phone)}" required></label><label>الاختصاص<input name="specialty" value="${esc(me.specialty)}"></label><label class="full">اسم العيادة<input name="clinic_name" value="${esc(me.clinic_name)}"></label><label class="full">عنوان العيادة<input name="address" value="${esc(me.address)}"></label><label>المنطقة<input name="area" value="${esc(me.area)}"></label><label>تغيير شعار العيادة<input type="file" name="logo" accept="image/png,image/jpeg,image/webp"></label></div><button class="btn" style="width:100%;margin-top:14px">حفظ التعديلات</button></form><p class="err" id="fmsg"></p><p class="lead">حالة الحساب: ${ST_AR[me.status]} (لا تُعدّل إلا من الإدارة).</p><button class="btn ghost" data-act="logout">تسجيل الخروج</button>`;
}
const v = $("view");
v.onclick = e => {
  const t = e.target;
  if (t.classList.contains("tooth")) t.classList.toggle("on");
  const pt = t.closest("[data-pt]"); if (pt) pre = pt.dataset.pt;
  const ax = t.closest("[data-apx]"); if (ax) sb.from("appointments").update({ status: ax.dataset.s }).eq("id", ax.dataset.apx).then(route);
  if (t.dataset.act === "install" && inst) inst.prompt();
  if (t.dataset.act === "logout") sb.auth.signOut().then(() => { me = null; boot(); });
  if (t.dataset.act === "send") send(t);
  if (t.dataset.act === "edit") { draft.review = false; route(); }
};
v.oninput = e => { if (e.target.id === "q") document.querySelectorAll("#view .cc").forEach(c => c.hidden = !c.textContent.includes(e.target.value)); };
v.onsubmit = async e => {
  e.preventDefault(); const f = e.target, d = Object.fromEntries(new FormData(f));
  if (f.id === "newF") {
    const files = [...f.elements.files.files];
    if (files.some(x => x.size > 8e6)) return alert("حجم أحد الملفات أكبر من 8 ميغابايت.");
    draft = { patient: d.patient.trim(), work: d.work, teeth: [...f.querySelectorAll(".tooth.on")].map(b => +b.textContent), shade: d.shade, material: d.material, due: d.due, notes: d.notes, files: files.length ? files : (draft?.files || []), review: true };
    route();
  }
  if (f.id === "ptF") { const { error } = await sb.from("patients").insert({ doctor_id: me.id, name_or_code: d.n.trim(), phone: d.p || null }); if (error) return $("pmsg").textContent = "تعذر إضافة المريض."; route(); }
  if (f.id === "ptEF") { await sb.from("patients").update({ notes: d.notes }).eq("id", f.dataset.id); route(); }
  if (f.id === "apF") { try { const id = await pid(d.p.trim()), { error } = await sb.from("appointments").insert({ doctor_id: me.id, patient_id: id, starts_at: new Date(d.d + "T" + d.t).toISOString(), reason: d.r || null }); if (error) throw error; route(); } catch { $("amsg").textContent = "تعذر حجز الموعد. حاول مرة أخرى."; } }
  if (f.id === "pyF") { try { const id = await pid(d.p.trim()), { error } = await sb.from("payments").insert({ doctor_id: me.id, patient_id: id, kind: d.k, amount: +d.a, note: d.n || null }); if (error) throw error; route(); } catch { $("ymsg").textContent = "تعذر التسجيل. حاول مرة أخرى."; } }
  if (f.id === "prF") {
    const upd = { name: d.name, phone: d.phone, specialty: d.specialty, clinic_name: d.clinic_name, address: d.address, area: d.area }, file = f.elements.logo.files[0];
    if (file) { const path = `${me.id}/logo-${Date.now()}.${file.name.split(".").pop().toLowerCase()}`, up = await sb.storage.from("clinic-logos").upload(path, file); if (!up.error) upd.logo_url = sb.storage.from("clinic-logos").getPublicUrl(path).data.publicUrl; }
    const { error } = await sb.from("doctors").update(upd).eq("id", me.id);
    if (error) return $("fmsg").textContent = "تعذر الحفظ. حاول مرة أخرى.";
    Object.assign(me, upd); $("clinicName").textContent = me.clinic_name || ""; $("docName").textContent = "د. " + me.name;
    if (me.logo_url) { $("clinicLogo").src = me.logo_url; $("clinicLogo").hidden = false; $("logoPh").hidden = true; }
    route();
  }
  if (f.id === "noteF") { await sb.from("case_notes").insert({ case_id: f.dataset.id, author: "doctor", message: d.m }); route(); }
  if (f.id === "pkF") {
    const { error } = await sb.from("pickup_requests").insert({ doctor_id: me.id, address: d.address, phone: d.phone, cases_count: +d.n || 1, preferred_time: d.t, notes: d.notes, status: "new" });
    if (error) return $("pmsg").textContent = "تعذر إرسال الطلب. حاول مرة أخرى.";
    route();
  }
};

$("tLogin").onclick = () => { $("loginForm").hidden = false; $("regForm").hidden = true; $("tLogin").className = "on"; $("tReg").className = ""; err(); };
$("tReg").onclick = () => { $("loginForm").hidden = true; $("regForm").hidden = false; $("tReg").className = "on"; $("tLogin").className = ""; err(); };
$("loginForm").onsubmit = async e => {
  e.preventDefault(); err(); const f = new FormData(e.target);
  const { error } = await sb.auth.signInWithPassword({ email: toEmail(f.get("phone")), password: f.get("password") });
  error ? err("تعذر الدخول: " + error.message) : boot();
};
$("regForm").onsubmit = async e => {
  e.preventDefault(); err(); const btn = e.target.querySelector("button"); btn.disabled = true; btn.textContent = "جاري إنشاء الحساب...";
  const f = Object.fromEntries(new FormData(e.target));
  const { data, error } = await sb.auth.signUp({ email: toEmail(f.phone), password: f.password, options: { data: { name: f.name, phone: f.phone, specialty: f.specialty, clinic_name: f.clinic_name, address: f.address, area: f.area } } });
  btn.disabled = false; btn.textContent = "إنشاء حساب";
  if (error) return err(/registered/i.test(error.message) ? "هذا الرقم مسجل مسبقاً، سجّل الدخول." : "تعذر إنشاء الحساب: " + error.message);
  const file = $("logoFile").files[0];
  if (file && data.session) {
    const path = `${data.user.id}/logo-${Date.now()}.${file.name.split(".").pop().toLowerCase()}`;
    const up = await sb.storage.from("clinic-logos").upload(path, file);
    if (!up.error) await sb.from("doctors").update({ logo_url: sb.storage.from("clinic-logos").getPublicUrl(path).data.publicUrl }).eq("id", data.user.id);
  }
  boot();
};
["out1", "out2"].forEach(i => $(i).onclick = async () => { await sb.auth.signOut(); me = null; boot(); });
boot();
