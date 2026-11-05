// ══════════════════════════════════════════════════════════════
// حضور طلبة التفوق الفني — جلسات + رمز QR متجدد + كشف الحضور (admin/editor)
// ══════════════════════════════════════════════════════════════
let ATT_LIST = [], ATT_CUR = null, ATT_TIMER = null;
const attEsc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

async function loadTalentAttendance() {
  const panel = document.getElementById('panel-talent_attendance');
  if (!panel) return;
  panel.innerHTML = `<div class="ph"><div><div class="pt">حضور طلبة التفوق الفني</div></div></div><div class="card"><div class="center" style="padding:24px">جارٍ التحميل...</div></div>`;
  const r = await api('/api/talent-attendance');
  if (!Array.isArray(r)) { panel.innerHTML = `<div class="card"><div class="center">تعذّر تحميل البيانات</div></div>`; return; }
  ATT_LIST = r; ATT_CUR = null;
  attRenderList();
}

function attRenderList() {
  const panel = document.getElementById('panel-talent_attendance');
  panel.innerHTML = `
  <div class="ph"><div><div class="pt">حضور طلبة التفوق الفني</div><div class="ps">جلسة لكل نشاط — يعرض المشرف رمزاً متجدداً ويمسحه الطالب ليُسجَّل حضوره بالتاريخ واليوم والوقت</div></div></div>
  <div class="card"><button class="btn btn-sm" style="background:var(--g);color:#fff" onclick="attNewSession()"><i class="ti ti-plus"></i> جلسة حضور جديدة</button></div>
  <div class="card"><div class="tw"><table>
    <thead><tr><th>#</th><th>التاريخ</th><th>اليوم</th><th>الوقت</th><th>النشاط</th><th>العنوان</th><th>الحضور</th><th>الحالة</th><th></th></tr></thead>
    <tbody>${ATT_LIST.length ? ATT_LIST.map((s,i) => `<tr>
      <td>${i+1}</td><td>${attEsc(s.date)}</td><td>${attEsc(s.day)}</td><td>${attEsc(s.start_time)}</td>
      <td>${typeof badge==='function'?badge(s.activity):attEsc(s.activity)}</td><td>${attEsc(s.title||'-')}</td>
      <td><b>${s.count}</b></td><td>${s.status==='open'?'🟢 مفتوحة':'⚪ مغلقة'}</td>
      <td style="white-space:nowrap">
        ${s.status==='open'?`<button class="btn btn-sm" style="background:var(--g);color:#fff" onclick="openAttendQR('${s.id}')"><i class="ti ti-qrcode"></i> عرض الرمز</button>`:''}
        <button class="btn btn-sm" onclick="attOpen('${s.id}')"><i class="ti ti-list-check"></i> الكشف</button>
        <button class="btn btn-sm" style="color:#c0392b" onclick="attDelete('${s.id}')"><i class="ti ti-trash"></i></button>
      </td></tr>`).join('') : `<tr><td colspan="9" class="center">لا توجد جلسات بعد</td></tr>`}</tbody>
  </table></div></div>`;
}

function attNewSession() {
  const acts = (typeof TALENT_ACTS !== 'undefined' ? TALENT_ACTS : ['المرسم الجامعي','الغناء','العزف','الأداء الحركي','الحرف اليدوية','الخط العربي','المسرح الجامعي']);
  const m = document.getElementById('mod-attend');
  m.querySelector('.modal').innerHTML = `
    <h3>جلسة حضور جديدة</h3>
    <label style="font-size:12.5px;font-weight:600">النشاط</label>
    <select id="at-act" style="width:100%;padding:9px;margin:6px 0 12px;border:1px solid var(--border);border-radius:var(--r)">${acts.map(a=>`<option>${a}</option>`).join('')}</select>
    <label style="font-size:12.5px;font-weight:600">عنوان الجلسة (اختياري)</label>
    <input id="at-title" type="text" placeholder="مثال: التدريب الأسبوعي" style="width:100%;padding:9px;margin:6px 0 12px;border:1px solid var(--border);border-radius:var(--r)">
    <p style="font-size:12px;color:var(--muted)">يُسجَّل التاريخ واليوم ووقت البدء تلقائياً بتوقيت عمّان.</p>
    <div style="display:flex;gap:8px;margin-top:10px"><button class="btn" style="background:var(--g);color:#fff" onclick="attCreate()">إنشاء وعرض الرمز</button><button class="btn" onclick="document.getElementById('mod-attend').classList.remove('open')">إلغاء</button></div>`;
  m.classList.add('open');
}
async function attCreate() {
  const r = await api('/api/talent-attendance', 'POST', { activity: document.getElementById('at-act').value, title: document.getElementById('at-title').value });
  if (!r || !r.id) { alert((r && r.error) || 'تعذّر الإنشاء'); return; }
  document.getElementById('mod-attend').classList.remove('open');
  await loadTalentAttendance();
  openAttendQR(r.id);
}
async function attDelete(id) {
  if (!confirm('حذف هذه الجلسة وكشف حضورها نهائياً؟')) return;
  await api('/api/talent-attendance/' + id, 'DELETE');
  loadTalentAttendance();
}

async function attOpen(id) {
  const panel = document.getElementById('panel-talent_attendance');
  const d = await api('/api/talent-attendance/' + id);
  if (!d || !d.id) { alert((d && d.error) || 'تعذّر التحميل'); return; }
  ATT_CUR = d;
  const recs = d.records || [];
  panel.innerHTML = `
  <div class="ph"><div><div class="pt">كشف الحضور — ${attEsc(d.activity)}${d.title?' / '+attEsc(d.title):''}</div>
    <div class="ps">${attEsc(d.day)} ${attEsc(d.date)} — حضر <b>${recs.length}</b> من <b>${d.registered}</b> طالب مسجَّل في النشاط — ${d.status==='open'?'🟢 مفتوحة':'⚪ مغلقة'}</div></div></div>
  <div class="card" style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
    <button class="btn btn-sm" onclick="loadTalentAttendance()"><i class="ti ti-arrow-right"></i> رجوع</button>
    ${d.status==='open'?`<button class="btn btn-sm" style="background:var(--g);color:#fff" onclick="openAttendQR('${d.id}')"><i class="ti ti-qrcode"></i> عرض الرمز</button>`:''}
    <button class="btn btn-sm" onclick="attToggle('${d.id}','${d.status==='open'?'closed':'open'}')">${d.status==='open'?'إغلاق التسجيل':'إعادة فتح التسجيل'}</button>
    <button class="btn btn-sm" onclick="attPrint()"><i class="ti ti-printer"></i> طباعة</button>
    <button class="btn btn-sm" onclick="attCsv()"><i class="ti ti-download"></i> تصدير CSV</button>
    <span style="flex:1"></span>
    <input id="at-manual" type="text" inputmode="numeric" placeholder="تسجيل يدوي: الرقم الجامعي" style="padding:8px;border:1px solid var(--border);border-radius:var(--r);min-width:180px">
    <button class="btn btn-sm" onclick="attManual()">إضافة</button>
  </div>
  <div class="card"><div class="tw"><table>
    <thead><tr><th>#</th><th>الرقم الجامعي</th><th>الاسم</th><th>الكلية</th><th>النشاط</th><th>اليوم</th><th>التاريخ</th><th>الوقت</th><th></th></tr></thead>
    <tbody>${recs.length ? recs.map((r,i)=>`<tr><td>${i+1}</td><td><b>${attEsc(r.student_id)}</b></td><td>${attEsc(r.name)}</td><td>${attEsc(r.college||'-')}</td><td>${attEsc(r.activity)}</td><td>${attEsc(r.day)}</td><td>${attEsc(r.date)}</td><td>${attEsc(r.time)}${r.manual?' <small>(يدوي)</small>':''}</td>
      <td><button class="btn btn-sm" style="color:#c0392b" onclick="attRemove('${attEsc(r.student_id)}')"><i class="ti ti-x"></i></button></td></tr>`).join('') : `<tr><td colspan="9" class="center">لم يُسجَّل أي حضور بعد</td></tr>`}</tbody>
  </table></div></div>
  ${d.absent && d.absent.length ? `<div class="card"><div style="font-weight:700;margin-bottom:8px">لم يحضروا بعد (${d.absent.length})</div>
    <div style="font-size:12.5px;line-height:2">${d.absent.map(a=>`${attEsc(a.name)} <span style="color:var(--muted)">(${attEsc(a.student_id)})</span>`).join(' • ')}</div></div>` : ''}`;
}
async function attToggle(id, status) { await api('/api/talent-attendance/' + id + '/status', 'POST', { status }); attOpen(id); }
async function attManual() {
  const v = document.getElementById('at-manual').value.trim();
  if (!v) return;
  const r = await api('/api/talent-attendance/' + ATT_CUR.id + '/manual', 'POST', { student_id: v });
  if (r && r.error) { alert(r.error); return; }
  attOpen(ATT_CUR.id);
}
async function attRemove(sid) {
  if (!confirm('إزالة تسجيل حضور هذا الطالب؟')) return;
  await api('/api/talent-attendance/' + ATT_CUR.id + '/remove', 'POST', { student_id: sid });
  attOpen(ATT_CUR.id);
}
function attPrint() {
  const d = ATT_CUR; if (!d) return;
  openPrint(`<h2 style="text-align:center">كشف حضور — ${attEsc(d.activity)}${d.title?' / '+attEsc(d.title):''}</h2>
    <p style="text-align:center">${attEsc(d.day)} ${attEsc(d.date)} — عدد الحاضرين: ${(d.records||[]).length}</p>
    <table border="1" cellspacing="0" cellpadding="6" style="width:100%;border-collapse:collapse;font-size:13px"><thead><tr><th>#</th><th>الرقم الجامعي</th><th>الاسم</th><th>الكلية</th><th>اليوم</th><th>التاريخ</th><th>الوقت</th></tr></thead>
    <tbody>${(d.records||[]).map((r,i)=>`<tr><td>${i+1}</td><td>${attEsc(r.student_id)}</td><td>${attEsc(r.name)}</td><td>${attEsc(r.college||'')}</td><td>${attEsc(r.day)}</td><td>${attEsc(r.date)}</td><td>${attEsc(r.time)}</td></tr>`).join('')}</tbody></table>`);
}
function attCsv() {
  const d = ATT_CUR; if (!d) return;
  const q = v => '"' + String(v ?? '').replace(/"/g, '""') + '"';
  const rows = [['#','الرقم الجامعي','الاسم','الكلية','النشاط','اليوم','التاريخ','الوقت']].concat((d.records||[]).map((r,i)=>[i+1,r.student_id,r.name,r.college,r.activity,r.day,r.date,r.time]));
  const blob = new Blob(['﻿' + rows.map(r => r.map(q).join(',')).join('\n')], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `attendance_${d.activity}_${d.date}.csv`; a.click();
}

// ── شاشة الرمز المتجدد ──
function closeAttendQR() {
  clearInterval(ATT_TIMER); ATT_TIMER = null;
  const o = document.getElementById('att-qr-ov'); if (o) o.remove();
  if (document.getElementById('panel-talent_attendance') && !ATT_CUR) loadTalentAttendance();
  else if (ATT_CUR) attOpen(ATT_CUR.id);
}
function openAttendQR(id) {
  clearInterval(ATT_TIMER);
  const old = document.getElementById('att-qr-ov'); if (old) old.remove();
  const s = ATT_LIST.find(x => x.id === id) || ATT_CUR || {};
  const ov = document.createElement('div');
  ov.id = 'att-qr-ov';
  ov.style.cssText = 'position:fixed;inset:0;background:#fff;z-index:99999;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:Tajawal,sans-serif;direction:rtl;text-align:center;padding:16px';
  ov.innerHTML = `<button onclick="closeAttendQR()" style="position:absolute;top:14px;left:14px;padding:8px 16px;border:1px solid #ccc;border-radius:8px;background:#fff;cursor:pointer;font-size:14px">✕ إغلاق</button>
    <div style="font-size:26px;font-weight:800;color:#0F5132">تسجيل الحضور — ${attEsc(s.activity||'')}</div>
    <div style="font-size:15px;color:#666;margin:4px 0 14px">امسح الرمز بكاميرا هاتفك ثم أدخل رقمك الجامعي</div>
    <img id="att-qr-img" style="width:min(70vh,80vw);height:min(70vh,80vw);image-rendering:pixelated" alt="">
    <div style="margin-top:14px;font-size:22px;font-weight:700">الحاضرون: <span id="att-qr-count" style="color:#0F5132">0</span></div>
    <div style="font-size:13px;color:#888;margin-top:4px">يتجدد الرمز تلقائياً كل ثوانٍ</div>`;
  document.body.appendChild(ov);
  let last = '';
  const tick = async () => {
    const r = await api('/api/talent-attendance/' + id + '/qr-token');
    if (!r || !r.token) return;
    document.getElementById('att-qr-count').textContent = r.count;
    if (r.token === last) return;
    last = r.token;
    const url = `${location.origin}/talent-attend.html?s=${id}&t=${r.token}`;
    QRCode.toDataURL(url, { width: 640, margin: 1 }, (e, data) => { const im = document.getElementById('att-qr-img'); if (!e && im) im.src = data; });
  };
  tick(); ATT_TIMER = setInterval(tick, 3000);
}
