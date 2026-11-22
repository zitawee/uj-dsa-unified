// ═══ المعاملات والمراسلات الرسمية (سرّية — المدير فقط) ═══
const crpEsc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const CRP_ST = ['جديدة','قيد الإجراء','بانتظار رد','محوّلة','منجزة'];
const CRP_STCOL = { 'جديدة':'#2563a8', 'قيد الإجراء':'#B7791F', 'بانتظار رد':'#7a4b9a', 'محوّلة':'#6b7280', 'منجزة':'#1B6B3A' };
const CRP_PRCOL = { 'عادي':'#6b7280', 'مهم':'#B7791F', 'عاجل':'#c0392b' };
const CRP_AT = ['كتاب صادر','إنجاز مهمة','تحويل لجهة','حفظ للعلم'];
let CRP_ROWS = [], CRP_TAB = 'reg', CRP_SOURCES = [], CRP_REP = null;

function crpFmtDT(iso) { try { return new Date(iso).toLocaleString('ar-JO', { timeZone:'Asia/Amman', dateStyle:'medium', timeStyle:'short' }); } catch (e) { return iso || ''; } }
function crpNowLocal() { const d = new Date(), p = n => String(n).padStart(2, '0'); return d.getFullYear() + '-' + p(d.getMonth()+1) + '-' + p(d.getDate()) + 'T' + p(d.getHours()) + ':' + p(d.getMinutes()); }
function crpToLocal(iso) { if (!iso) return crpNowLocal(); const d = new Date(iso), p = n => String(n).padStart(2, '0'); return d.getFullYear() + '-' + p(d.getMonth()+1) + '-' + p(d.getDate()) + 'T' + p(d.getHours()) + ':' + p(d.getMinutes()); }

async function loadCorr() {
  const panel = document.getElementById('panel-corr'); if (!panel) return;
  panel.innerHTML = `<div class="ph"><div><div class="pt">📨 المعاملات والمراسلات</div><div class="ps">سجل الكتب الواردة وإجراءاتها — سرّي (للمدير فقط)</div></div>
    <button class="btn" style="background:var(--g);color:#fff" onclick="crpOpen()">➕ معاملة جديدة</button></div>
  <div style="display:flex;gap:6px;margin-bottom:10px"><button class="btn btn-sm" id="crp-t-reg" onclick="crpTab('reg')">السجل</button><button class="btn btn-sm" id="crp-t-rep" onclick="crpTab('rep')">التقرير الشهري</button></div>
  <div id="crp-body"></div>`;
  CRP_SOURCES = await api('/api/corr/sources'); if (!Array.isArray(CRP_SOURCES)) CRP_SOURCES = [];
  crpTab(CRP_TAB);
}
function crpTab(t) {
  CRP_TAB = t;
  ['reg','rep'].forEach(k => { const b = document.getElementById('crp-t-' + k); if (b) b.style.cssText = k === t ? 'background:var(--g);color:#fff' : ''; });
  if (t === 'reg') crpRenderReg(); else crpRenderRep();
}
function crpRenderReg() {
  const box = document.getElementById('crp-body');
  box.innerHTML = `<div id="crp-stats" style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px"></div>
  <div class="card"><div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:8px">
    <input id="crp-q" type="text" placeholder="🔍 بحث برقم الكتاب أو الموضوع أو الجهة..." oninput="crpDebounce()" style="flex:1;min-width:200px;padding:8px;border:1px solid var(--border);border-radius:8px">
    <select id="crp-fs" onchange="crpLoad()"><option value="open">المفتوحة فقط</option><option value="">كل الحالات (مع المنجزة)</option>${CRP_ST.map(k => `<option>${k}</option>`).join('')}</select>
    <select id="crp-fp" onchange="crpLoad()"><option value="">كل الأولويات</option><option>عادي</option><option>مهم</option><option>عاجل</option></select>
    <select id="crp-fsrc" onchange="crpLoad()"><option value="">كل الجهات</option>${CRP_SOURCES.map(s => `<option>${crpEsc(s)}</option>`).join('')}</select>
    <label style="font-size:12px">من <input id="crp-ff" type="date" onchange="crpLoad()"></label>
    <label style="font-size:12px">إلى <input id="crp-ft" type="date" onchange="crpLoad()"></label>
    <label style="font-size:12px"><input id="crp-fo" type="checkbox" onchange="crpLoad()"> المتأخرة فقط</label>
    <button class="btn btn-sm" onclick="crpPrintReg()"><i class="ti ti-printer"></i> طباعة السجل</button>
    <button class="btn btn-sm" onclick="crpExcel()"><i class="ti ti-file-spreadsheet"></i> Excel</button></div>
    <div class="tw"><table><thead><tr><th>رقم الوارد</th><th>رقم الكتاب / تاريخه</th><th>الجهة</th><th>الموضوع</th><th>الاستلام</th><th>المدة</th><th>الأولوية</th><th>الحالة</th><th>موعد الرد</th><th>إجراءات</th><th></th></tr></thead><tbody id="crp-rows"></tbody></table></div></div>`;
  crpLoad();
}
let CRP_T = null;
function crpDebounce() { clearTimeout(CRP_T); CRP_T = setTimeout(crpLoad, 300); }
async function crpLoad() {
  const v = id => (document.getElementById(id) || {}).value || '';
  const p = new URLSearchParams({ q: v('crp-q'), status: v('crp-fs'), priority: v('crp-fp'), source: v('crp-fsrc'), from: v('crp-ff'), to: v('crp-ft') });
  if ((document.getElementById('crp-fo') || {}).checked) p.set('overdue', '1');
  const [rows, st] = await Promise.all([api('/api/corr?' + p), api('/api/corr/stats')]);
  CRP_ROWS = Array.isArray(rows) ? rows : [];
  const sb = document.getElementById('crp-stats');
  if (sb && st && !st.error) sb.innerHTML = [['الإجمالي', st.total, '#333'], ['معلّقة', st.pending, '#B7791F'], ['منجزة', st.done, '#1B6B3A'], ['متأخرة', st.overdue, '#c0392b']].map(([l, n, c]) => `<div class="card" style="padding:8px 16px;margin:0;text-align:center"><div style="font-size:11.5px;color:var(--muted)">${l}</div><div style="font-size:20px;font-weight:800;color:${c}">${n}</div></div>`).join('');
  const tb = document.getElementById('crp-rows'); if (!tb) return;
  tb.innerHTML = CRP_ROWS.map(r => `<tr${r.overdue ? ' style="background:#FDF0F0"' : ''}>
    <td><b>${crpEsc(r.in_no)}</b></td><td>${crpEsc(r.book_no)}<div style="font-size:11px;color:var(--muted)">${crpEsc(r.book_date)}</div></td>
    <td>${crpEsc(r.source)}</td><td style="max-width:260px">${crpEsc(r.subject)}</td>
    <td style="font-size:12px">${crpEsc(crpFmtDT(r.received_at))}</td><td>${r.age_days} يوم</td>
    <td><span style="color:${CRP_PRCOL[r.priority] || '#444'};font-weight:700">${crpEsc(r.priority)}</span></td>
    <td><span style="color:${CRP_STCOL[r.status] || '#444'};font-weight:700">${crpEsc(r.status)}</span></td>
    <td style="font-size:12px;${r.overdue ? 'color:#c0392b;font-weight:700' : ''}">${crpEsc(r.due_date || '-')}${r.overdue ? ' ⚠️' : ''}</td>
    <td>${(r.actions || []).length}</td><td style="white-space:nowrap"><button class="btn btn-sm" onclick="crpView('${r.id}')">عرض</button> <button class="btn btn-sm" onclick="crpOpen('${r.id}')">فتح</button></td></tr>`).join('') || '<tr><td colspan="11" class="center">لا توجد معاملات</td></tr>';
}

// ── نافذة المعاملة (إضافة / عرض / إجراءات) ──
async function crpOpen(id) {
  let r = {};
  if (id) { const all = await api('/api/corr?q='); r = (Array.isArray(all) ? all : []).find(x => x.id === id) || {}; }
  const old = document.getElementById('crp-dlg'); if (old) old.remove();
  const d = document.createElement('div'); d.id = 'crp-dlg';
  d.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:9999;display:flex;align-items:flex-start;justify-content:center;padding:14px;overflow:auto';
  const inp = (i, l, v, t) => `<div class="fg"><label>${l}</label><input id="crp-${i}" type="${t || 'text'}" value="${crpEsc(v)}" style="width:100%"></div>`;
  d.innerHTML = `<div style="background:#fff;border-radius:12px;padding:18px;max-width:780px;width:100%;margin:auto">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px"><b style="color:var(--g)">${id ? 'معاملة ' + crpEsc(r.in_no) : 'معاملة جديدة'}</b><button onclick="document.getElementById('crp-dlg').remove()" style="background:none;border:none;font-size:18px;cursor:pointer">✕</button></div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:8px">
      ${inp('bno', 'رقم الكتاب', r.book_no)}${inp('bdate', 'تاريخ الكتاب', r.book_date, 'date')}
      <div class="fg"><label>الجهة الصادر عنها *</label><input id="crp-src" list="crp-srcs" value="${crpEsc(r.source)}" style="width:100%"><datalist id="crp-srcs">${CRP_SOURCES.map(s => `<option value="${crpEsc(s)}">`).join('')}</datalist></div>
      ${inp('rec', 'تاريخ ووقت الاستلام', crpToLocal(r.received_at), 'datetime-local')}
      <div class="fg"><label>التصنيف</label><select id="crp-cat" style="width:100%">${['للإجراء','للمتابعة','للعلم','للتعميم'].map(k => `<option ${k === (r.category || 'للإجراء') ? 'selected' : ''}>${k}</option>`).join('')}</select></div>
      <div class="fg"><label>الأولوية</label><select id="crp-pri" style="width:100%">${['عادي','مهم','عاجل'].map(k => `<option ${k === (r.priority || 'عادي') ? 'selected' : ''}>${k}</option>`).join('')}</select></div>
      ${inp('due', 'الموعد النهائي للرد (اختياري)', r.due_date, 'date')}</div>
    <div class="fg" style="margin-top:8px"><label>الموضوع *</label><input id="crp-subj" value="${crpEsc(r.subject)}" style="width:100%"></div>
    <div class="fg"><label>ملخص المطلوب</label><textarea id="crp-sum" style="width:100%;min-height:60px">${crpEsc(r.summary)}</textarea></div>
    <div class="fg"><label>ملاحظات</label><textarea id="crp-notes" style="width:100%;min-height:44px">${crpEsc(r.notes)}</textarea></div>
    <div style="display:flex;gap:8px;margin:8px 0"><button class="btn" style="background:var(--g);color:#fff" onclick="crpSave('${id || ''}')">${id ? 'حفظ التعديلات' : 'تسجيل المعاملة'}</button>
      ${id ? `<button class="btn" style="color:#a32d2d" onclick="crpDelete('${id}')">حذف</button>` : ''}</div>
    ${id ? `<hr><div id="crp-detail"></div>` : ''}</div>`;
  document.body.appendChild(d);
  if (id) crpDetail(r);
}
async function crpSave(id) {
  const g = i => document.getElementById('crp-' + i).value;
  const body = { book_no: g('bno'), book_date: g('bdate'), source: g('src'), received_at: g('rec') ? new Date(g('rec')).toISOString() : '', category: g('cat'), priority: g('pri'), due_date: g('due'), subject: g('subj'), summary: g('sum'), notes: g('notes') };
  const r = id ? await api('/api/corr/' + id, 'PUT', body) : await api('/api/corr', 'POST', body);
  if (r && r.error) return alert(r.error);
  if (!id) { document.getElementById('crp-dlg').remove(); alert('تم التسجيل برقم وارد: ' + r.in_no); }
  CRP_SOURCES = await api('/api/corr/sources'); if (!Array.isArray(CRP_SOURCES)) CRP_SOURCES = [];
  if (CRP_TAB === 'reg') crpRenderReg(); if (id) crpOpen(id);
}
async function crpDelete(id) {
  if (!confirm('حذف هذه المعاملة نهائياً؟')) return;
  await api('/api/corr/' + id + '/delete', 'POST', {});
  document.getElementById('crp-dlg').remove(); crpRenderReg();
}
function crpDetail(r) {
  const box = document.getElementById('crp-detail'); if (!box) return;
  const acts = r.actions || [], hist = r.history || [];
  box.innerHTML = `<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:8px"><b>الحالة:</b>
      <select id="crp-st" style="padding:6px">${CRP_ST.map(k => `<option ${k === r.status ? 'selected' : ''}>${k}</option>`).join('')}</select>
      <input id="crp-stnote" placeholder="ملاحظة على التغيير (اختياري)" style="flex:1;min-width:160px;padding:6px;border:1px solid var(--border);border-radius:8px">
      <button class="btn btn-sm" onclick="crpSetStatus('${r.id}')">تغيير الحالة</button></div>
    <b>الإجراءات المتخذة</b>
    <div style="margin:6px 0">${acts.map(a => `<div style="border:1px solid var(--border);border-radius:8px;padding:8px;margin-bottom:6px;font-size:13px;${a.done ? 'background:#F1FAF4' : ''}">
        <div style="display:flex;justify-content:space-between;gap:8px"><span><b>${crpEsc(a.type)}</b> — ${crpEsc(a.date)}${a.out_no ? ' — صادر رقم ' + crpEsc(a.out_no) + (a.out_date ? ' بتاريخ ' + crpEsc(a.out_date) : '') : ''}${a.to ? ' — إلى: ' + crpEsc(a.to) : ''}</span>
        <span style="white-space:nowrap"><label style="font-size:12px"><input type="checkbox" ${a.done ? 'checked' : ''} onchange="crpActDone('${r.id}','${a.aid}',this.checked)"> منجز</label> <a href="#" onclick="crpActDel('${r.id}','${a.aid}');return false" style="color:#a32d2d">حذف</a></span></div>
        ${a.text ? `<div style="color:#444;margin-top:3px">${crpEsc(a.text)}</div>` : ''}</div>`).join('') || '<div style="font-size:12px;color:var(--muted)">لا توجد إجراءات بعد</div>'}</div>
    <div style="background:#f6f8f6;border-radius:8px;padding:8px;display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:6px">
      <select id="crp-a-t" onchange="crpActType()">${CRP_AT.map(k => `<option>${k}</option>`).join('')}</select>
      <input id="crp-a-d" type="date" value="${new Date().toLocaleDateString('en-CA')}">
      <input id="crp-a-no" placeholder="رقم الصادر">
      <input id="crp-a-od" type="date" title="تاريخ الصادر">
      <input id="crp-a-to" placeholder="الجهة المحوَّل إليها" style="display:none">
      <input id="crp-a-x" placeholder="تفاصيل الإجراء" style="grid-column:1/-1">
      <button class="btn btn-sm" style="background:var(--g);color:#fff" onclick="crpAddAct('${r.id}')">➕ إضافة إجراء</button></div>
    <div style="margin-top:12px"><b>سجل الحالة</b>${hist.slice().reverse().map(h => `<div style="font-size:12px;color:#555;padding:3px 0;border-bottom:1px dashed #eee">${crpEsc(crpFmtDT(h.at))} — <b style="color:${CRP_STCOL[h.status] || '#444'}">${crpEsc(h.status)}</b>${h.note ? ' — ' + crpEsc(h.note) : ''}</div>`).join('')}</div>`;
}
function crpActType() {
  const t = document.getElementById('crp-a-t').value;
  document.getElementById('crp-a-no').style.display = t === 'كتاب صادر' ? '' : 'none';
  document.getElementById('crp-a-od').style.display = t === 'كتاب صادر' ? '' : 'none';
  document.getElementById('crp-a-to').style.display = t === 'تحويل لجهة' ? '' : 'none';
}
async function crpRefresh(id) { if (CRP_TAB === 'reg') crpLoad(); crpOpen(id); }
async function crpSetStatus(id) {
  const r = await api('/api/corr/' + id + '/status', 'POST', { status: document.getElementById('crp-st').value, note: document.getElementById('crp-stnote').value });
  if (r && r.error) return alert(r.error); crpRefresh(id);
}
async function crpAddAct(id) {
  const g = i => document.getElementById('crp-a-' + i).value;
  const r = await api('/api/corr/' + id + '/action', 'POST', { type: g('t'), date: g('d'), out_no: g('no'), out_date: g('od'), to: g('to'), text: g('x') });
  if (r && r.error) return alert(r.error); crpRefresh(id);
}
async function crpActDone(id, aid, done) { await api('/api/corr/' + id + '/action/update', 'POST', { aid, done }); crpRefresh(id); }
async function crpActDel(id, aid) { if (!confirm('حذف الإجراء؟')) return; await api('/api/corr/' + id + '/action/delete', 'POST', { aid }); crpRefresh(id); }

// ── الطباعة والتصدير ──
function crpPrintReg() {
  openPrint(`<div style="text-align:center;font-weight:800;font-size:15pt;margin-bottom:8px">سجل المعاملات الواردة</div>` +
    crpPrintTbl(['رقم الوارد','رقم الكتاب','تاريخ الكتاب','الجهة','الموضوع','تاريخ الاستلام','الحالة','موعد الرد'],
      CRP_ROWS.map(r => [r.in_no, r.book_no, r.book_date, r.source, r.subject, r.received_date, r.status, r.due_date])));
}
function crpDownload(name, head, rows) {
  const tr = a => '<tr>' + a.map(v => `<td>${crpEsc(v)}</td>`).join('') + '</tr>';
  const html = '<html dir="rtl"><head><meta charset="UTF-8"></head><body><table border="1">' + tr(head) + rows.map(tr).join('') + '</table></body></html>';
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + html], { type: 'application/vnd.ms-excel' })); a.download = name; a.click();
}
function crpExcel() {
  crpDownload('correspondences.xls', ['رقم الوارد','رقم الكتاب','تاريخ الكتاب','الجهة','الموضوع','الملخص','تاريخ الاستلام','المدة (يوم)','الأولوية','الحالة','موعد الرد','الإجراءات'],
    CRP_ROWS.map(r => [r.in_no, r.book_no, r.book_date, r.source, r.subject, r.summary, r.received_date, r.age_days, r.priority, r.status, r.due_date, (r.actions || []).map(a => a.type + (a.out_no ? ' ' + a.out_no : '') + (a.text ? ': ' + a.text : '')).join(' | ')]));
}

// ── التقرير الشهري ──
async function crpRenderRep() {
  const box = document.getElementById('crp-body');
  const m = (CRP_REP && CRP_REP.month) || new Date().toLocaleDateString('en-CA').slice(0, 7);
  box.innerHTML = `<div class="card"><div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><label>الشهر <input id="crp-m" type="month" value="${m}" onchange="crpRenderRep()"></label>
    <button class="btn btn-sm" onclick="crpPrintRep()"><i class="ti ti-printer"></i> طباعة</button><button class="btn btn-sm" onclick="crpExcelRep()"><i class="ti ti-file-spreadsheet"></i> Excel</button></div><div id="crp-rep" style="margin-top:10px">جارٍ التحميل...</div></div>`;
  const val = document.getElementById('crp-m').value || m;
  CRP_REP = await api('/api/corr/report?month=' + val);
  const r = CRP_REP, rb = document.getElementById('crp-rep'); if (!rb) return;
  if (!r || r.error) { rb.textContent = (r && r.error) || 'تعذّر التحميل'; return; }
  rb.innerHTML = `<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px">${[['وارد الشهر', r.received, '#2563a8'], ['أُنجز خلال الشهر', r.done, '#1B6B3A'], ['مفتوحة', r.open, '#B7791F'], ['متأخرة (حالياً)', r.overdue, '#c0392b'], ['متوسط مدة الإنجاز (يوم)', r.avg_days, '#333']].map(([l, n, c]) => `<div class="card" style="padding:8px 14px;margin:0;text-align:center"><div style="font-size:11.5px;color:var(--muted)">${l}</div><div style="font-size:20px;font-weight:800;color:${c}">${n}</div></div>`).join('')}</div>
    <b>الوارد حسب الجهة</b><div style="margin:6px 0 12px">${r.by_source.map(s => `<span style="display:inline-block;background:#f1f3f0;border-radius:99px;padding:3px 10px;font-size:12px;margin:2px">${crpEsc(s.source)}: <b>${s.count}</b></span>`).join('') || '—'}</div>
    <b>المعاملات الواردة خلال الشهر</b><div class="tw"><table><thead><tr><th>رقم الوارد</th><th>الجهة</th><th>الموضوع</th><th>الاستلام</th><th>الحالة</th><th>المدة</th></tr></thead><tbody>${r.received_rows.map(x => `<tr><td>${crpEsc(x.in_no)}</td><td>${crpEsc(x.source)}</td><td>${crpEsc(x.subject)}</td><td>${crpEsc(x.received_date)}</td><td>${crpEsc(x.status)}</td><td>${x.age_days} يوم</td></tr>`).join('') || '<tr><td colspan="6" class="center">لا يوجد</td></tr>'}</tbody></table></div>
    <b style="display:block;margin-top:12px">المعاملات المفتوحة (لم تُنجز بعد)</b><div class="tw"><table><thead><tr><th>رقم الوارد</th><th>الجهة</th><th>الموضوع</th><th>الاستلام</th><th>الحالة</th><th>المدة</th><th>موعد الرد</th></tr></thead><tbody>${r.open_rows.map(x => `<tr${x.overdue ? ' style="background:#FDF0F0"' : ''}><td>${crpEsc(x.in_no)}</td><td>${crpEsc(x.source)}</td><td>${crpEsc(x.subject)}</td><td>${crpEsc(x.received_date)}</td><td>${crpEsc(x.status)}</td><td>${x.age_days} يوم</td><td>${crpEsc(x.due_date || '-')}</td></tr>`).join('') || '<tr><td colspan="7" class="center">لا يوجد</td></tr>'}</tbody></table></div>`;
}
function crpPrintTbl(heads, rows) {
  const th = 'border:1px solid #333;padding:5px 6px;background:#e9ece9;font-size:9.5pt;text-align:right';
  const td = 'border:1px solid #333;padding:5px 6px;font-size:9.5pt;text-align:right;vertical-align:top';
  return `<table style="width:100%;border-collapse:collapse;margin:6px 0 14px"><thead><tr><th style="${th};width:28px">#</th>${heads.map(h => `<th style="${th}">${h}</th>`).join('')}</tr></thead><tbody>${
    rows.map((r, i) => `<tr><td style="${td}">${i + 1}</td>${r.map(v => `<td style="${td}">${crpEsc(v)}</td>`).join('')}</tr>`).join('') || `<tr><td colspan="${heads.length + 1}" style="${td};text-align:center">لا يوجد</td></tr>`}</tbody></table>`;
}
function crpPrintRep() {
  const r = CRP_REP; if (!r || r.error) return;
  const box = (l, n) => `<td style="border:1px solid #333;padding:6px 10px;text-align:center"><div style="font-size:9pt">${l}</div><div style="font-size:14pt;font-weight:800">${n}</div></td>`;
  const h = t => `<div style="font-weight:800;font-size:11.5pt;margin:12px 0 2px;border-bottom:2px solid #333;padding-bottom:2px">${t}</div>`;
  openPrint(`<div style="text-align:center;font-weight:800;font-size:15pt;margin-bottom:10px">تقرير المعاملات الواردة — ${crpEsc(r.month)}</div>
    <table style="width:100%;border-collapse:collapse;margin-bottom:6px"><tr>${box('وارد الشهر', r.received)}${box('أُنجز خلال الشهر', r.done)}${box('مفتوحة', r.open)}${box('متأخرة (حالياً)', r.overdue)}${box('متوسط مدة الإنجاز (يوم)', r.avg_days)}</tr></table>
    ${h('الوارد حسب الجهة')}${crpPrintTbl(['الجهة', 'العدد'], r.by_source.map(x => [x.source, x.count]))}
    ${h('المعاملات الواردة خلال الشهر')}${crpPrintTbl(['رقم الوارد', 'الجهة', 'الموضوع', 'الاستلام', 'الحالة', 'المدة (يوم)'], r.received_rows.map(x => [x.in_no, x.source, x.subject, x.received_date, x.status, x.age_days]))}
    ${h('المعاملات المفتوحة (لم تُنجز بعد)')}${crpPrintTbl(['رقم الوارد', 'الجهة', 'الموضوع', 'الاستلام', 'الحالة', 'المدة (يوم)', 'موعد الرد'], r.open_rows.map(x => [x.in_no, x.source, x.subject, x.received_date, x.status, x.age_days, x.due_date || '-']))}`);
}
function crpExcelRep() {
  if (!CRP_REP) return;
  crpDownload('correspondences_' + CRP_REP.month + '.xls', ['رقم الوارد','الجهة','الموضوع','تاريخ الاستلام','الحالة','المدة (يوم)','موعد الرد','النوع'],
    CRP_REP.received_rows.map(x => [x.in_no, x.source, x.subject, x.received_date, x.status, x.age_days, x.due_date, 'وارد الشهر']).concat(CRP_REP.open_rows.map(x => [x.in_no, x.source, x.subject, x.received_date, x.status, x.age_days, x.due_date, 'مفتوحة'])));
}

// ── بطاقة الصفحة الرئيسية (تحت بطاقة حضور الطلبة) ──
async function corrDashCard() {
  const panel = document.getElementById('panel-dash'); if (!panel || document.getElementById('corr-dash-card')) return;
  if (!ME || ME.role !== 'admin') return;
  const st = await api('/api/corr/stats'); if (!st || st.error || document.getElementById('corr-dash-card')) return;
  const div = document.createElement('div'); div.id = 'corr-dash-card'; div.className = 'card';
  div.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:8px"><div style="font-weight:700;color:var(--g)">📨 المعاملات والمراسلات</div><button class="btn btn-sm" onclick="go('corr')">فتح السجل</button></div>
    <div style="display:flex;gap:8px;flex-wrap:wrap">${[['إجمالي المعاملات', st.total, '#333'], ['معلّقة', st.pending, '#B7791F'], ['منجزة', st.done, '#1B6B3A'], ['متأخرة', st.overdue, '#c0392b']].map(([l, n, c]) => `<div style="background:#f6f8f6;border:1px solid var(--border);border-radius:10px;padding:8px 18px;text-align:center"><div style="font-size:11.5px;color:var(--muted)">${l}</div><div style="font-size:20px;font-weight:800;color:${c}">${n}</div></div>`).join('')}</div>`;
  const att = document.getElementById('att-dash-card');
  if (att) att.after(div); else panel.insertBefore(div, panel.firstChild.nextSibling || null);
}

// ── عرض المعاملة للقراءة فقط (بدون فتح نموذج التعديل) ──
function crpView(id) {
  const r = CRP_ROWS.find(x => x.id === id); if (!r) return;
  const old = document.getElementById('crp-view'); if (old) old.remove();
  const row = (l, v) => v ? `<div style="display:flex;gap:8px;padding:4px 0;border-bottom:1px dashed #eee;font-size:13px"><span style="min-width:120px;color:var(--muted)">${l}</span><span style="flex:1">${crpEsc(v)}</span></div>` : '';
  const d = document.createElement('div'); d.id = 'crp-view';
  d.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:9999;display:flex;align-items:flex-start;justify-content:center;padding:14px;overflow:auto;font-family:'Tajawal','Segoe UI',Tahoma,Arial,sans-serif";
  d.onclick = e => { if (e.target === d) d.remove(); };
  d.innerHTML = `<div style="background:#fff;border-radius:12px;padding:18px;max-width:640px;width:100%;margin:auto">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><b style="color:var(--g)">معاملة ${crpEsc(r.in_no)}</b><button onclick="document.getElementById('crp-view').remove()" style="background:none;border:none;font-size:18px;cursor:pointer">✕</button></div>
    <div style="margin-bottom:8px"><span style="color:${CRP_STCOL[r.status] || '#444'};font-weight:700">${crpEsc(r.status)}</span> · <span style="color:${CRP_PRCOL[r.priority] || '#444'};font-weight:700">${crpEsc(r.priority)}</span> · ${crpEsc(r.category)}${r.overdue ? ' · <b style="color:#c0392b">⚠️ متأخرة</b>' : ''}</div>
    ${row('الموضوع', r.subject)}${row('الجهة', r.source)}${row('رقم الكتاب', r.book_no)}${row('تاريخ الكتاب', r.book_date)}${row('الاستلام', crpFmtDT(r.received_at))}${row('المدة منذ الاستلام', r.age_days + ' يوم')}${row('موعد الرد', r.due_date)}${row('ملخص المطلوب', r.summary)}${row('ملاحظات', r.notes)}
    <div style="margin-top:10px"><b>الإجراءات</b>${(r.actions || []).map(a => `<div style="font-size:13px;padding:5px 0;border-bottom:1px dashed #eee">${a.done ? '✅' : '⬜'} <b>${crpEsc(a.type)}</b> — ${crpEsc(a.date)}${a.out_no ? ' — صادر رقم ' + crpEsc(a.out_no) + (a.out_date ? ' بتاريخ ' + crpEsc(a.out_date) : '') : ''}${a.to ? ' — إلى: ' + crpEsc(a.to) : ''}${a.text ? '<div style="color:#444">' + crpEsc(a.text) + '</div>' : ''}</div>`).join('') || '<div style="font-size:12px;color:var(--muted)">لا توجد إجراءات</div>'}</div>
    <div style="margin-top:10px"><b>سجل الحالة</b>${(r.history || []).slice().reverse().map(h => `<div style="font-size:12px;color:#555;padding:3px 0">${crpEsc(crpFmtDT(h.at))} — <b style="color:${CRP_STCOL[h.status] || '#444'}">${crpEsc(h.status)}</b>${h.note ? ' — ' + crpEsc(h.note) : ''}</div>`).join('')}</div>
    <div style="margin-top:12px;display:flex;gap:8px"><button class="btn btn-sm" onclick="document.getElementById('crp-view').remove();crpOpen('${r.id}')">فتح للتعديل</button><button class="btn btn-sm" onclick="document.getElementById('crp-view').remove()">إغلاق</button></div></div>`;
  document.body.appendChild(d);
}
