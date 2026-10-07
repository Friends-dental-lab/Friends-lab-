const SB_URL = "https://twirzkwvgdpqprbinosk.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3aXJ6a3d2Z2RwcXByYmlub3NrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEyMzk2NjgsImV4cCI6MjEwNjgxNTY2OH0.jGCo6I0GO0fpi9JDTwlU7uMNlCmcUCjgJ2ARs7bQpvA"; // مفتاح عام (anon)، الحماية من قواعد RLS
const sb = supabase.createClient(SB_URL, SB_KEY);
// رقم الهاتف يتحول إلى بريد داخلي للدخول
const toEmail = p => { p = String(p).replace(/\D/g, ""); if (p.startsWith("0")) p = CONFIG.country + p.slice(1); return p + "@doctor.friendslab.app"; };
const ST_AR = { pending: "جديد (بانتظار الاعتماد)", approved: "معتمد", suspended: "موقوف" };
// ===== مشترك بين بوابة الطبيب والإدارة =====
const ST = { sent: "تم إرسال الطلب", received: "تم استلام الحالة", in_progress: "قيد التنفيذ", review: "بانتظار مراجعة الطبيب", ready: "جاهزة", delivered: "تم التسليم" }, ORDER = Object.keys(ST);
const PK = { new: "بانتظار التأكيد", confirmed: "تم التأكيد", on_way: "في الطريق", picked: "تم الاستلام", cancelled: "ملغى" };
const D = d => new Date(d).toLocaleDateString("en-GB");
const DT = d => new Date(d).toLocaleString("en-GB", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
const bd = s => `<span class="bd ${s}">${ST[s]}</span>`;
const info = c => `<div class="card" style="margin:14px 0"><p>المريض: ${esc(c.patients?.name_or_code)}</p><p>نوع العمل: ${esc(c.work_type)}</p><p>الأسنان: ${(c.teeth || []).join("، ") || "—"}</p><p>اللون: ${esc(c.shade) || "—"}</p><p>المادة: ${esc(c.material) || "—"}</p><p>التسليم المطلوب: ${c.requested_delivery_date ? D(c.requested_delivery_date) : "—"}</p><p>موعد الجاهزية: ${c.ready_date ? D(c.ready_date) : "لم يُحدد بعد"}</p><p>ملاحظات الطبيب: ${esc(c.notes) || "—"}</p></div>`;
async function caseParts(id) {
  const q = t => sb.from(t).select("*").eq("case_id", id);
  const [h, f, n] = await Promise.all([q("case_status_history").order("created_at"), q("case_files"), q("case_notes").order("created_at")]);
  const files = f.data || [];
  const urls = await Promise.all(files.map(x => sb.storage.from("case-files").createSignedUrl(x.file_url, 3600)));
  return { h: h.data || [], f: files, n: n.data || [], urls };
}
function caseHtml(c, p) {
  const hs = Object.fromEntries(p.h.map(x => [x.status, x.created_at])), cur = ORDER.indexOf(c.status);
  return {
    tl: ORDER.map((s, i) => `<li class="${i < cur ? "done" : i == cur ? "cur" : ""}"><i></i><b>${ST[s]}</b>${hs[s] ? `<small>${DT(hs[s])}</small>` : ""}</li>`).join(""),
    fl: p.f.map((x, i) => { const u = p.urls[i].data?.signedUrl || "#"; return (x.file_type || "").startsWith("image") ? `<a href="${u}" target="_blank" rel="noopener"><img src="${u}" alt=""></a>` : `<a class="btn ghost sm" href="${u}" target="_blank" rel="noopener">ملف PDF</a>`; }).join("") || '<p class="lead">لا توجد مرفقات.</p>',
    nt: p.n.map(x => `<div class="note ${x.author}"><small>${x.author === "lab" ? "المخبر" : "الطبيب"} · ${DT(x.created_at)}</small><p>${esc(x.message)}</p></div>`).join("")
  };
}
