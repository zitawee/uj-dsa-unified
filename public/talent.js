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
const TE_TRACK_SUB = {
  academic:   ['الحقل الصحي','الحقل الهندسي','حقل العلوم والتكنولوجيا','حقل اللغات والعلوم الاجتماعية','حقل القانون والعلوم الشرعية','حقل الأعمال'],
  vocational: ['الصناعي','الزراعي','الاقتصاد المنزلي','الفندقي والسياحي'],
  btec:       []
};
const TE_ACTIVITY_TYPES = ['الغناء','العزف','الخط العربي','الرسم','التمثيل','الأداء الحركي'];
const TE_INSTRUMENTS = ['الأورغ','العود','القانون','الكمان','آلات نفخية','آلات إيقاعية','جيتار'];
const TE_DISTRICTS = {"العاصمة": ["عمان", "الجامعة", "القويسمة", "ماركا", "الجيزة", "الموقر", "ناعور", "سحاب", "وادي السير"], "البلقاء": ["السلط", "الشونة الجنوبية", "دير علا", "عين الباشا", "ماحص والفحيص"], "الزرقاء": ["الزرقاء", "الرصيفة", "الهاشمية", "بيرين"], "مأدبا": ["مأدبا", "ذيبان"], "إربد": ["إربد", "الرمثا", "بني كنانة", "بني عبيد", "الكورة", "المزار الشمالي", "الطيبة"], "المفرق": ["المفرق", "البادية الشمالية", "البادية الشمالية الغربية", "الرويشد", "الخالدية"], "جرش": ["جرش"], "عجلون": ["عجلون", "كفرنجة"], "الكرك": ["الكرك", "القصر", "القطرانة", "المزار الجنوبي", "الأغوار الجنوبية", "عي", "فقوع"], "الطفيلة": ["الطفيلة", "الحسا", "بصيرا"], "معان": ["معان", "البتراء", "الحسينية", "الشوبك"], "العقبة": ["العقبة", "القويرة"]};
const TE_MAJORS = MAJORS_BY_COLLEGE; // مصدر مشترك مع كشف المشاركين (quality.js) — معرَّف في app.js
const TE_STATUS = {
  pending:       { label: '🟡 قيد المراجعة',     cls: 'st-p' },
  accepted_exam: { label: '🔵 مقبول للاختبار',   cls: 'st-d' },
  passed:        { label: '✅ ناجح',              cls: 'st-a' },
  rejected:      { label: '❌ مرفوض',             cls: 'st-r' },
};
let TE_ROWS = [];
let TE_SETTINGS = {};
let TE_EDIT_PHOTO = null; // صورة بديلة (base64) إن اختار الإداري تغييرها أثناء التعديل
let TE_CUSTOM_ROWS = null, TE_CUSTOM_COLS = null; // نتيجة آخر "قائمة مخصصة" تم إنشاؤها (للطباعة/التصدير)

// كل الحقول المتاحة لبناء قائمة مخصصة منها
const TE_FIELDS = [
  { key:'ref_code',      label:'رقم الطلب' },
  { key:'full_name',     label:'الاسم' },
  { key:'phone',         label:'الهاتف' },
  { key:'phone_alt',     label:'هاتف بديل' },
  { key:'school',        label:'المدرسة' },
  { key:'governorate',   label:'المحافظة' },
  { key:'district',      label:'اللواء' },
  { key:'activity_types',label:'نوع النشاط' },
  { key:'instruments',   label:'الآلة الموسيقية' },
  { key:'cert_track',    label:'فرع الشهادة' },
  { key:'cert_subfield', label:'الحقل' },
  { key:'cert_year',     label:'سنة الشهادة' },
  { key:'gpa',           label:'المعدل' },
  { key:'address',       label:'العنوان' },
  { key:'major1',        label:'التخصص الأول' },
  { key:'major2',        label:'التخصص الثاني' },
  { key:'major3',        label:'التخصص الثالث' },
  { key:'status',        label:'الحالة' },
  { key:'certs_received',label:'استلام الشهادات' },
  { key:'committee_score',label:'علامة اللجنة (من 50)' },
  { key:'hs_score',      label:'علامة الثانوية (من 50)' },
  { key:'final_score',   label:'العلامة النهائية (من 100)' },
  { key:'createdAt',     label:'تاريخ التقديم' },
];
const TE_DEFAULT_COLS = ['ref_code','full_name','cert_track','cert_subfield','cert_year','gpa','major1','major2','major3'];

function teFieldValue(r, key) {
  switch (key) {
    case 'activity_types': return (r.activity_types||[]).join('، ');
    case 'instruments':    return (r.instruments||[]).join('، ');
    case 'cert_track':     return TE_TRACKS[r.cert_track] || r.cert_track || '';
    case 'gpa':            return r.gpa ? r.gpa + '%' : '';
    case 'major1':         return (r.majors||[])[0] || '';
    case 'major2':         return (r.majors||[])[1] || '';
    case 'major3':         return (r.majors||[])[2] || '';
    case 'status':         return TE_STATUS[r.status]?.label || TE_STATUS.pending.label;
    case 'certs_received': return r.certs_received ? 'نعم' : 'لا';
    case 'committee_score':return r.committee_score!=null ? r.committee_score.toFixed(1) : '';
    case 'hs_score':       return r.hs_score!=null ? r.hs_score.toFixed(1) : '';
    case 'final_score':    return r.final_score!=null ? r.final_score.toFixed(1) : '';
    case 'createdAt':      return teDate(r.createdAt);
    default:                return r[key] || '';
  }
}

// يُستدعى مرة واحدة بعد الدخول (admin فقط) لتعبئة عدّاد الشريط الجانبي دون تحميل اللوحة كاملة
async function teLoadBadgeCount() {
  try {
    const rows = await api('/api/talent_excellence');
    const el = document.getElementById('c-talent_excellence');
    if (el && Array.isArray(rows)) el.textContent = rows.length;
  } catch (e) {}
}

function teCopyLink() {
  const link = window.location.origin + '/talent.html';
  const btn = document.getElementById('te-link-btn');
  const restore = () => { if (btn) btn.innerHTML = '<i class="ti ti-link"></i> رابط التقديم'; };
  const showCopied = () => { if (btn) { btn.innerHTML = '<i class="ti ti-check"></i> تم نسخ الرابط'; setTimeout(restore, 2000); } };
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(link).then(showCopied).catch(() => prompt('انسخي الرابط يدوياً:', link));
  } else {
    prompt('انسخي الرابط يدوياً:', link);
  }
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
  TE_SETTINGS = settings || {};

  panel.innerHTML = `
  <div class="ph"><div><div class="pt">التفوق الفني</div><div class="ps">طلبات الالتحاق على أساس التفوق الفني (بند مؤقت) — ${rows.length} طلب</div></div></div>

  <div class="card">
    <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end">
      <div class="fg" style="min-width:170px"><label>تاريخ إغلاق الرابط</label><input type="date" id="te-close-date" value="${settings?.close_date || ''}"></div>
      <button class="btn btn-sm" onclick="teSaveSettings()"><i class="ti ti-device-floppy"></i> حفظ تاريخ الإغلاق</button>
      <div style="font-size:11.5px;color:var(--muted)">${settings?.close_date ? `الرابط مفتوح حتى ${teDate(settings.close_date)}` : 'الرابط مفتوح حالياً بلا تاريخ إغلاق محدَّد'}</div>
      <div style="flex:1"></div>
      <button class="btn btn-sm" id="te-link-btn" onclick="teCopyLink()"><i class="ti ti-link"></i> رابط التقديم</button>
      <button class="btn btn-sm" onclick="teExportExcel()"><i class="ti ti-file-spreadsheet"></i> تصدير Excel</button>
      <button class="btn btn-sm" onclick="printSelectedTalent()"><i class="ti ti-printer"></i> طباعة المحدد</button>
      <button class="btn btn-sm" onclick="teOpenCustomList()"><i class="ti ti-list-details"></i> قائمة مخصصة</button>
    </div>
  </div>

  <div class="card">
    <div class="fb">
      <input type="text" id="te-q" placeholder="بحث بالاسم أو الهاتف أو المدرسة..." style="flex:1;min-width:180px" oninput="teRender()">
      <select id="te-f-status" onchange="teRender()"><option value="">كل الحالات</option>${Object.entries(TE_STATUS).map(([k,v])=>`<option value="${k}">${v.label}</option>`).join('')}</select>
      <select id="te-f-gov" onchange="teRender()"><option value="">كل المحافظات</option>${[...new Set(rows.map(r=>r.governorate).filter(Boolean))].map(g=>`<option>${g}</option>`).join('')}</select>
      <select id="te-f-act" onchange="teRender()"><option value="">كل الأنشطة</option>${TE_ACTIVITY_TYPES.map(t=>`<option>${t}</option>`).join('')}</select>
      <select id="te-sort" onchange="teRender()"><option value="date_desc">الأحدث</option><option value="score_desc">الأعلى علامة</option><option value="score_asc">الأدنى علامة</option></select>
    </div>
  </div>

  <div class="card">
    <div class="tw"><table>
      <thead><tr>
        <th style="width:40px">مقبول</th>
        <th>#</th><th>الاسم</th><th>الهاتف</th><th>المحافظة / اللواء</th><th>نوع النشاط</th><th>فرع الشهادة</th><th>المعدل</th><th>العلامة النهائية</th><th>الحالة</th><th>تاريخ التقديم</th><th>إجراءات</th>
      </tr></thead>
      <tbody id="tbl-talent-body"></tbody>
    </table></div>
  </div>

  <div class="modal-ov" id="te-modal" onclick="if(event.target===this) teCloseModal()"><div class="modal" style="max-width:640px;max-height:88vh;overflow-y:auto" id="te-modal-body"></div></div>`;

  if (!window.__teEscBound) {
    window.__teEscBound = true;
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') teCloseModal();
    });
  }

  teRender();
}

function teRender() {
  const q = (document.getElementById('te-q')?.value || '').trim().toLowerCase();
  const fStatus = document.getElementById('te-f-status')?.value || '';
  const fGov = document.getElementById('te-f-gov')?.value || '';
  const fAct = document.getElementById('te-f-act')?.value || '';
  const sort = document.getElementById('te-sort')?.value || 'date_desc';
  let rows = TE_ROWS.filter(r => {
    if (fStatus && (r.status || 'pending') !== fStatus) return false;
    if (fGov && r.governorate !== fGov) return false;
    if (fAct && !(r.activity_types||[]).includes(fAct)) return false;
    if (q) {
      const hay = [r.full_name, r.phone, r.phone_alt, r.school, r.ref_code].join(' ').toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
  rows = rows.slice().sort((a,b) => {
    if (sort === 'score_desc') return (b.final_score ?? -1) - (a.final_score ?? -1);
    if (sort === 'score_asc') return (a.final_score ?? 999) - (b.final_score ?? 999);
    return new Date(b.createdAt||0) - new Date(a.createdAt||0);
  });
  const tb = document.getElementById('tbl-talent-body');
  if (!rows.length) { tb.innerHTML = `<tr><td colspan="11" class="center">لا توجد نتائج مطابقة</td></tr>`; return; }
  tb.innerHTML = rows.map((r,i) => `
    <tr>
      <td style="text-align:center"><input type="checkbox" value="${r.id}" ${r.status==='passed'?'checked':''} onchange="teToggleAccept('${r.id}', this)" title="وضع إشارة القبول (تُحفظ تلقائياً)"></td>
      <td>${i+1}</td>
      <td>${teEsc(r.full_name)}</td>
      <td>${teEsc(r.phone)}</td>
      <td>${teEsc(r.governorate)} / ${teEsc(r.district)}</td>
      <td>${(r.activity_types||[]).map(teEsc).join('، ')}</td>
      <td>${teEsc(TE_TRACKS[r.cert_track]||r.cert_track||'')}</td>
      <td>${teEsc(r.gpa)}%</td>
      <td style="font-weight:700">${r.final_score!=null ? r.final_score.toFixed(1) : '—'}</td>
      <td class="te-status-cell">${teBadge(r.status)}</td>
      <td>${teDate(r.createdAt)}</td>
      <td style="white-space:nowrap">
        <button class="btn btn-sm" onclick="teView('${r.id}')"><i class="ti ti-eye"></i></button>
        <button class="btn btn-sm" onclick="tePrintOne('${r.id}')"><i class="ti ti-printer"></i></button>
        <button class="btn btn-sm" style="color:#c0392b" onclick="teDelete('${r.id}')"><i class="ti ti-trash"></i></button>
      </td>
    </tr>`).join('');
}

// وضع/إزالة إشارة "مقبول" مباشرة من الجدول — تُحفظ فوراً في قاعدة البيانات
// (تُستخدم status='passed' كعلامة القبول النهائي؛ إلغاء التحديد يعيدها إلى "قيد المراجعة")
async function teToggleAccept(id, cb) {
  const newStatus = cb.checked ? 'passed' : 'pending';
  cb.disabled = true;
  const res = await api('/api/talent_excellence/'+id, 'PUT', { status: newStatus });
  cb.disabled = false;
  if (res && res.error) { alert(res.error); cb.checked = !cb.checked; return; }
  const r = TE_ROWS.find(x => x.id === id);
  if (r) r.status = newStatus;
  const statusCell = cb.closest('tr')?.querySelector('.te-status-cell');
  if (statusCell) statusCell.innerHTML = teBadge(newStatus);
}

async function teSaveSettings() {
  const close_date = document.getElementById('te-close-date').value || null;
  TE_SETTINGS.close_date = close_date;
  const r = await api('/api/talent_excellence/settings', 'PUT', TE_SETTINGS);
  if (r.error) { alert(r.error); return; }
  loadTalent();
}

function teMajorOpts(selected) {
  let html = '<option value="">اختر...</option>';
  Object.keys(TE_MAJORS).forEach(college => {
    html += `<optgroup label="${teEsc(college)}">` +
      TE_MAJORS[college].map(m => `<option${m===selected?' selected':''}>${teEsc(m)}</option>`).join('') +
      `</optgroup>`;
  });
  return html;
}

function teEditFormHTML(r) {
  const certs = [0,1,2].map(i => (r.certificates||[])[i] || {});
  return `
    <div style="text-align:center;font-size:11px;color:var(--muted);margin-bottom:8px">الرقم المرجعي: ${teEsc(r.ref_code)} — قُدِّم بتاريخ ${teDate(r.createdAt)}</div>
    <div style="text-align:center;margin-bottom:10px">
      <img id="te-e-photo-preview" src="${r.photo||''}" style="width:96px;height:96px;object-fit:contain;background:#F1F3F0;border-radius:10px;border:1px solid var(--border);${r.photo?'':'display:none'}">
      <div class="fg" style="margin-top:6px"><input type="file" id="te-e-photo-file" accept="image/*"></div>
    </div>
    <div class="fg"><label>اسم الطالب كاملاً</label><input type="text" id="te-e-name" value="${teEsc(r.full_name)}"></div>
    <div class="fg"><label>المدرسة</label><input type="text" id="te-e-school" value="${teEsc(r.school)}"></div>
    <div class="fg"><label>المحافظة</label><select id="te-e-gov">${Object.keys(TE_DISTRICTS).map(g=>`<option${g===r.governorate?' selected':''}>${g}</option>`).join('')}</select></div>
    <div class="fg"><label>اللواء</label><select id="te-e-dist"></select></div>

    <div class="fg"><label>نوع النشاط (يمكن أكثر من نوع)</label>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:2px 10px">
        ${TE_ACTIVITY_TYPES.map(t=>`<label style="display:flex;align-items:center;gap:6px;font-weight:400;font-size:12.5px;margin-bottom:6px"><input type="checkbox" class="te-e-act" value="${t}"${(r.activity_types||[]).includes(t)?' checked':''}> ${t}</label>`).join('')}
      </div>
    </div>
    <div class="fg" id="te-e-instr-box" style="${(r.activity_types||[]).includes('العزف')?'':'display:none'}">
      <label>الآلة الموسيقية</label>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:2px 10px">
        ${TE_INSTRUMENTS.map(t=>`<label style="display:flex;align-items:center;gap:6px;font-weight:400;font-size:12.5px;margin-bottom:6px"><input type="checkbox" class="te-e-instr" value="${t}"${(r.instruments||[]).includes(t)?' checked':''}> ${t}</label>`).join('')}
      </div>
    </div>

    <div class="fg"><label>فرع الشهادة</label>
      <select id="te-e-track">${Object.entries(TE_TRACKS).map(([k,v])=>`<option value="${k}"${k===r.cert_track?' selected':''}>${v}</option>`).join('')}</select>
    </div>
    <div class="fg" id="te-e-sub-box"><label>الحقل</label><select id="te-e-subfield"></select></div>
    <div class="fg"><label>سنة الشهادة</label><input type="text" id="te-e-year" maxlength="4" value="${teEsc(r.cert_year)}"></div>
    <div class="fg"><label>المعدل (%)</label><input type="text" id="te-e-gpa" value="${teEsc(r.gpa)}"></div>
    <div class="fg"><label>العنوان</label><textarea id="te-e-address">${teEsc(r.address)}</textarea></div>
    <div class="fg"><label>الهاتف</label><input type="text" id="te-e-phone" maxlength="10" value="${teEsc(r.phone)}"></div>
    <div class="fg"><label>هاتف بديل</label><input type="text" id="te-e-phone-alt" maxlength="10" value="${teEsc(r.phone_alt)}"></div>

    <div class="fg"><label>التخصص الأول</label><select id="te-e-major1">${teMajorOpts((r.majors||[])[0])}</select></div>
    <div class="fg"><label>التخصص الثاني</label><select id="te-e-major2">${teMajorOpts((r.majors||[])[1])}</select></div>
    <div class="fg"><label>التخصص الثالث</label><select id="te-e-major3">${teMajorOpts((r.majors||[])[2])}</select></div>

    <div style="font-weight:700;color:var(--g);font-size:12.5px;margin:10px 0 4px">شهادات التفوق الفني (حتى 3)</div>
    ${[0,1,2].map(i => `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:0 8px">
      <div class="fg"><label>نوع الشهادة ${i+1}</label><input type="text" class="te-e-cert-type" value="${teEsc(certs[i].type)}"></div>
      <div class="fg"><label>المصدر ${i+1}</label><input type="text" class="te-e-cert-src" value="${teEsc(certs[i].source)}"></div>
    </div>`).join('')}

    <div class="fg" style="margin-top:8px"><label>الحالة</label>
      <select id="te-status-sel">${Object.entries(TE_STATUS).map(([k,v])=>`<option value="${k}"${r.status===k?' selected':''}>${v.label}</option>`).join('')}</select>
    </div>
    <label style="display:flex;align-items:center;gap:7px;font-size:12.5px;margin-top:8px">
      <input type="checkbox" id="te-certs-received" ${r.certs_received?'checked':''}> تم استلام الشهادات الأصلية (يوم الاختبار)
    </label>`;
}

function teView(id) {
  const r = TE_ROWS.find(x => x.id === id); if (!r) return;
  TE_EDIT_PHOTO = null;
  document.getElementById('te-modal-body').innerHTML = `
    <h3>تعديل الطلب</h3>
    ${teEditFormHTML(r)}
    <div id="te-e-msg" class="msg"></div>
    <div style="display:flex;gap:8px;margin-top:16px">
      <button class="btn" style="flex:1;background:var(--g);color:#fff" onclick="teSaveEdit('${r.id}')"><i class="ti ti-device-floppy"></i> حفظ التعديلات</button>
      <button class="btn" onclick="tePrintOne('${r.id}')"><i class="ti ti-printer"></i> طباعة</button>
      <button class="btn" onclick="teCloseModal()">إغلاق</button>
    </div>`;
  document.getElementById('te-modal').classList.add('open');

  // ── ربط اللواء بالمحافظة، والحقل الفرعي بفرع الشهادة، ومعاينة/تغيير الصورة ──
  const govSel = document.getElementById('te-e-gov');
  const distSel = document.getElementById('te-e-dist');
  function fillDist() {
    const list = TE_DISTRICTS[govSel.value] || [];
    distSel.innerHTML = list.map(d => `<option${d===r.district?' selected':''}>${d}</option>`).join('');
  }
  fillDist();
  govSel.addEventListener('change', fillDist);

  const trackSel = document.getElementById('te-e-track');
  const subSel = document.getElementById('te-e-subfield');
  const subBox = document.getElementById('te-e-sub-box');
  function fillSub() {
    const sub = TE_TRACK_SUB[trackSel.value] || [];
    if (!sub.length) { subBox.style.display = 'none'; subSel.innerHTML = ''; return; }
    subBox.style.display = 'block';
    subSel.innerHTML = '<option value="">اختر...</option>' + sub.map(s => `<option${s===r.cert_subfield?' selected':''}>${s}</option>`).join('');
  }
  fillSub();
  trackSel.addEventListener('change', fillSub);

  document.querySelectorAll('.te-e-act').forEach(cb => cb.addEventListener('change', () => {
    const playing = document.querySelector('.te-e-act[value="العزف"]').checked;
    document.getElementById('te-e-instr-box').style.display = playing ? 'block' : 'none';
  }));

  document.getElementById('te-e-photo-file').addEventListener('change', e => {
    const file = e.target.files[0]; if (!file) return;
    const img = new Image(); const reader = new FileReader();
    reader.onload = ev => { img.onload = () => {
      const maxDim = 500; let w = img.width, h = img.height;
      if (w > h && w > maxDim) { h = Math.round(h*maxDim/w); w = maxDim; } else if (h > maxDim) { w = Math.round(w*maxDim/h); h = maxDim; }
      const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      TE_EDIT_PHOTO = canvas.toDataURL('image/jpeg', 0.75);
      const prev = document.getElementById('te-e-photo-preview'); prev.src = TE_EDIT_PHOTO; prev.style.display = '';
    }; img.src = ev.target.result; };
    reader.readAsDataURL(file);
  });
}
function teCloseModal() { document.getElementById('te-modal')?.classList.remove('open'); }

function teMsg(txt) {
  const el = document.getElementById('te-e-msg'); if (!el) return;
  el.textContent = txt; el.className = 'msg err'; el.style.display = 'block';
}

async function teSaveEdit(id) {
  const gv = sel => document.getElementById(sel).value.trim();
  const full_name = gv('te-e-name'), school = gv('te-e-school'), governorate = gv('te-e-gov'), district = gv('te-e-dist');
  const activity_types = Array.from(document.querySelectorAll('.te-e-act:checked')).map(el => el.value);
  const instruments = Array.from(document.querySelectorAll('.te-e-instr:checked')).map(el => el.value);
  const cert_track = gv('te-e-track'), cert_subfield = gv('te-e-subfield');
  const cert_year = gv('te-e-year'), gpa = gv('te-e-gpa'), address = gv('te-e-address');
  const phone = gv('te-e-phone'), phone_alt = gv('te-e-phone-alt');
  const major1 = gv('te-e-major1'), major2 = gv('te-e-major2'), major3 = gv('te-e-major3');
  const status = gv('te-status-sel');
  const certs_received = document.getElementById('te-certs-received').checked;

  if (!full_name || !school) return teMsg('يرجى إدخال اسم الطالب والمدرسة');
  if (!governorate || !district) return teMsg('يرجى اختيار المحافظة واللواء');
  if (!activity_types.length) return teMsg('يرجى اختيار نوع نشاط واحد على الأقل');
  if (activity_types.includes('العزف') && !instruments.length) return teMsg('يرجى اختيار آلة موسيقية واحدة على الأقل');
  if (!/^\d{4}$/.test(cert_year)) return teMsg('سنة الشهادة يجب أن تكون 4 أرقام');
  if (!gpa) return teMsg('يرجى إدخال المعدل');
  if (!/^07\d{8}$/.test(phone)) return teMsg('رقم الهاتف يجب أن يبدأ بـ 07 ويتكون من 10 خانات');
  if (phone_alt && !/^07\d{8}$/.test(phone_alt)) return teMsg('صيغة رقم الهاتف البديل غير صحيحة');
  if (!major1 || !major2 || !major3) return teMsg('يرجى اختيار التخصصات الثلاثة');
  if (new Set([major1, major2, major3]).size < 3) return teMsg('لا يمكن تكرار نفس التخصص في أكثر من خيار');

  const certTypes = Array.from(document.querySelectorAll('.te-e-cert-type')).map(el => el.value.trim());
  const certSrcs = Array.from(document.querySelectorAll('.te-e-cert-src')).map(el => el.value.trim());
  const certificates = certTypes.map((t,i) => ({ type: t, source: certSrcs[i] })).filter(c => c.type || c.source);

  const payload = {
    full_name, school, governorate, district, activity_types, instruments,
    cert_track, cert_subfield, cert_year, gpa, address, phone, phone_alt,
    majors: [major1, major2, major3], certificates, status, certs_received
  };
  if (TE_EDIT_PHOTO) payload.photo = TE_EDIT_PHOTO;

  const r = await api('/api/talent_excellence/'+id, 'PUT', payload);
  if (r.error) return teMsg(r.error);
  teCloseModal();
  loadTalent();
}

async function teDelete(id) {
  if (!confirm('حذف هذا الطلب نهائياً؟ لا يمكن التراجع عن هذا الإجراء.')) return;
  const r = await api('/api/talent_excellence/'+id, 'DELETE');
  if (r.error) { alert(r.error); return; }
  loadTalent();
}

// ── قائمة مخصصة (تصفية حسب نوع النشاط/الحالة/الفرع + اختيار الحقول المطلوبة) ──
function teOpenCustomList() {
  document.getElementById('te-modal-body').innerHTML = `
    <h3>إنشاء قائمة مخصصة</h3>
    <div class="fg"><label>تصفية حسب نوع النشاط (اتركه فارغاً لعرض جميع الطلبة)</label>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:2px 10px">
        ${TE_ACTIVITY_TYPES.map(t=>`<label style="display:flex;align-items:center;gap:6px;font-weight:400;font-size:12.5px;margin-bottom:6px"><input type="checkbox" class="te-cl-act" value="${t}"> ${t}</label>`).join('')}
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:0 10px">
      <div class="fg"><label>فرع الشهادة (اختياري)</label><select id="te-cl-track"><option value="">الكل</option>${Object.entries(TE_TRACKS).map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}</select></div>
      <div class="fg"><label>الحالة (اختياري)</label><select id="te-cl-status"><option value="">الكل</option>${Object.entries(TE_STATUS).map(([k,v])=>`<option value="${k}">${v.label}</option>`).join('')}</select></div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:0 10px">
      <div class="fg"><label>الترتيب حسب العلامة النهائية</label><select id="te-cl-sort"><option value="">بدون ترتيب (كما هو مُدخَل)</option><option value="desc">الأعلى علامة أولاً</option><option value="asc">الأدنى علامة أولاً</option></select></div>
      <div class="fg"><label>الاكتفاء بأعلى عدد (اختياري)</label><input type="number" id="te-cl-top" min="1" placeholder="مثال: 10 — اتركه فارغاً لعرض الكل"></div>
    </div>
    <div style="font-weight:700;color:var(--g);font-size:12.5px;margin:10px 0 4px">الحقول المطلوب إدراجها في الجدول</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:2px 10px">
      ${TE_FIELDS.map(f=>`<label style="display:flex;align-items:center;gap:6px;font-weight:400;font-size:12.5px;margin-bottom:6px"><input type="checkbox" class="te-cl-col" value="${f.key}"${TE_DEFAULT_COLS.includes(f.key)?' checked':''}> ${f.label}</label>`).join('')}
    </div>
    <button class="btn" style="width:100%;margin-top:10px;background:var(--g);color:#fff" onclick="teGenerateCustomList()"><i class="ti ti-table"></i> إنشاء القائمة</button>
    <div id="te-cl-result" style="margin-top:14px"></div>
    <button class="btn" style="width:100%;margin-top:10px" onclick="teCloseModal()">إغلاق</button>`;
  document.getElementById('te-modal').classList.add('open');
}

let TE_CUSTOM_FILTER_TITLE = '';

function teGenerateCustomList() {
  const acts = Array.from(document.querySelectorAll('.te-cl-act:checked')).map(el => el.value);
  const track = document.getElementById('te-cl-track').value;
  const status = document.getElementById('te-cl-status').value;
  const sortDir = document.getElementById('te-cl-sort').value;
  const topN = parseInt(document.getElementById('te-cl-top').value) || 0;
  const colKeys = Array.from(document.querySelectorAll('.te-cl-col:checked')).map(el => el.value);

  if (!colKeys.length) { alert('يرجى اختيار حقل واحد على الأقل'); return; }

  let rows = TE_ROWS.filter(r => {
    if (acts.length && !acts.some(a => (r.activity_types||[]).includes(a))) return false;
    if (track && r.cert_track !== track) return false;
    if (status && (r.status||'pending') !== status) return false;
    return true;
  });
  if (sortDir) {
    rows = rows.slice().sort((a,b) => sortDir === 'desc'
      ? (b.final_score ?? -1) - (a.final_score ?? -1)
      : (a.final_score ?? 999) - (b.final_score ?? 999));
  }
  if (topN > 0) rows = rows.slice(0, topN);

  const cols = TE_FIELDS.filter(f => colKeys.includes(f.key));
  TE_CUSTOM_ROWS = rows; TE_CUSTOM_COLS = cols;
  TE_CUSTOM_FILTER_TITLE = acts.join('، ');

  const box = document.getElementById('te-cl-result');
  if (!rows.length) { box.innerHTML = `<div class="center">لا توجد نتائج مطابقة لهذه التصفية</div>`; return; }
  box.innerHTML = `
    <div style="font-size:11.5px;color:var(--muted);margin-bottom:6px">${rows.length} طالب مطابق</div>
    <div class="tw" style="max-height:260px"><table>
      <thead><tr><th>#</th>${cols.map(c=>`<th>${c.label}</th>`).join('')}</tr></thead>
      <tbody>${rows.map((r,i)=>`<tr><td>${i+1}</td>${cols.map(c=>`<td>${teEsc(teFieldValue(r,c.key))}</td>`).join('')}</tr>`).join('')}</tbody>
    </table></div>
    <div style="display:flex;gap:8px;margin-top:10px">
      <button class="btn" style="flex:1" onclick="tePrintCustomList()"><i class="ti ti-printer"></i> طباعة هذه القائمة</button>
      <button class="btn" style="flex:1" onclick="teExportCustomListExcel()"><i class="ti ti-file-spreadsheet"></i> تصدير Excel</button>
    </div>`;
}

function tePrintCustomList() {
  if (!TE_CUSTOM_ROWS) return;
  const html = `
    ${TE_TABLE_ALIGN_STYLE}
    <style>.te-cl-title{text-align:center;font-size:15pt;font-weight:800;color:#1B6B3A;margin:2px 0 12px;padding-bottom:7px;border-bottom:2px solid #1B6B3A}</style>
    <div class="ph2">
      <img src="/logo.png" class="plogo" alt="شعار الجامعة الأردنية">
      <div class="puni"><div class="ar">الجامعة الأردنية</div><div class="en">The University of Jordan</div><div class="dep">عمادة شؤون الطلبة — Dean of Student Affairs</div></div>
      <div class="pmeta">${teDate(new Date())}</div>
    </div>
    <div class="ptitle">قائمة الطلبة المتقدمين — التفوق الفني</div>
    ${TE_CUSTOM_FILTER_TITLE ? `<div class="te-cl-title">نوع النشاط: ${teEsc(TE_CUSTOM_FILTER_TITLE)}</div>` : ''}
    <table class="ptbl"><thead><tr><th>#</th>${TE_CUSTOM_COLS.map(c=>`<th>${c.label}</th>`).join('')}</tr></thead><tbody>
      ${TE_CUSTOM_ROWS.map((r,i)=>`<tr><td style="text-align:center">${i+1}</td>${TE_CUSTOM_COLS.map(c=>`<td${c.key==='full_name'?' style="text-align:right"':' style="text-align:center"'}>${teEsc(teFieldValue(r,c.key))}</td>`).join('')}</tr>`).join('')}
    </tbody></table>
    ${teSignatureBlockHTML()}`;
  openPrint(html);
}

function teExportCustomListExcel() {
  if (!TE_CUSTOM_ROWS || !TE_CUSTOM_ROWS.length) return;
  const sheetRows = TE_CUSTOM_ROWS.map((r,i) => {
    const o = { '#': i+1 };
    TE_CUSTOM_COLS.forEach(c => { o[c.label] = teFieldValue(r, c.key); });
    return o;
  });
  const ws = XLSX.utils.json_to_sheet(sheetRows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'قائمة مخصصة');
  XLSX.writeFile(wb, `قائمة_مخصصة_التفوق_الفني_${new Date().toISOString().slice(0,10)}.xlsx`);
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
    ${r.photo ? `<div style="text-align:left;margin-bottom:6px"><img src="${r.photo}" style="width:90px;height:90px;object-fit:contain;background:#F1F3F0;border-radius:6px;border:1px solid #ccc"></div>` : ''}
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
    ${r.phone_alt ? `<div class="fr"><div class="fl">هاتف بديل</div><div class="fv">${teEsc(r.phone_alt)}</div></div>` : ''}
    <div class="fr"><div class="fl">العنوان</div><div class="fv">${teEsc(r.address)}</div></div>
    <div class="psub">التخصصات المرغوبة (حسب الأولوية)</div>
    <table class="ptbl"><thead><tr><th>الأولوية</th><th>التخصص</th></tr></thead><tbody>
      ${majorsRows}
    </tbody></table>
    <div class="psub">شهادات التفوق الفني المرفقة</div>
    <table class="ptbl"><thead><tr><th>#</th><th>نوع الشهادة</th><th>المصدر</th></tr></thead><tbody>
      ${[0,1,2].map(i => { const c=(r.certificates||[])[i]||{}; return `<tr><td>${i+1}</td><td>${teEsc(c.type)}</td><td>${teEsc(c.source)}</td></tr>`; }).join('')}
    </tbody></table>
    <div class="dbox">أتعهد بأن كافة البيانات الواردة في هذا الطلب صحيحة ودقيقة، وأتحمل وحدي المسؤولية الكاملة عن أي أخطاء أو معلومات غير صحيحة قد ترد فيه.</div>
    <div style="margin-top:36px;font-size:11pt">توقيع مقدم الطلب</div>`;
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

// ══════════════════════════════════════════════════════════════
// شاشة "علامات لجنة التحكيم" — إدخال أسماء اللجنة، طباعة كشوف تقييم
// ورقية فارغة لتُمنح للجنة، ثم إدخال علاماتهم بعد المقابلات.
// آلية الاحتساب: كل عضو يمنح علامة من (100 ÷ عدد الأعضاء)، فيكون
// مجموع اللجنة دائماً من 100 بغض النظر عن عدد الأعضاء (4 أو 5) —
// علامة اللجنة = المجموع ÷ 2 (من 50)، علامة الثانوية = المعدل × 0.5 (من 50)
// العلامة النهائية = علامة اللجنة + علامة الثانوية (من 100)
// ══════════════════════════════════════════════════════════════

async function loadTalentCommittee() {
  const panel = document.getElementById('panel-talent_committee');
  if (!panel) return;
  panel.innerHTML = `<div class="ph"><div><div class="pt">علامات لجنة التحكيم</div><div class="ps">إدخال أسماء اللجنة، وتجهيز كشوف التقييم، وإدخال العلامات</div></div></div>
    <div class="card"><div class="center" style="padding:24px">جارٍ التحميل...</div></div>`;

  const [rows, settings] = await Promise.all([
    api('/api/talent_excellence'),
    api('/api/talent_excellence/settings'),
  ]);
  if (!Array.isArray(rows)) { panel.innerHTML = `<div class="card"><div class="center">تعذّر تحميل البيانات</div></div>`; return; }
  TE_ROWS = rows;
  TE_SETTINGS = settings || {};
  const members = teCommitteeMembers();
  const n = members.length;
  const per = n ? 100 / n : 0;

  panel.innerHTML = `
  <div class="ph"><div><div class="pt">علامات لجنة التحكيم</div><div class="ps">إدخال أسماء اللجنة، وتجهيز كشوف التقييم، وإدخال العلامات</div></div></div>

  <div class="card">
    <div style="font-weight:700;color:var(--g);margin-bottom:8px">أعضاء اللجنة (من عضوين إلى 5 أعضاء)</div>
    <div style="font-size:11.5px;color:var(--muted);margin-bottom:10px">تُحسب علامة كل عضو تلقائياً من (100 ÷ عدد الأعضاء المدخلين هنا)، بحيث يكون مجموع علامات اللجنة دائماً من 100 مهما كان العدد الفعلي. الاسم الوظيفي يظهر في كشف العلامات النهائي للتوقيع.</div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:8px">
      ${[0,1,2,3,4].map(i => `
      <div style="border:1px solid var(--border);border-radius:var(--r);padding:8px">
        <div class="fg"><label>العضو ${i+1}${i>3?' (اختياري)':''} — الاسم</label><input type="text" id="tc-m-${i}" value="${teEsc(members[i]?.name||'')}" placeholder="اسم العضو..."></div>
        <div class="fg" style="margin-top:6px"><label>الاسم الوظيفي</label><input type="text" id="tc-t-${i}" value="${teEsc(members[i]?.title||'')}" placeholder="مثال: عميد شؤون الطلبة..."></div>
      </div>`).join('')}
    </div>
    <button class="btn btn-sm" style="margin-top:10px" onclick="tcSaveCommittee()"><i class="ti ti-device-floppy"></i> حفظ أسماء اللجنة</button>
  </div>

  <div class="card">
    <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end">
      <div class="fg" style="min-width:180px"><label>تصفية حسب نوع النشاط</label><select id="tc-f-act" onchange="tcRenderTable()"><option value="">كل الأنشطة</option>${TE_ACTIVITY_TYPES.map(t=>`<option>${t}</option>`).join('')}</select></div>
      <button class="btn btn-sm" onclick="tcOpenPrintFields('blank')"><i class="ti ti-printer"></i> طباعة كشف تقييم فارغ للجنة</button>
      <button class="btn btn-sm" onclick="tcOpenPrintFields('final')"><i class="ti ti-printer"></i> طباعة كشف العلامات النهائي</button>
      <div style="flex:1"></div>
      <button class="btn btn-sm" style="background:var(--g);color:#fff" onclick="tcSaveAll()"><i class="ti ti-device-floppy"></i> حفظ كل العلامات المُدخَلة</button>
    </div>
  </div>

  <div class="card">
    ${!n ? `<div class="center">يرجى إدخال أسماء أعضاء اللجنة أعلاه أولاً قبل إدخال العلامات</div>` : `
    <div class="tw"><table>
      <thead><tr>
        <th>#</th><th>الاسم</th><th>نوع النشاط</th>
        ${members.map(m=>`<th>${teEsc(m.name)}<br><span style="font-weight:400;font-size:10px;color:var(--muted)">(من ${per.toFixed(1)})</span></th>`).join('')}
        <th>علامة اللجنة<br><span style="font-weight:400;font-size:10px;color:var(--muted)">(من 50)</span></th>
        <th>علامة الثانوية<br><span style="font-weight:400;font-size:10px;color:var(--muted)">(من 50)</span></th>
        <th>العلامة النهائية</th>
      </tr></thead>
      <tbody id="tc-tbody"></tbody>
    </table></div>`}
  </div>

  <div class="modal-ov" id="tc-modal" onclick="if(event.target===this) tcCloseModal()"><div class="modal" style="max-width:480px;max-height:88vh;overflow-y:auto" id="tc-modal-body"></div></div>`;

  if (!window.__tcEscBound) {
    window.__tcEscBound = true;
    document.addEventListener('keydown', e => { if (e.key === 'Escape') tcCloseModal(); });
  }

  if (n) tcRenderTable();
}
function tcCloseModal() { document.getElementById('tc-modal')?.classList.remove('open'); }

// يعيد أعضاء اللجنة بصيغة موحّدة {name, title} — مع التوافق مع الصيغة القديمة (أسماء نصّية فقط بلا مسمّى وظيفي)
function teCommitteeMembers() {
  return (TE_SETTINGS.committee_members || []).map(m => typeof m === 'string' ? { name: m, title: '' } : m);
}

const TC_SHEET_FIELDS = TE_FIELDS.filter(f => !['committee_score','hs_score','final_score','status','certs_received'].includes(f.key));

function tcOpenPrintFields(mode) {
  const members = teCommitteeMembers();
  if (!members.length) { alert('يرجى إدخال أسماء أعضاء اللجنة أولاً'); return; }
  document.getElementById('tc-modal-body').innerHTML = `
    <h3>${mode==='final' ? 'بيانات إضافية تُعرض في كشف العلامات النهائي' : 'بيانات إضافية تُعرض للجنة في الكشف'}</h3>
    <div style="font-size:11.5px;color:var(--muted);margin-bottom:10px">تظهر هذه الحقول بجانب اسم الطالب في الكشف المطبوع.</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:2px 10px">
      ${TC_SHEET_FIELDS.map(f=>`<label style="display:flex;align-items:center;gap:6px;font-weight:400;font-size:12.5px;margin-bottom:6px"><input type="checkbox" class="tc-sheet-col" value="${f.key}"> ${f.label}</label>`).join('')}
    </div>
    <div style="display:flex;gap:8px;margin-top:12px">
      <button class="btn" style="flex:1;background:var(--g);color:#fff" onclick="${mode==='final'?'tcPrintFinalReport()':'tcPrintGradingSheet()'}"><i class="ti ti-printer"></i> طباعة الكشف</button>
      <button class="btn" onclick="tcCloseModal()">إغلاق</button>
    </div>`;
  document.getElementById('tc-modal').classList.add('open');
}

async function tcSaveCommittee() {
  const members = [0,1,2,3,4]
    .map(i => ({ name: document.getElementById('tc-m-'+i).value.trim(), title: document.getElementById('tc-t-'+i).value.trim() }))
    .filter(m => m.name);
  if (members.length < 2) { alert('يرجى إدخال اسمين على الأقل لأعضاء اللجنة'); return; }
  TE_SETTINGS.committee_members = members;
  const r = await api('/api/talent_excellence/settings', 'PUT', TE_SETTINGS);
  if (r.error) { alert(r.error); return; }
  loadTalentCommittee();
}

function tcRenderTable() {
  const act = document.getElementById('tc-f-act')?.value || '';
  const members = teCommitteeMembers();
  const tbody = document.getElementById('tc-tbody');
  if (!tbody) return;
  const rows = TE_ROWS.filter(r => !act || (r.activity_types||[]).includes(act));
  if (!rows.length) { tbody.innerHTML = `<tr><td colspan="${3+members.length+3}" class="center">لا يوجد متقدمون مطابقون لهذه التصفية</td></tr>`; return; }
  const per = 100 / members.length;
  tbody.innerHTML = rows.map((r,i) => {
    const scores = r.committee_scores || [];
    const hs = r.gpa ? (parseFloat(r.gpa) * 0.5) : 0;
    const filled = scores.filter(v => v != null && v !== '');
    const cscore = filled.length ? filled.reduce((a,b)=>a+(+b||0),0) / 2 : null;
    return `<tr data-id="${r.id}" data-hs="${hs}">
      <td>${i+1}</td>
      <td>${teEsc(r.full_name)} <button class="btn btn-sm" style="padding:2px 6px" onclick="tcViewApplicant('${r.id}')" title="عرض بيانات الطالب"><i class="ti ti-eye"></i></button></td>
      <td>${(r.activity_types||[]).map(teEsc).join('، ')}</td>
      ${members.map((m,mi) => `<td><input type="number" min="0" max="${per}" step="0.5" class="tc-score" style="width:64px" value="${scores[mi]!=null?scores[mi]:''}" oninput="tcRecalc(this)"></td>`).join('')}
      <td class="tc-cscore">${cscore!=null ? cscore.toFixed(1) : '—'}</td>
      <td>${hs.toFixed(1)}</td>
      <td class="tc-final" style="font-weight:700">${cscore!=null ? (cscore+hs).toFixed(1) : '—'}</td>
    </tr>`;
  }).join('');
}

function tcRecalc(input) {
  const tr = input.closest('tr');
  const hs = parseFloat(tr.dataset.hs) || 0;
  const vals = Array.from(tr.querySelectorAll('.tc-score')).map(el => el.value === '' ? null : parseFloat(el.value));
  const filled = vals.filter(v => v != null);
  const cscore = filled.length ? filled.reduce((a,b)=>a+b, 0) / 2 : null;
  tr.querySelector('.tc-cscore').textContent = cscore!=null ? cscore.toFixed(1) : '—';
  tr.querySelector('.tc-final').textContent = cscore!=null ? (cscore+hs).toFixed(1) : '—';
}

// عرض سريع (للقراءة فقط) لبيانات الطالب من شاشة علامات اللجنة، دون مغادرتها
// (تُبنى بعناصر مستقلة تماماً عن نافذة التعديل في شاشة الطلبات، تفادياً لتكرار أرقام تعريف العناصر id)
function teReadOnlyHTML(r) {
  return `
    ${r.photo ? `<div style="text-align:center;margin-bottom:10px"><img src="${r.photo}" style="width:110px;height:110px;object-fit:contain;background:#F1F3F0;border-radius:10px;border:1px solid var(--border)"></div>` : ''}
    <div class="fr"><div class="fl">الرقم المرجعي</div><div class="fv">${teEsc(r.ref_code)}</div></div>
    <div class="fr"><div class="fl">اسم الطالب</div><div class="fv">${teEsc(r.full_name)}</div></div>
    <div class="fr"><div class="fl">المدرسة</div><div class="fv">${teEsc(r.school)}</div></div>
    <div class="fr"><div class="fl">المحافظة / اللواء</div><div class="fv">${teEsc(r.governorate)} / ${teEsc(r.district)}</div></div>
    <div class="fr"><div class="fl">نوع النشاط</div><div class="fv">${(r.activity_types||[]).map(teEsc).join('، ')}${(r.instruments||[]).length?' — '+r.instruments.map(teEsc).join('، '):''}</div></div>
    <div class="fr"><div class="fl">فرع الشهادة</div><div class="fv">${teEsc(TE_TRACKS[r.cert_track]||r.cert_track)}${r.cert_subfield?' — '+teEsc(r.cert_subfield):''}</div></div>
    <div class="fr"><div class="fl">سنة الشهادة</div><div class="fv">${teEsc(r.cert_year)}</div></div>
    <div class="fr"><div class="fl">المعدل</div><div class="fv">${teEsc(r.gpa)}%</div></div>
    <div class="fr"><div class="fl">العنوان</div><div class="fv">${teEsc(r.address)}</div></div>
    <div class="fr"><div class="fl">الهاتف</div><div class="fv">${teEsc(r.phone)}${r.phone_alt?' / بديل: '+teEsc(r.phone_alt):''}</div></div>
    <div class="fr"><div class="fl">التخصصات المرغوبة</div><div class="fv">${(r.majors||[]).map(teEsc).join(' ← ')}</div></div>
    <div style="font-weight:700;color:var(--g);font-size:12.5px;margin:10px 0 4px">شهادات التفوق الفني المرفقة</div>
    ${(r.certificates||[]).filter(c=>c.type||c.source).map(c=>`<div class="fr"><div class="fl">${teEsc(c.type)||'—'}</div><div class="fv">${teEsc(c.source)||'—'}</div></div>`).join('') || `<div style="font-size:12px;color:var(--muted)">لم يُدرج الطالب أي شهادات</div>`}
    <div class="fr" style="margin-top:6px"><div class="fl">تاريخ التقديم</div><div class="fv">${teDate(r.createdAt)}</div></div>`;
}

function tcViewApplicant(id) {
  const r = TE_ROWS.find(x => x.id === id); if (!r) return;
  document.getElementById('tc-modal-body').innerHTML = `
    <h3>بيانات الطالب</h3>
    ${teReadOnlyHTML(r)}
    <div style="display:flex;gap:8px;margin-top:16px">
      <button class="btn" style="flex:1" onclick="tcCloseModal()">إغلاق</button>
    </div>`;
  document.getElementById('tc-modal').classList.add('open');
}

async function tcSaveAll() {
  const trs = Array.from(document.querySelectorAll('#tc-tbody tr[data-id]'));
  if (!trs.length) return;
  const jobs = trs.map(tr => {
    const id = tr.dataset.id;
    const hs = parseFloat(tr.dataset.hs) || 0;
    const committee_scores = Array.from(tr.querySelectorAll('.tc-score')).map(el => el.value === '' ? null : parseFloat(el.value));
    const filled = committee_scores.filter(v => v != null);
    const committee_total = filled.length ? filled.reduce((a,b)=>a+b, 0) : null;
    const committee_score = filled.length ? committee_total / 2 : null;
    const final_score = filled.length ? committee_score + hs : null;
    return api('/api/talent_excellence/'+id, 'PUT', { committee_scores, committee_total, committee_score, hs_score: hs, final_score });
  });
  const results = await Promise.all(jobs);
  if (results.some(r => r && r.error)) { alert('حدث خطأ أثناء حفظ بعض العلامات'); return; }
  alert('✅ تم حفظ جميع العلامات بنجاح');
  loadTalentCommittee();
}

// خط مخصّص لكشوف لجنة التحكيم فقط (لا يمسّ خط باقي شاشات النظام)
const TC_PRINT_FONT = `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Scheherazade+New:wght@400;700&display=swap"><style>body,table,th,td,div{font-family:'Scheherazade New',serif!important;font-weight:700!important}</style>`;
// توسيط عناوين الأعمدة في كل جداول التفوق الفني المطبوعة (عمود اسم الطالب يبقى يميناً بشكل صريح لكل صف)
const TE_TABLE_ALIGN_STYLE = `<style>.ptbl th{text-align:center!important}</style>`;
// مربّع توقيعات أعضاء اللجنة (الاسم الوظيفي أعلى الاسم) — يُستخدم في أكثر من كشف مطبوع
function teSignatureBlockHTML() {
  const members = teCommitteeMembers();
  if (!members.length) return '';
  return `<div style="margin-top:60px;display:grid;grid-template-columns:repeat(${members.length},1fr);gap:14px;text-align:center;font-size:10.5pt;page-break-inside:avoid">
    ${members.map(m => `<div><div style="border-top:1px solid #333;padding-top:6px">${teEsc(m.title)||'&nbsp;'}</div><div style="margin-top:60px;font-weight:700">${teEsc(m.name)}</div></div>`).join('')}
  </div>`;
}

function tcPrintGradingSheet() {
  const act = document.getElementById('tc-f-act')?.value || '';
  const members = teCommitteeMembers();
  if (!members.length) { alert('يرجى إدخال أسماء أعضاء اللجنة أولاً'); return; }
  const rows = TE_ROWS.filter(r => !act || (r.activity_types||[]).includes(act));
  if (!rows.length) { alert('لا يوجد متقدمون مطابقون لهذه التصفية'); return; }
  const extraKeys = Array.from(document.querySelectorAll('.tc-sheet-col:checked')).map(el => el.value);
  const extraCols = TE_FIELDS.filter(f => extraKeys.includes(f.key));
  const per = (100 / members.length).toFixed(1);
  const html = `
    ${TC_PRINT_FONT}${TE_TABLE_ALIGN_STYLE}
    <div class="ph2">
      <img src="/logo.png" class="plogo" alt="شعار الجامعة الأردنية">
      <div class="puni"><div class="ar">الجامعة الأردنية</div><div class="en">The University of Jordan</div><div class="dep">عمادة شؤون الطلبة — Dean of Student Affairs</div></div>
      <div class="pmeta">${teDate(new Date())}</div>
    </div>
    <div class="ptitle">كشف تقييم لجنة المقابلة${act?' — '+teEsc(act):''}</div>
    <table class="ptbl"><thead><tr>
      <th>#</th><th>اسم الطالب</th>
      ${extraCols.map(c=>`<th>${c.label}</th>`).join('')}
      ${members.map(m=>`<th>${teEsc(m.name)}<br>(من ${per})</th>`).join('')}
      <th>المجموع (من 100)</th>
    </tr></thead><tbody>
      ${rows.map((r,i)=>`<tr><td style="text-align:center">${i+1}</td><td style="text-align:right">${teEsc(r.full_name)}</td>${extraCols.map(c=>`<td style="text-align:center">${teEsc(teFieldValue(r,c.key))}</td>`).join('')}${members.map(()=>`<td style="height:30px"></td>`).join('')}<td></td></tr>`).join('')}
    </tbody></table>`;
  openPrint(html);
  tcCloseModal();
}

// كشف العلامات النهائي — يشمل العلامات الفعلية المُدخَلة + مربّع توقيعات أعضاء اللجنة (الاسم الوظيفي فوق الاسم)
function tcPrintFinalReport() {
  const act = document.getElementById('tc-f-act')?.value || '';
  const members = teCommitteeMembers();
  if (!members.length) { alert('يرجى إدخال أسماء أعضاء اللجنة أولاً'); return; }
  const rows = TE_ROWS.filter(r => !act || (r.activity_types||[]).includes(act));
  if (!rows.length) { alert('لا يوجد متقدمون مطابقون لهذه التصفية'); return; }
  const extraKeys = Array.from(document.querySelectorAll('.tc-sheet-col:checked')).map(el => el.value);
  const extraCols = TE_FIELDS.filter(f => extraKeys.includes(f.key));
  const per = (100 / members.length).toFixed(1);
  const html = `
    ${TC_PRINT_FONT}${TE_TABLE_ALIGN_STYLE}
    <div class="ph2">
      <img src="/logo.png" class="plogo" alt="شعار الجامعة الأردنية">
      <div class="puni"><div class="ar">الجامعة الأردنية</div><div class="en">The University of Jordan</div><div class="dep">عمادة شؤون الطلبة — Dean of Student Affairs</div></div>
      <div class="pmeta">${teDate(new Date())}</div>
    </div>
    <div class="ptitle">كشف علامات لجنة المقابلة${act?' — '+teEsc(act):''}</div>
    <table class="ptbl"><thead><tr>
      <th>#</th><th>اسم الطالب</th>
      ${extraCols.map(c=>`<th>${c.label}</th>`).join('')}
      ${members.map(m=>`<th>${teEsc(m.name)}<br>(من ${per})</th>`).join('')}
      <th>علامة اللجنة (50)</th><th>علامة الثانوية (50)</th><th>العلامة النهائية</th>
    </tr></thead><tbody>
      ${rows.map((r,i) => {
        const scores = r.committee_scores || [];
        return `<tr><td style="text-align:center">${i+1}</td><td style="text-align:right">${teEsc(r.full_name)}</td>${extraCols.map(c=>`<td style="text-align:center">${teEsc(teFieldValue(r,c.key))}</td>`).join('')}${members.map((m,mi)=>`<td style="text-align:center">${scores[mi]!=null?scores[mi]:'—'}</td>`).join('')}<td style="text-align:center">${r.committee_score!=null?r.committee_score.toFixed(1):'—'}</td><td style="text-align:center">${r.hs_score!=null?r.hs_score.toFixed(1):'—'}</td><td style="font-weight:700;text-align:center">${r.final_score!=null?r.final_score.toFixed(1):'—'}</td></tr>`;
      }).join('')}
    </tbody></table>
    ${teSignatureBlockHTML()}`;
  openPrint(html);
  tcCloseModal();
}
