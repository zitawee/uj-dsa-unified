// ══════════════════════════════════════════════════════════════
// بند مؤقت: التفوق الرياضي — لوحة الإدارة (Admin فقط)
// وحدة مستقلة تماماً عن باقي النظام لسهولة إزالتها لاحقاً:
// لإزالتها بالكامل: احذف هذا الملف + سطر <script src="/sports.js"> من index.html
// + سطر الشريط الجانبي الخاص بها في buildSidebar() + 'sports_excellence' من IDS في buildPanels()
// + المدخل المقابل في خريطة loaders داخل go() — كل ذلك في app.js
// ══════════════════════════════════════════════════════════════

const SP_TRACKS = {
  academic: 'المسار الأكاديمي', vocational: 'المسار المهني والتقني', btec: 'برنامج BTEC', international: 'شهادة دولية', arabic: 'الثانوية العربية'
};
const SP_TRACK_SUB = {
  academic:   ['الحقل الصحي','الحقل الهندسي','حقل العلوم والتكنولوجيا','حقل اللغات والعلوم الاجتماعية','حقل القانون والعلوم الشرعية','حقل الأعمال'],
  vocational: ['الصناعي','الزراعي','الاقتصاد المنزلي','الفندقي والسياحي'],
  btec:       [],
  international: ['أمريكية','بريطانية','بكالوريا دولية'],
  arabic: ['الإمارات العربية المتحدة','البحرين','تونس','الجزائر','جزر القمر','جيبوتي','السعودية','السودان','سوريا','الصومال','العراق','سلطنة عُمان','فلسطين','قطر','الكويت','لبنان','ليبيا','مصر','المغرب','موريتانيا','اليمن']
};
const SP_GAME_TYPES = ['كرة الطائرة','كرة السلة','كرة اليد','كرة القدم','كرة الطاولة','ألعاب القوى','التايكوندو','الكراتيه','الريشة الطائرة','الشطرنج'];
// نوع نموذج التفوق الرياضي: كل فئة تحمل علامة ثابتة محدَّدة سلفاً (من 20) — تُحتسب تلقائياً عند اختيار رقم النموذج
const SP_NOMINATION_TYPES = [
  { num: 1, label: 'لاعب منتخب وطني مثّل الأردن', score: 20 },
  { num: 2, label: 'لاعب منتخب وطني', score: 19 },
  { num: 3, label: 'منتخب مدرسي مثّل الأردن', score: 16 },
  { num: 4, label: 'لاعب نادي – ألعاب جماعية (المراكز الثلاثة الأولى)', score: null },
  { num: 5, label: 'لاعب نادي – ألعاب جماعية (المركز الرابع فما فوق)', score: 13 },
  { num: 6, label: 'لاعب نادي – ألعاب فردية (المراكز الثلاثة الأولى)', score: null },
  { num: 7, label: 'منتخب مديرية التربية والتعليم', score: null },
  { num: 8, label: 'فريق مدرسي', score: 10 },
];
// ملاحظة: النماذج 4، 6، 7 علامتها تعتمد على المركز المُسجَّل في الشهادة (score: null هنا عمداً) —
// يُعتمَد دائماً على r.nomination_score المحفوظة وقت التقديم، وليس هذا الجدول الثابت، لعرضها بدقة
const SP_NOMINATION_SCORES = Object.fromEntries(SP_NOMINATION_TYPES.filter(t => t.score != null).map(t => [t.label, t.score]));
function spNominationScore(label) { return SP_NOMINATION_SCORES[label] ?? null; }
const SP_DISTRICTS = {"العاصمة": ["عمان", "الجامعة", "القويسمة", "ماركا", "الجيزة", "الموقر", "ناعور", "سحاب", "وادي السير"], "البلقاء": ["السلط", "الشونة الجنوبية", "دير علا", "عين الباشا", "ماحص والفحيص"], "الزرقاء": ["الزرقاء", "الرصيفة", "الهاشمية", "بيرين"], "مأدبا": ["مأدبا", "ذيبان"], "إربد": ["إربد", "الرمثا", "بني كنانة", "بني عبيد", "الكورة", "المزار الشمالي", "الطيبة"], "المفرق": ["المفرق", "البادية الشمالية", "البادية الشمالية الغربية", "الرويشد", "الخالدية"], "جرش": ["جرش"], "عجلون": ["عجلون", "كفرنجة"], "الكرك": ["الكرك", "القصر", "القطرانة", "المزار الجنوبي", "الأغوار الجنوبية", "عي", "فقوع"], "الطفيلة": ["الطفيلة", "الحسا", "بصيرا"], "معان": ["معان", "البتراء", "الحسينية", "الشوبك"], "العقبة": ["العقبة", "القويرة"]};
const SP_MAJORS = MAJORS_BY_COLLEGE; // مصدر مشترك مع كشف المشاركين (quality.js) — معرَّف في app.js
const SP_STATUS = {
  pending:       { label: '🟡 قيد المراجعة',     cls: 'st-p' },
  accepted_exam: { label: '🔵 مقبول للاختبار',   cls: 'st-d' },
  ability_test_passed: { label: '🟣 اجتاز اختبار القدرات', cls: 'st-d' },
  passed:        { label: '✅ ناجح',              cls: 'st-a' },
  rejected:      { label: '❌ مرفوض',             cls: 'st-r' },
};
let SP_ROWS = [];
let SP_SETTINGS = {};
let SP_EDIT_PHOTO = null; // صورة بديلة (base64) إن اختار الإداري تغييرها أثناء التعديل
let SP_CUSTOM_ROWS = null, SP_CUSTOM_COLS = null; // نتيجة آخر "قائمة مخصصة" تم إنشاؤها (للطباعة/التصدير)

// كل الحقول المتاحة لبناء قائمة مخصصة منها
const SP_FIELDS = [
  { key:'ref_code',      label:'رقم الطلب' },
  { key:'full_name',     label:'الاسم' },
  { key:'gender',        label:'الجنس' },
  { key:'seat_number',   label:'رقم الجلوس' },
  { key:'phone',         label:'الهاتف' },
  { key:'phone_alt',     label:'هاتف بديل' },
  { key:'school',        label:'المدرسة' },

  { key:'governorate',   label:'المحافظة' },
  { key:'district',      label:'اللواء' },
  { key:'game_types',    label:'نوع اللعبة' },
  { key:'nomination_type', label:'نوع نموذج التفوق الرياضي' },
  { key:'cert_track',    label:'فرع الشهادة' },
  { key:'cert_subfield', label:'الحقل' },
  { key:'arab_branch',   label:'الفرع الدراسي (ثانوية عربية)' },
  { key:'equivalency_doc', label:'وثيقة معادلة الشهادة' },
  { key:'cert_year',     label:'سنة الشهادة' },
  { key:'gpa',           label:'المعدل' },
  { key:'address',       label:'العنوان' },
  { key:'major1',        label:'التخصص الأول' },
  { key:'major2',        label:'التخصص الثاني' },
  { key:'major3',        label:'التخصص الثالث' },
  { key:'status',        label:'الحالة' },
  { key:'committee_score',label:'علامة الاختبار (من 60)' },
  { key:'hs_score',      label:'علامة الثانوية (من 20)' },
  { key:'nomination_score',label:'علامة نوع النموذج (من 20)' },
  { key:'final_score',   label:'العلامة النهائية (من 100)' },
  { key:'createdAt',     label:'تاريخ التقديم' },
];
const SP_DEFAULT_COLS = ['ref_code','full_name','game_types','cert_track','cert_subfield','cert_year','gpa','major1','major2','major3'];

function spFieldValue(r, key) {
  switch (key) {
    case 'game_types':     return (r.game_types||[]).join('، ');
    case 'cert_track':     return SP_TRACKS[r.cert_track] || r.cert_track || '';
    case 'gpa':            return r.gpa ? r.gpa + '%' : '';
    case 'major1':         return (r.majors||[])[0] || '';
    case 'major2':         return (r.majors||[])[1] || '';
    case 'major3':         return (r.majors||[])[2] || '';
    case 'status':         return SP_STATUS[r.status]?.label || SP_STATUS.pending.label;
    case 'committee_score':return r.committee_score!=null ? spPct(r.committee_score) : '';
    case 'hs_score':       return r.hs_score!=null ? spPct(r.hs_score) : '';
    case 'nomination_score': return r.nomination_score!=null ? spPct(r.nomination_score) : (spNominationScore(r.nomination_type)!=null ? spPct(spNominationScore(r.nomination_type)) : '');
    case 'final_score':    return r.final_score!=null ? spPct(r.final_score) : '';
    case 'createdAt':      return spDate(r.createdAt);
    default:                return r[key] || '';
  }
}

// يُستدعى مرة واحدة بعد الدخول (admin فقط) لتعبئة عدّاد الشريط الجانبي دون تحميل اللوحة كاملة
async function spLoadBadgeCount() {
  try {
    const rows = await api('/api/sports_excellence');
    const el = document.getElementById('c-sports_excellence');
    if (el && Array.isArray(rows)) el.textContent = rows.length;
  } catch (e) {}
}

function spCopyLink() {
  const link = window.location.origin + '/sports.html';
  const btn = document.getElementById('sp-link-btn');
  const restore = () => { if (btn) btn.innerHTML = '<i class="ti ti-link"></i> رابط التقديم'; };
  const showCopied = () => { if (btn) { btn.innerHTML = '<i class="ti ti-check"></i> تم نسخ الرابط'; setTimeout(restore, 2000); } };
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(link).then(showCopied).catch(() => prompt('انسخي الرابط يدوياً:', link));
  } else {
    prompt('انسخي الرابط يدوياً:', link);
  }
}

function spPct(n) { return n.toFixed(2) + '%'; }
function spEsc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function spBadge(status) {
  const s = SP_STATUS[status] || SP_STATUS.pending;
  return `<span class="st ${s.cls}">${s.label}</span>`;
}
function spDate(d) {
  if (!d) return '';
  try { return new Date(d).toLocaleDateString('ar-JO', { year:'numeric', month:'long', day:'numeric' }); } catch(e) { return ''; }
}

async function loadSports() {
  const panel = document.getElementById('panel-sports_excellence');
  if (!panel) return;
  panel.innerHTML = `<div class="ph"><div><div class="pt">التفوق الرياضي</div><div class="ps">طلبات الالتحاق على أساس التفوق الرياضي (بند مؤقت)</div></div></div>
    <div class="card"><div class="center" style="padding:24px">جارٍ التحميل...</div></div>`;

  const [rows, settings] = await Promise.all([
    api('/api/sports_excellence'),
    api('/api/sports_excellence/settings'),
  ]);
  if (!Array.isArray(rows)) { panel.innerHTML = `<div class="card"><div class="center">تعذّر تحميل البيانات</div></div>`; return; }
  SP_ROWS = rows;
  SP_SETTINGS = settings || {};

  panel.innerHTML = `
  <div class="ph"><div><div class="pt">التفوق الرياضي</div><div class="ps">طلبات الالتحاق على أساس التفوق الرياضي (بند مؤقت) — ${rows.length} طلب</div></div></div>

  <div class="card">
    <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end">
      ${ME?.role==='admin' ? `
      <div class="fg" style="min-width:170px"><label>تاريخ إغلاق الرابط</label><input type="date" id="sp-close-date" value="${settings?.close_date || ''}"></div>
      <button class="btn btn-sm" onclick="spSaveSettings()"><i class="ti ti-device-floppy"></i> حفظ تاريخ الإغلاق</button>
      <div style="font-size:11.5px;color:var(--muted)">${settings?.close_date ? `الرابط مفتوح حتى ${spDate(settings.close_date)}` : 'الرابط مفتوح حالياً بلا تاريخ إغلاق محدَّد'}</div>` : ''}
      <div style="flex:1"></div>
      <button class="btn btn-sm" id="sp-link-btn" onclick="spCopyLink()"><i class="ti ti-link"></i> رابط التقديم</button>
      <button class="btn btn-sm" onclick="spExportExcel()"><i class="ti ti-file-spreadsheet"></i> تصدير Excel</button>
      <button class="btn btn-sm" onclick="printSelectedSports()"><i class="ti ti-printer"></i> طباعة المحدد</button>
      <button class="btn btn-sm" onclick="spOpenCustomList()"><i class="ti ti-list-details"></i> قائمة مخصصة</button>
    </div>
  </div>

  ${ME?.role==='admin' ? `
  <div class="card">
    <div style="font-weight:700;color:var(--g);margin-bottom:8px">الألعاب المتاحة للتقديم هذا العام</div>
    <div style="font-size:11.5px;color:var(--muted);margin-bottom:10px">عطّلي أي لعبة غير متاحة هذا العام فتختفي فوراً من نموذج التقديم العام ومن صفحة تعبئة الشهادة، ويُرفَض أي طلب/شهادة لها من طرف الخادم مباشرة.</div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:6px">
      ${SP_GAME_TYPES.map(g => `<label style="display:flex;align-items:center;gap:6px;font-weight:400;font-size:12.5px"><input type="checkbox" class="sp-active-game" value="${g}" ${(settings?.active_games || SP_GAME_TYPES).includes(g) ? 'checked' : ''}> ${g}</label>`).join('')}
    </div>
    <button class="btn btn-sm" style="margin-top:10px" onclick="spSaveActiveGames()"><i class="ti ti-device-floppy"></i> حفظ الألعاب المتاحة</button>
  </div>

  <div class="card">
    <div style="font-weight:700;color:var(--g);margin-bottom:8px">اللجنة العليا للتفوق الرياضي (5 أعضاء) — تختار الناجحين النهائيين من بين كل المتقدمين، عبر كل الألعاب</div>
    <div style="font-size:11.5px;color:var(--muted);margin-bottom:10px">هذه اللجنة مستقلة تماماً عن لجان الاختبار الخاصة بكل لعبة. أسماؤها تظهر فقط في توقيع "كشف الطلبة الناجحين" النهائي أدناه.</div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:8px">
      ${[0,1,2,3,4].map(i => `
      <div style="border:1px solid var(--border);border-radius:var(--r);padding:8px">
        <div class="fg"><label>العضو ${i+1} — الاسم</label><input type="text" id="sp-hc-m-${i}" value="${spEsc((settings?.higher_committee||[])[i]?.name||'')}" placeholder="اسم العضو..."></div>
        <div class="fg" style="margin-top:6px"><label>الاسم الوظيفي</label><input type="text" id="sp-hc-t-${i}" value="${spEsc((settings?.higher_committee||[])[i]?.title||'')}" placeholder="مثال: عميد شؤون الطلبة..."></div>
      </div>`).join('')}
    </div>
    <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">
      <button class="btn btn-sm" onclick="spSaveHigherCommittee()"><i class="ti ti-device-floppy"></i> حفظ أسماء اللجنة العليا</button>
      <button class="btn btn-sm" style="background:var(--g);color:#fff" onclick="spOpenPassedListPrintFields()"><i class="ti ti-printer"></i> طباعة كشف الطلبة الناجحين (المحدَّدين بـ "مقبول")</button>
    </div>
  </div>` : ''}

  <div class="card">
    <div class="fb">
      <input type="text" id="sp-q" placeholder="بحث بالاسم أو الهاتف أو المدرسة..." style="flex:1;min-width:180px" oninput="spRender()">
      <select id="sp-f-status" onchange="spRender()"><option value="">كل الحالات</option>${Object.entries(SP_STATUS).map(([k,v])=>`<option value="${k}">${v.label}</option>`).join('')}</select>
      <select id="sp-f-gov" onchange="spRender()"><option value="">كل المحافظات</option>${[...new Set(rows.map(r=>r.governorate).filter(Boolean))].map(g=>`<option>${g}</option>`).join('')}</select>
      <select id="sp-f-game" onchange="spRender()"><option value="">كل الألعاب</option>${SP_GAME_TYPES.map(t=>`<option>${t}</option>`).join('')}</select>
      <select id="sp-sort" onchange="spRender()"><option value="date_desc">الأحدث</option><option value="score_desc">الأعلى علامة</option><option value="score_asc">الأدنى علامة</option></select>
      <label style="display:flex;align-items:center;gap:6px;font-weight:400;font-size:12.5px;white-space:nowrap;background:#FCEBEB;color:#791F1F;padding:0 10px;border-radius:var(--r)"><input type="checkbox" id="sp-f-nocert" onchange="spRender()"> ⚠️ إظهار غير المرتبطة بشهادة فقط</label>
    </div>
  </div>

  ${ME?.role==='admin' ? `
  <div class="card">
    <div class="fb" style="align-items:center">
      <button class="btn btn-sm" onclick="spToggleAllRows(true)"><i class="ti ti-checkbox"></i> تحديد كل النتائج الظاهرة</button>
      <button class="btn btn-sm" onclick="spToggleAllRows(false)">إلغاء التحديد</button>
      <div style="flex:1"></div>
      <span id="sp-sel-count" style="font-size:12px;color:var(--muted)">لم يُحدَّد شيء</span>
      <button class="btn btn-sm" style="background:#8A1F1F;color:#fff;border-color:#8A1F1F" onclick="spDeleteSelected()"><i class="ti ti-trash"></i> حذف المحدَّد</button>
    </div>
    <p style="font-size:11px;color:var(--muted);margin:6px 0 0">نصيحة: صفّي الجدول أولاً (مثلاً حسب الحالة "قيد المراجعة")، ثم "تحديد كل النتائج الظاهرة" — يتم تحديد المطابق للفلتر الحالي فقط.</p>
  </div>` : ''}

  <div class="card">
    <div class="tw"><table>
      <thead><tr>
        ${ME?.role==='admin' ? `<th style="width:36px"><input type="checkbox" id="sp-check-all" onchange="spToggleAllRows(this.checked)"></th>` : ''}
        ${ME?.role==='admin' ? `<th style="width:40px">مقبول</th>` : ''}
        <th>#</th><th>الاسم</th><th>الجنس</th><th>نوع اللعبة</th><th>فرع الشهادة</th><th>المعدل</th><th>الرقم المرجعي للشهادة</th><th>العلامة النهائية</th><th>الحالة</th><th>تاريخ التقديم</th><th>إجراءات</th>
      </tr></thead>
      <tbody id="tbl-sports-body"></tbody>
    </table></div>
  </div>

  <div class="modal-ov" id="sp-modal" onclick="if(event.target===this) spCloseModal()"><div class="modal" style="max-width:640px;max-height:88vh;overflow-y:auto" id="sp-modal-body"></div></div>`;

  if (!window.__spEscBound) {
    window.__spEscBound = true;
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') spCloseModal();
    });
  }

  spRender();
}

function spRender() {
  const q = (document.getElementById('sp-q')?.value || '').trim().toLowerCase();
  const fStatus = document.getElementById('sp-f-status')?.value || '';
  const fGov = document.getElementById('sp-f-gov')?.value || '';
  const fAct = document.getElementById('sp-f-game')?.value || '';
  const fNoCert = document.getElementById('sp-f-nocert')?.checked || false;
  const sort = document.getElementById('sp-sort')?.value || 'date_desc';
  let rows = SP_ROWS.filter(r => {
    if (fStatus && (r.status || 'pending') !== fStatus) return false;
    if (fGov && r.governorate !== fGov) return false;
    if (fAct && !(r.game_types||[]).includes(fAct)) return false;
    if (fNoCert && r.cert_ref_code) return false;
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
  const tb = document.getElementById('tbl-sports-body');
  if (!rows.length) { tb.innerHTML = `<tr><td colspan="14" class="center">لا توجد نتائج مطابقة</td></tr>`; spUpdateSelCount(); return; }
  tb.innerHTML = rows.map((r,i) => `
    <tr>
      ${ME?.role==='admin' ? `<td style="text-align:center"><input type="checkbox" class="sp-row-chk" value="${r.id}" onchange="spUpdateSelCount()"></td>` : ''}
      ${ME?.role==='admin' ? `<td style="text-align:center"><input type="checkbox" value="${r.id}" ${r.status==='passed'?'checked':''} onchange="spToggleAccept('${r.id}', this)" title="وضع إشارة القبول (تُحفظ تلقائياً)"></td>` : ''}
      <td>${i+1}</td>
      <td>${spEsc(r.full_name)}</td>
      <td>${spEsc(r.gender)}</td>
      <td>${(r.game_types||[]).map(spEsc).join('، ')}</td>
      <td>${spEsc(SP_TRACKS[r.cert_track]||r.cert_track||'')}</td>
      <td>${spEsc(r.gpa)}%</td>
      <td>${r.cert_ref_code ? `<a href="#" onclick="spViewCertByRef('${spEsc(r.cert_ref_code)}');return false" style="font-family:monospace;color:var(--g);font-weight:700;text-decoration:underline">${spEsc(r.cert_ref_code)}</a>` : `<span style="background:#FCEBEB;color:#791F1F;font-weight:700;padding:2px 8px;border-radius:6px;font-size:11.5px">⚠️ بلا شهادة مرتبطة</span>`}</td>
      <td style="font-weight:700">${r.final_score!=null ? spPct(r.final_score) : '—'}</td>
      <td class="sp-status-cell">${spBadge(r.status)}</td>
      <td>${spDate(r.createdAt)}</td>
      <td style="white-space:nowrap">
        <button class="btn btn-sm" onclick="spView('${r.id}')"><i class="ti ti-eye"></i></button>
        <button class="btn btn-sm" onclick="spPrintOne('${r.id}')"><i class="ti ti-printer"></i></button>
        ${ME?.role==='admin' ? `<button class="btn btn-sm" style="color:#c0392b" onclick="spDelete('${r.id}')"><i class="ti ti-trash"></i></button>` : ''}
      </td>
    </tr>`).join('');
  spUpdateSelCount();
}

function spToggleAllRows(state) {
  document.querySelectorAll('.sp-row-chk').forEach(cb => cb.checked = state);
  const all = document.getElementById('sp-check-all'); if (all) all.checked = state;
  spUpdateSelCount();
}

function spUpdateSelCount() {
  const n = document.querySelectorAll('.sp-row-chk:checked').length;
  const el = document.getElementById('sp-sel-count');
  if (el) el.textContent = n ? `${n} طلب محدَّد` : 'لم يُحدَّد شيء';
}

async function spDeleteSelected() {
  const ids = Array.from(document.querySelectorAll('.sp-row-chk:checked')).map(cb => cb.value);
  if (!ids.length) { alert('يرجى تحديد طلب واحد على الأقل'); return; }
  if (!confirm(`هل تريدين حذف ${ids.length} طلب محدَّد نهائياً؟ لا يمكن التراجع عن هذا الإجراء.\nملاحظة: أي شهادة مرتبطة بأحد هذه الطلبات ستُحرَّر تلقائياً لتصبح قابلة للاستخدام مجدداً.`)) return;
  const results = await Promise.all(ids.map(id => api('/api/sports_excellence/'+id, 'DELETE')));
  const failed = results.filter(r => r && r.error).length;
  if (failed) alert(`تم الحذف مع فشل ${failed} عملية من أصل ${ids.length}`);
  loadSports();
}

// وضع/إزالة إشارة "مقبول" مباشرة من الجدول — تُحفظ فوراً في قاعدة البيانات
// (تُستخدم status='passed' كعلامة القبول النهائي؛ إلغاء التحديد يعيدها إلى "قيد المراجعة")
async function spToggleAccept(id, cb) {
  const newStatus = cb.checked ? 'passed' : 'pending';
  cb.disabled = true;
  const res = await api('/api/sports_excellence/'+id, 'PUT', { status: newStatus });
  cb.disabled = false;
  if (res && res.error) { alert(res.error); cb.checked = !cb.checked; return; }
  const r = SP_ROWS.find(x => x.id === id);
  if (r) r.status = newStatus;
  const statusCell = cb.closest('tr')?.querySelector('.sp-status-cell');
  if (statusCell) statusCell.innerHTML = spBadge(newStatus);
}

async function spSaveSettings() {
  const close_date = document.getElementById('sp-close-date').value || null;
  SP_SETTINGS.close_date = close_date;
  const r = await api('/api/sports_excellence/settings', 'PUT', SP_SETTINGS);
  if (r.error) { alert(r.error); return; }
  loadSports();
}

async function spSaveActiveGames() {
  const active_games = Array.from(document.querySelectorAll('.sp-active-game:checked')).map(el => el.value);
  if (!active_games.length) { alert('يجب إبقاء لعبة واحدة مفعَّلة على الأقل'); return; }
  SP_SETTINGS.active_games = active_games;
  const r = await api('/api/sports_excellence/settings', 'PUT', SP_SETTINGS);
  if (r.error) { alert(r.error); return; }
  alert('✅ تم حفظ الألعاب المتاحة للتقديم');
  loadSports();
}

function spMajorOpts(selected) {
  let html = '<option value="">اختر...</option>';
  Object.keys(SP_MAJORS).forEach(college => {
    html += `<optgroup label="${spEsc(college)}">` +
      SP_MAJORS[college].map(m => `<option${m===selected?' selected':''}>${spEsc(m)}</option>`).join('') +
      `</optgroup>`;
  });
  return html;
}

function spEditFormHTML(r) {
  return `
    <div style="text-align:center;font-size:11px;color:var(--muted);margin-bottom:8px">الرقم المرجعي: ${spEsc(r.ref_code)} — قُدِّم بتاريخ ${spDate(r.createdAt)}</div>
    <div style="text-align:center;margin-bottom:10px">
      <img id="sp-e-photo-preview" src="${r.photo||''}" style="width:96px;height:96px;object-fit:contain;background:#F1F3F0;border-radius:10px;border:1px solid var(--border);${r.photo?'':'display:none'}">
      <div class="fg" style="margin-top:6px"><input type="file" id="sp-e-photo-file" accept="image/*"></div>
    </div>
    <div class="fg"><label>اسم الطالب كاملاً</label><input type="text" id="sp-e-name" value="${spEsc(r.full_name)}"></div>
    <div class="fg"><label>الجنس</label><select id="sp-e-gender"><option value="">اختر...</option><option${r.gender==='ذكر'?' selected':''}>ذكر</option><option${r.gender==='أنثى'?' selected':''}>أنثى</option></select></div>
    <div class="fg"><label>رقم الجلوس</label><input type="text" id="sp-e-seat" value="${spEsc(r.seat_number)}"></div>
    <div class="fg"><label>المدرسة</label><input type="text" id="sp-e-school" value="${spEsc(r.school)}"></div>
    <div class="fg"><label>المحافظة</label><select id="sp-e-gov">${Object.keys(SP_DISTRICTS).map(g=>`<option${g===r.governorate?' selected':''}>${g}</option>`).join('')}</select></div>
    <div class="fg"><label>اللواء</label><select id="sp-e-dist"></select></div>

    <div class="fg"><label>نوع اللعبة (يمكن أكثر من نوع)</label>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:2px 10px">
        ${SP_GAME_TYPES.map(t=>`<label style="display:flex;align-items:center;gap:6px;font-weight:400;font-size:12.5px;margin-bottom:6px"><input type="checkbox" class="sp-e-game" value="${t}"${(r.game_types||[]).includes(t)?' checked':''}> ${t}</label>`).join('')}
      </div>
    </div>

    <div class="fg"><label>فرع الشهادة</label>
      <select id="sp-e-track">${Object.entries(SP_TRACKS).map(([k,v])=>`<option value="${k}"${k===r.cert_track?' selected':''}>${v}</option>`).join('')}</select>
    </div>
    <div class="fg" id="sp-e-sub-box"><label>الحقل</label><select id="sp-e-subfield"></select></div>
    <div class="fg" id="sp-e-arabbranch-box" style="display:none"><label>الفرع الدراسي (إن وجد)</label><input type="text" id="sp-e-arabbranch" value="${spEsc(r.arab_branch)}"></div>
    <div class="fg" id="sp-e-equiv-box" style="display:none"><label>وثيقة معادلة الشهادة</label>
      <select id="sp-e-equiv"><option value="">اختر...</option><option${r.equivalency_doc==='متوفرة'?' selected':''}>متوفرة</option><option${r.equivalency_doc==='غير متوفرة'?' selected':''}>غير متوفرة</option></select>
    </div>
    <div class="fg"><label>سنة الشهادة</label><input type="text" id="sp-e-year" maxlength="4" value="${spEsc(r.cert_year)}"></div>
    <div class="fg"><label>المعدل (%)</label><input type="text" id="sp-e-gpa" value="${spEsc(r.gpa)}"></div>
    <div class="fg"><label>العنوان</label><textarea id="sp-e-address">${spEsc(r.address)}</textarea></div>
    <div class="fg"><label>الهاتف</label><input type="text" id="sp-e-phone" maxlength="10" value="${spEsc(r.phone)}"></div>
    <div class="fg"><label>هاتف بديل</label><input type="text" id="sp-e-phone-alt" maxlength="10" value="${spEsc(r.phone_alt)}"></div>

    <div class="fg"><label>التخصص الأول</label><select id="sp-e-major1">${spMajorOpts((r.majors||[])[0])}</select></div>
    <div class="fg"><label>التخصص الثاني</label><select id="sp-e-major2">${spMajorOpts((r.majors||[])[1])}</select></div>
    <div class="fg"><label>التخصص الثالث</label><select id="sp-e-major3">${spMajorOpts((r.majors||[])[2])}</select></div>

    <div class="fg"><label>رقم نموذج شهادة التفوق الرياضي</label>
      <select id="sp-e-nomination" onchange="spUpdateNominationDesc()"><option value="">اختر...</option>${SP_NOMINATION_TYPES.map(t=>`<option value="${t.num}"${t.label===r.nomination_type?' selected':''}>نموذج رقم (${t.num})</option>`).join('')}</select>
      <div style="font-size:11px;color:var(--muted);margin:6px 0 2px">وصف النموذج</div>
      <div id="sp-e-nomination-desc" style="border:1px solid var(--border);border-radius:var(--r);padding:10px 12px;font-size:12.5px;background:#F7F9F6;min-height:20px">${spEsc(r.nomination_type)||'—'}</div>
      <div style="font-size:11px;color:var(--muted);margin-top:4px">العلامة المقابلة (من 20): <b id="sp-e-nomination-score">${r.nomination_score!=null ? r.nomination_score : (r.nomination_type && spNominationScore(r.nomination_type)!=null ? spNominationScore(r.nomination_type) : 'تعتمد على المركز في الشهادة')}</b></div>
      <label style="display:block;margin-top:10px">الرقم المرجعي لشهادة النموذج</label>
      <input type="text" id="sp-e-cert-ref" value="${spEsc(r.cert_ref_code||'')}" style="text-transform:uppercase" placeholder="مثال: CERT-A7K92X">
      <button type="button" class="btn btn-sm" onclick="spOpenCertSearch()"><i class="ti ti-search"></i> بحث عن شهادة بالاسم لاختيارها</button>
      <div id="sp-e-cert-search-box" style="display:none;margin-top:8px"></div>
    </div>

    <div class="fg" style="margin-top:8px"><label>الحالة</label>
      <select id="sp-status-sel">${Object.entries(SP_STATUS).map(([k,v])=>`<option value="${k}"${r.status===k?' selected':''}>${v.label}</option>`).join('')}</select>
    </div>`;
}

// فتح لوحة "تعديل الطلب" مباشرة عبر رقمه المرجعي (وليس معرّفه الداخلي) — تُستخدَم من أي شاشة أخرى
// تعرض فقط الرقم المرجعي للطلب (مثل شاشة "نماذج الطلبات")، مع تحميل بيانات الطلبات تلقائياً إن لم تكن محمَّلة أصلاً
async function spViewByRefCode(refCode) {
  if (!refCode) return;
  // ننتقل فعلياً لشاشة "طلبات التفوق الرياضي" أولاً — النافذة المنبثقة sp-modal جزء من هذه اللوحة تحديداً،
  // ولا تظهر بصرياً إن كانت اللوحة غير نشطة حالياً حتى لو بُنيت في الخلفية (اللوحات المخفية display:none)
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.ni').forEach(n => n.classList.remove('active'));
  const panel = document.getElementById('panel-sports_excellence');
  if (panel) panel.classList.add('active');
  const navItem = document.querySelector(`.ni[onclick*="'sports_excellence'"]`);
  if (navItem) navItem.classList.add('active');

  await loadSports();
  const row = (SP_ROWS || []).find(x => x.ref_code === refCode);
  if (!row) { alert('تعذّر إيجاد الطلب بهذا الرقم المرجعي — ربما حُذف'); return; }
  spView(row.id);
}

function spView(id) {
  const r = SP_ROWS.find(x => x.id === id); if (!r) return;
  SP_EDIT_PHOTO = null;
  document.getElementById('sp-modal-body').innerHTML = `
    <h3>تعديل الطلب</h3>
    ${spEditFormHTML(r)}
    <div id="sp-e-msg" class="msg"></div>
    <div style="display:flex;gap:8px;margin-top:16px">
      <button class="btn" style="flex:1;background:var(--g);color:#fff" onclick="spSaveEdit('${r.id}')"><i class="ti ti-device-floppy"></i> حفظ التعديلات</button>
      <button class="btn" onclick="spPrintOne('${r.id}')"><i class="ti ti-printer"></i> طباعة</button>
      <button class="btn" onclick="spCloseModal()">إغلاق</button>
    </div>`;
  document.getElementById('sp-modal').classList.add('open');

  // ── ربط اللواء بالمحافظة، والحقل الفرعي بفرع الشهادة، ومعاينة/تغيير الصورة ──
  const govSel = document.getElementById('sp-e-gov');
  const distSel = document.getElementById('sp-e-dist');
  function fillDist() {
    const list = SP_DISTRICTS[govSel.value] || [];
    distSel.innerHTML = list.map(d => `<option${d===r.district?' selected':''}>${d}</option>`).join('');
  }
  fillDist();
  govSel.addEventListener('change', fillDist);

  const trackSel = document.getElementById('sp-e-track');
  const subSel = document.getElementById('sp-e-subfield');
  const subBox = document.getElementById('sp-e-sub-box');
  const equivBox = document.getElementById('sp-e-equiv-box');
  const arabBranchBox = document.getElementById('sp-e-arabbranch-box');
  function fillSub() {
    const sub = SP_TRACK_SUB[trackSel.value] || [];
    if (!sub.length) { subBox.style.display = 'none'; subSel.innerHTML = ''; }
    else {
      subBox.style.display = 'block';
      subSel.innerHTML = '<option value="">اختر...</option>' + sub.map(s => `<option${s===r.cert_subfield?' selected':''}>${s}</option>`).join('');
    }
    equivBox.style.display = (trackSel.value === 'international' || trackSel.value === 'arabic') ? 'block' : 'none';
    arabBranchBox.style.display = trackSel.value === 'arabic' ? 'block' : 'none';
  }
  fillSub();
  trackSel.addEventListener('change', fillSub);

  document.getElementById('sp-e-photo-file').addEventListener('change', e => {
    const file = e.target.files[0]; if (!file) return;
    const img = new Image(); const reader = new FileReader();
    reader.onload = ev => { img.onload = () => {
      const maxDim = 500; let w = img.width, h = img.height;
      if (w > h && w > maxDim) { h = Math.round(h*maxDim/w); w = maxDim; } else if (h > maxDim) { w = Math.round(w*maxDim/h); h = maxDim; }
      const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      SP_EDIT_PHOTO = canvas.toDataURL('image/jpeg', 0.75);
      const prev = document.getElementById('sp-e-photo-preview'); prev.src = SP_EDIT_PHOTO; prev.style.display = '';
    }; img.src = ev.target.result; };
    reader.readAsDataURL(file);
  });
}
function spCloseModal() { document.getElementById('sp-modal')?.classList.remove('open'); }

// عرض تفاصيل شهادة النموذج مباشرة من جدول "طلبات التفوق الرياضي" — بالضغط على الرقم المرجعي نفسه
async function spViewCertByRef(refCode) {
  const rows = await api('/api/sports_certificate');
  if (!Array.isArray(rows)) { alert('تعذّر تحميل بيانات الشهادة'); return; }
  const r = rows.find(x => (x.ref_code || '').toUpperCase() === (refCode || '').toUpperCase());
  if (!r) { alert('تعذّر إيجاد شهادة بهذا الرقم المرجعي — ربما حُذفت'); return; }
  SP_CERT_DETAIL_CACHE = r; // تخزين مؤقت آمن يستخدمه زر "طباعة الشهادة" أدناه، بدل تضمين JSON مباشرة داخل onclick

  const skipKeys = ['id','_id','__v','ref_code','player_name','game','model_number','model_label','used','used_in_application_ref','used_at','createdAt','updatedAt'];
  const extraRows = Object.keys(r).filter(k => !skipKeys.includes(k) && r[k]).map(k => `<div class="fr"><div class="fl">${spEsc(k)}</div><div class="fv">${spEsc(r[k])}</div></div>`).join('');
  document.getElementById('sp-modal-body').innerHTML = `
    <h3>تفاصيل الشهادة</h3>
    <div class="fr"><div class="fl">الرقم المرجعي</div><div class="fv" style="font-family:monospace">${spEsc(r.ref_code)}</div></div>
    <div class="fr"><div class="fl">رقم النموذج</div><div class="fv">نموذج (${r.model_number})</div></div>
    <div class="fr"><div class="fl">الوصف</div><div class="fv">${spEsc(r.model_label)}</div></div>
    <div class="fr"><div class="fl">اسم اللاعب/ـة</div><div class="fv">${spEsc(r.player_name)}</div></div>
    <div class="fr"><div class="fl">اللعبة</div><div class="fv">${spEsc(r.game)}</div></div>
    ${extraRows}
    <div class="fr"><div class="fl">الحالة</div><div class="fv">${r.used ? 'مُستخدَمة في طلب رقم ' + `<a href="#" onclick="spViewByRefCode('${spEsc(r.used_in_application_ref)}');return false" style="color:var(--g);font-weight:700;text-decoration:underline">${spEsc(r.used_in_application_ref)}</a>` : 'غير مُستخدَمة بعد'}</div></div>
    <div class="fr"><div class="fl">تاريخ التعبئة</div><div class="fv">${spDate(r.createdAt)}</div></div>
    <div style="display:flex;gap:8px;margin-top:16px">
      <button class="btn" style="flex:1;background:var(--g);color:#fff" onclick="spReprintCertObj()"><i class="ti ti-printer"></i> طباعة الشهادة</button>
      <button class="btn" style="flex:1" onclick="spCloseModal()">إغلاق</button>
    </div>`;
  document.getElementById('sp-modal').classList.add('open');
}

let SP_CERT_DETAIL_CACHE = null;
// إعادة طباعة شهادة (تُستخدَم من نافذة "تفاصيل الشهادة") — بفتح صفحة الشهادة بوضع "إعادة طباعة" بنفس التصميم الأصلي
function spReprintCertObj() {
  if (!SP_CERT_DETAIL_CACHE) return;
  localStorage.setItem('sp_reprint_cert', JSON.stringify(SP_CERT_DETAIL_CACHE));
  window.open('/sports-certificate.html?reprint=1', '_blank');
}

let SP_CERT_SEARCH_CACHE = null;

async function spOpenCertSearch() {
  const box = document.getElementById('sp-e-cert-search-box');
  if (!box) return;
  if (box.style.display === 'block') { box.style.display = 'none'; return; }
  box.style.display = 'block';
  box.innerHTML = 'جارٍ التحميل...';
  if (!SP_CERT_SEARCH_CACHE) {
    const rows = await api('/api/sports_certificate');
    if (!Array.isArray(rows)) { box.innerHTML = 'تعذّر تحميل الشهادات'; return; }
    SP_CERT_SEARCH_CACHE = rows;
  }
  box.innerHTML = `
    <input type="text" id="sp-e-cert-search-q" placeholder="اكتبي اسم اللاعب/ـة أو الرقم المرجعي للبحث..." oninput="spRenderCertSearchResults()">
    <div id="sp-e-cert-search-results" style="max-height:220px;overflow-y:auto;border:1px solid var(--border);border-radius:var(--r)"></div>`;
  spRenderCertSearchResults();
}

function spRenderCertSearchResults() {
  const q = (document.getElementById('sp-e-cert-search-q')?.value || '').trim().toLowerCase();
  const results = document.getElementById('sp-e-cert-search-results');
  if (!results) return;
  let rows = SP_CERT_SEARCH_CACHE || [];
  if (q) rows = rows.filter(r => (r.player_name||'').toLowerCase().includes(q) || (r.ref_code||'').toLowerCase().includes(q));
  rows = rows.slice(0, 30);
  if (!rows.length) { results.innerHTML = `<div style="padding:10px;text-align:center;color:var(--muted);font-size:12px">لا توجد نتائج</div>`; return; }
  results.innerHTML = rows.map(r => `
    <div onclick="spPickCertRef('${spEsc(r.ref_code)}')" style="padding:8px 10px;border-bottom:1px solid var(--border);cursor:pointer;font-size:12.5px;display:flex;justify-content:space-between;align-items:center;gap:8px">
      <span>${spEsc(r.player_name)} — نموذج (${r.model_number}) — ${spEsc(r.game)}</span>
      <span style="font-family:monospace;white-space:nowrap;color:${r.used?'#c0392b':'var(--g)'}">${spEsc(r.ref_code)}${r.used?' (مُستخدَمة)':''}</span>
    </div>`).join('');
}

function spPickCertRef(refCode) {
  const field = document.getElementById('sp-e-cert-ref');
  if (field) field.value = refCode;
  document.getElementById('sp-e-cert-search-box').style.display = 'none';
}

function spUpdateNominationDesc() {
  const sel = document.getElementById('sp-e-nomination');
  const num = parseInt(sel.value) || null;
  const t = SP_NOMINATION_TYPES.find(x => x.num === num);
  document.getElementById('sp-e-nomination-desc').textContent = t ? t.label : '—';
  document.getElementById('sp-e-nomination-score').textContent = t ? (t.score != null ? t.score : 'تعتمد على المركز في الشهادة') : '—';
}

function spMsg(txt) {
  const el = document.getElementById('sp-e-msg'); if (!el) return;
  el.textContent = txt; el.className = 'msg err'; el.style.display = 'block';
}

async function spSaveEdit(id) {
  const gv = sel => document.getElementById(sel).value.trim();
  const full_name = gv('sp-e-name'), gender = gv('sp-e-gender'), seat_number = gv('sp-e-seat'), school = gv('sp-e-school'), governorate = gv('sp-e-gov'), district = gv('sp-e-dist');
  const game_types = Array.from(document.querySelectorAll('.sp-e-game:checked')).map(el => el.value);
  const cert_track = gv('sp-e-track'), cert_subfield = gv('sp-e-subfield');
  const equivalency_doc = gv('sp-e-equiv');
  const arab_branch = gv('sp-e-arabbranch');
  const cert_year = gv('sp-e-year'), gpa = gv('sp-e-gpa'), address = gv('sp-e-address');
  const phone = gv('sp-e-phone'), phone_alt = gv('sp-e-phone-alt');
  const major1 = gv('sp-e-major1'), major2 = gv('sp-e-major2'), major3 = gv('sp-e-major3');
  const nominationNum = parseInt(gv('sp-e-nomination')) || null;
  const nominationEntry = SP_NOMINATION_TYPES.find(x => x.num === nominationNum);
  const nomination_type = nominationEntry ? nominationEntry.label : '';
  const status = gv('sp-status-sel');

  if (!full_name || !school) return spMsg('يرجى إدخال اسم الطالب والمدرسة');
  if (!gender) return spMsg('يرجى اختيار الجنس');
  if (!seat_number) return spMsg('يرجى إدخال رقم الجلوس');
  if (!governorate || !district) return spMsg('يرجى اختيار المحافظة واللواء');
  if (!game_types.length) return spMsg('يرجى اختيار نوع لعبة واحدة على الأقل');
  if (!/^\d{4}$/.test(cert_year)) return spMsg('سنة الشهادة يجب أن تكون 4 أرقام');
  if (cert_track === 'international' && !equivalency_doc) return spMsg('يرجى تحديد حالة وثيقة معادلة الشهادة');
  if (cert_track === 'arabic' && !equivalency_doc) return spMsg('يرجى تحديد حالة وثيقة معادلة الشهادة');
  if (!gpa) return spMsg('يرجى إدخال المعدل');
  if (!/^07\d{8}$/.test(phone)) return spMsg('رقم الهاتف يجب أن يبدأ بـ 07 ويتكون من 10 خانات');
  if (phone_alt && !/^07\d{8}$/.test(phone_alt)) return spMsg('صيغة رقم الهاتف البديل غير صحيحة');
  if (!major1 || !major2 || !major3) return spMsg('يرجى اختيار التخصصات الثلاثة');
  if (new Set([major1, major2, major3]).size < 3) return spMsg('لا يمكن تكرار نفس التخصص في أكثر من خيار');
  if (!nomination_type) return spMsg('يرجى اختيار نوع نموذج التفوق الرياضي');

  const cert_ref_code = gv('sp-e-cert-ref').toUpperCase();
  const payload = {
    full_name, gender, seat_number, school, governorate, district, game_types,
    cert_track, cert_subfield, cert_year, gpa, address, phone, phone_alt, equivalency_doc, arab_branch,
    majors: [major1, major2, major3], nomination_type, cert_ref_code, status
  };
  if (SP_EDIT_PHOTO) payload.photo = SP_EDIT_PHOTO;

  const r = await api('/api/sports_excellence/'+id, 'PUT', payload);
  if (r.error) return spMsg(r.error);
  spCloseModal();
  loadSports();
}

async function spDelete(id) {
  if (!confirm('حذف هذا الطلب نهائياً؟ لا يمكن التراجع عن هذا الإجراء.')) return;
  const r = await api('/api/sports_excellence/'+id, 'DELETE');
  if (r.error) { alert(r.error); return; }
  loadSports();
}

// ── قائمة مخصصة (تصفية حسب نوع اللعبة/الحالة/الفرع + اختيار الحقول المطلوبة) ──
function spOpenCustomList() {
  document.getElementById('sp-modal-body').innerHTML = `
    <h3>إنشاء قائمة مخصصة</h3>
    <div class="fg"><label>تصفية حسب نوع اللعبة (اتركه فارغاً لعرض جميع الطلبة)</label>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:2px 10px">
        ${SP_GAME_TYPES.map(t=>`<label style="display:flex;align-items:center;gap:6px;font-weight:400;font-size:12.5px;margin-bottom:6px"><input type="checkbox" class="sp-cl-game" value="${t}"> ${t}</label>`).join('')}
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:0 10px">
      <div class="fg"><label>فرع الشهادة (اختياري)</label><select id="sp-cl-track"><option value="">الكل</option>${Object.entries(SP_TRACKS).map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}</select></div>
      <div class="fg"><label>الحالة (اختياري)</label><select id="sp-cl-status"><option value="">الكل</option>${Object.entries(SP_STATUS).map(([k,v])=>`<option value="${k}">${v.label}</option>`).join('')}</select></div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:0 10px">
      <div class="fg"><label>الترتيب حسب العلامة النهائية</label><select id="sp-cl-sort"><option value="">بدون ترتيب (كما هو مُدخَل)</option><option value="desc">الأعلى علامة أولاً</option><option value="asc">الأدنى علامة أولاً</option></select></div>
      <div class="fg"><label>الاكتفاء بأعلى عدد (اختياري)</label><input type="number" id="sp-cl-top" min="1" placeholder="مثال: 10 — اتركه فارغاً لعرض الكل"></div>
    </div>
    <div style="font-weight:700;color:var(--g);font-size:12.5px;margin:10px 0 4px">الحقول المطلوب إدراجها في الجدول</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:2px 10px">
      ${SP_FIELDS.map(f=>`<label style="display:flex;align-items:center;gap:6px;font-weight:400;font-size:12.5px;margin-bottom:6px"><input type="checkbox" class="sp-cl-col" value="${f.key}"${SP_DEFAULT_COLS.includes(f.key)?' checked':''}> ${f.label}</label>`).join('')}
    </div>
    <button class="btn" style="width:100%;margin-top:10px;background:var(--g);color:#fff" onclick="spGenerateCustomList()"><i class="ti ti-table"></i> إنشاء القائمة</button>
    <div id="sp-cl-result" style="margin-top:14px"></div>
    <button class="btn" style="width:100%;margin-top:10px" onclick="spCloseModal()">إغلاق</button>`;
  document.getElementById('sp-modal').classList.add('open');
}

let SP_CUSTOM_FILTER_TITLE = '';

function spGenerateCustomList() {
  const acts = Array.from(document.querySelectorAll('.sp-cl-game:checked')).map(el => el.value);
  const track = document.getElementById('sp-cl-track').value;
  const status = document.getElementById('sp-cl-status').value;
  const sortDir = document.getElementById('sp-cl-sort').value;
  const topN = parseInt(document.getElementById('sp-cl-top').value) || 0;
  const colKeys = Array.from(document.querySelectorAll('.sp-cl-col:checked')).map(el => el.value);

  if (!colKeys.length) { alert('يرجى اختيار حقل واحد على الأقل'); return; }

  let rows = SP_ROWS.filter(r => {
    if (acts.length && !acts.some(a => (r.game_types||[]).includes(a))) return false;
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

  const cols = SP_FIELDS.filter(f => colKeys.includes(f.key));
  SP_CUSTOM_ROWS = rows; SP_CUSTOM_COLS = cols;
  SP_CUSTOM_FILTER_TITLE = acts.join('، ');

  const box = document.getElementById('sp-cl-result');
  if (!rows.length) { box.innerHTML = `<div class="center">لا توجد نتائج مطابقة لهذه التصفية</div>`; return; }
  box.innerHTML = `
    <div style="font-size:11.5px;color:var(--muted);margin-bottom:6px">${rows.length} طالب مطابق</div>
    <div class="tw" style="max-height:260px"><table>
      <thead><tr><th>#</th>${cols.map(c=>`<th>${c.label}</th>`).join('')}</tr></thead>
      <tbody>${rows.map((r,i)=>`<tr><td>${i+1}</td>${cols.map(c=>`<td>${spEsc(spFieldValue(r,c.key))}</td>`).join('')}</tr>`).join('')}</tbody>
    </table></div>
    <div style="display:flex;gap:8px;margin-top:10px">
      <button class="btn" style="flex:1" onclick="spPrintCustomList()"><i class="ti ti-printer"></i> طباعة هذه القائمة</button>
      <button class="btn" style="flex:1" onclick="spExportCustomListExcel()"><i class="ti ti-file-spreadsheet"></i> تصدير Excel</button>
    </div>`;
}

function spPrintCustomList() {
  if (!SP_CUSTOM_ROWS) return;
  const html = `
    ${SP_TABLE_ALIGN_STYLE}
    <style>.sp-cl-title{text-align:center;font-size:15pt;font-weight:800;color:#1B6B3A;margin:2px 0 12px;padding-bottom:7px;border-bottom:2px solid #1B6B3A}</style>
    <div class="ph2">
      <img src="/logo.png" class="plogo" alt="شعار الجامعة الأردنية">
      <div class="puni"><div class="ar">الجامعة الأردنية</div><div class="en">The University of Jordan</div><div class="dep">عمادة شؤون الطلبة — Dean of Student Affairs</div></div>
      <div class="pmeta">${spDate(new Date())}</div>
    </div>
    <div class="ptitle">قائمة الطلبة المتقدمين — التفوق الرياضي</div>
    ${SP_CUSTOM_FILTER_TITLE ? `<div class="sp-cl-title">نوع اللعبة: ${spEsc(SP_CUSTOM_FILTER_TITLE)}</div>` : ''}
    <table class="ptbl"><thead><tr><th>#</th>${SP_CUSTOM_COLS.map(c=>`<th>${c.label}</th>`).join('')}</tr></thead><tbody>
      ${SP_CUSTOM_ROWS.map((r,i)=>`<tr><td style="text-align:center">${i+1}</td>${SP_CUSTOM_COLS.map(c=>`<td${c.key==='full_name'?' style="text-align:right"':' style="text-align:center"'}>${spEsc(spFieldValue(r,c.key))}</td>`).join('')}</tr>`).join('')}
    </tbody></table>
    ${spSignatureBlockHTML()}`;
  openPrint(html);
}

function spExportCustomListExcel() {
  if (!SP_CUSTOM_ROWS || !SP_CUSTOM_ROWS.length) return;
  const sheetRows = SP_CUSTOM_ROWS.map((r,i) => {
    const o = { '#': i+1 };
    SP_CUSTOM_COLS.forEach(c => { o[c.label] = spFieldValue(r, c.key); });
    return o;
  });
  const ws = XLSX.utils.json_to_sheet(sheetRows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'قائمة مخصصة');
  XLSX.writeFile(wb, `قائمة_مخصصة_التفوق_الفني_${new Date().toISOString().slice(0,10)}.xlsx`);
}

// ── طباعة (فردية وجماعية) ──
// ستايل خاص بطباعة هذا البند فقط (لا يمسّ PRINT_STYLES العام المُستخدم في باقي شاشات النظام)
const SP_PRINT_EXTRA_STYLE = `<style>
  body{font-size:12pt}
  .fl{font-size:10.5pt;min-width:150px}
  .fv{font-size:11pt}
  .ptitle{font-size:16pt}
  .psub{font-size:11pt}
  .ptbl{font-size:10.5pt}
  .ptbl th{font-size:10.5pt}
  .dbox{font-size:10.5pt}
  .sp-activity-title{text-align:center;font-size:16pt;font-weight:800;color:#1B6B3A;margin:2px 0 12px;padding-bottom:7px;border-bottom:2px solid #1B6B3A}
</style>`;

function spPrintRecordHTML(r) {
  const activityTitle = (r.game_types||[]).join(' — ');
  const majorsRows = [0,1,2].map(i => {
    const label = ['الأول','الثاني','الثالث'][i];
    return `<tr><td>${label}</td><td>${spEsc((r.majors||[])[i])}</td></tr>`;
  }).join('');
  return `
    ${SP_PRINT_EXTRA_STYLE}
    <div class="ph2">
      <img src="/logo.png" class="plogo" alt="شعار الجامعة الأردنية">
      <div class="puni"><div class="ar">الجامعة الأردنية</div><div class="en">The University of Jordan</div><div class="dep">عمادة شؤون الطلبة — Dean of Student Affairs</div></div>
      <div class="pmeta">الرقم المرجعي: ${spEsc(r.ref_code)}<br>${spDate(r.createdAt)}</div>
    </div>
    <div class="ptitle">طلب الالتحاق للدراسة على أساس التفوق الرياضي</div>
    <div class="sp-activity-title">${spEsc(activityTitle)}</div>
    ${r.photo ? `<div style="text-align:left;margin-bottom:6px"><img src="${r.photo}" style="width:90px;height:90px;object-fit:contain;background:#F1F3F0;border-radius:6px;border:1px solid #ccc"></div>` : ''}
    <div class="fg2">
      <div class="fr"><div class="fl">اسم الطالب</div><div class="fv">${spEsc(r.full_name)}</div></div>
      <div class="fr"><div class="fl">الجنس</div><div class="fv">${spEsc(r.gender)}</div></div>
      <div class="fr"><div class="fl">رقم الجلوس</div><div class="fv">${spEsc(r.seat_number)}</div></div>
      <div class="fr"><div class="fl">المدرسة</div><div class="fv">${spEsc(r.school)}</div></div>
      <div class="fr"><div class="fl">المحافظة</div><div class="fv">${spEsc(r.governorate)}</div></div>
      <div class="fr"><div class="fl">اللواء</div><div class="fv">${spEsc(r.district)}</div></div>
    </div>
    <div class="fg2">
      <div class="fr"><div class="fl">فرع الشهادة</div><div class="fv">${spEsc(SP_TRACKS[r.cert_track]||r.cert_track)}${r.cert_subfield?' — '+spEsc(r.cert_subfield):''}${r.arab_branch?' — الفرع الدراسي: '+spEsc(r.arab_branch):''}${r.equivalency_doc?' — وثيقة المعادلة: '+spEsc(r.equivalency_doc):''}</div></div>
      <div class="fr"><div class="fl">سنة الشهادة</div><div class="fv">${spEsc(r.cert_year)}</div></div>
      <div class="fr"><div class="fl">المعدل</div><div class="fv">${spEsc(r.gpa)}%</div></div>
      <div class="fr"><div class="fl">الهاتف</div><div class="fv">${spEsc(r.phone)}</div></div>
    </div>
    ${r.phone_alt ? `<div class="fr"><div class="fl">هاتف بديل</div><div class="fv">${spEsc(r.phone_alt)}</div></div>` : ''}
    <div class="fr"><div class="fl">العنوان</div><div class="fv">${spEsc(r.address)}</div></div>
    <div class="psub">التخصصات المرغوبة (حسب الأولوية)</div>
    <table class="ptbl"><thead><tr><th>الأولوية</th><th>التخصص</th></tr></thead><tbody>
      ${majorsRows}
    </tbody></table>
    <div class="fr"><div class="fl">نوع نموذج التفوق الرياضي</div><div class="fv">${spEsc(r.nomination_type)}</div></div>
    <div class="fr"><div class="fl">الرقم المرجعي لشهادة النموذج</div><div class="fv">${spEsc(r.cert_ref_code) || '—'}</div></div>
    <div style="font-size:10.5pt;color:#555;margin-top:4px">ملاحظة: يُستلَم النموذج الورقي الأصلي المطابق لهذا التصنيف بشكل منفصل.</div>
    <div class="dbox">أتعهد بأن كافة البيانات الواردة في هذا الطلب صحيحة ودقيقة، وأتحمل وحدي المسؤولية الكاملة عن أي أخطاء أو معلومات غير صحيحة قد ترد فيه.</div>
    <div style="margin-top:36px;font-size:11pt">توقيع مقدم الطلب</div>`;
}

function spPrintOne(id) {
  const r = SP_ROWS.find(x => x.id === id); if (!r) return;
  openPrint(spPrintRecordHTML(r));
}

function printSelectedSports() {
  const ids = Array.from(document.querySelectorAll('#tbl-sports-body input[type=checkbox]:checked')).map(cb => cb.value);
  if (!ids.length) { alert('يرجى تحديد طلب واحد على الأقل للطباعة'); return; }
  const html = ids.map((id,i) => {
    const r = SP_ROWS.find(x => x.id === id); if (!r) return '';
    return `${i>0 ? '<div style="page-break-before:always"></div>' : ''}${spPrintRecordHTML(r)}`;
  }).join('');
  openPrint(html);
}

async function spSaveHigherCommittee() {
  const members = [0,1,2,3,4]
    .map(i => ({ name: document.getElementById('sp-hc-m-'+i).value.trim(), title: document.getElementById('sp-hc-t-'+i).value.trim() }))
    .filter(m => m.name);
  SP_SETTINGS.higher_committee = members;
  const r = await api('/api/sports_excellence/settings', 'PUT', SP_SETTINGS);
  if (r.error) { alert(r.error); return; }
  alert('✅ تم حفظ أسماء اللجنة العليا');
}

// نافذة اختيار الحقول قبل طباعة كشف الناجحين (بنفس أسلوب "قائمة مخصصة")
const SP_PASSED_LIST_DEFAULT_COLS = ['gender','seat_number','game_types','school','final_score'];
function spOpenPassedListPrintFields() {
  const members = (SP_SETTINGS.higher_committee || []);
  if (!members.length) { alert('يرجى إدخال أسماء اللجنة العليا أولاً'); return; }
  const passedCount = SP_ROWS.filter(r => r.status === 'passed').length;
  if (!passedCount) { alert('لا يوجد أي طالب مُحدَّد كـ"مقبول" حتى الآن'); return; }
  document.getElementById('sp-modal-body').innerHTML = `
    <h3>الحقول المطلوب إدراجها في كشف الناجحين</h3>
    <div style="font-size:11.5px;color:var(--muted);margin-bottom:10px">عمود "اسم الطالب" يظهر دائماً. اختاري أي حقول إضافية تريدين عرضها بجانبه في الكشف المطبوع (${passedCount} طالب/طالبة).</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:2px 10px">
      ${SP_FIELDS.filter(f=>f.key!=='full_name').map(f=>`<label style="display:flex;align-items:center;gap:6px;font-weight:400;font-size:12.5px;margin-bottom:6px"><input type="checkbox" class="sp-pl-col" value="${f.key}"${SP_PASSED_LIST_DEFAULT_COLS.includes(f.key)?' checked':''}> ${f.label}</label>`).join('')}
    </div>
    <div style="display:flex;gap:8px;margin-top:12px">
      <button class="btn" style="flex:1;background:var(--g);color:#fff" onclick="spPrintPassedList()"><i class="ti ti-printer"></i> طباعة الكشف</button>
      <button class="btn" onclick="spCloseModal()">إغلاق</button>
    </div>`;
  document.getElementById('sp-modal').classList.add('open');
}

// كشف مختصر بأسماء الطلبة الذين وُضعت عليهم إشارة "مقبول" (اختيار اللجنة العليا النهائي) — صفحة واحدة، موقّعة من اللجنة العليا
function spPrintPassedList() {
  const members = (SP_SETTINGS.higher_committee || []);
  if (!members.length) { alert('يرجى إدخال أسماء اللجنة العليا أولاً'); return; }
  const passed = SP_ROWS.filter(r => r.status === 'passed')
    .sort((a,b) => (a.game_types?.[0]||'').localeCompare(b.game_types?.[0]||'', 'ar') || (b.final_score||0)-(a.final_score||0));
  if (!passed.length) { alert('لا يوجد أي طالب مُحدَّد كـ"مقبول" حتى الآن'); return; }
  const extraKeys = Array.from(document.querySelectorAll('.sp-pl-col:checked')).map(el => el.value);
  const extraCols = SP_FIELDS.filter(f => extraKeys.includes(f.key));
  const html = `
    ${SC_PRINT_FONT}${SP_TABLE_ALIGN_STYLE}
    <div class="ph2">
      <img src="/logo.png" class="plogo" alt="شعار الجامعة الأردنية">
      <div class="puni"><div class="ar">الجامعة الأردنية</div><div class="en">The University of Jordan</div><div class="dep">عمادة شؤون الطلبة — Dean of Student Affairs</div></div>
      <div class="pmeta">${spDate(new Date())}</div>
    </div>
    <div class="ptitle">كشف أسماء الطلبة الناجحين — التفوق الرياضي</div>
    <div style="text-align:center;font-size:11pt;margin-bottom:10px">العدد الإجمالي: ${passed.length} طالب/طالبة</div>
    <table class="ptbl"><thead><tr>
      <th>#</th><th>اسم الطالب</th>
      ${extraCols.map(c=>`<th>${c.label}</th>`).join('')}
    </tr></thead><tbody>
      ${passed.map((r,i)=>`<tr><td style="text-align:center">${i+1}</td><td style="text-align:right">${spEsc(r.full_name)}</td>${extraCols.map(c=>`<td style="text-align:center">${spEsc(spFieldValue(r,c.key))}</td>`).join('')}</tr>`).join('')}
    </tbody></table>
    <div style="margin-top:50px;display:grid;grid-template-columns:repeat(${members.length},1fr);gap:14px;text-align:center;font-size:10.5pt;page-break-inside:avoid">
      ${members.map(m => `<div><div style="border-top:1px solid #333;padding-top:6px">${spEsc(m.title)||'&nbsp;'}</div><div style="margin-top:60px;font-weight:700">${spEsc(m.name)}</div></div>`).join('')}
    </div>`;
  openPrint(html);
  spCloseModal();
}

// ── تصدير Excel ──
function spExportExcel() {
  if (!SP_ROWS.length) { alert('لا توجد بيانات للتصدير'); return; }
  const sheetRows = SP_ROWS.map((r,i) => ({
    '#': i+1, 'الرقم المرجعي': r.ref_code||'', 'اسم الطالب': r.full_name||'', 'الجنس': r.gender||'', 'رقم الجلوس': r.seat_number||'', 'المدرسة': r.school||'',
    'المحافظة': r.governorate||'', 'اللواء': r.district||'',
    'نوع اللعبة': (r.game_types||[]).join('، '),
    'فرع الشهادة': SP_TRACKS[r.cert_track]||r.cert_track||'', 'الحقل': r.cert_subfield||'',
    'سنة الشهادة': r.cert_year||'', 'المعدل': r.gpa||'', 'العنوان': r.address||'',
    'الهاتف': r.phone||'', 'هاتف بديل': r.phone_alt||'',
    'التخصص الأول': (r.majors||[])[0]||'', 'التخصص الثاني': (r.majors||[])[1]||'', 'التخصص الثالث': (r.majors||[])[2]||'',
    'نوع نموذج التفوق الرياضي': r.nomination_type||'',
    'الحالة': SP_STATUS[r.status]?.label || SP_STATUS.pending.label,
    'تاريخ التقديم': spDate(r.createdAt),
  }));
  const ws = XLSX.utils.json_to_sheet(sheetRows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'التفوق الرياضي');
  XLSX.writeFile(wb, `طلبات_التفوق_الرياضي_${new Date().toISOString().slice(0,10)}.xlsx`);
}

// ══════════════════════════════════════════════════════════════
// شاشة "علامات لجنة التحكيم" (الاختبار) — لكل لعبة لجنة مستقلة (3 إلى 5 أعضاء)
// آلية الاحتساب: كل عضو يمنح علامة كاملة من (60)، وعلامة اللجنة النهائية = متوسط علامات الأعضاء المُدخَلة (يبقى الناتج من 60 دائماً) —
// علامة الثانوية = المعدل × 0.2 (من 20)، علامة نوع النموذج ثابتة (من 20) حسب الفئة المختارة عند التقديم
// العلامة النهائية = علامة اللجنة (60) + علامة الثانوية (20) + علامة نوع النموذج (20) = من 100
// ══════════════════════════════════════════════════════════════

let SC_CURRENT_GAME = '';

// ══════════════════════════════════════════════════════════════
// شاشة "نماذج الطلبات" — عرض كل شهادات نماذج التفوق الرياضي المُعبَّأة عبر الرابط العام،
// حالتها (مستخدَمة/غير مستخدَمة)، وربطها بالطلب الذي استُخدمت فيه إن وُجد
// ══════════════════════════════════════════════════════════════
let SP_CERT_ROWS = [];

async function loadSportsCertificates() {
  const panel = document.getElementById('panel-sports_certificate');
  if (!panel) return;
  panel.innerHTML = `<div class="ph"><div><div class="pt">نماذج الطلبات</div><div class="ps">شهادات نماذج التفوق الرياضي المُعبَّأة عبر الرابط العام</div></div></div>
    <div class="card"><div class="center" style="padding:24px">جارٍ التحميل...</div></div>`;

  const rows = await api('/api/sports_certificate');
  if (!Array.isArray(rows)) { panel.innerHTML = `<div class="card"><div class="center">تعذّر تحميل البيانات</div></div>`; return; }
  SP_CERT_ROWS = rows;

  panel.innerHTML = `
  <div class="ph"><div><div class="pt">نماذج الطلبات</div><div class="ps">شهادات نماذج التفوق الرياضي المُعبَّأة عبر الرابط العام — ${rows.length} شهادة</div></div></div>

  <div class="card">
    <div class="fb">
      <input type="text" id="spc-q" placeholder="بحث بالاسم أو الرقم المرجعي..." style="flex:1;min-width:180px" oninput="spcRender()">
      <select id="spc-f-status" onchange="spcRender()"><option value="">كل الحالات</option><option value="used">مُستخدَمة</option><option value="unused">غير مُستخدَمة</option></select>
      <select id="spc-f-model" onchange="spcRender()"><option value="">كل النماذج</option>${[1,2,3,4,5,6,7,8].map(n=>`<option value="${n}">نموذج رقم (${n})</option>`).join('')}</select>
    </div>
  </div>

  ${ME?.role==='admin' ? `
  <div class="card">
    <div class="fb" style="align-items:center">
      <button class="btn btn-sm" onclick="spcToggleAll(true)"><i class="ti ti-checkbox"></i> تحديد كل النتائج الظاهرة</button>
      <button class="btn btn-sm" onclick="spcToggleAll(false)">إلغاء التحديد</button>
      <div style="flex:1"></div>
      <span id="spc-sel-count" style="font-size:12px;color:var(--muted)">لم يُحدَّد شيء</span>
      <button class="btn btn-sm" style="background:#8A1F1F;color:#fff;border-color:#8A1F1F" onclick="spcDeleteSelected()"><i class="ti ti-trash"></i> حذف المحدَّد</button>
    </div>
    <p style="font-size:11px;color:var(--muted);margin:6px 0 0">نصيحة: استخدمي فلتر "الحالة" أعلاه (مُستخدَمة / غير مُستخدَمة) أولاً، ثم "تحديد كل النتائج الظاهرة" — يتم تحديد المطابق للفلتر الحالي فقط، وليس كل الشهادات.</p>
  </div>` : ''}

  <div class="card">
    <div class="tw"><table>
      <thead><tr>
        ${ME?.role==='admin' ? `<th style="width:36px"><input type="checkbox" id="spc-check-all" onchange="spcToggleAll(this.checked)"></th>` : ''}
        <th>#</th><th>الرقم المرجعي</th><th>رقم النموذج</th><th>اسم اللاعب/ـة</th><th>اللعبة</th><th>الحالة</th><th>الطلب المرتبط</th><th>تاريخ التعبئة</th><th>إجراءات</th>
      </tr></thead>
      <tbody id="spc-tbody"></tbody>
    </table></div>
  </div>

  <div class="modal-ov" id="spc-modal" onclick="if(event.target===this) spcCloseModal()"><div class="modal" style="max-width:520px;max-height:88vh;overflow-y:auto" id="spc-modal-body"></div></div>`;

  if (!window.__spcEscBound) {
    window.__spcEscBound = true;
    document.addEventListener('keydown', e => { if (e.key === 'Escape') spcCloseModal(); });
  }
  spcRender();
}
function spcCloseModal() { document.getElementById('spc-modal')?.classList.remove('open'); }

function spcRender() {
  const q = (document.getElementById('spc-q')?.value || '').trim().toLowerCase();
  const statusF = document.getElementById('spc-f-status')?.value || '';
  const modelF = document.getElementById('spc-f-model')?.value || '';
  let rows = SP_CERT_ROWS.filter(r => {
    if (statusF === 'used' && !r.used) return false;
    if (statusF === 'unused' && r.used) return false;
    if (modelF && String(r.model_number) !== modelF) return false;
    if (q && !((r.player_name||'').toLowerCase().includes(q) || (r.ref_code||'').toLowerCase().includes(q))) return false;
    return true;
  });
  const tb = document.getElementById('spc-tbody');
  if (!rows.length) { tb.innerHTML = `<tr><td colspan="10" class="center">لا توجد نتائج مطابقة</td></tr>`; spcUpdateSelCount(); return; }
  tb.innerHTML = rows.map((r,i) => `
    <tr>
      ${ME?.role==='admin' ? `<td style="text-align:center"><input type="checkbox" class="spc-row-chk" value="${r.id}" onchange="spcUpdateSelCount()"></td>` : ''}
      <td>${i+1}</td>
      <td style="font-family:monospace">${spEsc(r.ref_code)}</td>
      <td>نموذج (${r.model_number})</td>
      <td>${spEsc(r.player_name)}</td>
      <td>${spEsc(r.game)}</td>
      <td>${r.used ? '<span style="color:#c0392b;font-weight:700">مُستخدَمة</span>' : '<span style="color:var(--g);font-weight:700">غير مُستخدَمة</span>'}</td>
      <td>${r.used_in_application_ref ? `<a href="#" onclick="spViewByRefCode('${spEsc(r.used_in_application_ref)}');return false" style="font-family:monospace;color:var(--g);font-weight:700;text-decoration:underline">${spEsc(r.used_in_application_ref)}</a>` : '—'}</td>
      <td>${spDate(r.createdAt)}</td>
      <td>
        <button class="btn btn-sm" onclick="spcView('${r.id}')" title="عرض التفاصيل"><i class="ti ti-eye"></i></button>
        <button class="btn btn-sm" onclick="spcReprint('${r.id}')" title="إعادة طباعة الشهادة"><i class="ti ti-printer"></i></button>
        ${r.used ? `<button class="btn btn-sm" style="color:#a15c00" onclick="spcRelease('${r.id}')" title="إعادة تحرير (لإتاحة استخدامها في طلب جديد)"><i class="ti ti-lock-open"></i></button>` : ''}
        ${ME?.role==='admin' ? `<button class="btn btn-sm" style="color:#c0392b" onclick="spcDelete('${r.id}')" title="حذف"><i class="ti ti-trash"></i></button>` : ''}
      </td>
    </tr>`).join('');
  spcUpdateSelCount();
}

function spcToggleAll(state) {
  document.querySelectorAll('.spc-row-chk').forEach(cb => cb.checked = state);
  const all = document.getElementById('spc-check-all'); if (all) all.checked = state;
  spcUpdateSelCount();
}

function spcUpdateSelCount() {
  const n = document.querySelectorAll('.spc-row-chk:checked').length;
  const el = document.getElementById('spc-sel-count');
  if (el) el.textContent = n ? `${n} شهادة محدَّدة` : 'لم يُحدَّد شيء';
}

async function spcDeleteSelected() {
  const ids = Array.from(document.querySelectorAll('.spc-row-chk:checked')).map(cb => cb.value);
  if (!ids.length) { alert('يرجى تحديد شهادة واحدة على الأقل'); return; }
  if (!confirm(`هل تريدين حذف ${ids.length} شهادة محدَّدة نهائياً؟ لا يمكن التراجع عن هذا الإجراء.`)) return;
  const results = await Promise.all(ids.map(id => api('/api/sports_certificate/'+id, 'DELETE')));
  const failed = results.filter(r => r && r.error).length;
  if (failed) alert(`تم الحذف مع فشل ${failed} عملية من أصل ${ids.length}`);
  loadSportsCertificates();
}

function spcView(id) {
  const r = SP_CERT_ROWS.find(x => x.id === id); if (!r) return;
  const skipKeys = ['id','_id','__v','ref_code','player_name','game','model_number','model_label','used','used_in_application_ref','used_at','createdAt','updatedAt'];
  const extraRows = Object.keys(r).filter(k => !skipKeys.includes(k) && r[k]).map(k => `<div class="fr"><div class="fl">${spEsc(k)}</div><div class="fv">${spEsc(r[k])}</div></div>`).join('');
  document.getElementById('spc-modal-body').innerHTML = `
    <h3>تفاصيل الشهادة</h3>
    <div class="fr"><div class="fl">الرقم المرجعي</div><div class="fv" style="font-family:monospace">${spEsc(r.ref_code)}</div></div>
    <div class="fr"><div class="fl">رقم النموذج</div><div class="fv">نموذج (${r.model_number})</div></div>
    <div class="fr"><div class="fl">الوصف</div><div class="fv">${spEsc(r.model_label)}</div></div>
    <div class="fr"><div class="fl">اسم اللاعب/ـة</div><div class="fv">${spEsc(r.player_name)}</div></div>
    <div class="fr"><div class="fl">اللعبة</div><div class="fv">${spEsc(r.game)}</div></div>
    ${extraRows}
    <div class="fr"><div class="fl">الحالة</div><div class="fv">${r.used ? 'مُستخدَمة في طلب رقم ' + `<a href="#" onclick="spViewByRefCode('${spEsc(r.used_in_application_ref)}');return false" style="color:var(--g);font-weight:700;text-decoration:underline">${spEsc(r.used_in_application_ref)}</a>` : 'غير مُستخدَمة بعد'}</div></div>
    <div class="fr"><div class="fl">تاريخ التعبئة</div><div class="fv">${spDate(r.createdAt)}</div></div>
    <div style="display:flex;gap:8px;margin-top:16px">
      <button class="btn" style="flex:1" onclick="spcCloseModal()">إغلاق</button>
    </div>`;
  document.getElementById('spc-modal').classList.add('open');
}

function spcReprint(id) {
  const r = SP_CERT_ROWS.find(x => x.id === id); if (!r) return;
  localStorage.setItem('sp_reprint_cert', JSON.stringify(r));
  window.open('/sports-certificate.html?reprint=1', '_blank');
}

async function spcRelease(id) {
  if (!confirm('هل تريدين إعادة تحرير هذه الشهادة لتصبح "غير مُستخدَمة" وقابلة للربط بطلب جديد؟')) return;
  const r = await api('/api/sports_certificate/'+id+'/release', 'PUT');
  if (r.error) { alert(r.error); return; }
  loadSportsCertificates();
}

async function spcDelete(id) {
  if (!confirm('هل تريدين حذف هذه الشهادة نهائياً؟')) return;
  const r = await api('/api/sports_certificate/'+id, 'DELETE');
  if (r.error) { alert(r.error); return; }
  loadSportsCertificates();
}

// ══════════════════════════════════════════════════════════════
// شاشة "اختبار فحص القدرات" — عرض الطلبة بحالة "مقبول للاختبار" فقط (لم يخضعوا بعد لاختبار القدرات)،
// طباعة كشف ورقي لإجراء الاختبار، ثم ترحيل النتيجة (اجتاز/لم يجتز) — من يجتاز يظهر تلقائياً لاحقاً في شاشة لجنة التحكيم
// ══════════════════════════════════════════════════════════════
let SP_ABILITY_CANDIDATES = [];

async function loadSportsAbilityTest() {
  const panel = document.getElementById('panel-sports_ability_test');
  if (!panel) return;
  panel.innerHTML = `<div class="ph"><div><div class="pt">اختبار فحص القدرات</div><div class="ps">الطلبة "مقبول للاختبار" الذين يخضعون لاختبار القدرات قبل الانتقال للاختبار العملي (لجنة التحكيم)</div></div></div>
    <div class="card"><div class="center" style="padding:24px">جارٍ التحميل...</div></div>`;

  const rows = await api('/api/sports_excellence');
  if (!Array.isArray(rows)) { panel.innerHTML = `<div class="card"><div class="center">تعذّر تحميل البيانات</div></div>`; return; }
  SP_ROWS = rows; // تحديث الكاش العام أيضاً، تستفيد منه شاشات أخرى (لجنة التحكيم) دون إعادة تحميل منفصلة
  SP_ABILITY_CANDIDATES = rows.filter(r => r.status === 'accepted_exam');

  panel.innerHTML = `
  <div class="ph"><div><div class="pt">اختبار فحص القدرات</div><div class="ps">الطلبة "مقبول للاختبار" الذين يخضعون لاختبار القدرات قبل الانتقال للاختبار العملي — ${SP_ABILITY_CANDIDATES.length} طالب/ة</div></div></div>

  <div class="card">
    <div class="fb" style="align-items:center">
      <select id="sat-f-game" onchange="satRender()"><option value="">كل الألعاب</option>${SP_GAME_TYPES.map(g=>`<option value="${g}">${g}</option>`).join('')}</select>
      <input type="text" id="sat-q" placeholder="بحث بالاسم أو رقم الجلوس..." style="flex:1;min-width:180px" oninput="satRender()">
      <button class="btn btn-sm" style="background:var(--g);color:#fff" onclick="satPrintRoster()"><i class="ti ti-printer"></i> طباعة كشف أسماء المرشَّحين (للاختبار الورقي)</button>
    </div>
    <p style="font-size:11px;color:var(--muted);margin:6px 0 0">اطبعي هذا الكشف واستخدميه يوم إجراء اختبار القدرات، ثم عودي هنا بعد الاختبار لتسجيل النتيجة لكل طالب (اجتاز/لم يجتاز).</p>
  </div>

  <div class="card">
    <div class="tw"><table>
      <thead><tr><th>#</th><th>الاسم</th><th>الجنس</th><th>رقم الجلوس</th><th>المدرسة</th><th>نوع اللعبة</th><th>نتيجة اختبار القدرات</th></tr></thead>
      <tbody id="sat-tbody"></tbody>
    </table></div>
  </div>`;
  satRender();
}

function satRender() {
  const q = (document.getElementById('sat-q')?.value || '').trim().toLowerCase();
  const fGame = document.getElementById('sat-f-game')?.value || '';
  let rows = (SP_ABILITY_CANDIDATES || []).filter(r => {
    if (fGame && !(r.game_types||[]).includes(fGame)) return false;
    if (q) {
      const hay = [r.full_name, r.seat_number].join(' ').toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
  const tb = document.getElementById('sat-tbody');
  if (!tb) return;
  if (!rows.length) { tb.innerHTML = `<tr><td colspan="7" class="center">لا يوجد طلبة "مقبول للاختبار" مطابقون حالياً</td></tr>`; return; }
  tb.innerHTML = rows.map((r,i) => `
    <tr>
      <td>${i+1}</td>
      <td>${spEsc(r.full_name)}</td>
      <td>${spEsc(r.gender)}</td>
      <td>${spEsc(r.seat_number)}</td>
      <td>${spEsc(r.school)}</td>
      <td>${(r.game_types||[]).map(spEsc).join('، ')}</td>
      <td style="white-space:nowrap">
        <button class="btn btn-sm" style="background:#1B6B3A;color:#fff" onclick="satSetResult('${r.id}','ability_test_passed')">✅ اجتاز</button>
        <button class="btn btn-sm" style="background:#8A1F1F;color:#fff" onclick="satSetResult('${r.id}','rejected')">❌ لم يجتز</button>
      </td>
    </tr>`).join('');
}

async function satSetResult(id, newStatus) {
  const label = newStatus === 'ability_test_passed' ? 'تسجيل "اجتاز اختبار القدرات"' : 'تسجيل "لم يجتز" (مرفوض)';
  if (!confirm(`${label} لهذا الطالب؟`)) return;
  const r = await api('/api/sports_excellence/'+id, 'PUT', { status: newStatus });
  if (r.error) { alert(r.error); return; }
  loadSportsAbilityTest();
}

function satPrintRoster() {
  const q = (document.getElementById('sat-q')?.value || '').trim().toLowerCase();
  const fGame = document.getElementById('sat-f-game')?.value || '';
  const rows = (SP_ABILITY_CANDIDATES || []).filter(r => {
    if (fGame && !(r.game_types||[]).includes(fGame)) return false;
    if (q) {
      const hay = [r.full_name, r.seat_number].join(' ').toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
  if (!rows.length) { alert('لا يوجد طلبة لطباعتهم وفق الفلتر الحالي'); return; }
  const html = `
    <div class="ph2">
      <img src="/logo.png" class="plogo" alt="شعار الجامعة الأردنية">
      <div class="puni"><div class="ar">الجامعة الأردنية</div><div class="en">The University of Jordan</div><div class="dep">عمادة شؤون الطلبة — Dean of Student Affairs</div></div>
      <div class="pmeta">${spDate(new Date())}</div>
    </div>
    <div class="ptitle">كشف أسماء المرشَّحين لاختبار القدرات${fGame ? ' — ' + spEsc(fGame) : ''}</div>
    <table class="ptbl"><thead><tr>
      <th style="width:4%">#</th>
      <th style="width:22%">الاسم</th>
      <th style="width:9.5%"></th><th style="width:9.5%"></th><th style="width:9.5%"></th><th style="width:9.5%"></th><th style="width:9.5%"></th><th style="width:9.5%"></th>
      <th style="width:17%">ملاحظات</th>
    </tr></thead><tbody>
      ${rows.map((r,i)=>`<tr><td>${i+1}</td><td>${spEsc(r.full_name)}</td><td style="height:26px"></td><td style="height:26px"></td><td style="height:26px"></td><td style="height:26px"></td><td style="height:26px"></td><td style="height:26px"></td><td style="height:26px"></td></tr>`).join('')}
    </tbody></table>`;
  openPrint(html);
}

async function loadSportsCommittee() {
  const panel = document.getElementById('panel-sports_committee');
  if (!panel) return;
  if (ME?.role !== 'admin') { panel.innerHTML = `<div class="card"><div class="center" style="padding:24px;color:#c0392b">ليست لديك صلاحية الوصول لهذه الشاشة</div></div>`; return; }
  panel.innerHTML = `<div class="ph"><div><div class="pt">علامات لجنة التحكيم</div><div class="ps">لكل لعبة لجنة تحكيم مستقلة بأعضائها الخاصين</div></div></div>
    <div class="card"><div class="center" style="padding:24px">جارٍ التحميل...</div></div>`;

  const [rows, settings] = await Promise.all([
    api('/api/sports_excellence'),
    api('/api/sports_excellence/settings'),
  ]);
  if (!Array.isArray(rows)) { panel.innerHTML = `<div class="card"><div class="center">تعذّر تحميل البيانات</div></div>`; return; }
  SP_ROWS = rows;
  SP_SETTINGS = settings || {};
  if (!SP_SETTINGS.committee_members_by_game) SP_SETTINGS.committee_members_by_game = {};
  if (!SC_CURRENT_GAME) SC_CURRENT_GAME = SP_GAME_TYPES[0];

  panel.innerHTML = `
  <div class="ph"><div><div class="pt">علامات لجنة التحكيم</div><div class="ps">لكل لعبة لجنة تحكيم مستقلة بأعضائها الخاصين (3 أعضاء كحد أدنى، 5 كحد أقصى)</div></div></div>

  <div class="card">
    <div class="fg" style="max-width:340px"><label style="font-weight:700;color:var(--g)">اللعبة</label>
      <select id="sc-game-select" onchange="scSwitchGame(this.value)">${SP_GAME_TYPES.map(t=>`<option value="${spEsc(t)}"${t===SC_CURRENT_GAME?' selected':''}>${spEsc(t)}</option>`).join('')}</select>
    </div>
  </div>

  <div id="sc-body-container"></div>

  <div class="modal-ov" id="sc-modal" onclick="if(event.target===this) scCloseModal()"><div class="modal" style="max-width:480px;max-height:88vh;overflow-y:auto" id="sc-modal-body"></div></div>`;

  if (!window.__scEscBound) {
    window.__scEscBound = true;
    document.addEventListener('keydown', e => { if (e.key === 'Escape') scCloseModal(); });
  }

  scRenderGameBody();
}

function scSwitchGame(game) {
  SC_CURRENT_GAME = game;
  scRenderGameBody();
}

function scRenderGameBody() {
  const container = document.getElementById('sc-body-container');
  if (!container) return;
  const members = spCommitteeMembers(SC_CURRENT_GAME);
  const n = members.length;
  const per = 60;

  container.innerHTML = `
  <div class="card">
    <div style="font-weight:700;color:var(--g);margin-bottom:8px">أعضاء لجنة "${spEsc(SC_CURRENT_GAME)}" (من 3 إلى 5 أعضاء)</div>
    <div style="font-size:11.5px;color:var(--muted);margin-bottom:10px">يمنح كل عضو علامة كاملة من (60)، وتُحتسَب علامة اللجنة تلقائياً كمتوسط علامات جميع الأعضاء المُدخَلين (يبقى الناتج دائماً من 60 كحد أقصى). تُحتسَب العلامة النهائية من: علامة اللجنة (60%) + علامة الثانوية (20%) + علامة نوع نموذج التفوق الرياضي الثابتة (20%). الاسم الوظيفي يظهر في كشف العلامات النهائي للتوقيع. هذه اللجنة خاصة بلعبة "${spEsc(SC_CURRENT_GAME)}" فقط ومستقلة عن بقية الألعاب.</div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:8px">
      ${[0,1,2,3,4].map(i => `
      <div style="border:1px solid var(--border);border-radius:var(--r);padding:8px">
        <div class="fg"><label>العضو ${i+1}${i>2?' (اختياري)':''} — الاسم</label><input type="text" id="sc-m-${i}" value="${spEsc(members[i]?.name||'')}" placeholder="اسم العضو..."></div>
        <div class="fg" style="margin-top:6px"><label>الاسم الوظيفي</label><input type="text" id="sc-t-${i}" value="${spEsc(members[i]?.title||'')}" placeholder="مثال: عميد شؤون الطلبة..."></div>
      </div>`).join('')}
    </div>
    <button class="btn btn-sm" style="margin-top:10px" onclick="scSaveCommittee()"><i class="ti ti-device-floppy"></i> حفظ أسماء لجنة هذه اللعبة</button>
  </div>

  <div class="card">
    <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end">
      <button class="btn btn-sm" onclick="scOpenPrintFields('blank')"><i class="ti ti-printer"></i> طباعة كشف تقييم فارغ للجنة</button>
      <button class="btn btn-sm" onclick="scOpenPrintFields('final')"><i class="ti ti-printer"></i> طباعة كشف العلامات النهائي</button>
      <div style="flex:1"></div>
      <button class="btn btn-sm" style="background:var(--g);color:#fff" onclick="scSaveAll()"><i class="ti ti-device-floppy"></i> حفظ كل العلامات المُدخَلة</button>
    </div>
  </div>

  <div class="card">
    ${!n ? `<div class="center">يرجى إدخال أسماء أعضاء لجنة "${spEsc(SC_CURRENT_GAME)}" أعلاه أولاً (3 أعضاء كحد أدنى) قبل إدخال العلامات</div>` : `
    <div class="tw"><table>
      <thead><tr>
        <th>#</th><th>الاسم</th>
        ${members.map(m=>`<th>${spEsc(m.name)}<br><span style="font-weight:400;font-size:10px;color:var(--muted)">(من ${per.toFixed(1)})</span></th>`).join('')}
        <th>علامة الاختبار<br><span style="font-weight:400;font-size:10px;color:var(--muted)">(من 60)</span></th>
        <th>علامة الثانوية<br><span style="font-weight:400;font-size:10px;color:var(--muted)">(من 20)</span></th>
        <th>علامة نوع النموذج<br><span style="font-weight:400;font-size:10px;color:var(--muted)">(من 20)</span></th>
        <th>العلامة النهائية</th>
      </tr></thead>
      <tbody id="sc-tbody"></tbody>
    </table></div>`}
  </div>`;

  if (n) scRenderTable();
}
function scCloseModal() { document.getElementById('sc-modal')?.classList.remove('open'); }

// يعيد أعضاء لجنة لعبة معيَّنة بصيغة موحّدة {name, title}
function spCommitteeMembers(game) {
  const map = SP_SETTINGS.committee_members_by_game || {};
  return (map[game] || []).map(m => typeof m === 'string' ? { name: m, title: '' } : m);
}

const SC_SHEET_FIELDS = SP_FIELDS.filter(f => !['committee_score','hs_score','final_score','status'].includes(f.key));

function scOpenPrintFields(mode) {
  const members = spCommitteeMembers(SC_CURRENT_GAME);
  if (!members.length) { alert('يرجى إدخال أسماء أعضاء لجنة هذه اللعبة أولاً'); return; }
  document.getElementById('sc-modal-body').innerHTML = `
    <h3>${mode==='final' ? 'بيانات إضافية تُعرض في كشف العلامات النهائي' : 'بيانات إضافية تُعرض للجنة في الكشف'}</h3>
    <div style="font-size:11.5px;color:var(--muted);margin-bottom:10px">تظهر هذه الحقول بجانب اسم الطالب في الكشف المطبوع.</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:2px 10px">
      ${SC_SHEET_FIELDS.map(f=>`<label style="display:flex;align-items:center;gap:6px;font-weight:400;font-size:12.5px;margin-bottom:6px"><input type="checkbox" class="sc-sheet-col" value="${f.key}"> ${f.label}</label>`).join('')}
    </div>
    <div style="display:flex;gap:8px;margin-top:12px">
      <button class="btn" style="flex:1;background:var(--g);color:#fff" onclick="${mode==='final'?'scPrintFinalReport()':'scPrintGradingSheet()'}"><i class="ti ti-printer"></i> طباعة الكشف</button>
      <button class="btn" onclick="scCloseModal()">إغلاق</button>
    </div>`;
  document.getElementById('sc-modal').classList.add('open');
}

async function scSaveCommittee() {
  const members = [0,1,2,3,4]
    .map(i => ({ name: document.getElementById('sc-m-'+i).value.trim(), title: document.getElementById('sc-t-'+i).value.trim() }))
    .filter(m => m.name);
  if (members.length < 3) { alert('يرجى إدخال ثلاثة أسماء على الأقل لأعضاء لجنة هذه اللعبة'); return; }
  if (!SP_SETTINGS.committee_members_by_game) SP_SETTINGS.committee_members_by_game = {};
  SP_SETTINGS.committee_members_by_game[SC_CURRENT_GAME] = members;
  const r = await api('/api/sports_excellence/settings', 'PUT', SP_SETTINGS);
  if (r.error) { alert(r.error); return; }
  scRenderGameBody();
}

function scRenderTable() {
  const members = spCommitteeMembers(SC_CURRENT_GAME);
  const tbody = document.getElementById('sc-tbody');
  if (!tbody) return;
  const rows = SP_ROWS.filter(r => (r.game_types||[]).includes(SC_CURRENT_GAME) && !['pending','accepted_exam'].includes(r.status));
  if (!rows.length) { tbody.innerHTML = `<tr><td colspan="${2+members.length+4}" class="center">لا يوجد طلبة اجتازوا اختبار القدرات للعبة "${spEsc(SC_CURRENT_GAME)}" بعد</td></tr>`; return; }
  const per = 60;
  tbody.innerHTML = rows.map((r,i) => {
    const scores = r.committee_scores || [];
    const hs = r.gpa ? (parseFloat(r.gpa) * 0.2) : 0;
    const nom = r.nomination_score!=null ? r.nomination_score : (spNominationScore(r.nomination_type) || 0);
    const filled = scores.filter(v => v != null && v !== '');
    const cscore = filled.length ? filled.reduce((a,b)=>a+(+b||0),0) / filled.length : null;
    return `<tr data-id="${r.id}" data-hs="${hs}" data-nom="${nom}">
      <td>${i+1}</td>
      <td>${spEsc(r.full_name)} <button class="btn btn-sm" style="padding:2px 6px" onclick="scViewApplicant('${r.id}')" title="عرض بيانات الطالب"><i class="ti ti-eye"></i></button></td>
      ${members.map((m,mi) => `<td><input type="number" min="0" max="${per}" step="0.5" class="sc-score" style="width:64px" value="${scores[mi]!=null?scores[mi]:''}" oninput="scRecalc(this)"></td>`).join('')}
      <td class="sc-cscore">${cscore!=null ? spPct(cscore) : '—'}</td>
      <td>${spPct(hs)}</td>
      <td>${spPct(nom)}</td>
      <td class="sc-final" style="font-weight:700">${cscore!=null ? spPct(cscore+hs+nom) : '—'}</td>
    </tr>`;
  }).join('');
}

function scRecalc(input) {
  const tr = input.closest('tr');
  const hs = parseFloat(tr.dataset.hs) || 0;
  const nom = parseFloat(tr.dataset.nom) || 0;
  const vals = Array.from(tr.querySelectorAll('.sc-score')).map(el => el.value === '' ? null : parseFloat(el.value));
  const filled = vals.filter(v => v != null);
  const cscore = filled.length ? filled.reduce((a,b)=>a+b, 0) / filled.length : null;
  tr.querySelector('.sc-cscore').textContent = cscore!=null ? spPct(cscore) : '—';
  tr.querySelector('.sc-final').textContent = cscore!=null ? spPct(cscore+hs+nom) : '—';
}

// عرض سريع (للقراءة فقط) لبيانات الطالب من شاشة علامات اللجنة، دون مغادرتها
// (تُبنى بعناصر مستقلة تماماً عن نافذة التعديل في شاشة الطلبات، تفادياً لتكرار أرقام تعريف العناصر id)
function spReadOnlyHTML(r) {
  return `
    ${r.photo ? `<div style="text-align:center;margin-bottom:10px"><img src="${r.photo}" style="width:110px;height:110px;object-fit:contain;background:#F1F3F0;border-radius:10px;border:1px solid var(--border)"></div>` : ''}
    <div class="fr"><div class="fl">الرقم المرجعي</div><div class="fv">${spEsc(r.ref_code)}</div></div>
    <div class="fr"><div class="fl">اسم الطالب</div><div class="fv">${spEsc(r.full_name)}</div></div>
    <div class="fr"><div class="fl">الجنس</div><div class="fv">${spEsc(r.gender)}</div></div>
    <div class="fr"><div class="fl">رقم الجلوس</div><div class="fv">${spEsc(r.seat_number)}</div></div>
    <div class="fr"><div class="fl">المدرسة</div><div class="fv">${spEsc(r.school)}</div></div>
    <div class="fr"><div class="fl">المحافظة / اللواء</div><div class="fv">${spEsc(r.governorate)} / ${spEsc(r.district)}</div></div>
    <div class="fr"><div class="fl">نوع اللعبة</div><div class="fv">${(r.game_types||[]).map(spEsc).join('، ')}</div></div>
    <div class="fr"><div class="fl">فرع الشهادة</div><div class="fv">${spEsc(SP_TRACKS[r.cert_track]||r.cert_track)}${r.cert_subfield?' — '+spEsc(r.cert_subfield):''}${r.arab_branch?' — الفرع الدراسي: '+spEsc(r.arab_branch):''}${r.equivalency_doc?' — وثيقة المعادلة: '+spEsc(r.equivalency_doc):''}</div></div>
    <div class="fr"><div class="fl">سنة الشهادة</div><div class="fv">${spEsc(r.cert_year)}</div></div>
    <div class="fr"><div class="fl">المعدل</div><div class="fv">${spEsc(r.gpa)}%</div></div>
    <div class="fr"><div class="fl">العنوان</div><div class="fv">${spEsc(r.address)}</div></div>
    <div class="fr"><div class="fl">الهاتف</div><div class="fv">${spEsc(r.phone)}${r.phone_alt?' / بديل: '+spEsc(r.phone_alt):''}</div></div>
    <div class="fr"><div class="fl">التخصصات المرغوبة</div><div class="fv">${(r.majors||[]).map(spEsc).join(' ← ')}</div></div>
    <div class="fr"><div class="fl">نوع نموذج التفوق الرياضي</div><div class="fv">${spEsc(r.nomination_type)}</div></div>
    <div class="fr"><div class="fl">الرقم المرجعي لشهادة النموذج</div><div class="fv">${spEsc(r.cert_ref_code) || '—'}</div></div>
    <div class="fr" style="margin-top:6px"><div class="fl">تاريخ التقديم</div><div class="fv">${spDate(r.createdAt)}</div></div>`;
}

function scViewApplicant(id) {
  const r = SP_ROWS.find(x => x.id === id); if (!r) return;
  document.getElementById('sc-modal-body').innerHTML = `
    <h3>بيانات الطالب</h3>
    ${spReadOnlyHTML(r)}
    <div style="display:flex;gap:8px;margin-top:16px">
      <button class="btn" style="flex:1" onclick="scCloseModal()">إغلاق</button>
    </div>`;
  document.getElementById('sc-modal').classList.add('open');
}

async function scSaveAll() {
  const trs = Array.from(document.querySelectorAll('#sc-tbody tr[data-id]'));
  if (!trs.length) return;
  const jobs = trs.map(tr => {
    const id = tr.dataset.id;
    const hs = parseFloat(tr.dataset.hs) || 0;
    const nom = parseFloat(tr.dataset.nom) || 0;
    const committee_scores = Array.from(tr.querySelectorAll('.sc-score')).map(el => el.value === '' ? null : parseFloat(el.value));
    const filled = committee_scores.filter(v => v != null);
    const committee_total = filled.length ? filled.reduce((a,b)=>a+b, 0) : null; // مجموع خام (للمرجعية فقط)
    const committee_score = filled.length ? committee_total / filled.length : null; // متوسط علامات الأعضاء (من 60)
    const final_score = filled.length ? committee_score + hs + nom : null;
    return api('/api/sports_excellence/'+id, 'PUT', { committee_scores, committee_total, committee_score, hs_score: hs, nomination_score: nom, final_score });
  });
  const results = await Promise.all(jobs);
  if (results.some(r => r && r.error)) { alert('حدث خطأ أثناء حفظ بعض العلامات'); return; }
  alert('✅ تم حفظ جميع العلامات بنجاح');
  loadSportsCommittee();
}

// خط مخصّص لكشوف لجنة التحكيم فقط (لا يمسّ خط باقي شاشات النظام)
const SC_PRINT_FONT = `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Scheherazade+New:wght@400;700&display=swap"><style>body,table,th,td,div{font-family:'Scheherazade New',serif!important;font-weight:700!important}</style>`;
// توسيط عناوين الأعمدة في كل جداول التفوق الرياضي المطبوعة (عمود اسم الطالب يبقى يميناً بشكل صريح لكل صف)
const SP_TABLE_ALIGN_STYLE = `<style>.ptbl th{text-align:center!important}</style>`;
// مربّع توقيعات أعضاء اللجنة (الاسم الوظيفي أعلى الاسم) — يُستخدم في أكثر من كشف مطبوع
function spSignatureBlockHTML() {
  const members = spCommitteeMembers(SC_CURRENT_GAME);
  if (!members.length) return '';
  return `<div style="margin-top:60px;display:grid;grid-template-columns:repeat(${members.length},1fr);gap:14px;text-align:center;font-size:10.5pt;page-break-inside:avoid">
    ${members.map(m => `<div><div style="border-top:1px solid #333;padding-top:6px">${spEsc(m.title)||'&nbsp;'}</div><div style="margin-top:60px;font-weight:700">${spEsc(m.name)}</div></div>`).join('')}
  </div>`;
}

function scPrintGradingSheet() {
  const members = spCommitteeMembers(SC_CURRENT_GAME);
  if (!members.length) { alert('يرجى إدخال أسماء أعضاء لجنة هذه اللعبة أولاً'); return; }
  const rows = SP_ROWS.filter(r => (r.game_types||[]).includes(SC_CURRENT_GAME) && !['pending','accepted_exam'].includes(r.status));
  if (!rows.length) { alert('لا يوجد طلبة اجتازوا اختبار القدرات لهذه اللعبة بعد'); return; }
  const extraKeys = Array.from(document.querySelectorAll('.sc-sheet-col:checked')).map(el => el.value);
  const extraCols = SP_FIELDS.filter(f => extraKeys.includes(f.key));
  const per = '60';
  const html = `
    ${SC_PRINT_FONT}${SP_TABLE_ALIGN_STYLE}
    <div class="ph2">
      <img src="/logo.png" class="plogo" alt="شعار الجامعة الأردنية">
      <div class="puni"><div class="ar">الجامعة الأردنية</div><div class="en">The University of Jordan</div><div class="dep">عمادة شؤون الطلبة — Dean of Student Affairs</div></div>
      <div class="pmeta">${spDate(new Date())}</div>
    </div>
    <div class="ptitle">كشف تقييم لجنة الاختبار — ${spEsc(SC_CURRENT_GAME)}</div>
    <table class="ptbl"><thead><tr>
      <th>#</th><th>اسم الطالب</th>
      ${extraCols.map(c=>`<th>${c.label}</th>`).join('')}
      ${members.map(m=>`<th>${spEsc(m.name)}<br>(من ${per})</th>`).join('')}
      <th>المجموع (من 60)</th>
    </tr></thead><tbody>
      ${rows.map((r,i)=>`<tr><td style="text-align:center">${i+1}</td><td style="text-align:right">${spEsc(r.full_name)}</td>${extraCols.map(c=>`<td style="text-align:center">${spEsc(spFieldValue(r,c.key))}</td>`).join('')}${members.map(()=>`<td style="height:30px"></td>`).join('')}<td></td></tr>`).join('')}
    </tbody></table>`;
  openPrint(html);
  scCloseModal();
}

// كشف العلامات النهائي — يشمل العلامات الفعلية المُدخَلة + مربّع توقيعات أعضاء اللجنة (الاسم الوظيفي فوق الاسم)
function scPrintFinalReport() {
  const members = spCommitteeMembers(SC_CURRENT_GAME);
  if (!members.length) { alert('يرجى إدخال أسماء أعضاء لجنة هذه اللعبة أولاً'); return; }
  const rows = SP_ROWS.filter(r => (r.game_types||[]).includes(SC_CURRENT_GAME) && !['pending','accepted_exam'].includes(r.status));
  if (!rows.length) { alert('لا يوجد طلبة اجتازوا اختبار القدرات لهذه اللعبة بعد'); return; }
  const extraKeys = Array.from(document.querySelectorAll('.sc-sheet-col:checked')).map(el => el.value);
  const extraCols = SP_FIELDS.filter(f => extraKeys.includes(f.key));
  const per = '60';
  const html = `
    ${SC_PRINT_FONT}${SP_TABLE_ALIGN_STYLE}
    <div class="ph2">
      <img src="/logo.png" class="plogo" alt="شعار الجامعة الأردنية">
      <div class="puni"><div class="ar">الجامعة الأردنية</div><div class="en">The University of Jordan</div><div class="dep">عمادة شؤون الطلبة — Dean of Student Affairs</div></div>
      <div class="pmeta">${spDate(new Date())}</div>
    </div>
    <div class="ptitle">كشف علامات لجنة الاختبار — ${spEsc(SC_CURRENT_GAME)}</div>
    <table class="ptbl"><thead><tr>
      <th>#</th><th>اسم الطالب</th>
      ${extraCols.map(c=>`<th>${c.label}</th>`).join('')}
      ${members.map(m=>`<th>${spEsc(m.name)}<br>(من ${per})</th>`).join('')}
      <th>علامة الاختبار (60)</th><th>علامة الثانوية (20)</th><th>علامة نوع النموذج (20)</th><th>العلامة النهائية</th>
    </tr></thead><tbody>
      ${rows.map((r,i) => {
        const scores = r.committee_scores || [];
        const nom = r.nomination_score!=null ? r.nomination_score : (spNominationScore(r.nomination_type) || 0);
        return `<tr><td style="text-align:center">${i+1}</td><td style="text-align:right">${spEsc(r.full_name)}</td>${extraCols.map(c=>`<td style="text-align:center">${spEsc(spFieldValue(r,c.key))}</td>`).join('')}${members.map((m,mi)=>`<td style="text-align:center">${scores[mi]!=null?scores[mi]:'—'}</td>`).join('')}<td style="text-align:center">${r.committee_score!=null?spPct(r.committee_score):'—'}</td><td style="text-align:center">${r.hs_score!=null?spPct(r.hs_score):'—'}</td><td style="text-align:center">${spPct(nom)}</td><td style="font-weight:700;text-align:center">${r.final_score!=null?spPct(r.final_score):'—'}</td></tr>`;
      }).join('')}
    </tbody></table>
    ${spSignatureBlockHTML()}`;
  openPrint(html);
  scCloseModal();
}
