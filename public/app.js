// ══════════════════════════════════════════
// الثوابت
// ══════════════════════════════════════════
const ACTS = ['المرسم الجامعي','الموسيقى','الخط العربي','الحرف اليدوية','المسرح الجامعي','الأداء الحركي','المناظرات','الأنشطة الحزبية'];
const COLS = ['كلية الآداب','كلية الأعمال','كلية الشريعة','كلية العلوم التربوية','كلية الحقوق','كلية علوم الرياضة','كلية الفنون والتصميم','كلية الأمير الحسين بن عبد الله الثاني للعلوم السياسية والدراسات الدولية','كلية اللغات الأجنبية','كلية الآثار والسياحة','كلية العلوم','كلية الزراعة','كلية الهندسة','كلية الملك عبد الله الثاني لتكنولوجيا المعلومات','كلية الطب','كلية التمريض','كلية طب الأسنان','كلية علوم التأهيل','معهد الصحة العامة','كلية الدراسات العليا'];
const ADMIT = ['تنافس','موازي','دولي','تحويل','تفوق فني'];
const YEARS = ['الأولى','الثانية','الثالثة','الرابعة','الخامسة','السادسة'];
const ACOLORS = {'المرسم الجامعي':['#EEEDFE','#3C3489'],'الموسيقى':['#E1F5EE','#085041'],'الخط العربي':['#FAEEDA','#633806'],'الحرف اليدوية':['#FAECE7','#712B13'],'المسرح الجامعي':['#FBE8F5','#5D1A4A'],'الأداء الحركي':['#EAF3DE','#27500A'],'المناظرات':['#E8F4FD','#0A4A6B'],'الأنشطة الحزبية':['#FBEAF0','#72243E']};
const RLABELS = {admin:'مدير النظام',editor:'مدخل بيانات',viewer:'عرض فقط',coordinator:'رئيس شعبة',manager:'مدير الدائرة',dean:'العميد'};
const RCLS = {admin:'r-admin',editor:'r-editor',viewer:'r-viewer',coordinator:'r-editor',manager:'r-admin',dean:'r-admin'};
// التصنيفات التسعة للأنشطة (يختارها مدير النظام عند الاعتماد) — قابلة للإضافة عليها لاحقاً
const ACTIVITY_CATEGORIES = [
  'الدورات وورش العمل والمحاضرات والبرامج',
  'مبادرات الإبداع والابتكار والريادة',
  'مشاركة الطلبة في الأنشطة الإبداعية الخارجية',
  'الأنشطة التي تعد الطلبة للمنافسات المحلية والدولية',
  'الأنشطة والمحاضرات التوعوية',
  'الأنشطة التي شارك بها الخبراء من المجتمع',
  'أنشطة البيئة والتنمية المستدامة',
  'الجلسات الحوارية عن التشريعات السياسية',
  'الحملات التوعوية والتثقيفية'
];

// دوائر العمادة (تظهر في حقل الجهة المنظمة بطلب إقامة نشاط)
const DEANSHIP_DEPTS = [
  'دائرة الهيئات والخدمات الطلابية',
  'دائرة الرعاية الصحية',
  'دائرة الإرشاد الطلابي',
  'دائرة النشاطات الرياضية',
  'دائرة المنازل الداخلية',
  'دائرة الخدمات الفنية والتطوير',
  'دائرة النشاطات الثقافية والحزبية',
  'مكتب شؤون الطلبة الدوليين',
  'اتحاد طلبة الجامعة الأردنية'
];
// ألوان خفيفة مميّزة لكل دائرة في بطاقات لوحة التحكم [خلفية, نص]
const DEPT_COLORS = {
  'دائرة الهيئات والخدمات الطلابية':      ['#EAF3DE','#27500A'],
  'دائرة الرعاية الصحية':                 ['#FBEAF0','#72243E'],
  'دائرة الإرشاد الطلابي':                ['#E1F5EE','#085041'],
  'دائرة النشاطات الرياضية':              ['#E8F4FD','#0A4A6B'],
  'دائرة المنازل الداخلية':               ['#FAEEDA','#633806'],
  'دائرة الخدمات الفنية والتطوير':        ['#EEEDFE','#3C3489'],
  'دائرة النشاطات الثقافية والحزبية':     ['#FBE8F5','#5D1A4A'],
  'مكتب شؤون الطلبة الدوليين':            ['#FAECE7','#712B13'],
  'اتحاد طلبة الجامعة الأردنية':          ['#FDEBEA','#8A2A22']
};

let TOKEN = localStorage.getItem('uj_tok');
let ME = null;
let APPROVE_ID = null;

// ══ Helpers ══
async function api(url, method='GET', body=null) {
  const opts = {method, headers:{'Content-Type':'application/json','Authorization':'Bearer '+(TOKEN||'')}};
  if (body) opts.body = JSON.stringify(body);
  try {
    const r = await fetch(url, opts);
    const t = await r.text();
    try { return JSON.parse(t); }
    catch {
      // رد غير JSON — غالباً خطأ بوابة/وسيط (Railway) مثل "upstream error"
      if (r.status===502 || r.status===503 || r.status===504 || /upstream|gateway|<html/i.test(t)) {
        return {error:'تعذّر الوصول إلى الخادم مؤقتاً (قد يكون قيد الإيقاظ). يرجى الانتظار بضع ثوانٍ ثم إعادة المحاولة.'};
      }
      return {error: (t && t.trim()) ? t : ('خطأ في الخادم ('+r.status+')')};
    }
  } catch(e) { return {error:'تعذّر الاتصال بالخادم. تحقّقي من الإنترنت ثم أعيدي المحاولة.'}; }
}
const g = id => { const el=document.getElementById(id); return el?el.value.trim():''; };
const sg = (id,v) => { const el=document.getElementById(id); if(el) el.value=v||''; };
const today = () => new Date().toLocaleDateString('ar-JO',{year:'numeric',month:'long',day:'numeric'});

// طباعة موثوقة عبر إطار مخفي (iframe) — تعمل على Chrome وEdge دون الاعتماد على النوافذ المنبثقة
function printDocument(fullDoc) {
  // تصحيح مسار الشعار ليكون رابطاً مطلقاً (الإطار قد لا يتعرّف على المسار النسبي)
  fullDoc = String(fullDoc).replace(/src="\/logo\.png"/g, 'src="' + location.origin + '/logo.png"');

  const old = document.getElementById('__print_frame__');
  if (old) old.remove();

  const iframe = document.createElement('iframe');
  iframe.id = '__print_frame__';
  iframe.setAttribute('aria-hidden', 'true');
  iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden';
  document.body.appendChild(iframe);

  let printed = false;
  const doPrint = () => {
    if (printed) return;
    printed = true;
    try { iframe.contentWindow.focus(); iframe.contentWindow.print(); }
    catch (e) { console.error('Print error:', e); }
    setTimeout(() => { try { iframe.remove(); } catch (e) {} }, 3000);
  };

  const win = iframe.contentWindow;
  const d = win.document;
  d.open();
  d.write(fullDoc);
  d.close();

  // اطبع بعد اكتمال تحميل الصور داخل الإطار، مع مهلة احتياطية تضمن الطباعة دائماً
  try {
    const imgs = d.images;
    if (imgs && imgs.length) {
      let remaining = 0;
      Array.prototype.forEach.call(imgs, im => {
        if (!im.complete) {
          remaining++;
          const done = () => { remaining--; if (remaining <= 0) doPrint(); };
          im.addEventListener('load', done);
          im.addEventListener('error', done);
        }
      });
      if (remaining === 0) setTimeout(doPrint, 200);
    } else {
      setTimeout(doPrint, 200);
    }
  } catch (e) {
    setTimeout(doPrint, 400);
  }
  setTimeout(doPrint, 2500); // احتياطي نهائي
}

const PRINT_STYLES = `
    *{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;box-sizing:border-box}
    body{font-family:'Segoe UI',Tahoma,Arial,sans-serif;direction:rtl;padding:8mm 10mm;color:#000;font-size:9.5pt;margin:0}
    .ph2{display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #1B6B3A;padding-bottom:7px;margin-bottom:9px}
    .plogo{width:62px;height:62px;object-fit:contain}
    .puni{text-align:center;flex:1}.puni .ar{font-size:14pt;font-weight:700;color:#1B6B3A}.puni .en{font-size:8.5pt;color:#555}.puni .dep{font-size:9pt;color:#333;font-weight:600;margin-top:2px}
    .pmeta{font-size:7.5pt;color:#555;text-align:left;line-height:1.8;min-width:145px}
    .ptitle{background:#1B6B3A;color:#fff;text-align:center;padding:5px;font-size:13pt;font-weight:700;margin-bottom:9px;border-radius:4px}
    .psub{background:#E8F5E9;color:#1B6B3A;padding:3px 8px;font-size:9.5pt;font-weight:700;margin:6px 0 4px;border-right:4px solid #1B6B3A}
    .fr{display:flex;border-bottom:1px solid #ccc;padding:3px 0;font-size:8.5pt;align-items:center;min-height:21px}
    .fl{font-weight:700;color:#1B6B3A;min-width:120px;flex-shrink:0;font-size:8pt}
    .fv{flex:1;border-bottom:1px dotted #aaa;padding:0 4px;min-height:14px}
    .fg2{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:4px}
    .fg3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:5px;margin-bottom:4px}
    .sg2{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-top:10px}
    .sbox{border:1px solid #ccc;border-radius:4px;padding:5px;text-align:center;min-height:50px}
    .sbox .st2{font-size:7.5pt;font-weight:700;color:#1B6B3A;margin-bottom:2px}
    .sbox .sl2{border-top:1px dotted #aaa;margin-top:14px;padding-top:3px;font-size:7pt;color:#666}
    .dbox{border:2px solid #1B6B3A;border-radius:5px;padding:7px;margin-top:8px}
    .chk{width:10px;height:10px;border:1px solid #333;display:inline-block;margin-left:3px;vertical-align:middle}
    .ptbl{width:100%;border-collapse:collapse;font-size:8.5pt;margin-top:6px}
    .ptbl th{background:#1B6B3A;color:#fff;padding:4px 5px;text-align:right;border:1px solid #ccc}
    .ptbl td{padding:3px 5px;border:1px solid #ccc;min-height:18px}
    .ptbl tr:nth-child(even) td{background:#F0FAF4}
    @media print{@page{margin:5mm 8mm}}`;

function openPrint(html) {
  const fullDoc = `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"><title>طباعة — عمادة شؤون الطلبة</title><style>${PRINT_STYLES}</style></head><body>${html}</body></html>`;
  printDocument(fullDoc);
}
const badge = act => { const[bg,fg]=ACOLORS[act]||['#eee','#555']; return `<span class="ab" style="background:${bg};color:${fg}">${act}</span>`; };
const stBadge = st => { const m={pending:'🟡 قيد مراجعة المنسّق',awaiting_manager:'🟠 قيد مراجعة المدير',awaiting_dean:'🔵 قيد اعتماد العميد',approved:'✅ معتمد',rejected:'❌ مرفوض'}; const c={pending:'st-p',awaiting_manager:'st-m',awaiting_dean:'st-d',approved:'st-a',rejected:'st-r'}; return `<span class="st ${c[st]||'st-p'}">${m[st]||'🟡 قيد مراجعة المنسّق'}</span>`; };
// صلاحية الإضافة/التعديل العامة: مقصورة فعلياً على admin/editor في الخادم.
// رئيس شعبة/المدير/العميد لهم صلاحيات محدودة ضمن مسار اعتماد النشاط فقط، وليس تعديلاً عاماً على الجداول.
function canEditGlobal() { return ['admin','editor'].includes(ME?.role); }
// صلاحية إضافة طلب إقامة نشاط جديد: تشمل أيضاً رئيس شعبة والمدير (وليس فقط admin/editor)
function canCreateAR() { return ['admin','editor','coordinator','manager'].includes(ME?.role); }
const colOpts = (val='') => COLS.map(c=>`<option${c===val?' selected':''}>${c}</option>`).join('');
const actOpts = (val='') => ACTS.map(a=>`<option${a===val?' selected':''}>${a}</option>`).join('');
const selOpts = (arr,val='') => arr.map(v=>`<option${v===val?' selected':''}>${v}</option>`).join('');
function showMsg(id,txt,err=false) { const el=document.getElementById(id); if(!el)return; el.textContent=txt; el.className='msg '+(err?'err':'ok'); el.style.display='block'; setTimeout(()=>el.style.display='none',3500); }

// ══ Build sidebar ══
function buildSidebar() {
  const sb = document.getElementById('sidebar');
  sb.innerHTML = `
  <div class="sbt">الرئيسية</div>
  <div class="ni active" onclick="go('dash',this)"><i class="ti ti-layout-dashboard"></i>لوحة التحكم<span class="cnt" id="c-all">0</span></div>
  <div class="ni" onclick="go('incomplete',this)"><i class="ti ti-alert-circle" style="color:#633806"></i>طلبات غير مكتملة<span class="cnt inc" id="c-inc">0</span></div>

  <!-- نظام الأنشطة -->
  <div class="folder-hdr" onclick="toggleFolder('f-acts')"><i class="ti ti-chevron-down folder-arrow" id="arr-f-acts"></i><i class="ti ti-users"></i>نظام الأنشطة</div>
  <div class="folder-body" id="f-acts">
    <div class="ni" onclick="go('students',this)"><i class="ti ti-users"></i>الطلبة المسجلون<span class="cnt" id="c-students">0</span></div>
    <div class="ni" onclick="go('achievements',this)"><i class="ti ti-trophy"></i>الإنجازات والتكريم<span class="cnt" id="c-achievements">0</span></div>
  </div>

  <!-- النماذج الرسمية -->
  <div class="folder-hdr" onclick="toggleFolder('f-forms')"><i class="ti ti-chevron-left folder-arrow" id="arr-f-forms"></i><i class="ti ti-files"></i>النماذج الرسمية</div>
  <div class="folder-body" id="f-forms" style="display:none">
    <div class="ni" onclick="go('activity_requests',this)"><i class="ti ti-file-plus"></i>طلبات إقامة نشاط<span class="cnt" id="c-activity_requests">0</span></div>
    <div class="ni" onclick="go('activity_requests_external',this)"><i class="ti ti-world"></i>طلبات إقامة نشاط خارجية<span class="cnt" id="c-activity_requests_external">0</span></div>
    <div class="ni" onclick="go('announcements',this)"><i class="ti ti-speakerphone"></i>الإعلانات<span class="cnt" id="c-announcements">0</span></div>
    <div class="ni" onclick="go('hall_bookings',this)"><i class="ti ti-building"></i>حجز القاعات<span class="cnt" id="c-hall_bookings">0</span></div>
    <div class="ni" onclick="go('participants',this)"><i class="ti ti-list-check"></i>أسماء المشاركين<span class="cnt" id="c-participants">0</span></div>
    <div class="ni" onclick="go('committees',this)"><i class="ti ti-sitemap"></i>تشكيل لجنة/مجلس<span class="cnt" id="c-committees">0</span></div>
    <div class="ni" onclick="go('meeting_invites',this)"><i class="ti ti-mail"></i>دعوات الاجتماعات<span class="cnt" id="c-meeting_invites">0</span></div>
    <div class="ni" onclick="go('meeting_minutes',this)"><i class="ti ti-notes"></i>محاضر الاجتماعات<span class="cnt" id="c-meeting_minutes">0</span></div>
  </div>

  <!-- بيانات الجودة -->
  <div class="folder-hdr" onclick="toggleFolder('f-quality')"><i class="ti ti-chevron-left folder-arrow" id="arr-f-quality"></i><i class="ti ti-certificate"></i>بيانات الجودة</div>
  <div class="folder-body" id="f-quality" style="display:none">
    <div class="ni" onclick="go('governance',this)"><i class="ti ti-building-community"></i>مجالس الحاكمية<span class="cnt" id="c-governance">0</span></div>
    <div class="ni" onclick="go('student_activities',this)"><i class="ti ti-confetti"></i>الأنشطة الطلابية<span class="cnt" id="c-student_activities">0</span></div>
    <div class="ni" onclick="go('student_activities_external',this)"><i class="ti ti-world"></i>الأنشطة الطلابية الخارجية<span class="cnt" id="c-student_activities_external">0</span></div>
    <div class="ni" onclick="go('student_honors',this)"><i class="ti ti-award"></i>تكريم الطلبة<span class="cnt" id="c-student_honors">0</span></div>
    <div class="ni" onclick="go('staff_committees',this)"><i class="ti ti-users-group"></i>لجان الموظفين<span class="cnt" id="c-staff_committees">0</span></div>
    <div class="ni" onclick="go('staff_training',this)"><i class="ti ti-certificate"></i>تدريب الموظفين<span class="cnt" id="c-staff_training">0</span></div>
    <div class="ni" onclick="go('staff_innovation',this)"><i class="ti ti-rocket"></i>إبداع الموظفين<span class="cnt" id="c-staff_innovation">0</span></div>
    <div class="ni" onclick="go('staff_honors',this)"><i class="ti ti-star"></i>تكريم الموظفين<span class="cnt" id="c-staff_honors">0</span></div>
    <div class="ni" onclick="go('uni_committees',this)"><i class="ti ti-network"></i>اللجان الجامعية<span class="cnt" id="c-uni_committees">0</span></div>
    <div class="ni" onclick="go('community_svc',this)"><i class="ti ti-heart-handshake"></i>الخدمات المجتمعية<span class="cnt" id="c-community_svc">0</span></div>
  </div>

  <div class="sbt">الأدوات</div>
  <div class="ni" onclick="go('reports',this)"><i class="ti ti-file-analytics"></i>التقارير الموحدة</div>
  <div class="ni" onclick="go('committee_report',this)"><i class="ti ti-clipboard-list"></i>تقرير اجتماعات اللجان</div>
  <div class="ni" onclick="go('sa_report',this)"><i class="ti ti-chart-bar"></i>تقرير الأنشطة الطلابية</div>
  <div class="ni" onclick="go('cat_report',this)"><i class="ti ti-category"></i>تقرير حسب التصنيفات</div>
  <div class="ni" onclick="go('search',this)"><i class="ti ti-search"></i>البحث الشامل</div>
  <div class="ni" id="nav-users" onclick="go('users',this)"><i class="ti ti-shield"></i>إدارة المستخدمين</div>`;
}

function toggleFolder(id) {
  const body = document.getElementById(id);
  const arrow = document.getElementById('arr-' + id);
  const isOpen = body.style.display !== 'none';
  body.style.display = isOpen ? 'none' : 'block';
  arrow.className = isOpen ? 'ti ti-chevron-left folder-arrow' : 'ti ti-chevron-down folder-arrow';
}

// ══ Build panels ══
function buildPanels() {
  const panels = document.getElementById('panels');
  const IDS = ['dash','incomplete','students','achievements','activity_requests','activity_requests_external','announcements','hall_bookings','participants','committees','meeting_invites','meeting_minutes','governance','student_activities','student_activities_external','student_honors','staff_committees','staff_training','staff_innovation','staff_honors','uni_committees','community_svc','reports','committee_report','sa_report','cat_report','search','users'];
  panels.innerHTML = IDS.map(id=>`<div id="panel-${id}" class="panel${id==='dash'?' active':''}"></div>`).join('');
}

// ══ Login ══
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('lp').addEventListener('keydown', e=>{ if(e.key==='Enter') doLogin(); });
  document.getElementById('lu').addEventListener('keydown', e=>{ if(e.key==='Enter') document.getElementById('lp').focus(); });
  checkSession();
});

async function doLogin() {
  const u=g('lu'), p=g('lp');
  const e=document.getElementById('lerr'); e.style.display='none';
  if (!u||!p) { e.textContent='يرجى ملء جميع الحقول'; e.style.display='block'; return; }
  const r = await api('/api/login','POST',{username:u,password:p});
  if (r.error) { e.textContent=r.error; e.style.display='block'; return; }
  TOKEN=r.token; localStorage.setItem('uj_tok',TOKEN); ME=r.user; showApp();
}

async function doLogout() {
  await api('/api/logout','POST');
  localStorage.removeItem('uj_tok'); localStorage.removeItem('uj_me');
  TOKEN=null; ME=null;
  document.getElementById('app').style.display='none';
  document.getElementById('login-page').style.display='flex';
  document.getElementById('lu').value=''; document.getElementById('lp').value='';
}

async function checkSession() {
  if (!TOKEN) return;
  const r = await api('/api/stats');
  if (r.error) { localStorage.removeItem('uj_tok'); TOKEN=null; return; }
  const stored = localStorage.getItem('uj_me');
  if (stored) { ME=JSON.parse(stored); showApp(); }
}

function showApp() {
  localStorage.setItem('uj_me', JSON.stringify(ME));
  document.getElementById('login-page').style.display='none';
  document.getElementById('app').style.display='block';
  document.getElementById('hn').textContent=ME.fullName;
  const rb=document.getElementById('hr'); rb.textContent=RLABELS[ME.role]; rb.className='rtag '+RCLS[ME.role];
  buildSidebar(); buildPanels();
  if (ME.role!=='admin') document.getElementById('nav-users').style.display='none';
  loadDash();
}

// ══ Navigation ══
function toggleSidebar() {
  document.getElementById('sidebar')?.classList.toggle('open');
  document.getElementById('sb-overlay')?.classList.toggle('open');
}
function closeSidebar() {
  document.getElementById('sidebar')?.classList.remove('open');
  document.getElementById('sb-overlay')?.classList.remove('open');
}

function go(name, el) {
  document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.ni').forEach(n=>n.classList.remove('active'));
  const panel = document.getElementById('panel-'+name);
  if (panel) panel.classList.add('active');
  if (el) el.classList.add('active');
  if (window.innerWidth <= 768) closeSidebar();
  const loaders = {
    dash:loadDash, incomplete:loadIncomplete, students:loadStudents, achievements:loadAchievements,
    activity_requests:loadAR, activity_requests_external:loadARExternal, announcements:()=>loadForm('announcements'), hall_bookings:()=>loadForm('hall_bookings'),
    participants:()=>loadParticipants(), committees:()=>loadForm('committees'),
    meeting_invites:()=>loadForm('meeting_invites'), meeting_minutes:()=>loadForm('meeting_minutes'),
    governance:()=>loadQ('governance'), student_activities:()=>loadQ('student_activities'), student_activities_external:()=>loadQ('student_activities_external'),
    student_honors:()=>loadQ('student_honors'), staff_committees:()=>loadQ('staff_committees'),
    staff_training:()=>loadQ('staff_training'), staff_innovation:()=>loadQ('staff_innovation'),
    staff_honors:()=>loadQ('staff_honors'), uni_committees:()=>loadQ('uni_committees'),
    community_svc:()=>loadQ('community_svc'),
    reports:loadReports, search:loadSearch, users:loadUsers, committee_report:loadCommitteeReport, sa_report:loadStudentActivitiesReport, cat_report:loadCategoryReport,
  };
  if (loaders[name]) loaders[name]();
}

// ══ Dashboard ══
async function loadDash() {
  const stats = await api('/api/stats');
  Object.keys(stats).forEach(k=>{ const el=document.getElementById('c-'+k); if(el) el.textContent=stats[k]||0; });
  document.getElementById('c-all').textContent = Object.values(stats).filter(v=>typeof v==='number').reduce((a,b)=>a+b,0);
  const incEl=document.getElementById('c-inc');
  if(incEl) incEl.textContent = stats.incomplete||0;

  const pendingAll = await api('/api/activity_requests');
  const pending = (pendingAll||[]).filter(r=>!['approved','rejected'].includes(r.status||'pending'))
    .filter(r=>!(['coordinator','manager'].includes(ME?.role) && ME.department) || r.organizer===ME.department);
  const deptStats = await api('/api/dept-stats');

  document.getElementById('panel-dash').innerHTML = `
  <div class="ph"><div><div class="pt">لوحة التحكم الموحدة</div><div class="ps">الجامعة الأردنية — عمادة شؤون الطلبة</div></div></div>
  ${(pending||[]).length ? (()=>{
    const returnedCount = pending.filter(r=>(r.status==='pending'&&r.manager_return_note)||(r.status==='awaiting_manager'&&r.dean_return_note)).length;
    return `
  <div class="card"><div class="ct" style="color:#633806"><i class="ti ti-clock"></i>طلبات قيد المعالجة (${pending.length})${returnedCount?` <span style="background:#FDEBD0;color:#8A4B0F;font-size:11px;font-weight:700;padding:2px 9px;border-radius:20px;margin-right:8px">⚠️ ${returnedCount} طلب مُرجَع بحاجة لمتابعتك</span>`:''}</div>`;
  })() : ''}
  ${(pending||[]).length ? `
  <div class="tw"><table><thead><tr><th>#</th><th>عنوان الفعالية</th><th>النوع</th><th>الجهة المنظمة</th><th>مقدم الطلب</th><th>تاريخ النشاط</th><th>المرحلة</th><th></th></tr></thead>
  <tbody>${(pending||[]).slice(0,6).map((r,i)=>{
    const status=r.status||'pending'; const role=ME?.role; let actions='';
    if(status==='pending' && ['coordinator','admin'].includes(role)) actions+=`<button class="btn btn-sm btn-g" onclick="coordDecision('${r.id}','forward')">✅ قبول</button><button class="btn btn-sm btn-r" onclick="coordDecision('${r.id}','reject')">❌ رفض</button><button class="btn btn-sm" style="color:#1B5E9A;border-color:#1B5E9A" onclick="editContentAR('${r.id}')">✏️</button>`;
    if(status==='awaiting_manager' && ['manager','admin'].includes(role)) actions+=`<button class="btn btn-sm btn-g" onclick="mgrDecision('${r.id}','forward')">✅ موافقة</button><button class="btn btn-sm" style="color:#8A4B0F;border-color:#8A4B0F" onclick="mgrReturn('${r.id}')">↩️ للمنسّق</button><button class="btn btn-sm btn-r" onclick="mgrDecision('${r.id}','reject')">❌ رفض نهائي</button><button class="btn btn-sm" style="color:#1B5E9A;border-color:#1B5E9A" onclick="editContentAR('${r.id}')">✏️</button>`;
    if(status==='awaiting_dean' && ['dean','admin'].includes(role)) actions+=`<button class="btn btn-sm btn-g" onclick="openApprove('${r.id}','approve')">✅ اعتماد</button><button class="btn btn-sm" style="color:#8A4B0F;border-color:#8A4B0F" onclick="deanReturn('${r.id}')">↩️ إرجاع</button>`;
    if(role==='admin') actions+=`<button class="btn btn-sm" style="background:#5B4636;color:#fff;border-color:#5B4636" onclick="openApprove('${r.id}','admin_approve')">🚀 تجاوز</button>`;
    const mgrReturnNote = (status==='pending' && r.manager_return_note) ? `<div style="font-size:10.5px;color:#8A4B0F;margin-top:3px">↩️ أعاده المدير: ${r.manager_return_note}</div>` : '';
    const deanReturnNote = (status==='awaiting_manager' && r.dean_return_note) ? `<div style="font-size:10.5px;color:#8A4B0F;margin-top:3px">↩️ أعاده العميد: ${r.dean_return_note}</div>` : '';
    return `<tr>
    <td>${i+1}</td><td><strong>${r.title||'-'}</strong></td><td>${r.type||'-'}</td>
    <td style="font-size:11px;color:var(--g)">${r.organizer||'-'}</td>
    <td>${r.student_name||'-'}</td><td>${r.activity_date||'-'}</td>
    <td>${stBadge(status)}${mgrReturnNote}${deanReturnNote}</td>
    <td><div class="rb">
      ${actions}
      <button class="btn btn-sm" style="color:#1B5E9A;border-color:#1B5E9A" onclick="viewAR('${r.id}')">👁️</button>
      <button class="btn btn-sm btn-b" onclick="printAR('${r.id}')">🖨️</button>
    </div></td>
  </tr>`;}).join('')}</tbody></table></div></div>` : ''}
  <div class="card"><div class="ct"><i class="ti ti-building-bank"></i>إحصائية الدوائر والجهات المنظِّمة</div>
  <div class="dept-grid" style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px">
    ${DEANSHIP_DEPTS.map(d=>{
      const st = (deptStats && deptStats[d]) || {pending:0,incomplete:0,activities:0,activities_external:0};
      const [bg,fg] = DEPT_COLORS[d] || ['#F2F2F2','#333'];
      const rows = [
        ['طلبات قيد المعالجة', st.pending||0],
        ['طلبات غير مكتملة', st.incomplete||0],
        ['الأنشطة الطلابية', st.activities||0],
        ['الأنشطة الطلابية الخارجية', st.activities_external||0]
      ];
      return `<div style="background:${bg};border-radius:var(--r);padding:12px 14px">
        <div style="font-weight:700;text-align:center;color:${fg};font-size:13.5px;margin-bottom:8px;padding-bottom:8px;border-bottom:1px solid ${fg}33">${d}</div>
        ${rows.map(([label,n],i)=>`<div style="display:flex;justify-content:space-between;align-items:center;padding:5px 2px;${i<rows.length-1?`border-bottom:1px solid ${fg}22`:''}"><span style="font-size:11.5px;color:${fg}">${label}</span><span style="font-weight:700;color:${fg};font-size:13.5px">${n}</span></div>`).join('')}
      </div>`;
    }).join('')}
  </div></div>`;
}

async function delRec(table,id,cb) {
  if (!confirm('هل تريد حذف هذا السجل؟')) return;
  await api('/api/'+table+'/'+id,'DELETE');
  if (cb) cb();
}
