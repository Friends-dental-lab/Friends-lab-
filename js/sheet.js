// ورقة الحالة: تُقرأ من الرابط (#...) أو من الجهاز (?c=الكود)
const TYPES = ["تاج", "جسر", "تعويض متحرك", "تجميلي", "أخرى"], ATT = ["صور", "طبعة", "ملفات أخرى"];
let c;
try { c = location.hash.length > 1 ? dec(location.hash.slice(1)) : load().find(x => x.code === new URLSearchParams(location.search).get("c")); } catch {}
if (!c) document.querySelector(".sheet").innerHTML = "<p>تعذّر فتح ورقة الحالة. تأكد من الرابط.</p>";
else {
  const map = { code: "code", date: "createdAt", doctor: "doctor", phone: "phone", clinic: "clinic", patient: "patient", age: "age", gender: "gender", shade: "shade", due: "due", notes: "notes" };
  for (const id in map) $(id).textContent = c[map[id]] || (id === "notes" ? "" : "—");
  const box = (list, has) => list.map(t => `<span>${has(t) ? "☒" : "☐"} ${t}</span>`).join("");
  $("types").innerHTML = box(TYPES, t => c.type === t);
  $("atts").innerHTML = box(ATT, t => (c.att || "").includes(t));
  const ids = imgIds(c);
  $("imgs").innerHTML = ids.length ? ids.map(i => `<img src="https://drive.google.com/thumbnail?id=${i}&sz=w400" alt="">`).join("") : "—";
  document.title = c.code + " | Friends Lab";
  $("shareWa").href = wa(CONFIG.whatsapp, `ورقة الحالة ${c.code}: ${location.href}`);
}
