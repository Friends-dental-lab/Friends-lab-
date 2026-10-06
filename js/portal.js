const show = id => ["authBox", "statusBox", "homeBox"].forEach(x => $(x).hidden = x !== id);
const err = m => $("msg").textContent = m || "";
async function boot() {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) return show("authBox");
  const { data: d, error: e1 } = await sb.from("doctors").select("*").eq("id", session.user.id).maybeSingle();
  if (!d) { await sb.auth.signOut(); show("authBox"); return err(e1 ? "تعذر تحميل الحساب: " + e1.message : "الحساب بلا ملف طبيب. أبلغ الإدارة."); }
  if (d.status === "approved") {
    $("hello").textContent = "مرحباً د. " + d.name;
    $("clinicName").textContent = d.clinic_name || "";
    $("docName").textContent = "د. " + d.name;
    if (d.logo_url) { $("clinicLogo").src = d.logo_url; $("clinicLogo").hidden = false; $("logoPh").hidden = true; }
    show("homeBox");
  } else {
    $("stMsg").textContent = d.status === "pending" ? "حسابك بانتظار اعتماد Friends. سنتواصل معك قريباً." : "هذا الحساب موقوف. تواصل مع Friends.";
    show("statusBox");
  }
}
$("tLogin").onclick = () => { $("loginForm").hidden = false; $("regForm").hidden = true; $("tLogin").className = "on"; $("tReg").className = ""; err(); };
$("tReg").onclick = () => { $("loginForm").hidden = true; $("regForm").hidden = false; $("tReg").className = "on"; $("tLogin").className = ""; err(); };
$("loginForm").onsubmit = async e => {
  e.preventDefault(); err();
  const f = new FormData(e.target);
  const { error } = await sb.auth.signInWithPassword({ email: toEmail(f.get("phone")), password: f.get("password") });
  error ? err("تعذر الدخول: " + error.message) : boot();
};
$("regForm").onsubmit = async e => {
  e.preventDefault(); err();
  const btn = e.target.querySelector("button"); btn.disabled = true; btn.textContent = "جاري إنشاء الحساب...";
  const f = Object.fromEntries(new FormData(e.target));
  const { data, error } = await sb.auth.signUp({ email: toEmail(f.phone), password: f.password, options: { data: { name: f.name, phone: f.phone, specialty: f.specialty, clinic_name: f.clinic_name, address: f.address, area: f.area } } });
  btn.disabled = false; btn.textContent = "إنشاء حساب";
  if (error) return err(/registered/i.test(error.message) ? "هذا الرقم مسجل مسبقاً، سجّل الدخول." : "تعذر إنشاء الحساب: " + error.message);
  const file = $("logoFile").files[0];
  if (file && data.session) {
