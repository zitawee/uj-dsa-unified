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
const TE_INSTRUMENTS = ['الأورغ','العود','القانون','الكمان','آلات نفخية','آلات إيقاعية'];
const TE_DISTRICTS = {"العاصمة": ["عمان", "الجامعة", "القويسمة", "ماركا", "الجيزة", "الموقر", "ناعور", "سحاب", "وادي السير"], "البلقاء": ["السلط", "الشونة الجنوبية", "دير علا", "عين الباشا", "ماحص والفحيص"], "الزرقاء": ["الزرقاء", "الرصيفة", "الهاشمية", "بيرين"], "مأدبا": ["مأدبا", "ذيبان"], "إربد": ["إربد", "الرمثا", "بني كنانة", "بني عبيد", "الكورة", "المزار الشمالي", "الطيبة"], "المفرق": ["المفرق", "البادية الشمالية", "البادية الشمالية الغربية", "الرويشد", "الخالدية"], "جرش": ["جرش"], "عجلون": ["عجلون", "كفرنجة"], "الكرك": ["الكرك", "القصر", "القطرانة", "المزار الجنوبي", "الأغوار الجنوبية", "عي", "فقوع"], "الطفيلة": ["الطفيلة", "الحسا", "بصيرا"], "معان": ["معان", "البتراء", "الحسينية", "الشوبك"], "العقبة": ["العقبة", "القويرة"]};
const TE_MAJORS = {"كلية العلوم": ["الرياضيات", "العلوم الحياتية", "الاحصاء وعلم البيانات", "الفيزياء", "الجيولوجيا البيئية والتطبيقية", "الكيمياء الصناعية", "العلوم الطبية المخبرية", "الكيمياء"], "كلية الشريعة": ["الفقه وأصوله", "أصول الدين", "المصارف الاسلامية"], "كلية الزراعة": ["الإنتتاج الحيواني", "تغذية الإنسان والحميات", "علم وتكنولوجيا الغذاء", "الإقتصاد الزراعي وادارةالأعمال الزراعية", "الوقاية النباتية", "البستنة والمحاصيل", "تصميم وتنسيق المواقع", "الأراضي والمياه والبيئة"], "كلية التمريض": ["التمريض"], "كلية العلوم التربوية": ["التربية الخاصة", "علم المكتبات والمعلومات", "معلم الصف", "تربية الطفولة المبكره", "الإرشاد والصحة النفسية"], "كلية الهندسة": ["هندسة الحاسوب", "الهندسة المدنية", "هندسة العمارة", "الهندسة الميكانيكية", "هندسة الميكاترونكس", "هندسة الطيران", "الهندسة الصناعية", "الهندسة الكهربائية", "الهندسة الكيميائية"], "كلية الحقوق": ["القانون"], "كلية الصيدلة": ["الصيدلة", "دكتور في الصيدلة"], "كلية الأعمال": ["إدارة الأعمال", "المحاسبة", "نظم المعلومات الإدارية", "التسويق", "إقتصاد الأعمال", "التمويل", "الإدارة العامة"], "كلية علوم التأهيل": ["العلاج الوظيفي", "الاطراف الاصطناعية والاجهزة المساعدة", "علوم السمع والنطق", "العلاج الطبيعي"], "كلية الملك عبد الله الثاني لتكنولوجيا المعلومات": ["الأمن السيبراني", "تكنولوجيا معلومات الأعمال", "علم الحاسوب", "الذكاء الإصطناعي", "أنظمة المعلومات الحاسوبية", "علم البيانات"], "كلية اللغات الأجنبية": ["اللغتين الألمانية والإنجليزية", "اللغتين الصينية والإنجليزية", "اللغتين الكورية والإنجليزية", "اللغة الفرنسية وآدابها", "اللغتين الفرنسية والانجليزية", "اللغتين الإيطالية والإنجليزية", "اللغتين التركية والإنجليزية", "اللغة الإنجليزية التطبيقية", "اللغتين الإسبانية والإنجليزية", "اللغتين الروسية والإنجليزية", "اللغة الإنجليزية وآدابها"], "كلية الآداب": ["التاريخ", "علم النفس", "اللغة العربية وآدابها", "علم الإجتماع", "العمل الإجتماعي", "الفلسفة", "الجغرافيا"], "كلية الآثار والسياحة": ["إدارة الفعاليات", "الآثار", "الإدارة السياحية", "إدارة المصادر التراثية وصيانتها", "إدارة الضيافة"], "كلية الأمير الحسين بن عبد الله الثاني للعلوم السياسية والدراسات الدولية": ["العلوم السياسية"]};
const TE_STATUS = {
  pending:       { label: '🟡 قيد المراجعة',     cls: 'st-p' },
  accepted_exam: { label: '🔵 مقبول للاختبار',   cls: 'st-d' },
  passed:        { label: '✅ ناجح',              cls: 'st-a' },
  rejected:      { label: '❌ مرفوض',             cls: 'st-r' },
};
let TE_ROWS = [];
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
  const colKeys = Array.from(document.querySelectorAll('.te-cl-col:checked')).map(el => el.value);

  if (!colKeys.length) { alert('يرجى اختيار حقل واحد على الأقل'); return; }

  const rows = TE_ROWS.filter(r => {
    if (acts.length && !acts.some(a => (r.activity_types||[]).includes(a))) return false;
    if (track && r.cert_track !== track) return false;
    if (status && (r.status||'pending') !== status) return false;
    return true;
  });
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
    <style>.te-cl-title{text-align:center;font-size:15pt;font-weight:800;color:#1B6B3A;margin:2px 0 12px;padding-bottom:7px;border-bottom:2px solid #1B6B3A}</style>
    <div class="ph2">
      <img src="/logo.png" class="plogo" alt="شعار الجامعة الأردنية">
      <div class="puni"><div class="ar">الجامعة الأردنية</div><div class="en">The University of Jordan</div><div class="dep">عمادة شؤون الطلبة — Dean of Student Affairs</div></div>
      <div class="pmeta">${teDate(new Date())}</div>
    </div>
    <div class="ptitle">قائمة الطلبة المتقدمين — التفوق الفني</div>
    ${TE_CUSTOM_FILTER_TITLE ? `<div class="te-cl-title">نوع النشاط: ${teEsc(TE_CUSTOM_FILTER_TITLE)}</div>` : ''}
    <table class="ptbl"><thead><tr><th>#</th>${TE_CUSTOM_COLS.map(c=>`<th>${c.label}</th>`).join('')}</tr></thead><tbody>
      ${TE_CUSTOM_ROWS.map((r,i)=>`<tr><td>${i+1}</td>${TE_CUSTOM_COLS.map(c=>`<td>${teEsc(teFieldValue(r,c.key))}</td>`).join('')}</tr>`).join('')}
    </tbody></table>`;
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
