const showA = id => ["gate", "panel"].forEach(x => $(x).hidden = x !== id);
async function boot() {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) return showA("gate");
  const { data: ok } = await sb.rpc("is_admin");
  if (!ok) { $("bad").textContent = "هذا الحساب ليس حساب إدارة."; await sb.auth.signOut(); return showA("gate"); }
  showA("panel"); load();
}
async function load() {
  const { data, error } = await sb.from("doctors").select("*").order("created_at", { ascending: false });
  if (error) return $("rows").innerHTML = '<tr><td colspan="6">تعذر تحميل البيانات.</td></tr>';
  $("rows").innerHTML = data.map(d => `<tr><td>${esc(d.name)}</td><td>${esc(d.clinic_name)}</td><td dir="ltr">${esc(d.phone)}</td><td>${esc(d.area)}</td><td>${ST_AR[d.status]}</td>
<td>${d.status !== "approved" ? `<button class="btn sm" data-id="${d.id}" data-s="approved">اعتماد</button>` : ""} ${d.status !== "suspended" ? `<button class="btn ghost sm" data-id="${d.id}" data-s="suspended">إيقاف</button>` : ""}</td></tr>`).join("") || '<tr><td colspan="6">لا يوجد أطباء بعد.</td></tr>';
}
$("rows").onclick = async e => {
  const b = e.target.closest("button[data-id]"); if (!b) return;
  b.disabled = true;
  await sb.from("doctors").update({ status: b.dataset.s }).eq("id", b.dataset.id);
  load();
};
$("gate").onsubmit = async e => {
  e.preventDefault(); $("bad").textContent = "";
  const f = new FormData(e.target);
  const { error } = await sb.auth.signInWithPassword({ email: toEmail(f.get("phone")), password: f.get("password") });
  error ? $("bad").textContent = "رقم الهاتف أو كلمة المرور غير صحيحة." : boot();
};
$("outA").onclick = async () => { await sb.auth.signOut(); boot(); };
boot();
