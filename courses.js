// ══════════════════════════════════════════════════════════════
// الدورات التدريبية — لوحة الإدارة (admin/editor)
// كتالوج دورات مقدَّمة من جهات خارجية — يمكن للطالب التسجيل في أكثر من دورة
// من كل الكتالوج، عبر رابط عام واحد (courses.html)
// ══════════════════════════════════════════════════════════════

let TC_COURSES = [];
let TC_COURSE = null; // الدورة المفتوحة حالياً لعرض متقدميها، أو null

function tcrEsc(s) { return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function tcrDate(d) { if (!d) return ''; try { return new Date(d).toLocaleDateString('ar-JO', { year:'numeric', month:'long', day:'numeric' }); } catch(e) { return ''; } }

async function loadTrainingCourses() {
  const panel = document.getElementById('panel-training_courses');
  if (!panel) return;
  panel.innerHTML = `<div class="ph"><div><div class="pt">الدورات التدريبية</div><div class="ps">كتالوج الدورات المقدَّمة من جهات خارجية، وتسجيل الطلبة فيها</div></div></div>
    <div class="card"><div class="center" style="padding:24px">جارٍ التحميل...</div></div>`;
  const courses = await api('/api/training_courses');
  if (!Array.isArray(courses)) { panel.innerHTML = `<div class="card"><div class="center">تعذّر تحميل البيانات</div></div>`; return; }
  TC_COURSES = courses;
  TC_COURSE = null;
  tcrRenderList();
}

function tcrRenderList() {
  const panel = document.getElementById('panel-training_courses');
  panel.innerHTML = `
  <div class="ph"><div><div class="pt">الدورات التدريبية</div><div class="ps">كتالوج الدورات المقدَّمة من جهات خارجية، وتسجيل الطلبة فيها</div></div></div>
  <div class="card"><button class="btn btn-sm" style="background:var(--g);color:#fff" onclick="tcrOpenCourseForm()"><i class="ti ti-plus"></i> إضافة دورة جديدة</button>
  <button class="btn btn-sm" onclick="tcrCopyCatalogLink()"><i class="ti ti-link"></i> نسخ رابط الدورات العام</button></div>

  <div class="card">
    <div class="fb" style="align-items:center">
      <button class="btn btn-sm" onclick="tcrToggleAllCourses(true)"><i class="ti ti-checkbox"></i> تحديد الكل</button>
      <button class="btn btn-sm" onclick="tcrToggleAllCourses(false)">إلغاء التحديد</button>
      <div style="flex:1"></div>
      <span id="tcr-sel-count" style="font-size:12px;color:var(--muted)">لم يُحدَّد شيء</span>
      <button class="btn btn-sm" style="background:var(--g);color:#fff" onclick="tcrPrintSelectedCourses()"><i class="ti ti-printer"></i> طباعة أسماء متقدمي الدورات المحدَّدة (PDF واحد)</button>
    </div>
  </div>

  <div class="card">
    <div class="tw"><table>
      <thead><tr><th style="width:36px"><input type="checkbox" id="tcr-check-all" onchange="tcrToggleAllCourses(this.checked)"></th><th>#</th><th>اسم الدورة</th><th>الجهة المنظِّمة</th><th>الساعات</th><th>الحصة الرسمية</th><th>المسجَّلون / الحد الأقصى</th><th>الحالة</th><th>إجراءات</th></tr></thead>
      <tbody>${TC_COURSES.length ? TC_COURSES.map((c,i) => {
        const regs = (c.registrants||[]).length;
        const cap = c.cap || 0;
        const todayStr = new Date().toISOString().slice(0,10);
        const closed = (c.close_date && c.close_date < todayStr) || regs >= cap;
        return `<tr>
          <td style="text-align:center"><input type="checkbox" class="tcr-course-chk" value="${c.id}" onchange="tcrUpdateSelCount()"></td>
          <td>${i+1}</td><td><strong>${tcrEsc(c.name)}</strong></td><td>${tcrEsc(c.organizer)}</td><td>${tcrEsc(c.hours)}</td><td>${tcrEsc(c.quota_note)}</td>
          <td>${regs} / ${cap}</td>
          <td>${closed ? '<span class="st st-r">مغلقة</span>' : '<span class="st st-a">مفتوحة</span>'}</td>
          <td style="white-space:nowrap">
            <button class="btn btn-sm" onclick="tcrOpenRegistrants('${c.id}')"><i class="ti ti-eye"></i> المتقدمون</button>
            <button class="btn btn-sm" onclick="tcrOpenCourseForm('${c.id}')"><i class="ti ti-pencil"></i></button>
            <button class="btn btn-sm" style="color:#c0392b" onclick="tcrDeleteCourse('${c.id}')"><i class="ti ti-trash"></i></button>
          </td>
        </tr>`;
      }).join('') : `<tr><td colspan="9" class="center">لا توجد دورات مضافة بعد</td></tr>`}</tbody>
    </table></div>
  </div>
  <div class="modal-ov" id="tcr-modal" onclick="if(event.target===this) tcrCloseModal()"><div class="modal" style="max-width:600px;max-height:88vh;overflow-y:auto" id="tcr-modal-body"></div></div>`;

  if (!window.__tcrEscBound) {
    window.__tcrEscBound = true;
    document.addEventListener('keydown', e => { if (e.key === 'Escape') tcrCloseModal(); });
  }
  tcrUpdateSelCount();
}

function tcrToggleAllCourses(state) {
  document.querySelectorAll('.tcr-course-chk').forEach(cb => cb.checked = state);
  const all = document.getElementById('tcr-check-all'); if (all) all.checked = state;
  tcrUpdateSelCount();
}

function tcrUpdateSelCount() {
  const n = document.querySelectorAll('.tcr-course-chk:checked').length;
  const el = document.getElementById('tcr-sel-count');
  if (el) el.textContent = n ? `${n} دورة محدَّدة` : 'لم يُحدَّد شيء';
}

function tcrPrintSelectedCourses() {
  const ids = Array.from(document.querySelectorAll('.tcr-course-chk:checked')).map(cb => cb.value);
  if (!ids.length) { alert('يرجى تحديد دورة واحدة على الأقل'); return; }
  const courses = ids.map(id => TC_COURSES.find(c => c.id === id)).filter(Boolean);
  const html = courses.map((c,i) => {
    const regs = c.registrants || [];
    return `${i>0 ? '<div style="page-break-before:always"></div>' : ''}
    <div class="ph2">
      <img src="/logo.png" class="plogo" alt="شعار الجامعة الأردنية">
      <div class="puni"><div class="ar">الجامعة الأردنية</div><div class="en">The University of Jordan</div><div class="dep">عمادة شؤون الطلبة — Dean of Student Affairs</div></div>
      <div class="pmeta">${tcrDate(new Date())}</div>
    </div>
    <div class="ptitle">قائمة المتقدمين — ${tcrEsc(c.name)}</div>
    <div class="psub">${tcrEsc(c.organizer)}${c.hours?' — '+tcrEsc(c.hours):''}${c.quota_note?' — '+tcrEsc(c.quota_note):''} — ${regs.length} متقدم</div>
    <table class="ptbl"><thead><tr><th>#</th><th>الاسم</th><th>الرقم الجامعي</th><th>الكلية</th><th>التخصص</th><th>الهاتف</th><th>مختار</th></tr></thead><tbody>
      ${regs.length ? regs.map((r,i2)=>`<tr><td>${i2+1}</td><td>${tcrEsc(r.name)}</td><td>${tcrEsc(r.id)}</td><td>${tcrEsc(r.college)}</td><td>${tcrEsc(r.major)}</td><td>${tcrEsc(r.phone)}</td><td>${r.selected?'✓':''}</td></tr>`).join('') : `<tr><td colspan="7" class="center">لا يوجد متقدمون</td></tr>`}
    </tbody></table>`;
  }).join('');
  openPrint(html);
}
function tcrCloseModal() { document.getElementById('tcr-modal')?.classList.remove('open'); }

function tcrCopyCatalogLink() {
  const link = window.location.origin + '/courses.html';
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(link).then(()=>alert('تم نسخ الرابط ✓')).catch(()=>prompt('انسخي الرابط يدوياً:', link));
  } else { prompt('انسخي الرابط يدوياً:', link); }
}

function tcrOpenCourseForm(id) {
  const c = id ? TC_COURSES.find(x=>x.id===id) : null;
  document.getElementById('tcr-modal-body').innerHTML = `
    <h3>${c ? 'تعديل الدورة' : 'إضافة دورة جديدة'}</h3>
    <div class="fg"><label>اسم الدورة</label><input type="text" id="tcr-name" value="${tcrEsc(c?.name||'')}"></div>
    <div class="fg"><label>الجهة المنظِّمة</label><input type="text" id="tcr-org" value="${tcrEsc(c?.organizer||'')}"></div>
    <div class="fg"><label>عدد الساعات</label><input type="text" id="tcr-hours" value="${tcrEsc(c?.hours||'')}" placeholder="مثال: 15 ساعة تدريبية، أو غير محدد"></div>
    <div class="fg"><label>الحصة الرسمية (كما وردت من الجهة المنظِّمة)</label><input type="text" id="tcr-quota" value="${tcrEsc(c?.quota_note||'')}" placeholder="مثال: 300 طالب من كل جامعة، أو 5 فائزين"></div>
    <div class="fg"><label>الحد الأقصى للتسجيل في هذا النظام *</label><input type="number" min="1" id="tcr-cap" value="${c?.cap||''}">
      <div style="font-size:11px;color:var(--muted);margin-top:3px">للدورات التنافسية ذات الحصة الصغيرة جداً، ضعي 10 لتكوين قائمة تختارين منها الفائزين لاحقاً.</div>
    </div>
    <div class="fg"><label>تاريخ إغلاق التسجيل (اختياري)</label><input type="date" id="tcr-close" value="${c?.close_date||''}"></div>
    <div class="fg"><label>وصف مختصر (يظهر للطالب)</label><textarea id="tcr-desc" style="min-height:70px">${tcrEsc(c?.description||'')}</textarea></div>
    <div style="display:flex;gap:8px;margin-top:8px">
      <button class="btn" style="flex:1;background:var(--g);color:#fff" onclick="tcrSaveCourse('${id||''}')"><i class="ti ti-device-floppy"></i> حفظ</button>
      <button class="btn" onclick="tcrCloseModal()">إغلاق</button>
    </div>`;
  document.getElementById('tcr-modal').classList.add('open');
}

async function tcrSaveCourse(id) {
  const name = document.getElementById('tcr-name').value.trim();
  const cap = document.getElementById('tcr-cap').value;
  if (!name) { alert('يرجى إدخال اسم الدورة'); return; }
  if (!cap || Number(cap) < 1) { alert('يرجى إدخال الحد الأقصى للتسجيل'); return; }
  const payload = {
    name, organizer: document.getElementById('tcr-org').value.trim(),
    hours: document.getElementById('tcr-hours').value.trim(),
    quota_note: document.getElementById('tcr-quota').value.trim(),
    cap: Number(cap), close_date: document.getElementById('tcr-close').value || null,
    description: document.getElementById('tcr-desc').value.trim(),
  };
  const r = id ? await api('/api/training_courses/'+id, 'PUT', payload) : await api('/api/training_courses', 'POST', payload);
  if (r.error) { alert(r.error); return; }
  tcrCloseModal();
  loadTrainingCourses();
}

async function tcrDeleteCourse(id) {
  if (!confirm('حذف هذه الدورة وكل بيانات المسجَّلين فيها؟ لا يمكن التراجع.')) return;
  const r = await api('/api/training_courses/'+id, 'DELETE');
  if (r.error) { alert(r.error); return; }
  loadTrainingCourses();
}

// ── عرض/إدارة المتقدمين لدورة معيّنة ──
async function tcrOpenRegistrants(id) {
  const c = await api('/api/training_courses/'+id);
  if (c.error) { alert(c.error); return; }
  TC_COURSE = c;
  tcrRenderRegistrants();
}

function tcrRenderRegistrants() {
  const panel = document.getElementById('panel-training_courses');
  const c = TC_COURSE;
  const regs = c.registrants || [];
  panel.innerHTML = `
  <div class="ph"><div><div class="pt">المتقدمون — ${tcrEsc(c.name)}</div><div class="ps">${tcrEsc(c.organizer)} — ${regs.length} / ${c.cap} مسجَّل</div></div></div>
  <div class="card">
    <button class="btn btn-sm" onclick="tcrRenderList()"><i class="ti ti-arrow-right"></i> كل الدورات</button>
    <button class="btn btn-sm" onclick="tcrPrintRegistrants()"><i class="ti ti-printer"></i> طباعة</button>
    <button class="btn btn-sm" onclick="tcrExportExcel()"><i class="ti ti-file-spreadsheet"></i> تصدير Excel</button>
  </div>
  <div class="card">
    <div class="tw"><table>
      <thead><tr><th style="width:36px">مختار</th><th>#</th><th>الاسم</th><th>الرقم الجامعي</th><th>الجنس</th><th>الجنسية</th><th>الكلية</th><th>التخصص</th><th>المستوى</th><th>الهاتف</th><th>البريد الإلكتروني</th><th>تاريخ التسجيل</th><th></th></tr></thead>
      <tbody>${regs.length ? regs.map((r,i)=>`
        <tr>
          <td style="text-align:center"><input type="checkbox" ${r.selected?'checked':''} onchange="tcrToggleSelected('${r.id}', this)"></td>
          <td>${i+1}</td><td>${tcrEsc(r.name)}</td><td>${tcrEsc(r.id)}</td><td>${tcrEsc(r.gender)}</td><td>${tcrEsc(r.nationality)}</td>
          <td>${tcrEsc(r.college)}</td><td>${tcrEsc(r.major)}</td><td>${tcrEsc(r.year)}</td><td>${tcrEsc(r.phone)}</td><td>${tcrEsc(r.email)}</td>
          <td>${tcrDate(r.registered_at)}</td>
          <td><button class="btn btn-sm" style="color:#c0392b" onclick="tcrRemoveRegistrant('${r.id}')"><i class="ti ti-trash"></i></button></td>
        </tr>`).join('') : `<tr><td colspan="13" class="center">لا يوجد متقدمون بعد</td></tr>`}</tbody>
    </table></div>
  </div>`;
}

async function tcrToggleSelected(regId, cb) {
  const regs = TC_COURSE.registrants || [];
  const idx = regs.findIndex(r => r.id === regId);
  if (idx === -1) return;
  regs[idx].selected = cb.checked;
  cb.disabled = true;
  const r = await api('/api/training_courses/'+TC_COURSE.id, 'PUT', { registrants: regs });
  cb.disabled = false;
  if (r.error) { alert(r.error); cb.checked = !cb.checked; return; }
}

async function tcrRemoveRegistrant(regId) {
  if (!confirm('إزالة هذا المتقدم من قائمة الدورة؟')) return;
  const regs = (TC_COURSE.registrants || []).filter(r => r.id !== regId);
  const r = await api('/api/training_courses/'+TC_COURSE.id, 'PUT', { registrants: regs });
  if (r.error) { alert(r.error); return; }
  TC_COURSE.registrants = regs;
  tcrRenderRegistrants();
}

function tcrPrintRegistrants() {
  const c = TC_COURSE;
  const regs = c.registrants || [];
  const html = `
    <div class="ph2">
      <img src="/logo.png" class="plogo" alt="شعار الجامعة الأردنية">
      <div class="puni"><div class="ar">الجامعة الأردنية</div><div class="en">The University of Jordan</div><div class="dep">عمادة شؤون الطلبة — Dean of Student Affairs</div></div>
      <div class="pmeta">${tcrDate(new Date())}</div>
    </div>
    <div class="ptitle">قائمة المتقدمين — ${tcrEsc(c.name)}</div>
    <div class="psub">${tcrEsc(c.organizer)}${c.hours?' — '+tcrEsc(c.hours):''}${c.quota_note?' — '+tcrEsc(c.quota_note):''}</div>
    <table class="ptbl"><thead><tr><th>#</th><th>الاسم</th><th>الرقم الجامعي</th><th>الكلية</th><th>التخصص</th><th>الهاتف</th><th>مختار</th></tr></thead><tbody>
      ${regs.map((r,i)=>`<tr><td>${i+1}</td><td>${tcrEsc(r.name)}</td><td>${tcrEsc(r.id)}</td><td>${tcrEsc(r.college)}</td><td>${tcrEsc(r.major)}</td><td>${tcrEsc(r.phone)}</td><td>${r.selected?'✓':''}</td></tr>`).join('')}
    </tbody></table>`;
  openPrint(html);
}

function tcrExportExcel() {
  const c = TC_COURSE;
  const regs = c.registrants || [];
  if (!regs.length) { alert('لا يوجد متقدمون للتصدير'); return; }
  const sheetRows = regs.map((r,i) => ({
    '#': i+1, 'الاسم': r.name||'', 'الرقم الجامعي': r.id||'', 'الجنس': r.gender||'', 'الجنسية': r.nationality||'',
    'الكلية': r.college||'', 'التخصص': r.major||'', 'المستوى': r.year||'', 'الهاتف': r.phone||'', 'البريد الإلكتروني': r.email||'',
    'تاريخ التسجيل': tcrDate(r.registered_at), 'مختار': r.selected ? 'نعم' : 'لا',
  }));
  const ws = XLSX.utils.json_to_sheet(sheetRows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'المتقدمون');
  XLSX.writeFile(wb, `متقدمو_${(c.name||'دورة').replace(/[\\/:*?"<>|]/g,'')}_${new Date().toISOString().slice(0,10)}.xlsx`);
}
