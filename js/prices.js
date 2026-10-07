// p = السعر كرقم، أو null لتظهر "حسب الحالة"
const PRICES = [{ n: "تاج زركون", p: null }, { n: "تاج خزف على معدن", p: null }, { n: "جسر (للوحدة)", p: null }, { n: "طقم متحرك كامل", p: null }, { n: "طقم متحرك جزئي", p: null }, { n: "فينير", p: null }, { n: "تاج على زرعة", p: null }];
const tb = $("pr");
tb.innerHTML = PRICES.map((x, i) => `<tr><td>${x.n}</td><td>${x.p ? x.p.toLocaleString("en") + " " + CONFIG.currency : "حسب الحالة"}</td><td><input type="number" min="0" value="0" data-i="${i}" style="width:80px"></td></tr>`).join("");
const items = () => PRICES.map((x, i) => ({ ...x, q: +tb.querySelector(`[data-i="${i}"]`).value })).filter(x => x.q > 0);
tb.oninput = () => { const t = items().reduce((s, x) => s + (x.p || 0) * x.q, 0); $("tot").textContent = t ? `الإجمالي التقريبي: ${t.toLocaleString("en")} ${CONFIG.currency}` : ""; };
$("quote").onclick = () => { const it = items(); if (!it.length) return alert("اختر بنداً واحداً على الأقل."); window.open(wa(CONFIG.whatsapp, `طلب عرض سعر - Friends Lab\nالطبيب: ${$("qn").value.trim() || "-"}\n` + it.map(x => `• ${x.n} × ${x.q}`).join("\n")), "_blank"); };
