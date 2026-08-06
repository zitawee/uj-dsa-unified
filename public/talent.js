// ══════════════════════════════════════════════════════════════
// بند مؤقت: التفوق الفني — لوحة الإدارة (Admin فقط)
// وحدة مستقلة تماماً عن باقي النظام لسهولة إزالتها لاحقاً:
// لإزالتها بالكامل: احذف هذا الملف + سطر <script src="/talent.js"> من index.html
// + سطر الشريط الجانبي الخاص بها في buildSidebar() + 'talent_excellence' من IDS في buildPanels()
// + المدخل المقابل في خريطة loaders داخل go() — كل ذلك في app.js
// ══════════════════════════════════════════════════════════════

const TE_TRACKS = {
  academic: 'المسار الأكاديمي', vocational: 'المسار المهني والتقني', btec: 'برنامج BTEC'
};
const TE_STATUS = {
  pending:       { label: '🟡 قيد المراجعة',     cls: 'st-p' },
  accepted_exam: { label: '🔵 مقبول للاختبار',   cls: 'st-d' },
  passed:        { label: '✅ ناجح',              cls: 'st-a' },
  rejected:      { label: '❌ مرفوض',             cls: 'st-r' },
};
let TE_ROWS = [];

// يُستدعى مرة واحدة بعد الدخول (admin فقط) لتعبئة عدّاد الشريط الجانبي دون تحميل اللوحة كاملة
async function teLoadBadgeCount() {
  try {
    const rows = await api('/api/talent_excellence');
    const el = document.getElementById('c-talent_excellence');
    if (el && Array.isArray(rows)) el.textContent = rows.length;
  } catch (e) {}
}

function teEsc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function teBadge(status) {
  const s = TE_STATUS[status] || TE_STATUS.pending;
  return `<span class="st ${s.cls}">${s.label}</span>`;
}
function teDate(d) {
  if (!d) return '';
  try { return new Date(d).toLocaleDateString('ar-JO', { year:'numeric', month:'long', day:'numeric' }); } catch(e) { return ''; }
}

async function loadTalent() {
  const panel = document.getElementById('panel-talent_excellence');
  if (!panel) return;
  panel.innerHTML = `<div class="ph"><div><div class="pt">التفوق الفني</div><div class="ps">طلبات الالتحاق على أساس التفوق الفني (بند مؤقت)</div></div></div>
    <div class="card"><div class="center" style="padding:24px">جارٍ التحميل...</div></div>`;

  const [rows, settings] = await Promise.all([
    api('/api/talent_excellence'),
    api('/api/talent_excellence/settings'),
  ]);
  if (!Array.isArray(rows)) { panel.innerHTML = `<div class="card"><div class="center">تعذّر تحميل البيانات</div></div>`; return; }
  TE_ROWS = rows;

  panel.innerHTML = `
  <div class="ph"><div><div class="pt">التفوق الفني</div><div class="ps">طلبات الالتحاق على أساس التفوق الفني (بند مؤقت) — ${rows.length} طلب</div></div></div>

  <div class="card">
    <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end">
      <div class="fg" style="min-width:170px"><label>تاريخ إغلاق الرابط</label><input type="date" id="te-close-date" value="${settings?.close_date || ''}"></div>
      <button class="btn btn-sm" onclick="teSaveSettings()"><i class="ti ti-device-floppy"></i> حفظ تاريخ الإغلاق</button>
      <div style="font-size:11.5px;color:var(--muted)">${settings?.close_date ? `الرابط مفتوح حتى ${teDate(settings.close_date)}` : 'الرابط مفتوح حالياً بلا تاريخ إغلاق محدَّد'}</div>
      <div style="flex:1"></div>
      <button class="btn btn-sm" onclick="teExportExcel()"><i class="ti ti-file-spreadsheet"></i> تصدير Excel</button>
      <button class="btn btn-sm" onclick="printSelectedTalent()"><i class="ti ti-printer"></i> طباعة المحدد</button>
    </div>
  </div>

  <div class="card">
    <div style="display:flex;gap:10px;flex-wrap:wrap">
      <input type="text" id="te-q" placeholder="بحث بالاسم أو الهاتف أو المدرسة..." style="flex:1;min-width:180px" oninput="teRender()">
      <select id="te-f-status" onchange="teRender()"><option value="">كل الحالات</option>${Object.entries(TE_STATUS).map(([k,v])=>`<option value="${k}">${v.label}</option>`).join('')}</select>
      <select id="te-f-gov" onchange="teRender()"><option value="">كل المحافظات</option>${[...new Set(rows.map(r=>r.governorate).filter(Boolean))].map(g=>`<option>${g}</option>`).join('')}</select>
    </div>
  </div>

  <div class="card">
    <div class="tw"><table>
      <thead><tr>
        <th style="width:26px"><input type="checkbox" onchange="toggleSelectAll('tbl-talent-body', this.checked)"></th>
        <th>#</th><th>الاسم</th><th>الهاتف</th><th>المحافظة / اللواء</th><th>نوع النشاط</th><th>فرع الشهادة</th><th>المعدل</th><th>الحالة</th><th>تاريخ التقديم</th><th>إجراءات</th>
      </tr></thead>
      <tbody id="tbl-talent-body"></tbody>
    </table></div>
  </div>

  <div class="modal-ov" id="te-modal"><div class="modal" style="max-width:640px;max-height:88vh;overflow-y:auto" id="te-modal-body"></div></div>`;

  teRender();
}

function teRender() {
  const q = (document.getElementById('te-q')?.value || '').trim().toLowerCase();
  const fStatus = document.getElementById('te-f-status')?.value || '';
  const fGov = document.getElementById('te-f-gov')?.value || '';
  let rows = TE_ROWS.filter(r => {
    if (fStatus && (r.status || 'pending') !== fStatus) return false;
    if (fGov && r.governorate !== fGov) return false;
    if (q) {
      const hay = [r.full_name, r.phone, r.phone_alt, r.school, r.ref_code].join(' ').toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
  const tb = document.getElementById('tbl-talent-body');
  if (!rows.length) { tb.innerHTML = `<tr><td colspan="10" class="center">لا توجد نتائج مطابقة</td></tr>`; return; }
  tb.innerHTML = rows.map((r,i) => `
    <tr>
      <td><input type="checkbox" value="${r.id}"></td>
      <td>${i+1}</td>
      <td>${teEsc(r.full_name)}</td>
      <td>${teEsc(r.phone)}</td>
      <td>${teEsc(r.governorate)} / ${teEsc(r.district)}</td>
      <td>${(r.activity_types||[]).map(teEsc).join('، ')}</td>
      <td>${teEsc(TE_TRACKS[r.cert_track]||r.cert_track||'')}</td>
      <td>${teEsc(r.gpa)}%</td>
      <td>${teBadge(r.status)}</td>
      <td>${teDate(r.createdAt)}</td>
      <td style="white-space:nowrap">
        <button class="btn btn-sm" onclick="teView('${r.id}')"><i class="ti ti-eye"></i></button>
        <button class="btn btn-sm" onclick="tePrintOne('${r.id}')"><i class="ti ti-printer"></i></button>
        <button class="btn btn-sm" style="color:#c0392b" onclick="teDelete('${r.id}')"><i class="ti ti-trash"></i></button>
      </td>
    </tr>`).join('');
}

async function teSaveSettings() {
  const close_date = document.getElementById('te-close-date').value || null;
  const r = await api('/api/talent_excellence/settings', 'PUT', { close_date });
  if (r.error) { alert(r.error); return; }
  loadTalent();
}

function teFieldsHTML(r) {
  const certsHTML = (r.certificates||[]).filter(c=>c.type||c.source).map(c =>
    `<div class="fr"><div class="fl">${teEsc(c.type)||'—'}</div><div class="fv">${teEsc(c.source)||'—'}</div></div>`).join('') || `<div style="font-size:12px;color:var(--muted)">لم يُدرج الطالب أي شهادات</div>`;
  return `
    ${r.photo ? `<div style="text-align:center;margin-bottom:10px"><img src="${r.photo}" style="width:110px;height:110px;object-fit:cover;border-radius:10px;border:1px solid var(--border)"></div>` : ''}
    <div class="fr"><div class="fl">الرقم المرجعي</div><div class="fv">${teEsc(r.ref_code)}</div></div>
    <div class="fr"><div class="fl">اسم الطالب</div><div class="fv">${teEsc(r.full_name)}</div></div>
    <div class="fr"><div class="fl">المدرسة</div><div class="fv">${teEsc(r.school)}</div></div>
    <div class="fr"><div class="fl">المحافظة / اللواء</div><div class="fv">${teEsc(r.governorate)} / ${teEsc(r.district)}</div></div>
    <div class="fr"><div class="fl">نوع النشاط</div><div class="fv">${(r.activity_types||[]).map(teEsc).join('، ')}</div></div>
    ${(r.instruments||[]).length ? `<div class="fr"><div class="fl">الآلة الموسيقية</div><div class="fv">${r.instruments.map(teEsc).join('، ')}</div></div>` : ''}
    <div class="fr"><div class="fl">فرع الشهادة</div><div class="fv">${teEsc(TE_TRACKS[r.cert_track]||r.cert_track)}${r.cert_subfield?' — '+teEsc(r.cert_subfield):''}</div></div>
    <div class="fr"><div class="fl">سنة الشهادة</div><div class="fv">${teEsc(r.cert_year)}</div></div>
    <div class="fr"><div class="fl">المعدل</div><div class="fv">${teEsc(r.gpa)}%</div></div>
    <div class="fr"><div class="fl">العنوان</div><div class="fv">${teEsc(r.address)}</div></div>
    <div class="fr"><div class="fl">الهاتف</div><div class="fv">${teEsc(r.phone)}${r.phone_alt?' / بديل: '+teEsc(r.phone_alt):''}</div></div>
    <div class="fr"><div class="fl">التخصصات المرغوبة</div><div class="fv">${(r.majors||[]).map(teEsc).join(' ← ')}</div></div>
    <div style="font-weight:700;color:var(--g);font-size:12.5px;margin:10px 0 4px">شهادات التفوق الفني المرفقة</div>
    ${certsHTML}
    <div class="fr"><div class="fl">تاريخ التقديم</div><div class="fv">${teDate(r.createdAt)}</div></div>`;
}

function teView(id) {
  const r = TE_ROWS.find(x => x.id === id); if (!r) return;
  document.getElementById('te-modal-body').innerHTML = `
    <h3>تفاصيل الطلب</h3>
    ${teFieldsHTML(r)}
    <div class="fg" style="margin-top:12px"><label>الحالة</label>
      <select id="te-status-sel">${Object.entries(TE_STATUS).map(([k,v])=>`<option value="${k}"${r.status===k?' selected':''}>${v.label}</option>`).join('')}</select>
    </div>
    <label style="display:flex;align-items:center;gap:7px;font-size:12.5px;margin-top:8px">
      <input type="checkbox" id="te-certs-received" ${r.certs_received?'checked':''}> تم استلام الشهادات الأصلية (يوم الاختبار)
    </label>
    <div style="display:flex;gap:8px;margin-top:16px">
      <button class="btn" style="flex:1;background:var(--g);color:#fff" onclick="teSaveStatus('${r.id}')"><i class="ti ti-device-floppy"></i> حفظ</button>
      <button class="btn" onclick="tePrintOne('${r.id}')"><i class="ti ti-printer"></i> طباعة</button>
      <button class="btn" onclick="teCloseModal()">إغلاق</button>
    </div>`;
  document.getElementById('te-modal').classList.add('open');
}
function teCloseModal() { document.getElementById('te-modal')?.classList.remove('open'); }

async function teSaveStatus(id) {
  const status = document.getElementById('te-status-sel').value;
  const certs_received = document.getElementById('te-certs-received').checked;
  const r = await api('/api/talent_excellence/'+id, 'PUT', { status, certs_received });
  if (r.error) { alert(r.error); return; }
  teCloseModal();
  loadTalent();
}

async function teDelete(id) {
  if (!confirm('حذف هذا الطلب نهائياً؟ لا يمكن التراجع عن هذا الإجراء.')) return;
  const r = await api('/api/talent_excellence/'+id, 'DELETE');
  if (r.error) { alert(r.error); return; }
  loadTalent();
}

// ── طباعة (فردية وجماعية) ──
// ستايل خاص بطباعة هذا البند فقط (لا يمسّ PRINT_STYLES العام المُستخدم في باقي شاشات النظام)
const TE_PRINT_EXTRA_STYLE = `<style>
  body{font-size:12pt}
  .fl{font-size:10.5pt;min-width:150px}
  .fv{font-size:11pt}
  .ptitle{font-size:16pt}
  .psub{font-size:11pt}
  .ptbl{font-size:10.5pt}
  .ptbl th{font-size:10.5pt}
  .dbox{font-size:10.5pt}
  .te-activity-title{text-align:center;font-size:16pt;font-weight:800;color:#1B6B3A;margin:2px 0 12px;padding-bottom:7px;border-bottom:2px solid #1B6B3A}
</style>`;

function tePrintRecordHTML(r) {
  const activityTitle = (r.activity_types||[]).join(' — ') + ((r.instruments||[]).length ? ' (' + r.instruments.join('، ') + ')' : '');
  const majorsRows = [0,1,2].map(i => {
    const label = ['الأول','الثاني','الثالث'][i];
    return `<tr><td>${label}</td><td>${teEsc((r.majors||[])[i])}</td></tr>`;
  }).join('');
  return `
    ${TE_PRINT_EXTRA_STYLE}
    <div class="ph2">
      <img src="/logo.png" class="plogo" alt="شعار الجامعة الأردنية">
      <div class="puni"><div class="ar">الجامعة الأردنية</div><div class="en">The University of Jordan</div><div class="dep">عمادة شؤون الطلبة — Dean of Student Affairs</div></div>
      <div class="pmeta">الرقم المرجعي: ${teEsc(r.ref_code)}<br>${teDate(r.createdAt)}</div>
    </div>
    <div class="ptitle">طلب الالتحاق للدراسة على أساس التفوق الفني</div>
    <div class="te-activity-title">${teEsc(activityTitle)}</div>
    ${r.photo ? `<div style="text-align:left;margin-bottom:6px"><img src="${r.photo}" style="width:90px;height:90px;object-fit:cover;border-radius:6px;border:1px solid #ccc"></div>` : ''}
    <div class="fg2">
      <div class="fr"><div class="fl">اسم الطالب</div><div class="fv">${teEsc(r.full_name)}</div></div>
      <div class="fr"><div class="fl">المدرسة</div><div class="fv">${teEsc(r.school)}</div></div>
      <div class="fr"><div class="fl">المحافظة</div><div class="fv">${teEsc(r.governorate)}</div></div>
      <div class="fr"><div class="fl">اللواء</div><div class="fv">${teEsc(r.district)}</div></div>
    </div>
    <div class="fg2">
      <div class="fr"><div class="fl">فرع الشهادة</div><div class="fv">${teEsc(TE_TRACKS[r.cert_track]||r.cert_track)}${r.cert_subfield?' — '+teEsc(r.cert_subfield):''}</div></div>
      <div class="fr"><div class="fl">سنة الشهادة</div><div class="fv">${teEsc(r.cert_year)}</div></div>
      <div class="fr"><div class="fl">المعدل</div><div class="fv">${teEsc(r.gpa)}%</div></div>
      <div class="fr"><div class="fl">الهاتف</div><div class="fv">${teEsc(r.phone)}</div></div>
    </div>
    <div class="fr"><div class="fl">العنوان</div><div class="fv">${teEsc(r.address)}</div></div>
    <div class="psub">التخصصات المرغوبة (حسب الأولوية)</div>
    <table class="ptbl"><thead><tr><th>الأولوية</th><th>التخصص</th></tr></thead><tbody>
      ${majorsRows}
    </tbody></table>
    <div class="psub">شهادات التفوق الفني المرفقة (تُستلم يوم الاختبار)</div>
    <table class="ptbl"><thead><tr><th>#</th><th>نوع الشهادة</th><th>المصدر</th></tr></thead><tbody>
      ${[0,1,2].map(i => { const c=(r.certificates||[])[i]||{}; return `<tr><td>${i+1}</td><td>${teEsc(c.type)}</td><td>${teEsc(c.source)}</td></tr>`; }).join('')}
    </tbody></table>
    <div class="dbox">أتعهد بأن كافة البيانات الواردة في هذا الطلب صحيحة ودقيقة، وأتحمل وحدي المسؤولية الكاملة عن أي أخطاء أو معلومات غير صحيحة قد ترد فيه.</div>
    <div class="fr" style="margin-top:6px"><div class="fl">حالة الطلب</div><div class="fv">${TE_STATUS[r.status]?.label || TE_STATUS.pending.label}</div></div>`;
}

function tePrintOne(id) {
  const r = TE_ROWS.find(x => x.id === id); if (!r) return;
  openPrint(tePrintRecordHTML(r));
}

function printSelectedTalent() {
  const ids = Array.from(document.querySelectorAll('#tbl-talent-body input[type=checkbox]:checked')).map(cb => cb.value);
  if (!ids.length) { alert('يرجى تحديد طلب واحد على الأقل للطباعة'); return; }
  const html = ids.map((id,i) => {
    const r = TE_ROWS.find(x => x.id === id); if (!r) return '';
    return `${i>0 ? '<div style="page-break-before:always"></div>' : ''}${tePrintRecordHTML(r)}`;
  }).join('');
  openPrint(html);
}

// ── تصدير Excel ──
function teExportExcel() {
  if (!TE_ROWS.length) { alert('لا توجد بيانات للتصدير'); return; }
  const sheetRows = TE_ROWS.map((r,i) => ({
    '#': i+1, 'الرقم المرجعي': r.ref_code||'', 'اسم الطالب': r.full_name||'', 'المدرسة': r.school||'',
    'المحافظة': r.governorate||'', 'اللواء': r.district||'',
    'نوع النشاط': (r.activity_types||[]).join('، '), 'الآلات': (r.instruments||[]).join('، '),
    'فرع الشهادة': TE_TRACKS[r.cert_track]||r.cert_track||'', 'الحقل': r.cert_subfield||'',
    'سنة الشهادة': r.cert_year||'', 'المعدل': r.gpa||'', 'العنوان': r.address||'',
    'الهاتف': r.phone||'', 'هاتف بديل': r.phone_alt||'',
    'التخصص الأول': (r.majors||[])[0]||'', 'التخصص الثاني': (r.majors||[])[1]||'', 'التخصص الثالث': (r.majors||[])[2]||'',
    'الحالة': TE_STATUS[r.status]?.label || TE_STATUS.pending.label,
    'استلام الشهادات': r.certs_received ? 'نعم' : 'لا',
    'تاريخ التقديم': teDate(r.createdAt),
  }));
  const ws = XLSX.utils.json_to_sheet(sheetRows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'التفوق الفني');
  XLSX.writeFile(wb, `طلبات_التفوق_الفني_${new Date().toISOString().slice(0,10)}.xlsx`);
}
