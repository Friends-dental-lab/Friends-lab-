const show = id => ["authBox", "statusBox", "homeBox"].forEach(x => $(x).hidden = x !== id);
const err = m => $("msg").textContent = m || "";
async function boot() {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) return show("authBox");
  const { data: d } = await sb.from("doctors").select("*").eq("id", session.user.id).maybeSingle();
  if (!d) { await sb.auth.signOut(); return show("authBox"); }
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
  error ? err("رقم الهاتف أو كلمة المرور غير صحيحة.") : boot();
};
$("regForm").onsubmit = async e => {
  e.preventDefault(); err();
  const btn = e.target.querySelector("button"); btn.disabled = true; btn.textContent = "جاري إنشاء الحساب...";
  const f = Object.fromEntries(new FormData(e.target));
  const { data, error } = await sb.auth.signUp({ email: toEmail(f.phone), password: f.password, options: { data: { name: f.name, phone: f.phone, specialty: f.specialty, clinic_name: f.clinic_name, address: f.address, area: f.area } } });
  btn.disabled = false; btn.textContent = "إنشاء حساب";
  if (error) return err(/registered/i.test(error.message) ? "هذا الرقم مسجل مسبقاً، سجّل الدخول." : "تعذر إنشاء الحساب. تحقق من البيانات وحاول مرة أخرى.");
  const file = $("logoFile").files[0];
  if (file && data.session) {
    const path = `${data.user.id}/logo-${Date.now()}.${file.name.split(".").pop().toLowerCase()}`;
    const up = await sb.storage.from("clinic-logos").upload(path, file);
    if (!up.error) await sb.from("doctors").update({ logo_url: sb.storage.from("clinic-logos").getPublicUrl(path).data.publicUrl }).eq("id", data.user.id);
  }
  boot();
};
["out1", "out2"].forEach(i => $(i).onclick = async () => { await sb.auth.signOut(); boot(); });
boot();
