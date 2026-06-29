// ══════════════════════════════════════════
// الثوابت
// ══════════════════════════════════════════
const ACTS = ['المرسم الجامعي','الموسيقى','الخط العربي','الحرف اليدوية','المسرح الجامعي','الأداء الحركي','المناظرات','الأنشطة الحزبية'];
const COLS = ['كلية الآداب','كلية الأعمال','كلية الشريعة','كلية العلوم التربوية','كلية الحقوق','كلية علوم الرياضة','كلية الفنون والتصميم','كلية الأمير الحسين بن عبد الله الثاني للعلوم السياسية والدراسات الدولية','كلية اللغات الأجنبية','كلية الآثار والسياحة','كلية العلوم','كلية الزراعة','كلية الهندسة','كلية الملك عبد الله الثاني لتكنولوجيا المعلومات','كلية الطب','كلية التمريض','كلية طب الأسنان','كلية علوم التأهيل','معهد الصحة العامة','كلية الدراسات العليا'];
const ADMIT = ['تنافس','موازي','دولي','تحويل','تفوق فني'];
const YEARS = ['الأولى','الثانية','الثالثة','الرابعة','الخامسة','السادسة'];
const ACOLORS = {'المرسم الجامعي':['#EEEDFE','#3C3489'],'الموسيقى':['#E1F5EE','#085041'],'الخط العربي':['#FAEEDA','#633806'],'الحرف اليدوية':['#FAECE7','#712B13'],'المسرح الجامعي':['#FBE8F5','#5D1A4A'],'الأداء الحركي':['#EAF3DE','#27500A'],'المناظرات':['#E8F4FD','#0A4A6B'],'الأنشطة الحزبية':['#FBEAF0','#72243E']};
const RLABELS = {admin:'مدير',editor:'مدخل بيانات',viewer:'عرض فقط'};
const RCLS = {admin:'r-admin',editor:'r-editor',viewer:'r-viewer'};
const QTBL_LABELS = {
  workshops:'الدورات وورش العمل والمحاضرات',
  initiatives:'مبادرات الإبداع والابتكار والريادة',
  external_acts:'الأنشطة الإبداعية / الريادية الخارجية',
  competitions:'الأنشطة التي تعد للمنافسات',
  awareness:'الأنشطة والمحاضرات التوعوية',
  staff_innovation:'مشاركة الموظفين في أنشطة الإبداع',
  expert_acts:'الأنشطة التي شارك بها الخبراء من المجتمع',
  environment:'أنشطة البيئة والتنمية المستدامة',
  dialogues:'الجلسات الحوارية عن التشريعات السياسية',
  campaigns:'الحملات التوعوية والتثقيفية'
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
    try { return JSON.parse(t); } catch { return {error:t}; }
  } catch(e) { return {error:'تعذر الاتصال'}; }
}
const g = id => { const el=document.getElementById(id); return el?el.value.trim():''; };
const sg = (id,v) => { const el=document.getElementById(id); if(el) el.value=v||''; };
const today = () => new Date().toLocaleDateString('ar-JO',{year:'numeric',month:'long',day:'numeric'});

function openPrint(html) {
  const win = window.open('','_blank','width=960,height=720');
  win.document.write(`<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"><title>طباعة — عمادة شؤون الطلبة</title><style>
    *{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;box-sizing:border-box}
    body{font-family:'Segoe UI',Tahoma,Arial,sans-serif;direction:rtl;padding:8mm 10mm;color:#000;font-size:9.5pt}
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
    .no-print{text-align:center;margin-bottom:10px}
    @media print{.no-print{display:none}@page{margin:5mm 8mm}}
  </style></head><body>
  <div class="no-print">
    <button onclick="window.print()" style="background:#1B6B3A;color:#fff;border:none;padding:7px 22px;border-radius:6px;font-size:13px;cursor:pointer;margin-left:8px">🖨️ طباعة / حفظ PDF</button>
    <button onclick="window.close()" style="background:#666;color:#fff;border:none;padding:7px 22px;border-radius:6px;font-size:13px;cursor:pointer">✕ إغلاق</button>
  </div>
  ${html}</body></html>`);
  win.document.close();
  setTimeout(()=>win.print(),700);
}
const badge = act => { const[bg,fg]=ACOLORS[act]||['#eee','#555']; return `<span class="ab" style="background:${bg};color:${fg}">${act}</span>`; };
const stBadge = st => { const m={pending:'🟡 قيد الانتظار',approved:'✅ معتمد',rejected:'❌ مرفوض'}; const c={pending:'st-p',approved:'st-a',rejected:'st-r'}; return `<span class="st ${c[st]||'st-p'}">${m[st]||'🟡 قيد الانتظار'}</span>`; };
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
    <div class="ni" onclick="go('workshops',this)"><i class="ti ti-chalkboard"></i>الدورات وورش العمل<span class="cnt" id="c-workshops">0</span></div>
    <div class="ni" onclick="go('initiatives',this)"><i class="ti ti-bulb"></i>مبادرات الإبداع<span class="cnt" id="c-initiatives">0</span></div>
    <div class="ni" onclick="go('external_acts',this)"><i class="ti ti-world"></i>الأنشطة الخارجية<span class="cnt" id="c-external_acts">0</span></div>
    <div class="ni" onclick="go('competitions',this)"><i class="ti ti-medal"></i>أنشطة المنافسات<span class="cnt" id="c-competitions">0</span></div>
    <div class="ni" onclick="go('student_honors',this)"><i class="ti ti-award"></i>تكريم الطلبة<span class="cnt" id="c-student_honors">0</span></div>
    <div class="ni" onclick="go('staff_committees',this)"><i class="ti ti-users-group"></i>لجان الموظفين<span class="cnt" id="c-staff_committees">0</span></div>
    <div class="ni" onclick="go('staff_training',this)"><i class="ti ti-certificate"></i>تدريب الموظفين<span class="cnt" id="c-staff_training">0</span></div>
    <div class="ni" onclick="go('staff_innovation',this)"><i class="ti ti-rocket"></i>إبداع الموظفين<span class="cnt" id="c-staff_innovation">0</span></div>
    <div class="ni" onclick="go('staff_honors',this)"><i class="ti ti-star"></i>تكريم الموظفين<span class="cnt" id="c-staff_honors">0</span></div>
    <div class="ni" onclick="go('uni_committees',this)"><i class="ti ti-network"></i>اللجان الجامعية<span class="cnt" id="c-uni_committees">0</span></div>
    <div class="ni" onclick="go('community_svc',this)"><i class="ti ti-heart-handshake"></i>الخدمات المجتمعية<span class="cnt" id="c-community_svc">0</span></div>
    <div class="ni" onclick="go('awareness',this)"><i class="ti ti-bell"></i>الأنشطة التوعوية<span class="cnt" id="c-awareness">0</span></div>
    <div class="ni" onclick="go('expert_acts',this)"><i class="ti ti-user-star"></i>أنشطة الخبراء<span class="cnt" id="c-expert_acts">0</span></div>
    <div class="ni" onclick="go('environment',this)"><i class="ti ti-leaf"></i>أنشطة البيئة<span class="cnt" id="c-environment">0</span></div>
    <div class="ni" onclick="go('dialogues',this)"><i class="ti ti-messages"></i>الجلسات الحوارية<span class="cnt" id="c-dialogues">0</span></div>
    <div class="ni" onclick="go('campaigns',this)"><i class="ti ti-flag"></i>الحملات التوعوية<span class="cnt" id="c-campaigns">0</span></div>
  </div>

  <div class="sbt">الأدوات</div>
  <div class="ni" onclick="go('reports',this)"><i class="ti ti-file-analytics"></i>التقارير الموحدة</div>
  <div class="ni" onclick="go('committee_report',this)"><i class="ti ti-clipboard-list"></i>تقرير اجتماعات اللجان</div>
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
  const IDS = ['dash','incomplete','students','achievements','activity_requests','announcements','hall_bookings','participants','committees','meeting_invites','meeting_minutes','governance','workshops','initiatives','external_acts','competitions','student_honors','staff_committees','staff_training','staff_innovation','staff_honors','uni_committees','community_svc','awareness','expert_acts','environment','dialogues','campaigns','reports','committee_report','search','users'];
  panels.innerHTML = IDS.map(id=>`<div id="panel-${id}" class="panel${id==='dash'?' active':''}"></div>`).join('');
  // fill approve modal options
  const sel = document.getElementById('approve-tbl');
  Object.entries(QTBL_LABELS).forEach(([k,v])=>{ const o=document.createElement('option'); o.value=k; o.textContent=v; sel.appendChild(o); });
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
function go(name, el) {
  document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.ni').forEach(n=>n.classList.remove('active'));
  const panel = document.getElementById('panel-'+name);
  if (panel) panel.classList.add('active');
  if (el) el.classList.add('active');
  const loaders = {
    dash:loadDash, incomplete:loadIncomplete, students:loadStudents, achievements:loadAchievements,
    activity_requests:loadAR, announcements:()=>loadForm('announcements'), hall_bookings:()=>loadForm('hall_bookings'),
    participants:()=>loadParticipants(), committees:()=>loadForm('committees'),
    meeting_invites:()=>loadForm('meeting_invites'), meeting_minutes:()=>loadForm('meeting_minutes'),
    governance:()=>loadQ('governance'), workshops:()=>loadQ('workshops'), initiatives:()=>loadQ('initiatives'),
    external_acts:()=>loadQ('external_acts'), competitions:()=>loadQ('competitions'),
    student_honors:()=>loadQ('student_honors'), staff_committees:()=>loadQ('staff_committees'),
    staff_training:()=>loadQ('staff_training'), staff_innovation:()=>loadQ('staff_innovation'),
    staff_honors:()=>loadQ('staff_honors'), uni_committees:()=>loadQ('uni_committees'),
    community_svc:()=>loadQ('community_svc'), awareness:()=>loadQ('awareness'),
    expert_acts:()=>loadQ('expert_acts'), environment:()=>loadQ('environment'),
    dialogues:()=>loadQ('dialogues'), campaigns:()=>loadQ('campaigns'),
    reports:loadReports, search:loadSearch, users:loadUsers, committee_report:loadCommitteeReport,
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

  const pending = await api('/api/activity_requests?status=pending');
  const studs = await api('/api/students');
  const byAct = {}; ACTS.forEach(a=>byAct[a]=0);
  (studs||[]).forEach(s=>{ if(byAct[s.activity]!==undefined) byAct[s.activity]++; });

  document.getElementById('panel-dash').innerHTML = `
  <div class="ph"><div><div class="pt">لوحة التحكم الموحدة</div><div class="ps">الجامعة الأردنية — عمادة شؤون الطلبة</div></div></div>
  <div class="g4" style="margin-bottom:14px">
    ${[[stats.students||0,'طلبة مسجلون','#1B6B3A'],[stats.achievements||0,'إنجازات','#1B5E9A'],[stats.pending_requests||0,'طلبات معلقة','#633806'],[stats.incomplete||0,'غير مكتملة','#8B6914']].map(([n,l,c])=>`<div style="background:#fff;border:1px solid var(--border);border-radius:var(--r);padding:12px;text-align:center"><div style="font-size:26px;font-weight:700;color:${c}">${n}</div><div style="font-size:11px;color:var(--muted);margin-top:2px">${l}</div></div>`).join('')}
  </div>
  ${(pending||[]).length ? `
  <div class="card"><div class="ct" style="color:#633806"><i class="ti ti-clock"></i>طلبات تنتظر الاعتماد (${pending.length})</div>
  <div class="tw"><table><thead><tr><th>#</th><th>عنوان الفعالية</th><th>النوع</th><th>الجدول المستهدف</th><th>مقدم الطلب</th><th>تاريخ النشاط</th><th></th></tr></thead>
  <tbody>${(pending||[]).slice(0,6).map((r,i)=>`<tr>
    <td>${i+1}</td><td><strong>${r.title||'-'}</strong></td><td>${r.type||'-'}</td>
    <td style="font-size:11px;color:var(--g)">${QTBL_LABELS[r.quality_table]||'-'}</td>
    <td>${r.student_name||'-'}</td><td>${r.activity_date||'-'}</td>
    <td><div class="rb">
      ${ME?.role==='admin'?`<button class="btn btn-sm btn-g" onclick="openApprove('${r.id}')">✅ اعتماد</button><button class="btn btn-sm btn-r" onclick="rejectAR('${r.id}')">❌ رفض</button>`:''}
      <button class="btn btn-sm btn-b" onclick="printAR('${r.id}')">🖨️</button>
    </div></td>
  </tr>`).join('')}</tbody></table></div></div>` : ''}
  <div class="card"><div class="ct"><i class="ti ti-chart-bar"></i>توزيع الطلبة على الأنشطة الجامعية</div>
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:7px">
    ${ACTS.map(a=>{ const[bg,fg]=ACOLORS[a]; return `<div style="background:${bg};border-radius:var(--r);padding:10px;text-align:center"><div style="font-size:22px;font-weight:700;color:${fg}">${byAct[a]||0}</div><div style="font-size:10.5px;color:${fg};margin-top:2px">${a}</div></div>`; }).join('')}
  </div></div>`;
}

async function delRec(table,id,cb) {
  if (!confirm('هل تريد حذف هذا السجل؟')) return;
  await api('/api/'+table+'/'+id,'DELETE');
  if (cb) cb();
}
