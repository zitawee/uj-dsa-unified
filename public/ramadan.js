// ═══ البرنامج الرمضاني — لوحة الإدارة (مقترحات الكليات) ═══
const rmEsc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let RM_SUBS = [], RM_SET = null, RM_TAB = 'subs';
const RM_ST = ['جديد','قيد الدراسة','معتمد','معتذر عنه'];
const RM_COL = { 'جديد':'#6b7280', 'قيد الدراسة':'#B7791F', 'معتمد':'#1B6B3A', 'معتذر عنه':'#A32D2D' };

async function loadRamadan() {
  const panel = document.getElementById('panel-ramadan'); if (!panel) return;
  panel.innerHTML = `<div class="ph"><div><div class="pt">🌙 البرنامج الرمضاني</div><div class="ps">مقترحات الكليات للأنشطة الرمضانية</div></div></div>
  <div style="display:flex;gap:6px;margin-bottom:10px"><button class="btn btn-sm" id="rm-t-subs" onclick="rmTab('subs')">المقترحات</button><button class="btn btn-sm" id="rm-t-miss" onclick="rmTab('miss')">الكليات التي لم تقدّم</button><button class="btn btn-sm" id="rm-t-set" onclick="rmTab('set')">الإعدادات والرابط</button></div>
  <div id="rm-body"><div class="center" style="padding:20px">جارٍ التحميل...</div></div>`;
  const [s, subs] = await Promise.all([api('/api/ramadan/settings'), api('/api/ramadan/submissions')]);
  RM_SET = s && !s.error ? s : null; RM_SUBS = Array.isArray(subs) ? subs : [];
  rmTab(RM_TAB);
}
function rmTab(t) {
  RM_TAB = t;
  ['subs','miss','set'].forEach(k => { const b = document.getElementById('rm-t-' + k); if (b) b.style.cssText = k === t ? 'background:var(--g);color:#fff' : ''; });
  ({ subs: rmRenderSubs, miss: rmRenderMiss, set: rmRenderSettings })[t]();
}
function rmFlat() { const r = []; RM_SUBS.forEach(s => (s.proposals || []).forEach(p => r.push({ sub: s, p }))); return r; }
function rmRenderSubs() {
  const box = document.getElementById('rm-body'), rows = rmFlat();
  const by = f => { const m = {}; rows.forEach(r => { const k = f(r); m[k] = (m[k] || 0) + 1; }); return m; };
  const st = by(r => r.p.status), ty = by(r => r.p.type === 'أخرى' ? 'أخرى: ' + r.p.other_text : r.p.type);
  const chip = (t, c) => `<span style="background:#f1f3f0;border-radius:99px;padding:3px 10px;font-size:12px;${c ? 'color:' + c + ';font-weight:700' : ''}">${t}</span>`;
  const srcs = [...new Set(RM_SUBS.map(s => s.source))].sort();
  box.innerHTML = `<div class="card"><div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px">${chip('الجهات المقدِّمة: <b>' + srcs.length + '</b>')}${chip('المقترحات: <b>' + rows.length + '</b>')}</div>
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px">${RM_ST.map(k => chip(k + ': <b>' + (st[k] || 0) + '</b>', RM_COL[k])).join('')}</div>
    <div style="display:flex;gap:6px;flex-wrap:wrap">${Object.keys(ty).map(k => chip(rmEsc(k) + ': <b>' + ty[k] + '</b>')).join('')}</div></div>
  <div class="card"><div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:8px">
    <select id="rm-fs" onchange="rmRows()"><option value="">كل الحالات</option>${RM_ST.map(k => `<option>${k}</option>`).join('')}</select>
    <select id="rm-ft" onchange="rmRows()"><option value="">كل الأنواع</option>${Object.keys(ty).map(k => `<option>${rmEsc(k)}</option>`).join('')}</select>
    <select id="rm-fu" onchange="rmRows()"><option value="">كل الجهات</option>${srcs.map(k => `<option>${rmEsc(k)}</option>`).join('')}</select>
    <button class="btn btn-sm" onclick="rmExcel()"><i class="ti ti-file-spreadsheet"></i> Excel</button>
    <button class="btn btn-sm" onclick="rmPrint()"><i class="ti ti-printer"></i> طباعة</button></div>
    <div class="tw"><table><thead><tr><th>#</th><th>الكلية / الجهة</th><th>النوع</th><th>العنوان</th><th>الموعد / المكان</th><th>العدد</th><th>الاحتياجات</th><th>الحالة</th><th>ضابط الارتباط</th><th></th></tr></thead><tbody id="rm-rows"></tbody></table></div></div>`;
  rmRows();
}
function rmFiltered() {
  const v = id => (document.getElementById(id) || {}).value || '';
  return rmFlat().filter(r => (!v('rm-fs') || r.p.status === v('rm-fs')) && (!v('rm-ft') || (r.p.type === 'أخرى' ? 'أخرى: ' + r.p.other_text : r.p.type) === v('rm-ft')) && (!v('rm-fu') || r.sub.source === v('rm-fu')));
}
function rmRows() {
  document.getElementById('rm-rows').innerHTML = rmFiltered().map((r, i) => { const p = r.p, s = r.sub;
    return `<tr><td>${i + 1}</td><td><b>${rmEsc(s.source)}</b>${s.is_other ? ' <span style="font-size:10.5px;color:#7a4b9a">(جهة أخرى)</span>' : ''}<div style="font-size:11px;color:var(--muted)">${rmEsc(s.ref)}</div></td>
    <td>${rmEsc(p.type)}${p.type === 'أخرى' ? '<div style="font-size:11px">' + rmEsc(p.other_text) + '</div>' : ''}</td>
    <td>${rmEsc(p.title)}${p.description ? '<div style="font-size:11px;color:var(--muted);max-width:260px">' + rmEsc(p.description) + '</div>' : ''}</td>
    <td style="font-size:12px">${rmEsc(p.suggested_date || '-')}<div style="color:var(--muted)">${rmEsc(p.place)}</div></td><td>${p.expected_count || '-'}</td>
    <td style="font-size:11.5px;max-width:170px">${rmEsc(p.needs)}</td>
    <td><span style="color:${RM_COL[p.status] || '#444'};font-weight:700">${rmEsc(p.status)}</span>${p.committee_note ? '<div style="font-size:11px;color:var(--muted)">' + rmEsc(p.committee_note) + '</div>' : ''}${p.request_ref ? '<div style="font-size:11px;color:#1B6B3A">طلب نشاط: ' + rmEsc(p.request_ref) + '</div>' : ''}</td>
    <td style="font-size:11.5px">${rmEsc(s.contact.name)}<br>${rmEsc(s.contact.title)}<br>${rmEsc(s.contact.phone)}<br>${rmEsc(s.contact.email)}</td>
    <td style="white-space:nowrap"><button class="btn btn-sm" onclick="rmDecide('${s.id}','${p.pid}')">قرار</button>${p.request_ref ? '' : ` <button class="btn btn-sm" style="background:var(--g);color:#fff" onclick="rmConvert('${s.id}','${p.pid}')">تحويل لطلب نشاط</button>`}</td></tr>`; }).join('') || '<tr><td colspan="10" class="center">لا توجد مقترحات</td></tr>';
}
function rmDecide(id, pid) {
  const s = RM_SUBS.find(x => x.id === id), p = s.proposals.find(x => x.pid === pid);
  const old = document.getElementById('rm-dlg'); if (old) old.remove();
  const d = document.createElement('div'); d.id = 'rm-dlg';
  d.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:9999;display:flex;align-items:center;justify-content:center;padding:14px;font-family:'Tajawal','Segoe UI',Tahoma,Arial,sans-serif";
  d.innerHTML = `<div style="background:#fff;border-radius:12px;padding:18px;max-width:420px;width:100%"><b>${rmEsc(p.title)}</b><div style="font-size:12px;color:var(--muted);margin-bottom:10px">${rmEsc(s.source)}</div>
    <label style="font-size:12.5px">القرار</label><select id="rm-d-st" style="width:100%;padding:8px;margin:4px 0 10px;font-family:inherit">${RM_ST.map(k => `<option ${k === p.status ? 'selected' : ''}>${k}</option>`).join('')}</select>
    <label style="font-size:12.5px">ملاحظة</label><textarea id="rm-d-n" style="width:100%;min-height:70px;padding:8px;margin-top:4px;font-family:inherit">${rmEsc(p.committee_note || '')}</textarea>
    <div style="display:flex;gap:8px;margin-top:12px"><button class="btn" style="background:var(--g);color:#fff" onclick="rmSaveDecision('${id}','${pid}')">حفظ</button><button class="btn" onclick="document.getElementById('rm-dlg').remove()">إلغاء</button></div></div>`;
  document.body.appendChild(d);
}
async function rmSaveDecision(id, pid) {
  const r = await api('/api/ramadan/decision', 'POST', { id, pid, status: document.getElementById('rm-d-st').value, committee_note: document.getElementById('rm-d-n').value });
  if (r && r.error) return alert(r.error);
  document.getElementById('rm-dlg').remove(); loadRamadan();
}
async function rmConvert(id, pid) {
  if (!confirm('سيُنشأ «طلب إقامة نشاط» جديد من هذا المقترح (بحالة قيد المراجعة) وتُعتمد حالة المقترح. هل تريد المتابعة؟')) return;
  const r = await api('/api/ramadan/convert', 'POST', { id, pid });
  if (r && r.error) return alert(r.error);
  alert('✅ تم إنشاء طلب إقامة النشاط برقم مرجعي: ' + r.ref_code + '\nيمكنك إكمال بياناته (الموعد، الوقت، المشرف، الخدمات) من «طلبات إقامة نشاط».');
  loadRamadan();
}
function rmRenderMiss() {
  const box = document.getElementById('rm-body'); const list = (RM_SET && RM_SET.colleges) || [];
  const done = new Set(RM_SUBS.map(s => s.source));
  const miss = window.RM_MISS = list.filter(c => !done.has(c)), got = list.filter(c => done.has(c));
  box.innerHTML = `<div class="card"><b>لم تقدّم بعد (${miss.length} من ${list.length})</b><div style="margin:8px 0 14px">${miss.map(c => `<span style="display:inline-block;background:#FDF0F0;border-radius:99px;padding:3px 12px;font-size:12.5px;margin:2px">${rmEsc(c)}</span>`).join('') || '<span style="color:var(--muted);font-size:13px">كل الكليات قدّمت مقترحاتها ✅</span>'}</div>
    <button class="btn btn-sm" onclick="navigator.clipboard.writeText(window.RM_MISS.join('\\n'));this.textContent='تم النسخ ✓'">نسخ الأسماء</button>
    <div style="margin-top:14px"><b>قدّمت (${got.length})</b><div style="margin-top:6px">${got.map(c => `<span style="display:inline-block;background:#EAF7EE;border-radius:99px;padding:3px 12px;font-size:12.5px;margin:2px">${rmEsc(c)}</span>`).join('') || '—'}</div></div>
    ${!list.length ? '<div style="font-size:12.5px;color:var(--muted);margin-top:10px">لم تُحدَّد قائمة الكليات بعد — من «الإعدادات والرابط».</div>' : ''}</div>`;
}
function rmRenderSettings() {
  const box = document.getElementById('rm-body'); const s = RM_SET || {}; const isAdmin = ME && ME.role === 'admin';
  const link = location.origin + '/ramadan.html';
  const stateTxt = { open: '🟢 مفتوح', not_yet: '🟡 لم يُفتح بعد', closed: '🔴 مغلق' }[s.state] || '';
  const cols = (s.colleges && s.colleges.length ? s.colleges : (typeof COLS !== 'undefined' ? COLS : [])).join('\n');
  box.innerHTML = `<div class="card"><b>الرابط العام (مشترك لكل الكليات)</b>
    <div style="direction:ltr;text-align:left;font-size:12.5px;background:#f4f6f4;padding:8px;border-radius:8px;margin:8px 0;word-break:break-all">${link}</div>
    <button class="btn btn-sm" onclick="navigator.clipboard.writeText('${link}');this.textContent='تم النسخ ✓'">نسخ الرابط</button>
    <span style="margin-right:10px;font-size:13px">الحالة: <b>${stateTxt}</b></span></div>
  <div class="card"><fieldset ${isAdmin ? '' : 'disabled'} style="border:0;padding:0;margin:0">
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px">
      <div><label>العنوان</label><input id="rs-title" value="${rmEsc(s.title)}" style="width:100%"></div>
      <div><label>العنوان الفرعي</label><input id="rs-sub" value="${rmEsc(s.subtitle)}" style="width:100%"></div>
      <div><label>بداية استقبال المقترحات</label><input id="rs-open" type="date" value="${rmEsc(s.open_date)}" style="width:100%"></div>
      <div><label>نهاية الاستقبال (شاملة)</label><input id="rs-close" type="date" value="${rmEsc(s.close_date)}" style="width:100%"></div>
      <div><label>اللون الرئيسي</label><input id="rs-color" type="color" value="${rmEsc(s.color || '#0F5132')}"></div>
      <div><label>الشعار (اختياري، حتى 900KB)</label><input type="file" accept="image/png,image/jpeg,image/webp" onchange="rmLogo(this)"><div id="rs-logo-prev">${s.logo ? `<img src="${rmEsc(s.logo)}" style="max-height:60px;margin-top:6px"> <a href="#" onclick="rmClearLogo();return false">إزالة</a>` : ''}</div></div></div>
    <label style="display:block;margin-top:10px">نص الدعوة أعلى النموذج (يمكنك لصق نص الكتاب)</label><textarea id="rs-intro" style="width:100%;min-height:110px">${rmEsc(s.intro)}</textarea>
    <label style="display:block;margin-top:10px">قائمة الكليات (اسم في كل سطر)${s.colleges && s.colleges.length ? '' : ' — معبّأة مبدئياً بكليات النظام، عدّلها ثم احفظ'}</label><textarea id="rs-cols" style="width:100%;min-height:160px">${rmEsc(cols)}</textarea>
    <div style="font-size:12px;color:var(--muted)">تظهر في النموذج خانة «جهة أخرى» تتيح لأي جهة خارج القائمة كتابة اسمها.</div>
    ${isAdmin ? `<button class="btn" style="background:var(--g);color:#fff;margin-top:10px" onclick="rmSaveSettings()">حفظ الإعدادات</button>` : '<div style="font-size:12px;color:var(--muted)">التعديل للمدير فقط</div>'}</fieldset></div>
  <div class="card" style="font-size:12.5px;color:var(--muted)">إن لم يُحدَّد تاريخا البداية والنهاية يبقى الباب مغلقاً. يمكن للكلية تعديل مقترحاتها عبر رابط خاص حتى إغلاق الباب.</div>`;
}
let RM_LOGO;
function rmLogo(inp) {
  const f = inp.files[0]; if (!f) return;
  if (f.size > 900000) { alert('حجم الشعار كبير (الحد 900KB)'); inp.value = ''; return; }
  const r = new FileReader(); r.onload = () => { RM_LOGO = r.result; document.getElementById('rs-logo-prev').innerHTML = `<img src="${r.result}" style="max-height:60px;margin-top:6px">`; }; r.readAsDataURL(f);
}
function rmClearLogo() { RM_LOGO = ''; document.getElementById('rs-logo-prev').innerHTML = 'سيُزال الشعار عند الحفظ'; }
async function rmSaveSettings() {
  const g = id => document.getElementById(id).value;
  const body = { title: g('rs-title'), subtitle: g('rs-sub'), open_date: g('rs-open'), close_date: g('rs-close'), color: g('rs-color'), intro: g('rs-intro'), colleges: g('rs-cols').split('\n') };
  if (RM_LOGO !== undefined) body.logo = RM_LOGO;
  const r = await api('/api/ramadan/settings', 'PUT', body);
  if (r && r.error) return alert(r.error);
  RM_LOGO = undefined; alert('تم الحفظ'); loadRamadan();
}
function rmExcel() {
  const rows = rmFiltered();
  const head = ['الكلية / الجهة','الرقم المرجعي','النوع','نوع (أخرى)','العنوان','الوصف','الفئة المستهدفة','العدد المتوقع','الموعد المقترح','المكان','الاحتياجات','الحالة','الملاحظة','طلب النشاط','ضابط الارتباط','المسمى','الهاتف','البريد'];
  const tr = a => '<tr>' + a.map(v => `<td>${rmEsc(v)}</td>`).join('') + '</tr>';
  const html = '<html dir="rtl"><head><meta charset="UTF-8"></head><body><table border="1">' + tr(head) + rows.map(r => tr([r.sub.source, r.sub.ref, r.p.type, r.p.other_text, r.p.title, r.p.description, r.p.audience, r.p.expected_count, r.p.suggested_date, r.p.place, r.p.needs, r.p.status, r.p.committee_note, r.p.request_ref, r.sub.contact.name, r.sub.contact.title, r.sub.contact.phone, r.sub.contact.email])).join('') + '</table></body></html>';
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + html], { type: 'application/vnd.ms-excel' })); a.download = 'ramadan_proposals.xls'; a.click();
}
function rmPrint() {
  const th = 'border:1px solid #333;padding:5px 6px;background:#e9ece9;font-size:9.5pt;text-align:right', td = 'border:1px solid #333;padding:5px 6px;font-size:9.5pt;text-align:right;vertical-align:top';
  const rows = rmFiltered();
  openPrint(`<div style="text-align:center;font-weight:800;font-size:15pt;margin-bottom:8px">مقترحات البرنامج الرمضاني</div><table style="width:100%;border-collapse:collapse"><thead><tr>${['#','الكلية / الجهة','النوع','العنوان','الموعد','المكان','العدد','الحالة'].map(h => `<th style="${th}">${h}</th>`).join('')}</tr></thead><tbody>${rows.map((r, i) => `<tr>${[i + 1, r.sub.source, r.p.type === 'أخرى' ? 'أخرى: ' + r.p.other_text : r.p.type, r.p.title, r.p.suggested_date, r.p.place, r.p.expected_count || '', r.p.status].map(v => `<td style="${td}">${rmEsc(v)}</td>`).join('')}</tr>`).join('')}</tbody></table>`);
}
