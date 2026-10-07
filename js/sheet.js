// ورقة الحالة A5: من رابط الجدول (#...) أو من بوابة الطبيب (?id=...)
const TYPES = ["تاج", "جسر", "تعويض متحرك", "تجميلي", "أخرى"], TYPES2 = ["تاج", "جسر", "زيركون", "فينير", "متحرك", "تعويض آخر", "أخرى"], ATT = ["صور", "طبعة", "ملفات أخرى"];
(async () => {
  let c; const id = new URLSearchParams(location.search).get("id");
  try {
    if (location.hash.length > 1) c = dec(location.hash.slice(1));
    else if (id) {
      const { data: x } = await sb.from("cases").select("*,patients(name_or_code),doctors(name,phone,clinic_name,logo_url)").eq("id", id).single();
      c = { supa: 1, code: x.case_number, createdAt: D(x.created_at), doctor: "د. " + x.doctors.name, phone: x.doctors.phone, clinic: x.doctors.clinic_name, patient: x.patients?.name_or_code, shade: x.shade, due: x.requested_delivery_date, type: x.work_type, att: "", notes: ((x.teeth || []).length ? "الأسنان: " + x.teeth.join("، ") + "\n" : "") + (x.notes || ""), logo: x.doctors.logo_url };
    } else c = load().find(x => x.code === new URLSearchParams(location.search).get("c"));
  } catch {}
  if (!c) return document.querySelector(".sheet").innerHTML = "<p>تعذّر فتح ورقة الحالة. تأكد من الرابط وسجّل الدخول إن لزم.</p>";
  const map = { code: "code", date: "createdAt", doctor: "doctor", phone: "phone", clinic: "clinic", patient: "patient", age: "age", gender: "gender", shade: "shade", due: "due", notes: "notes" };
  for (const k in map) $(k).textContent = c[map[k]] || (k === "notes" ? "" : "—");
  const box = (l, has) => l.map(t => `<span>${has(t) ? "☒" : "☐"} ${t}</span>`).join("");
  $("types").innerHTML = box(c.supa ? TYPES2 : TYPES, t => c.type === t);
  $("atts").innerHTML = box(ATT, t => (c.att || "").includes(t));
  if (c.logo) { $("clinicImg").src = c.logo; $("clinicImg").hidden = false; }
  if (c.supa) $("shareWa").hidden = true;
  else { const ids = imgIds(c); $("imgs").innerHTML = ids.length ? ids.map(i => `<img src="https://drive.google.com/thumbnail?id=${i}&sz=w400" alt="">`).join("") : "—"; $("shareWa").href = wa(CONFIG.whatsapp, `ورقة الحالة ${c.code}: ${location.href}`); }
  document.title = c.code + " | Friends Lab";
})();
