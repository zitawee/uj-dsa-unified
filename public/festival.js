// ═══ مهرجان الجامعات الأردنية للفن والثقافة — لوحة الإدارة ═══
const fstEsc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let FST_SUBS = [], FST_SET = null, FST_TAB = 'subs';
const FST_STATUSES = ['جديدة','قيد الدراسة','مقبولة','معتذر عنها'];
const FST_COL = { 'جديدة': '#6b7280', 'قيد الدراسة': '#B7791F', 'مقبولة': '#1B6B3A', 'معتذر عنها': '#A32D2D' };

async function loadFestival() {
  const panel = document.getElementById('panel-festival'); if (!panel) return;
  panel.innerHTML = `<div class="ph"><div><div class="pt">مهرجان الجامعات الأردنية للفن والثقافة</div><div class="ps">استقبال طلبات المشاركة وقرارات اللجنة</div></div></div>
  <div style="display:flex;gap:6px;margin-bottom:10px"><button class="btn btn-sm" id="fst-t-subs" onclick="fstTab('subs')">المشاركات</button><button class="btn btn-sm" id="fst-t-set" onclick="fstTab('set')">الإعدادات والرابط</button></div>
  <div id="fst-body"><div class="center" style="padding:20px">جارٍ التحميل...</div></div>`;
  const [s, subs] = await Promise.all([api('/api/festival/settings'), api('/api/festival/submissions')]);
  FST_SET = s && !s.error ? s : null; FST_SUBS = Array.isArray(subs) ? subs : [];
  fstTab(FST_TAB);
}
function fstTab(t) {
  FST_TAB = t;
  ['subs', 'set'].forEach(k => { const b = document.getElementById('fst-t-' + k); if (b) b.style.cssText = k === t ? 'background:var(--g);color:#fff' : ''; });
  if (t === 'subs') fstRenderSubs(); else fstRenderSettings();
}
function fstFlat() {
  const rows = [];
  FST_SUBS.forEach(s => (s.participations || []).forEach((p, i) => rows.push({ sub: s, p, n: i + 1 })));
  return rows;
}
function fstRenderSubs() {
  const box = document.getElementById('fst-body'); if (!box) return;
  const rows = fstFlat();
  const by = f => { const m = {}; rows.forEach(r => { const k = f(r); m[k] = (m[k] || 0) + 1; }); return m; };
  const st = by(r => r.p.status), fl = by(r => r.p.field);
  const students = rows.reduce((n, r) => n + (+r.p.students_count || 0), 0);
  const mins = rows.reduce((n, r) => n + (+r.p.duration_min || 0), 0);
  const chip = (t, c) => `<span style="background:#f1f3f0;border-radius:99px;padding:3px 10px;font-size:12px;${c ? 'color:' + c + ';font-weight:700' : ''}">${t}</span>`;
  const unis = [...new Set(FST_SUBS.map(s => s.university))].sort();
  box.innerHTML = `<div class="card"><div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px">
      ${chip('الجامعات: <b>' + FST_SUBS.length + '</b>')}${chip('المشاركات: <b>' + rows.length + '</b>')}${chip('الطلبة: <b>' + students + '</b>')}${chip('الزمن: <b>' + mins + '</b> د')}</div>
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px">${FST_STATUSES.map(k => chip(k + ': <b>' + (st[k] || 0) + '</b>', FST_COL[k])).join('')}</div>
    <div style="display:flex;gap:6px;flex-wrap:wrap">${Object.keys(fl).map(k => chip(fstEsc(k) + ': <b>' + fl[k] + '</b>')).join('')}</div></div>
  <div class="card"><div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:8px">
    <select id="fst-fs" onchange="fstRows()"><option value="">كل الحالات</option>${FST_STATUSES.map(k => `<option>${k}</option>`).join('')}</select>
    <select id="fst-ff" onchange="fstRows()"><option value="">كل المجالات</option>${Object.keys(fl).map(k => `<option>${fstEsc(k)}</option>`).join('')}</select>
    <select id="fst-fu" onchange="fstRows()"><option value="">كل الجامعات</option>${unis.map(k => `<option>${fstEsc(k)}</option>`).join('')}</select>
    <button class="btn btn-sm" onclick="fstExcel()"><i class="ti ti-file-spreadsheet"></i> Excel</button>
    <button class="btn btn-sm" onclick="window.print()"><i class="ti ti-printer"></i> طباعة</button></div>
    <div class="tw"><table><thead><tr><th>#</th><th>الجامعة</th><th>المجال</th><th>العنوان</th><th>المدة</th><th>الطلبة</th><th>الاحتياجات</th><th>الحالة</th><th>التواصل</th><th></th></tr></thead><tbody id="fst-rows"></tbody></table></div></div>`;
  fstRows();
}
function fstRows() {
  const fs = document.getElementById('fst-fs').value, ff = document.getElementById('fst-ff').value, fu = document.getElementById('fst-fu').value;
  const rows = fstFlat().filter(r => (!fs || r.p.status === fs) && (!ff || r.p.field === ff) && (!fu || r.sub.university === fu));
  document.getElementById('fst-rows').innerHTML = rows.map((r, i) => { const p = r.p, s = r.sub;
    return `<tr><td>${i + 1}</td><td><b>${fstEsc(s.university)}</b><div style="font-size:11px;color:var(--muted)">${fstEsc(s.ref)}</div></td>
    <td>${fstEsc(p.field)}${p.field === 'أخرى' ? '<div style="font-size:11px">' + fstEsc(p.other_text) + '</div>' : ''}</td>
    <td>${fstEsc(p.title)}${p.description ? '<div style="font-size:11px;color:var(--muted);max-width:260px">' + fstEsc(p.description) + '</div>' : ''}</td>
    <td>${fstEsc(p.duration_min)} د</td><td>${fstEsc(p.students_count)}</td><td style="font-size:11.5px;max-width:180px">${fstEsc(p.tech_needs)}</td>
    <td><span style="color:${FST_COL[p.status] || '#444'};font-weight:700">${fstEsc(p.status)}</span>${p.committee_note ? '<div style="font-size:11px;color:var(--muted)">' + fstEsc(p.committee_note) + '</div>' : ''}</td>
    <td style="font-size:11.5px">${fstEsc(s.contact.name)}<br>${fstEsc(s.contact.title)}<br>${fstEsc(s.contact.phone)}<br>${fstEsc(s.contact.email)}</td>
    <td style="white-space:nowrap"><button class="btn btn-sm" onclick="fstDecide('${s.id}','${p.pid}')">قرار</button></td></tr>`; }).join('') || '<tr><td colspan="10" class="center">لا توجد مشاركات</td></tr>';
}
function fstDecide(id, pid) {
  const s = FST_SUBS.find(x => x.id === id), p = s.participations.find(x => x.pid === pid);
  const old = document.getElementById('fst-dlg'); if (old) old.remove();
  const d = document.createElement('div'); d.id = 'fst-dlg';
  d.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:9999;display:flex;align-items:center;justify-content:center;padding:14px';
  d.innerHTML = `<div style="background:#fff;border-radius:12px;padding:18px;max-width:420px;width:100%">
    <b>${fstEsc(p.title)}</b><div style="font-size:12px;color:var(--muted);margin-bottom:10px">${fstEsc(s.university)}</div>
    <label style="font-size:12.5px">القرار</label><select id="fst-d-st" style="width:100%;padding:8px;margin:4px 0 10px">${FST_STATUSES.map(k => `<option ${k === p.status ? 'selected' : ''}>${k}</option>`).join('')}</select>
    <label style="font-size:12.5px">ملاحظة اللجنة</label><textarea id="fst-d-n" style="width:100%;min-height:70px;padding:8px;margin-top:4px">${fstEsc(p.committee_note || '')}</textarea>
    <div style="display:flex;gap:8px;margin-top:12px"><button class="btn" style="background:var(--g);color:#fff" onclick="fstSaveDecision('${id}','${pid}')">حفظ</button><button class="btn" onclick="document.getElementById('fst-dlg').remove()">إلغاء</button></div></div>`;
  document.body.appendChild(d);
}
async function fstSaveDecision(id, pid) {
  const r = await api('/api/festival/decision', 'POST', { id, pid, status: document.getElementById('fst-d-st').value, committee_note: document.getElementById('fst-d-n').value });
  if (r && r.error) return alert(r.error);
  document.getElementById('fst-dlg').remove(); loadFestival();
}
function fstExcel() {
  const rows = fstFlat();
  const head = ['الجامعة','الرقم المرجعي','المجال','نوع المشاركة (أخرى)','العنوان','الوصف','المدة (د)','عدد الطلبة','الاحتياجات الفنية','الحالة','ملاحظة اللجنة','المسؤول','المسمى','الهاتف','البريد'];
  const tr = a => '<tr>' + a.map(v => `<td>${fstEsc(v)}</td>`).join('') + '</tr>';
  const html = '<html dir="rtl"><head><meta charset="UTF-8"></head><body><table border="1">' + tr(head) +
    rows.map(r => tr([r.sub.university, r.sub.ref, r.p.field, r.p.other_text, r.p.title, r.p.description, r.p.duration_min, r.p.students_count, r.p.tech_needs, r.p.status, r.p.committee_note, r.sub.contact.name, r.sub.contact.title, r.sub.contact.phone, r.sub.contact.email])).join('') + '</table></body></html>';
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + html], { type: 'application/vnd.ms-excel' })); a.download = 'festival_participations.xls'; a.click();
}
function fstRenderSettings() {
  const box = document.getElementById('fst-body'); if (!box) return;
  const s = FST_SET || {}; const isAdmin = ME && ME.role === 'admin';
  const link = location.origin + '/festival.html';
  const stateTxt = { open: '🟢 مفتوح', not_yet: '🟡 لم يُفتح بعد', closed: '🔴 مغلق' }[s.state] || '';
  box.innerHTML = `<div class="card"><b>الرابط العام (مشترك لكل الجامعات)</b>
    <div style="direction:ltr;text-align:left;font-size:12.5px;background:#f4f6f4;padding:8px;border-radius:8px;margin:8px 0;word-break:break-all">${link}</div>
    <button class="btn btn-sm" onclick="navigator.clipboard.writeText('${link}');this.textContent='تم النسخ ✓'">نسخ الرابط</button>
    <span style="margin-right:10px;font-size:13px">حالة التسجيل: <b>${stateTxt}</b></span></div>
  <div class="card"><fieldset ${isAdmin ? '' : 'disabled'} style="border:0;padding:0;margin:0">
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px">
      <div><label>العنوان</label><input id="fs-title" value="${fstEsc(s.title)}" style="width:100%"></div>
      <div><label>العنوان الفرعي</label><input id="fs-sub" value="${fstEsc(s.subtitle)}" style="width:100%"></div>
      <div><label>بداية التسجيل</label><input id="fs-open" type="date" value="${fstEsc(s.open_date)}" style="width:100%"></div>
      <div><label>نهاية التسجيل (شاملة)</label><input id="fs-close" type="date" value="${fstEsc(s.close_date)}" style="width:100%"></div>
      <div><label>اللون الرئيسي</label><input id="fs-color" type="color" value="${fstEsc(s.color || '#0F5132')}"></div>
      <div><label>الشعار (PNG/JPG، حتى 1MB)</label><input id="fs-logo" type="file" accept="image/png,image/jpeg,image/webp" onchange="fstLogo(this)">
        <div id="fs-logo-prev">${s.logo ? `<img src="${fstEsc(s.logo)}" style="max-height:60px;margin-top:6px"> <a href="#" onclick="fstClearLogo();return false">إزالة</a>` : '<span style="font-size:12px;color:var(--muted)">لا يوجد شعار (يظهر مكان فارغ)</span>'}</div></div></div>
    <label style="display:block;margin-top:10px">نص تعريفي أعلى النموذج (اختياري)</label><textarea id="fs-intro" style="width:100%;min-height:70px">${fstEsc(s.intro)}</textarea>
    <label style="display:block;margin-top:10px">قائمة الجامعات (اسم في كل سطر)</label><textarea id="fs-unis" style="width:100%;min-height:160px">${fstEsc((s.universities || []).join('\n'))}</textarea>
    ${isAdmin ? `<button class="btn" style="background:var(--g);color:#fff;margin-top:10px" onclick="fstSaveSettings()">حفظ الإعدادات</button>` : '<div style="font-size:12px;color:var(--muted)">التعديل للمدير فقط</div>'}
  </fieldset></div>
  <div class="card" style="font-size:12.5px;color:var(--muted)">ملاحظة: إن لم يُحدَّد تاريخا البداية والنهاية يبقى باب التسجيل مغلقاً. لكل جامعة طلب واحد، ويمكنها تعديله عبر رابط خاص حتى إغلاق التسجيل. مجالات المشاركة: موسيقى، مسرح، رسم، تصوير، نحت، شعر، أخرى.</div>`;
}
let FST_LOGO = undefined;
function fstLogo(inp) {
  const f = inp.files[0]; if (!f) return;
  if (f.size > 900000) { alert('حجم الشعار كبير (الحد 900KB)'); inp.value = ''; return; }
  const r = new FileReader(); r.onload = () => { FST_LOGO = r.result; document.getElementById('fs-logo-prev').innerHTML = `<img src="${r.result}" style="max-height:60px;margin-top:6px">`; }; r.readAsDataURL(f);
}
function fstClearLogo() { FST_LOGO = ''; document.getElementById('fs-logo-prev').innerHTML = '<span style="font-size:12px">سيُزال الشعار عند الحفظ</span>'; }
async function fstSaveSettings() {
  const body = { title: document.getElementById('fs-title').value, subtitle: document.getElementById('fs-sub').value, open_date: document.getElementById('fs-open').value,
    close_date: document.getElementById('fs-close').value, color: document.getElementById('fs-color').value, intro: document.getElementById('fs-intro').value,
    universities: document.getElementById('fs-unis').value.split('\n') };
  if (FST_LOGO !== undefined) body.logo = FST_LOGO;
  const r = await api('/api/festival/settings', 'PUT', body);
  if (r && r.error) return alert(r.error);
  FST_LOGO = undefined; alert('تم الحفظ'); loadFestival();
}
