// ══════════════════════════════════════════════════════════════
// حضور طلبة التفوق الفني — زيارات مستمرة (دوام ٨:٠٠–١٥:٠٠) برمز QR متجدد لكل نشاط + تقرير شهري (admin/editor)
// ══════════════════════════════════════════════════════════════
let ATT_TAB = 'today', ATT_TIMER = null, ATT_REP = null;
const attEsc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const attActs = () => (typeof TALENT_ACTS !== 'undefined' ? TALENT_ACTS : ['المرسم الجامعي','الغناء','العزف','الأداء الحركي','الحرف اليدوية','الخط العربي','المسرح الجامعي']);
const attMonthNow = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Amman' }).slice(0, 7);

function loadTalentAttendance() {
  const panel = document.getElementById('panel-talent_attendance');
  if (!panel) return;
  panel.innerHTML = `
  <div class="ph"><div><div class="pt">حضور طلبة التفوق الفني</div><div class="ps">زيارة مستمرة خلال الدوام ٨:٠٠ صباحاً – ٣:٠٠ عصراً — يمسح الطالب الرمز المعروض على الشاشة فتُسجَّل زيارته بالتاريخ واليوم والوقت</div></div></div>
  <div class="card" style="display:flex;gap:8px">
    <button class="btn btn-sm" id="att-t-today" onclick="attTab('today')">📺 الزيارات والشاشات</button>
    <button class="btn btn-sm" id="att-t-report" onclick="attTab('report')">📊 التقرير الشهري</button>
  </div>
  <div id="att-body"></div>`;
  attTab(ATT_TAB);
}
function attTab(t) {
  ATT_TAB = t;
  ['today','report'].forEach(k => { const b = document.getElementById('att-t-' + k); if (b) { b.style.background = k === t ? 'var(--g)' : ''; b.style.color = k === t ? '#fff' : ''; } });
  t === 'today' ? attRenderToday() : attRenderReport();
}

// ── الزيارات (يوم محدد أو فترة) + أزرار فتح شاشة الرمز لكل نشاط ──
let ATT_DAY = null;
const attTodayStr = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Amman' });
async function attRenderToday() {
  const body = document.getElementById('att-body');
  const sel = 'padding:7px;border:1px solid var(--border);border-radius:var(--r)';
  body.innerHTML = `
  <div class="card"><div style="font-weight:700;margin-bottom:8px">فتح شاشة الرمز (اختاري النشاط وجهّزي الشاشة في مكانه)</div>
    <div style="display:flex;gap:8px;flex-wrap:wrap">${attActs().map(a => `<button class="btn btn-sm" style="background:var(--g);color:#fff" onclick="openAttendQR('${attEsc(a)}')"><i class="ti ti-qrcode"></i> ${attEsc(a)}</button>`).join('')}</div></div>
  <div class="card"><b id="att-today-title">الزيارات</b>
    <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:8px 0">
      <label style="font-size:12px">من <input id="att-from" type="date" value="${attTodayStr()}" onchange="attLoadToday()" style="${sel}"></label>
      <label style="font-size:12px">إلى <input id="att-to" type="date" onchange="attLoadToday()" style="${sel}"></label>
      <button class="btn btn-sm" onclick="document.getElementById('att-from').value='${attTodayStr()}';document.getElementById('att-to').value='';attLoadToday()">اليوم</button>
      <select id="att-today-act" onchange="attLoadToday()" style="${sel}"><option value="">كل الأنشطة</option>${attActs().map(a => `<option>${attEsc(a)}</option>`).join('')}</select>
      <select id="att-today-col" onchange="attLoadToday()" style="${sel}"><option value="">جميع الكليات</option>${typeof colOpts === 'function' ? colOpts() : ''}</select>
      <select id="att-today-gen" onchange="attLoadToday()" style="${sel}"><option value="">كل الجنسين</option><option>ذكر</option><option>أنثى</option></select>
    </div>
    <div style="font-size:11.5px;color:var(--muted);margin-bottom:8px">اتركي «إلى» فارغاً لعرض يوم «من» فقط.</div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:8px">
      <button class="btn btn-sm" onclick="attPrintDay()"><i class="ti ti-printer"></i> طباعة الكشف</button>
      <label style="font-size:12px;display:flex;align-items:center;gap:4px"><input type="checkbox" id="att-sign"> إضافة عمود توقيع</label>
      <button class="btn btn-sm" onclick="attExportDay()"><i class="ti ti-download"></i> تصدير Excel</button>
      <span style="flex:1"></span>
      <input id="att-man-id" type="text" inputmode="numeric" placeholder="تسجيل يدوي (اليوم): الرقم الجامعي" style="padding:8px;border:1px solid var(--border);border-radius:var(--r);min-width:200px">
      <button class="btn btn-sm" onclick="attManual()">إضافة</button></div>
    <div class="tw"><table><thead><tr><th>#</th><th>الرقم الجامعي</th><th>الاسم</th><th>الكلية</th><th>النشاط</th><th>اليوم</th><th>التاريخ</th><th>الوقت</th><th></th></tr></thead><tbody id="att-today-body"><tr><td colspan="9" class="center">جارٍ التحميل...</td></tr></tbody></table></div></div>`;
  attLoadToday();
}
async function attLoadToday() {
  const g = id => (document.getElementById(id) || {}).value || '';
  const p = new URLSearchParams();
  if (g('att-from')) p.set('from', g('att-from'));
  if (g('att-to')) p.set('to', g('att-to'));
  ['today-act:activity', 'today-col:college', 'today-gen:gender'].forEach(x => { const [i, k] = x.split(':'); if (g('att-' + i)) p.set(k, g('att-' + i)); });
  const r = await api('/api/talent-attendance/today?' + p);
  const tb = document.getElementById('att-today-body'); if (!tb) return;
  if (!r || !r.visits) { tb.innerHTML = '<tr><td colspan="9" class="center">تعذّر التحميل</td></tr>'; return; }
  ATT_DAY = r;
  document.getElementById('att-today-title').textContent = (r.from === r.to ? `زيارات ${r.day} ${r.from}` : `زيارات الفترة ${r.from} → ${r.to}`) + ` (${r.visits.length})`;
  tb.innerHTML = r.visits.length ? r.visits.map((v, i) => `<tr><td>${i + 1}</td><td><b>${attEsc(v.student_id)}</b></td><td>${attEsc(v.name)}</td><td style="font-size:11px">${attEsc(v.college || '-')}</td><td>${attEsc(v.activity)}</td><td>${attEsc(v.day)}</td><td>${attEsc(v.date)}</td><td>${attEsc(v.time)}${v.manual ? ' <small>(يدوي)</small>' : ''}</td>
    <td><button class="btn btn-sm" style="color:#c0392b" onclick="attDelVisit('${v.id}')"><i class="ti ti-x"></i></button></td></tr>`).join('') : '<tr><td colspan="9" class="center">لا توجد زيارات مسجَّلة</td></tr>';
}
function attDayTitle() {
  const r = ATT_DAY, act = (document.getElementById('att-today-act') || {}).value || 'جميع الأنشطة';
  return { act, when: r.from === r.to ? `${r.day} ${r.from}` : `من ${r.from} إلى ${r.to}` };
}
function attPrintDay() {
  const r = ATT_DAY; if (!r) return;
  const sign = document.getElementById('att-sign').checked, multi = r.from !== r.to, t = attDayTitle();
  openPrint(`<h2 style="text-align:center">كشف حضور طلبة التفوق الفني — ${attEsc(t.act)}</h2>
    <p style="text-align:center">${attEsc(t.when)} — عدد الحاضرين: ${r.visits.length}</p>
    <table border="1" cellspacing="0" cellpadding="6" style="width:100%;border-collapse:collapse;font-size:13px"><thead><tr><th>#</th><th>الرقم الجامعي</th><th>الاسم</th><th>الكلية</th>${t.act === 'جميع الأنشطة' ? '<th>النشاط</th>' : ''}${multi ? '<th>اليوم</th><th>التاريخ</th>' : ''}<th>وقت الوصول</th>${sign ? '<th style="min-width:90px">التوقيع</th>' : ''}</tr></thead>
    <tbody>${r.visits.map((v, i) => `<tr><td>${i + 1}</td><td>${attEsc(v.student_id)}</td><td>${attEsc(v.name)}</td><td>${attEsc(v.college)}</td>${t.act === 'جميع الأنشطة' ? `<td>${attEsc(v.activity)}</td>` : ''}${multi ? `<td>${attEsc(v.day)}</td><td>${attEsc(v.date)}</td>` : ''}<td>${attEsc(v.time)}</td>${sign ? '<td></td>' : ''}</tr>`).join('')}</tbody></table>`);
}
function attExportDay() {
  const r = ATT_DAY; if (!r) return;
  const data = [['#', 'الرقم الجامعي', 'الاسم', 'الكلية', 'النشاط', 'اليوم', 'التاريخ', 'الوقت']].concat(r.visits.map((v, i) => [i + 1, v.student_id, v.name, v.college, v.activity, v.day, v.date, v.time]));
  if (typeof XLSX !== 'undefined') {
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(data), 'الحضور');
    XLSX.writeFile(wb, `حضور_${r.from}${r.from === r.to ? '' : '_' + r.to}.xlsx`);
  }
}
async function attManual() {
  const el = document.getElementById('att-man-id'); const v = el.value.trim(); if (!v) return;
  const r = await api('/api/talent-attendance/manual', 'POST', { student_id: v });
  if (r && r.error) { alert(r.error); return; }
  el.value = ''; attLoadToday();
}
async function attDelVisit(id) {
  if (!confirm('حذف هذه الزيارة؟')) return;
  await api('/api/talent-attendance/visit/delete', 'POST', { id });
  attLoadToday();
}

// ── التقرير الشهري ──
async function attRenderReport() {
  const body = document.getElementById('att-body');
  const colSel = typeof colOpts === 'function' ? colOpts() : '';
  body.innerHTML = `
  <div class="card" style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
    <input id="ar-month" type="month" value="${attMonthNow()}" onchange="attLoadReport()" style="padding:7px;border:1px solid var(--border);border-radius:var(--r)">
    <select id="ar-act" onchange="attLoadReport()" style="padding:7px;border:1px solid var(--border);border-radius:var(--r)"><option value="">جميع الأنشطة</option>${attActs().map(a => `<option>${attEsc(a)}</option>`).join('')}</select>
    <select id="ar-col" onchange="attLoadReport()" style="padding:7px;border:1px solid var(--border);border-radius:var(--r)"><option value="">جميع الكليات</option>${colSel}</select>
    <select id="ar-gen" onchange="attLoadReport()" style="padding:7px;border:1px solid var(--border);border-radius:var(--r)"><option value="">كل الجنسين</option><option>ذكر</option><option>أنثى</option></select>
    <input id="ar-q" type="text" placeholder="بحث بالاسم أو الرقم..." oninput="attDrawReport()" style="padding:7px;border:1px solid var(--border);border-radius:var(--r);flex:1;min-width:160px">
  </div>
  <div id="ar-sum" style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px"></div>
  <div class="card"><div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px">
    <button class="btn btn-sm" onclick="attPrintSummary()"><i class="ti ti-printer"></i> طباعة الكشف الإجمالي</button>
    <button class="btn btn-sm" onclick="attPrintAllDetails()"><i class="ti ti-files"></i> طباعة تفصيلية لكل طالب</button>
    <button class="btn btn-sm" onclick="attExport()"><i class="ti ti-download"></i> تصدير Excel</button></div>
    <div class="tw"><table><thead><tr><th>#</th><th>الرقم الجامعي</th><th>الاسم</th><th>الكلية</th><th>النشاط</th><th>أيام الزيارة</th><th>آخر زيارة</th><th></th></tr></thead><tbody id="ar-body"></tbody></table></div></div>`;
  attLoadReport();
}
async function attLoadReport() {
  const g = id => (document.getElementById(id) || {}).value || '';
  const p = new URLSearchParams({ month: g('ar-month') });
  ['act:activity', 'col:college', 'gen:gender'].forEach(x => { const [i, k] = x.split(':'); if (g('ar-' + i)) p.set(k, g('ar-' + i)); });
  const tb = document.getElementById('ar-body'); if (tb) tb.innerHTML = '<tr><td colspan="8" class="center">جارٍ التحميل...</td></tr>';
  const r = await api('/api/talent-attendance/report?' + p);
  if (!r || !r.rows) { if (tb) tb.innerHTML = '<tr><td colspan="8" class="center">تعذّر التحميل</td></tr>'; return; }
  ATT_REP = r; attDrawReport();
}
function attFiltered() {
  const q = ((document.getElementById('ar-q') || {}).value || '').trim();
  return !ATT_REP ? [] : (q ? ATT_REP.rows.filter(r => String(r.name).includes(q) || String(r.student_id).includes(q)) : ATT_REP.rows);
}
function attDrawReport() {
  if (!ATT_REP) return;
  const rows = attFiltered(), s = ATT_REP.summary;
  const chip = (t, v, c) => `<div class="card" style="margin:0;padding:10px 16px;min-width:130px"><div style="font-size:11px;color:var(--muted)">${t}</div><div style="font-size:22px;font-weight:800;color:${c || 'var(--g)'}">${v}</div></div>`;
  document.getElementById('ar-sum').innerHTML = chip('عدد الطلبة', s.students) + chip('زاروا هذا الشهر', s.visited) + chip('لم يزوروا', s.not_visited, '#c0392b') + chip('إجمالي الزيارات', s.visits);
  document.getElementById('ar-body').innerHTML = rows.length ? rows.map((r, i) => `<tr><td>${i + 1}</td><td><b>${attEsc(r.student_id)}</b></td><td>${attEsc(r.name)}</td><td style="font-size:11px">${attEsc(r.college || '-')}</td><td>${attEsc(r.activity)}</td>
    <td><b style="color:${r.days ? 'var(--g)' : '#c0392b'}">${r.days}</b></td><td>${attEsc(r.last || '-')}</td>
    <td><button class="btn btn-sm" onclick="attStudentDetail('${attEsc(r.student_id)}')">تفاصيل</button></td></tr>`).join('') : '<tr><td colspan="8" class="center">لا توجد نتائج</td></tr>';
}
async function attStudentDetail(sid) {
  const month = document.getElementById('ar-month').value;
  const r = await api('/api/talent-attendance/student/' + encodeURIComponent(sid) + '?month=' + month);
  if (!r || !r.visits) { alert('تعذّر التحميل'); return; }
  window.ATT_DET = { sid, month, r };
  const m = document.getElementById('mod-attend');
  m.querySelector('.modal').innerHTML = `<h3>${attEsc(r.student ? r.student.name : sid)} <small style="color:var(--muted)">(${attEsc(sid)})</small></h3>
    <div style="font-size:12.5px;color:var(--muted);margin-bottom:8px">${attEsc(r.student ? r.student.activity : '')} — شهر ${attEsc(month)} — عدد الزيارات: <b>${r.visits.length}</b></div>
    <div class="tw" style="max-height:50vh;overflow:auto"><table><thead><tr><th>#</th><th>اليوم</th><th>التاريخ</th><th>الوقت</th></tr></thead><tbody>
    ${r.visits.length ? r.visits.map((v, i) => `<tr><td>${i + 1}</td><td>${attEsc(v.day)}</td><td>${attEsc(v.date)}</td><td>${attEsc(v.time)}${v.manual ? ' (يدوي)' : ''}</td></tr>`).join('') : '<tr><td colspan="4" class="center">لا زيارات في هذا الشهر</td></tr>'}</tbody></table></div>
    <div style="display:flex;gap:8px;margin-top:10px"><button class="btn" onclick="attPrintStudent()">🖨️ طباعة</button><button class="btn" onclick="document.getElementById('mod-attend').classList.remove('open')">إغلاق</button></div>`;
  m.classList.add('open');
}
const attStudentSheet = (st, sid, month, visits) => `<div style="page-break-after:always">
  <h2 style="text-align:center">كشف زيارات طالب — شهر ${attEsc(month)}</h2>
  <p style="text-align:center">${attEsc(st ? st.name : sid)} — الرقم الجامعي ${attEsc(sid)} — ${attEsc(st ? st.activity : '')}${st && st.college ? ' — ' + attEsc(st.college) : ''}</p>
  <p style="text-align:center">عدد أيام الزيارة: <b>${visits.length}</b></p>
  <table border="1" cellspacing="0" cellpadding="6" style="width:100%;border-collapse:collapse;font-size:13px"><thead><tr><th>#</th><th>اليوم</th><th>التاريخ</th><th>الوقت</th></tr></thead>
  <tbody>${visits.map((v, i) => `<tr><td>${i + 1}</td><td>${attEsc(v.day)}</td><td>${attEsc(v.date)}</td><td>${attEsc(v.time)}</td></tr>`).join('') || '<tr><td colspan="4" style="text-align:center">لا زيارات</td></tr>'}</tbody></table></div>`;
function attPrintStudent() { const d = window.ATT_DET; if (d) openPrint(attStudentSheet(d.r.student, d.sid, d.month, d.r.visits)); }
function attPrintSummary() {
  if (!ATT_REP) return;
  const rows = attFiltered(), act = document.getElementById('ar-act').value;
  openPrint(`<h2 style="text-align:center">تقرير زيارات طلبة التفوق الفني — ${attEsc(act || 'جميع الأنشطة')}</h2>
    <p style="text-align:center">شهر ${attEsc(ATT_REP.month)} — عدد الطلبة ${rows.length} — زاروا ${rows.filter(r => r.days).length} — إجمالي الزيارات ${rows.reduce((n, r) => n + r.days, 0)}</p>
    <table border="1" cellspacing="0" cellpadding="6" style="width:100%;border-collapse:collapse;font-size:13px"><thead><tr><th>#</th><th>الرقم الجامعي</th><th>الاسم</th><th>الكلية</th><th>النشاط</th><th>أيام الزيارة</th><th>آخر زيارة</th></tr></thead>
    <tbody>${rows.map((r, i) => `<tr><td>${i + 1}</td><td>${attEsc(r.student_id)}</td><td>${attEsc(r.name)}</td><td>${attEsc(r.college)}</td><td>${attEsc(r.activity)}</td><td>${r.days}</td><td>${attEsc(r.last || '-')}</td></tr>`).join('')}</tbody></table>`);
}
async function attPrintAllDetails() {
  if (!ATT_REP) return;
  const rows = attFiltered();
  if (!rows.length) return;
  if (rows.length > 15 && !confirm(`سيتم إعداد ${rows.length} ورقة (ورقة لكل طالب). متابعة؟`)) return;
  const month = ATT_REP.month; let html = '';
  for (const r of rows) {
    const d = await api('/api/talent-attendance/student/' + encodeURIComponent(r.student_id) + '?month=' + month);
    html += attStudentSheet(d && d.student, r.student_id, month, (d && d.visits) || []);
  }
  openPrint(html);
}
function attExport() {
  if (!ATT_REP) return;
  const rows = attFiltered();
  const data = [['#', 'الرقم الجامعي', 'الاسم', 'الكلية', 'النشاط', 'أيام الزيارة', 'آخر زيارة']].concat(rows.map((r, i) => [i + 1, r.student_id, r.name, r.college, r.activity, r.days, r.last]));
  if (typeof XLSX !== 'undefined') {
    const ws = XLSX.utils.aoa_to_sheet(data); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'الزيارات');
    XLSX.writeFile(wb, `زيارات_التفوق_${ATT_REP.month}.xlsx`);
  } else {
    const q = v => '"' + String(v ?? '').replace(/"/g, '""') + '"';
    const blob = new Blob(['﻿' + data.map(r => r.map(q).join(',')).join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `زيارات_التفوق_${ATT_REP.month}.csv`; a.click();
  }
}

// ── شاشة الرمز المتجدد لنشاط (مع قائمة زيارات اليوم مباشرة) ──
function closeAttendQR() {
  clearInterval(ATT_TIMER); ATT_TIMER = null;
  const o = document.getElementById('att-qr-ov'); if (o) o.remove();
  if (ATT_TAB === 'today') attLoadToday();
}
function openAttendQR(activity) {
  clearInterval(ATT_TIMER);
  const old = document.getElementById('att-qr-ov'); if (old) old.remove();
  const ov = document.createElement('div');
  ov.id = 'att-qr-ov';
  ov.style.cssText = 'position:fixed;inset:0;background:#fff;z-index:99999;display:flex;font-family:Tajawal,sans-serif;direction:rtl;text-align:center;overflow:auto';
  ov.innerHTML = `<button onclick="closeAttendQR()" style="position:absolute;top:12px;left:12px;padding:8px 16px;border:1px solid #ccc;border-radius:8px;background:#fff;cursor:pointer;font-size:14px;z-index:2">✕ إغلاق</button>
    <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:16px;min-width:0">
      <div style="font-size:26px;font-weight:800;color:#0F5132">تسجيل الحضور — ${attEsc(activity)}</div>
      <div style="font-size:15px;color:#666;margin:4px 0 14px">امسح الرمز بكاميرا هاتفك ثم أدخل رقمك الجامعي (الدوام ٨:٠٠ – ٣:٠٠)</div>
      <img id="att-qr-img" style="width:min(64vh,50vw);height:min(64vh,50vw);image-rendering:pixelated" alt="">
      <div style="font-size:13px;color:#888;margin-top:8px">يتجدد الرمز تلقائياً كل ثوانٍ</div></div>
    <div style="width:min(340px,38vw);border-right:1px solid #e3e6e0;background:#f8faf8;padding:56px 12px 12px;overflow:auto">
      <div style="font-size:18px;font-weight:700">زيارات اليوم: <span id="att-qr-count" style="color:#0F5132">0</span></div>
      <div id="att-qr-list" style="margin-top:10px;font-size:14px;text-align:right"></div></div>`;
  document.body.appendChild(ov);
  let last = '';
  const tick = async () => {
    const r = await api('/api/talent-attendance/qr-token?activity=' + encodeURIComponent(activity));
    if (!r || !r.token) return;
    const c = document.getElementById('att-qr-count'); if (!c) return;
    c.textContent = r.count;
    document.getElementById('att-qr-list').innerHTML = r.visits.map(v => `<div style="padding:6px 4px;border-bottom:1px solid #e3e6e0;display:flex;justify-content:space-between;gap:8px"><span>${attEsc(v.name)}</span><span style="color:#0F5132;font-weight:700;direction:ltr">${attEsc(v.time.slice(0, 5))}</span></div>`).join('') || '<div style="color:#888">لا زيارات بعد</div>';
    if (r.token === last) return;
    last = r.token;
    const url = `${location.origin}/talent-attend.html?a=${encodeURIComponent(activity)}&t=${r.token}`;
    QRCode.toDataURL(url, { width: 640, margin: 1 }, (e, data) => { const im = document.getElementById('att-qr-img'); if (!e && im) im.src = data; });
  };
  tick(); ATT_TIMER = setInterval(tick, 3000);
}
