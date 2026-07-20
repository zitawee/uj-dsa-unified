
// تحويل نص متعدد الأسطر إلى HTML (كل سطر منفصل)
function fmtVal(val) {
  if(!val && val !== 0) return '-';
  const str = String(val);
  if(str.includes('\n')) {
    return str.split('\n').filter(Boolean).map((s,i)=>`${i+1}. ${s}`).join('<br>');
  }
  return str;
}
// ══════════════════════════════════════════
// الطباعة
// ══════════════════════════════════════════
const UNIHEADER = `<div class="ph2">
  <img src="/logo.png" class="plogo" alt="شعار الجامعة الأردنية">
  <div class="puni"><div class="ar">الجامعة الأردنية</div><div class="en">The University of Jordan</div><div class="dep">عمادة شؤون الطلبة — Dean of Student Affairs</div></div>
  <div class="pmeta">`;

function prtHeader(title, code, extra='') {
  return UNIHEADER + `<div><strong>رقم النموذج:</strong> ${code||'-'}</div><div><strong>تاريخ الطباعة:</strong> ${today()}</div>${extra}</div></div><div class="ptitle">${title}</div>`;
}
function prtSign(label) { return `<div class="sbox"><div class="st2">${label}</div><div class="sl2">التوقيع: .........................</div></div>`; }
function prtApproval() {
  return `<div class="dbox"><div style="font-weight:700;color:#1B6B3A;margin-bottom:6px;font-size:9.5pt">خاص في عمادة شؤون الطلبة</div>
  <div class="sg2">${prtSign('تنسيب رئيس الشعبة')}${prtSign('تنسيب مدير الدائرة')}${prtSign('تنسيب نائب العميد')}</div>
  <div style="border:1px solid #1B6B3A;border-radius:4px;padding:7px;margin-top:8px">
    <div style="font-weight:700;color:#1B6B3A;margin-bottom:5px;font-size:9pt">قرار الأستاذ الدكتور عميد شؤون الطلبة:</div>
    <div style="font-size:8.5pt;display:flex;gap:20px"><span><span class="chk"></span> موافق</span><span><span class="chk"></span> غير موافق</span></div>
    <div style="margin-top:6px;font-size:8.5pt">الاسم: ......................................  التوقيع: ......................................</div>
  </div></div>`;
}


function buildARBodyHTML(r, cats) {
  return `
  <div class="fr"><span class="fl">نوع النشاط:</span><div style="display:flex;gap:10px;flex:1;font-size:8pt;flex-wrap:wrap">${['مبادرة','محاضرة','دورة تدريبية','ورشة','معرض','مسابقة','جلسة','حملة','أخرى'].map(t=>`<span><span class="chk">${r.type===t?'✓':''}</span> ${t}</span>`).join('')}</div></div>
  <div class="fr"><span class="fl">اسم / عنوان الفعالية:</span><span class="fv">${r.title||''}</span></div>
  <div class="fr"><span class="fl">اسم الفعالية في الإعلان:</span><span class="fv">${r.ad_title||''}</span></div>
  <div class="fr" style="min-height:42px"><span class="fl">وصف النشاط:</span><span class="fv">${r.description||''}</span></div>
  <div class="fr" style="min-height:42px"><span class="fl">أهداف النشاط:</span><span class="fv">${r.goals||''}</span></div>
  <div class="fr"><span class="fl">نوع الحضور:</span><span class="fv">${r.audience||''}</span></div>
  <div class="fr"><span class="fl">التكلفة المالية:</span><span class="fv">${r.cost||''}</span></div>
  <div class="fr"><span class="fl">الجهة المنظمة:</span><span class="fv" style="color:#1B6B3A;font-weight:600">${r.organizer||''}</span></div>
  ${(cats&&cats.length)?`<div class="fr" style="min-height:30px"><span class="fl">تصنيفات الجودة المعتمدة:</span><span class="fv" style="white-space:normal">${cats.map((c,i)=>`${i+1}. ${c}`).join('<br>')}</span></div>`:''}
  <div class="fg2">
    <div class="fr"><span class="fl">اسم مقدم الطلب:</span><span class="fv">${r.student_name||''}</span></div>
    <div class="fr"><span class="fl">تاريخ التقديم:</span><span class="fv">${r.submit_date||''}</span></div>
  </div>
  <div class="fg3">
    <div class="fr"><span class="fl">الكلية:</span><span class="fv">${r.college||''}</span></div>
    <div class="fr"><span class="fl">رقم الهاتف:</span><span class="fv">${r.phone||''}</span></div>
    <div class="fr"><span class="fl">الرقم الجامعي:</span><span class="fv">${r.student_id||''}</span></div>
  </div>
  <div class="fg3">
    <div class="fr"><span class="fl">تاريخ انعقاد النشاط:</span><span class="fv">${r.activity_date||''}</span></div>
    <div class="fr"><span class="fl">من الساعة:</span><span class="fv">${r.time_from||''}</span></div>
    <div class="fr"><span class="fl">إلى الساعة:</span><span class="fv">${r.time_to||''}</span></div>
  </div>
  <div class="fr"><span class="fl">مكان انعقاد النشاط:</span><span class="fv">${r.location||''}</span></div>
  <div class="psub">الخدمات المساندة المطلوبة</div>
  <div style="font-size:8.5pt;padding:3px 0">${(r.services||'').split('\n').map((s,i)=>`${i+1}. ${s}`).join('<br>')||'1. ..........  2. ..........  3. ..........'}</div>
  <div class="psub">مشرف النشاط</div>
  <div class="fg3">
    <div class="fr"><span class="fl">الاسم:</span><span class="fv">${r.supervisor||''}</span></div>
    <div class="fr"><span class="fl">الكلية:</span><span class="fv">${r.sup_college||''}</span></div>
    <div class="fr"><span class="fl">الهاتف:</span><span class="fv">${r.sup_phone||''}</span></div>
  </div>
  <div class="psub">مشاركة جهة خارجية</div>
  <div class="fr"><span class="fl">مشاركة جهة خارجية:</span><span class="fv">${r.guests||'-'}</span></div>
  <div class="fr"><span class="fl">اسم الجهة الخارجية:</span><span class="fv">${r.ext_name||''}</span></div>
  <div class="fr" style="min-height:35px"><span class="fl">أسماء المشاركين من الخارج:</span><span class="fv" style="white-space:pre-wrap">${r.ext_people||''}</span></div>
  ${prtApproval()}
  <div style="margin-top:9px;font-size:8pt">
    <div class="fg2">
      <div><strong>موافقة مساعد العميد لشؤون الطلبة:</strong><br>الاسم والتوقيع: ......................................</div>
      <div><strong>موافقة عميد الكلية المعني:</strong><br>الاسم والتوقيع: ......................................</div>
    </div>
    <div style="margin-top:6px"><strong>اسم رئيس الاتحاد:</strong> ..............................  <strong>توقيع/ختم رئيس اتحاد الطلبة:</strong> ..............................</div>
  </div>
  ${r.status==='approved'?`<div style="margin-top:10px;border:3px solid #27500A;border-radius:8px;padding:6px 14px;display:inline-block;color:#27500A;font-weight:700;font-size:10pt;transform:rotate(-5deg)">✅ معتمد — ${r.approved_by||''} — ${(r.approved_at||'').split('T')[0]}</div>`:''}`;
}

async function printAR(id) {
  const r=await api('/api/activity_requests/'+id); if(!r||r.error)return;
  const saList=await getCombinedActivitiesList();
  const cats=(typeof resolveReqCategories==='function')?resolveReqCategories(r, saList):(r.categories||[]);
  const html=prtHeader('نموذج طلب إقامة نشاط','DSA-02-01-05')+buildARBodyHTML(r, cats);
  openPrint(html);
}

function printBlankAR() {
  const html=prtHeader('نموذج طلب إقامة نشاط','DSA-02-01-05')+`
  <div class="fr"><span class="fl">نوع النشاط:</span><div style="display:flex;gap:10px;flex:1;font-size:8pt">${['مبادرة','محاضرة','دورة تدريبية','ورشة','معرض','مسابقة','أخرى'].map(t=>`<span><span class="chk"></span> ${t}</span>`).join('')}</div></div>
  <div class="fr"><span class="fl">اسم / عنوان الفعالية:</span><span class="fv"></span></div>
  <div class="fr"><span class="fl">اسم الفعالية في الإعلان:</span><span class="fv"></span></div>
  <div class="fr" style="min-height:42px"><span class="fl">وصف النشاط:</span><span class="fv"></span></div>
  <div class="fr" style="min-height:42px"><span class="fl">أهداف النشاط:</span><span class="fv"></span></div>
  <div class="fr"><span class="fl">نوع الحضور:</span><span class="fv"></span></div>
  <div class="fr"><span class="fl">التكلفة المالية:</span><span class="fv"></span></div>
  <div class="fg2"><div class="fr"><span class="fl">اسم مقدم الطلب:</span><span class="fv"></span></div><div class="fr"><span class="fl">تاريخ التقديم:</span><span class="fv"></span></div></div>
  <div class="fg3"><div class="fr"><span class="fl">الكلية:</span><span class="fv"></span></div><div class="fr"><span class="fl">رقم الهاتف:</span><span class="fv"></span></div><div class="fr"><span class="fl">الرقم الجامعي:</span><span class="fv"></span></div></div>
  <div class="fg3"><div class="fr"><span class="fl">تاريخ انعقاد النشاط:</span><span class="fv"></span></div><div class="fr"><span class="fl">من الساعة:</span><span class="fv"></span></div><div class="fr"><span class="fl">إلى الساعة:</span><span class="fv"></span></div></div>
  <div class="fr"><span class="fl">مكان انعقاد النشاط:</span><span class="fv"></span></div>
  <div class="psub">الخدمات المساندة المطلوبة</div>
  <div style="font-size:8.5pt;padding:3px 0">1. ..............<br>2. ..............<br>3. ..............</div>
  <div class="psub">مشرف النشاط</div>
  <div class="fg3"><div class="fr"><span class="fl">الاسم:</span><span class="fv"></span></div><div class="fr"><span class="fl">الكلية:</span><span class="fv"></span></div><div class="fr"><span class="fl">الهاتف:</span><span class="fv"></span></div></div>
  ${prtApproval()}`;
  openPrint(html);
}

function buildPartBodyHTML(r) {
  const students = r.students||[];
  return `
  <div class="fg2">
    <div class="fr"><span class="fl">اسم النشاط:</span><span class="fv">${r.activity||''}</span></div>
    <div class="fr"><span class="fl">يوم وتاريخ عقد النشاط:</span><span class="fv">${r.date||''}</span></div>
  </div>
  <div class="fg2">
    <div class="fr"><span class="fl">الجهة المسؤولة:</span><span class="fv">${r.organizer||''}</span></div>
    <div class="fr"><span class="fl">رقم النشاط للتقييم:</span><span class="fv">${r.eval_num||''}</span></div>
  </div>
  <table class="ptbl" style="margin-top:10px">
    <thead><tr><th>ت</th><th>اسم الطالب</th><th>الرقم الجامعي</th><th>الجنس</th><th>الجنسية</th><th>الكلية</th><th>التخصص</th><th>المستوى</th><th>رقم الهاتف</th></tr></thead>
    <tbody>${students.length?students.map((s,i)=>`<tr><td>${i+1}</td><td>${s.name||''}</td><td>${s.id||''}</td><td>${s.gender||''}</td><td>${s.nationality||''}</td><td>${s.college||''}</td><td>${s.major||''}</td><td>${s.year||''}</td><td>${s.phone||''}</td></tr>`).join(''):Array(25).fill(0).map((_,i)=>`<tr><td>${i+1}</td>${Array(8).fill('<td>&nbsp;</td>').join('')}</tr>`).join('')}</tbody>
  </table>
  <div style="margin-top:9px;font-size:8.5pt">
    <strong>المشرفون:</strong> ${(r.supervisors||'').split('\n').filter(Boolean).map((s,i)=>`${i+1}. ${s}`).join('  ')||'1. ............  2. ............  3. ............'}
    <br><br><strong>الموظفون:</strong> ${(r.staff||'').split('\n').filter(Boolean).map((s,i)=>`${i+1}. ${s}`).join('  ')||'1. ............  2. ............'}
  </div>`;
}

async function printPart(id) {
  const r=await api('/api/participants/'+id); if(!r||r.error)return;
  const html=prtHeader('نموذج أسماء الطلبة المشاركين في النشاط','DSA-02-01-02')+buildPartBodyHTML(r);
  openPrint(html);
}

function printBlankPart() {
  const html=prtHeader('نموذج أسماء الطلبة المشاركين في النشاط','DSA-02-01-02')+`
  <div class="fg2"><div class="fr"><span class="fl">اسم النشاط:</span><span class="fv"></span></div><div class="fr"><span class="fl">يوم وتاريخ عقد النشاط:</span><span class="fv"></span></div></div>
  <div class="fg2"><div class="fr"><span class="fl">الجهة المسؤولة:</span><span class="fv"></span></div><div class="fr"><span class="fl">رقم النشاط للتقييم:</span><span class="fv"></span></div></div>
  <table class="ptbl" style="margin-top:10px">
    <thead><tr><th>ت</th><th>اسم الطالب</th><th>الرقم الجامعي</th><th>الجنس</th><th>الجنسية</th><th>الكلية</th><th>التخصص</th><th>المستوى الدراسي</th><th>رقم الهاتف</th></tr></thead>
    <tbody>${Array(25).fill(0).map((_,i)=>`<tr><td>${i+1}</td>${Array(8).fill('<td>&nbsp;</td>').join('')}</tr>`).join('')}</tbody>
  </table>`;
  openPrint(html);
}

async function printQTable(table) {
  const cfg=QCFG[table]; if(!cfg)return;
  const rows=await api('/api/'+table);
  if(!rows?.length){alert('لا توجد بيانات للطباعة');return;}

  // استخدام جميع الحقول من cfg.fields وليس فقط cols
  const allFields = cfg.fields.map(f=>({id:f.id, label:f.l.replace(/\*/g,'').trim()}));
  const allHeads  = ['#', ...allFields.map(f=>f.label), 'المصدر'];

  const html=prtHeader(cfg.title,'')+`
  <table class="ptbl">
    <thead><tr>${allHeads.map(h=>`<th>${h}</th>`).join('')}</tr></thead>
    <tbody>${rows.map((r,i)=>`<tr>
      <td>${i+1}</td>
      ${allFields.map(f=>`<td style='vertical-align:top'>${fmtVal(r[f.id])}</td>`).join('')}
      <td style="font-size:7pt">${r.source?'مرحَّل':'يدوي'}</td>
    </tr>`).join('')}</tbody>
  </table>
  <div style="margin-top:6px;font-size:8pt;color:#666">إجمالي السجلات: ${rows.length}</div>`;
  openPrint(html);
}

// ══════════════════════════════════════════
// التقارير الموحدة
// ══════════════════════════════════════════
async function loadReports() {
  document.getElementById('panel-reports').innerHTML=`
  <div class="ph"><div><div class="pt"><i class="ti ti-file-analytics"></i> التقارير الموحدة</div><div class="ps">الجامعة الأردنية — عمادة شؤون الطلبة | متوافقة مع معايير </div></div></div>
  <div class="card">
    <div class="ct"><i class="ti ti-filter"></i>خيارات التقرير</div>
    <div class="g3">
      <div class="fg"><label>نوع الفترة</label><select id="rp" onchange="toggleRP()"><option value="custom">فترة مخصصة</option><option value="monthly">شهري</option><option value="yearly">سنوي</option><option value="all">جميع البيانات</option></select></div>
      <div id="rpm" class="fg" style="display:none"><label>الشهر والسنة</label><input type="month" id="rpm-v"></div>
      <div id="rpy" class="fg" style="display:none"><label>السنة</label><input type="number" id="rpy-v" placeholder="2024"></div>
      <div id="rpc" style="display:contents">
        <div class="fg"><label>من تاريخ</label><input type="date" id="rp-from"></div>
        <div class="fg"><label>إلى تاريخ</label><input type="date" id="rp-to"></div>
      </div>
    </div>
    <div style="display:flex;gap:8px;margin-top:10px">
      <button class="btn btn-g" onclick="genReport()"><i class="ti ti-file-analytics"></i>توليد التقرير</button>
      <button class="btn btn-b" onclick="printReport()"><i class="ti ti-printer"></i>طباعة / PDF</button>
    </div>
  </div>
  <div id="rpt-out" style="margin-top:14px"></div>`;
}

function toggleRP() {
  const v=document.getElementById('rp').value;
  document.getElementById('rpm').style.display=v==='monthly'?'block':'none';
  document.getElementById('rpy').style.display=v==='yearly'?'block':'none';
  document.getElementById('rpc').style.display=v==='custom'?'contents':'none';
}

function getRPRange() {
  const v=document.getElementById('rp')?.value;
  if(v==='all')return{from:'',to:''};
  if(v==='monthly'){const m=document.getElementById('rpm-v')?.value;if(!m)return{from:'',to:''};const[y,mo]=m.split('-');const last=new Date(y,mo,0).getDate();return{from:`${y}-${mo}-01`,to:`${y}-${mo}-${last}`};}
  if(v==='yearly'){const y=document.getElementById('rpy-v')?.value;if(!y)return{from:'',to:''};return{from:`${y}-01-01`,to:`${y}-12-31`};}
  return{from:document.getElementById('rp-from')?.value||'',to:document.getElementById('rp-to')?.value||''};
}

async function genReport() {
  const{from,to}=getRPRange();
  const qs=new URLSearchParams(); if(from)qs.set('from',from); if(to)qs.set('to',to);
  const qstr='?'+qs;
  const QTBLS=['governance','student_activities','student_honors','staff_committees','staff_training','staff_innovation','staff_honors','uni_committees','community_svc'];
  const[studs,achs,...qData]=await Promise.all([api('/api/students'+qstr),api('/api/achievements'+qstr),...QTBLS.map(t=>api('/api/'+t+qstr))]);
  const qStats={}; QTBLS.forEach((t,i)=>qStats[t]=qData[i]?.length||0);
  const total=Object.values(qStats).reduce((a,b)=>a+b,0);
  const pLabel=from&&to?`من ${from} إلى ${to}`:from?`من ${from}`:to?`إلى ${to}`:'جميع البيانات';

  document.getElementById('rpt-out').innerHTML=`
  <div style="background:#fff;border:1px solid var(--border);border-radius:var(--rl);padding:18px">
    <div style="text-align:center;padding:16px;border-bottom:3px solid var(--g);margin-bottom:14px">
      <img src="/logo.png" style="width:68px;height:68px;object-fit:contain;margin-bottom:7px">
      <div style="font-size:20px;font-weight:700;color:var(--g)">الجامعة الأردنية</div>
      <div style="font-size:13px;font-weight:600;color:#333;margin:3px 0">عمادة شؤون الطلبة — Dean of Student Affairs</div>
      <div style="background:var(--g);color:#fff;padding:7px 22px;border-radius:7px;display:inline-block;margin:9px 0;font-size:15px;font-weight:700">التقرير الشامل للجودة</div>
      <div style="font-size:12px;color:var(--muted)">الفترة: ${pLabel}</div>
      <div style="font-size:11px;color:#aaa;margin-top:3px">تاريخ الإصدار: ${today()} | </div>
    </div>
    <div style="font-size:13px;font-weight:600;color:var(--g);border-bottom:2px solid #C6E8D3;padding-bottom:5px;margin-bottom:9px">الملخص التنفيذي</div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:12px">
      ${[[(studs||[]).length,'طلبة مسجلون','var(--g)'],[achs?.length||0,'إنجازات','#1B5E9A'],[total,'سجلات الجودة','#633806'],[(achs||[]).filter(a=>a.honor==='نعم').length,'مكرَّمون','#8B6914']].map(([n,l,c])=>`<div style="background:#F0FAF4;border:1px solid #C6E8D3;border-radius:var(--r);padding:10px;text-align:center"><div style="font-size:22px;font-weight:700;color:${c}">${n}</div><div style="font-size:10.5px;color:var(--muted);margin-top:2px">${l}</div></div>`).join('')}
    </div>
    <table style="width:100%;border-collapse:collapse;font-size:12px;margin-bottom:14px">
      <thead><tr style="background:#F0FAF4"><th style="padding:6px 9px;border:1px solid #C6E8D3;color:var(--g);text-align:right">المجال</th><th style="padding:6px 9px;border:1px solid #C6E8D3;color:var(--g);text-align:center">عدد السجلات</th></tr></thead>
      <tbody>${QTBLS.map((t,i)=>`<tr style="background:${i%2?'#F9FAFB':'#fff'}"><td style="padding:5px 9px;border:1px solid var(--border)">${QCFG[t]?.title||t}</td><td style="padding:5px 9px;border:1px solid var(--border);text-align:center;font-weight:600;color:var(--g)">${qStats[t]}</td></tr>`).join('')}</tbody>
    </table>

  </div>`;
}

// ══════════════════════════════════════════
// تقرير اجتماعات اللجان
// ══════════════════════════════════════════
let _cmtReportData = { committees: [], byCommittee: {} };
let _cmtFilter = '';            // اللجنة المختارة حالياً (فارغ = الكل)
let _cmtFilterMatches = [];     // الأسماء المطابقة المعروضة في قائمة الاقتراح

async function loadCommitteeReport() {
  const panel = document.getElementById('panel-committee_report');
  _cmtFilter = '';
  panel.innerHTML = `
  <div class="ph">
    <div><div class="pt"><i class="ti ti-clipboard-list"></i> تقرير اجتماعات اللجان</div><div class="ps">عدد الاجتماعات التي عقدتها كل لجنة</div></div>
    <div style="display:flex;gap:6px">
      <button class="btn btn-b" onclick="printCommitteeReport()"><i class="ti ti-printer"></i>طباعة / PDF</button>
    </div>
  </div>
  <div class="card" style="display:flex;align-items:flex-end;gap:10px;flex-wrap:wrap">
    <div class="fg" id="cmt-filter-wrapper" style="margin:0;min-width:280px;flex:1;position:relative">
      <label>تصفية حسب اللجنة (ابحث بالاسم)</label>
      <input id="cmt-filter-input" type="text" autocomplete="off" placeholder="اكتب للبحث عن لجنة..."
        oninput="cmtFilterSuggest(this.value)" onfocus="cmtFilterSuggest(this.value)"
        style="padding:7px 10px;border:1px solid var(--border);border-radius:var(--r);font-family:inherit;width:100%">
      <div id="cmt-filter-list" style="display:none;position:absolute;top:100%;right:0;left:0;background:#fff;border:1px solid var(--border);border-radius:var(--r);box-shadow:0 4px 12px rgba(0,0,0,.1);z-index:100;max-height:260px;overflow-y:auto"></div>
    </div>
    <button class="btn" onclick="cmtFilterClear()" style="margin-bottom:0"><i class="ti ti-list"></i>عرض جميع اللجان</button>
    <div class="fg" style="margin:0"><label>من تاريخ</label><input type="date" id="cmt-from" onchange="renderCommitteeReport()"></div>
    <div class="fg" style="margin:0"><label>إلى تاريخ</label><input type="date" id="cmt-to" onchange="renderCommitteeReport()"></div>
    <button class="btn" onclick="document.getElementById('cmt-from').value='';document.getElementById('cmt-to').value='';renderCommitteeReport()" style="margin-bottom:0">كل الفترات</button>
  </div>
  <div id="cmt-rpt-out"><div style="padding:20px;text-align:center;color:var(--muted)">جارٍ التحميل...</div></div>`;

  const [committees, invites] = await Promise.all([
    api('/api/committees'),
    api('/api/meeting_invites')
  ]);

  // تجميع اجتماعات كل لجنة (التاريخ + رقم الجلسة) حسب اسم اللجنة
  const byCommittee = {};
  (invites || []).forEach(m => {
    const key = (m.committee || '').trim();
    if (!key) return;
    (byCommittee[key] = byCommittee[key] || []).push({
      date: (m.date || '').trim(),
      session: (m.session_num || '').toString().trim()
    });
  });

  _cmtReportData = { committees: committees || [], byCommittee };
  renderCommitteeReport();
}

// قائمة الاقتراحات للبحث عن لجنة
function cmtFilterSuggest(q) {
  const box = document.getElementById('cmt-filter-list');
  if (!box) return;
  const names = [...new Set((_cmtReportData.committees || []).map(c => (c.name || '').trim()).filter(Boolean))];
  const query = (q || '').trim().toLowerCase();
  _cmtFilterMatches = query ? names.filter(n => n.toLowerCase().includes(query)) : names;

  let html = `<div onclick="cmtFilterPick(-1)"
    style="padding:8px 12px;cursor:pointer;border-bottom:1px solid var(--border);font-size:12px;font-weight:700;color:var(--g)"
    onmouseover="this.style.background='#F0FAF4'" onmouseout="this.style.background=''">جميع اللجان</div>`;
  if (_cmtFilterMatches.length) {
    html += _cmtFilterMatches.map((n, i) => `<div onclick="cmtFilterPick(${i})"
      style="padding:8px 12px;cursor:pointer;border-bottom:1px solid var(--border);font-size:12px"
      onmouseover="this.style.background='#F0FAF4'" onmouseout="this.style.background=''">${n}</div>`).join('');
  } else {
    html += `<div style="padding:8px 12px;font-size:12px;color:var(--muted)">لا توجد لجنة مطابقة</div>`;
  }
  box.innerHTML = html;
  box.style.display = 'block';
}

// اختيار لجنة من القائمة (i = -1 يعني جميع اللجان)
function cmtFilterPick(i) {
  const name = (i >= 0 && _cmtFilterMatches[i] !== undefined) ? _cmtFilterMatches[i] : '';
  _cmtFilter = name;
  const input = document.getElementById('cmt-filter-input');
  if (input) input.value = name;
  const box = document.getElementById('cmt-filter-list');
  if (box) box.style.display = 'none';
  renderCommitteeReport();
}

function cmtFilterClear() {
  _cmtFilter = '';
  const input = document.getElementById('cmt-filter-input');
  if (input) input.value = '';
  const box = document.getElementById('cmt-filter-list');
  if (box) box.style.display = 'none';
  renderCommitteeReport();
}

// إغلاق قائمة الاقتراح عند النقر خارجها
document.addEventListener('click', e => {
  if (!e.target.closest('#cmt-filter-wrapper')) {
    const box = document.getElementById('cmt-filter-list');
    if (box) box.style.display = 'none';
  }
});

function renderCommitteeReport() {
  const { committees, byCommittee } = _cmtReportData;
  const filter = (_cmtFilter || '').trim();
  const from = document.getElementById('cmt-from')?.value || '';
  const to   = document.getElementById('cmt-to')?.value || '';

  const source = filter
    ? committees.filter(c => (c.name || '').trim() === filter)
    : committees;

  const rows = source.map(c => {
    const list = (byCommittee[(c.name || '').trim()] || [])
      .slice()
      // تصفية الاجتماعات حسب الفترة الزمنية المحددة
      .filter(m => (!from || (m.date || '') >= from) && (!to || (m.date || '') <= to))
      .sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    // قائمة التواريخ كأسطر منفصلة: رقم الجلسة — التاريخ
    const datesHtml = list.length
      ? list.map(m => {
          const d = m.date || '—';
          return m.session ? `الجلسة ${m.session} — ${d}` : d;
        }).map((s, i) => `${i + 1}. ${s}`).join('<br>')
      : '-';
    return {
      name:      (c.name || '').trim() || '-',
      date:      c.date || '-',
      ref_num:   c.ref_num || '-',
      meetings:  list.length,
      datesHtml,
      secretary: c.secretary || '-'
    };
  });

  const totalMeetings = rows.reduce((a, r) => a + r.meetings, 0);
  const scopeLabel = filter ? `اللجنة: ${filter}` : 'جميع اللجان';
  const periodLabel = from&&to ? `الفترة: من ${from} إلى ${to}` : from ? `الفترة: من ${from}` : to ? `الفترة: حتى ${to}` : 'الفترة: جميع التواريخ';

  document.getElementById('cmt-rpt-out').innerHTML = `
  <div style="background:#fff;border:1px solid var(--border);border-radius:var(--rl);padding:18px">
    <div style="text-align:center;padding:16px;border-bottom:3px solid var(--g);margin-bottom:14px">
      <img src="/logo.png" style="width:68px;height:68px;object-fit:contain;margin-bottom:7px">
      <div style="font-size:20px;font-weight:700;color:var(--g)">الجامعة الأردنية</div>
      <div style="font-size:13px;font-weight:600;color:#333;margin:3px 0">عمادة شؤون الطلبة — Dean of Student Affairs</div>
      <div style="background:var(--g);color:#fff;padding:7px 22px;border-radius:7px;display:inline-block;margin:9px 0;font-size:15px;font-weight:700">تقرير اجتماعات اللجان</div>
      <div style="font-size:12px;color:#333;font-weight:600;margin-top:2px">${scopeLabel}</div>
      <div style="font-size:11px;color:#555;margin-top:1px">${periodLabel}</div>
      <div style="font-size:11px;color:#aaa;margin-top:3px">تاريخ الإصدار: ${today()}</div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-bottom:12px">
      <div style="background:#F0FAF4;border:1px solid #C6E8D3;border-radius:var(--r);padding:10px;text-align:center"><div style="font-size:22px;font-weight:700;color:var(--g)">${rows.length}</div><div style="font-size:10.5px;color:var(--muted);margin-top:2px">عدد اللجان</div></div>
      <div style="background:#F0FAF4;border:1px solid #C6E8D3;border-radius:var(--r);padding:10px;text-align:center"><div style="font-size:22px;font-weight:700;color:#1B5E9A">${totalMeetings}</div><div style="font-size:10.5px;color:var(--muted);margin-top:2px">إجمالي الاجتماعات</div></div>
    </div>
    <table style="width:100%;border-collapse:collapse;font-size:12px">
      <thead><tr style="background:#F0FAF4">
        <th style="padding:6px 9px;border:1px solid #C6E8D3;color:var(--g);text-align:center">#</th>
        <th style="padding:6px 9px;border:1px solid #C6E8D3;color:var(--g);text-align:right">اسم اللجنة</th>
        <th style="padding:6px 9px;border:1px solid #C6E8D3;color:var(--g);text-align:center">تاريخ التشكيل</th>
        <th style="padding:6px 9px;border:1px solid #C6E8D3;color:var(--g);text-align:center">رقم كتاب التشكيل</th>
        <th style="padding:6px 9px;border:1px solid #C6E8D3;color:var(--g);text-align:center">عدد الاجتماعات</th>
        <th style="padding:6px 9px;border:1px solid #C6E8D3;color:var(--g);text-align:right">تواريخ الاجتماعات</th>
        <th style="padding:6px 9px;border:1px solid #C6E8D3;color:var(--g);text-align:right">مقرر اللجنة</th>
      </tr></thead>
      <tbody>
        ${rows.length ? rows.map((r, i) => `<tr style="background:${i%2?'#F9FAFB':'#fff'}">
          <td style="padding:5px 9px;border:1px solid var(--border);text-align:center">${i+1}</td>
          <td style="padding:5px 9px;border:1px solid var(--border)">${r.name}</td>
          <td style="padding:5px 9px;border:1px solid var(--border);text-align:center">${r.date}</td>
          <td style="padding:5px 9px;border:1px solid var(--border);text-align:center">${r.ref_num}</td>
          <td style="padding:5px 9px;border:1px solid var(--border);text-align:center;font-weight:700;color:var(--g)">${r.meetings}</td>
          <td style="padding:5px 9px;border:1px solid var(--border);font-size:11px;line-height:1.7">${r.datesHtml}</td>
          <td style="padding:5px 9px;border:1px solid var(--border)">${r.secretary}</td>
        </tr>`).join('') : `<tr><td colspan="7" style="padding:14px;text-align:center;color:var(--muted)">لا توجد لجان مطابقة</td></tr>`}
      </tbody>
    </table>
  </div>`;
}

function printCommitteeReport() {
  const content = document.getElementById('cmt-rpt-out');
  if (!content || !content.innerHTML.trim() || content.innerHTML.includes('جارٍ التحميل')) {
    alert('لا يوجد تقرير للطباعة');
    return;
  }
  const body = content.innerHTML;
  const fullDoc = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<title>تقرير اجتماعات اللجان — عمادة شؤون الطلبة</title>
<style>
  *{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;box-sizing:border-box}
  :root{--g:#1B6B3A;--g2:#145229;--muted:#6B7280;--border:#E5E7EB;--r:8px;--rl:12px;--blue:#1B5E9A}
  body{font-family:'Segoe UI',Tahoma,Arial,sans-serif;direction:rtl;padding:8mm 10mm;color:#000;font-size:9.5pt;margin:0}
  img{max-width:100%}
  table{width:100%;border-collapse:collapse;font-size:8.5pt;margin-top:6px}
  th{background:#1B6B3A;color:#fff;padding:4px 6px;text-align:right;border:1px solid #ccc}
  td{padding:4px 6px;border:1px solid #ccc}
  tr:nth-child(even) td{background:#F0FAF4}
  @media print{@page{margin:5mm 8mm}}
</style>
</head>
<body>
${body}
</body></html>`;
  printDocument(fullDoc);
}

// ══════════════════════════════════════════
// تقرير الأنشطة الطلابية (تجميع حسب التصنيفات)
// ══════════════════════════════════════════
let _saReportData = [];

async function loadStudentActivitiesReport() {
  const panel = document.getElementById('panel-sa_report');
  panel.innerHTML = `
  <div class="ph">
    <div><div class="pt"><i class="ti ti-confetti"></i> تقرير الأنشطة الطلابية</div><div class="ps">عدد الأنشطة المُسجَّلة ضمن كل تصنيف من تصنيفات الجودة</div></div>
    <div style="display:flex;gap:6px">
      <button class="btn btn-b" onclick="printStudentActivitiesReport()"><i class="ti ti-printer"></i>طباعة / PDF</button>
    </div>
  </div>
  <div class="card" style="display:flex;align-items:flex-end;gap:10px;flex-wrap:wrap">
    <div class="fg" style="margin:0"><label>من تاريخ</label><input type="date" id="sar-from" onchange="renderSAReport()"></div>
    <div class="fg" style="margin:0"><label>إلى تاريخ</label><input type="date" id="sar-to" onchange="renderSAReport()"></div>
    <button class="btn" onclick="document.getElementById('sar-from').value='';document.getElementById('sar-to').value='';renderSAReport()" style="margin-bottom:0"><i class="ti ti-list"></i>عرض كل الفترات</button>
    <div style="font-size:11px;color:var(--muted);padding-bottom:8px">النشاط الذي يحمل أكثر من تصنيف يُحتسب ضمن كل تصنيف اختير له.</div>
  </div>
  <div id="sar-out"><div style="padding:20px;text-align:center;color:var(--muted)">جارٍ التحميل...</div></div>`;

  _saReportData = (await api('/api/student_activities')) || [];
  renderSAReport();
}

function renderSAReport() {
  const from = document.getElementById('sar-from')?.value || '';
  const to   = document.getElementById('sar-to')?.value || '';
  let rows = Array.isArray(_saReportData) ? _saReportData.slice() : [];
  if(from) rows = rows.filter(r => (r.date||'') >= from);
  if(to)   rows = rows.filter(r => (r.date||'') <= to);

  // عدّ الأنشطة ضمن كل تصنيف (النشاط متعدد التصنيفات يُحسب في كل تصنيف)
  const cats = (typeof ACTIVITY_CATEGORIES!=='undefined') ? ACTIVITY_CATEGORIES : [];
  const counts = {}; cats.forEach(c => counts[c] = 0);
  let uncategorized = 0;
  rows.forEach(r => {
    const rc = Array.isArray(r.categories) ? r.categories : [];
    if(!rc.length){ uncategorized++; return; }
    rc.forEach(c => { if(counts[c]===undefined) counts[c]=0; counts[c]++; });
  });
  const totalActs   = rows.length;
  const totalAssign = Object.values(counts).reduce((a,b)=>a+b,0);
  const pLabel = from&&to ? `من ${from} إلى ${to}` : from ? `من ${from}` : to ? `حتى ${to}` : 'جميع الفترات';

  document.getElementById('sar-out').innerHTML = `
  <div style="background:#fff;border:1px solid var(--border);border-radius:var(--rl);padding:18px">
    <div style="text-align:center;padding:16px;border-bottom:3px solid var(--g);margin-bottom:14px">
      <img src="/logo.png" style="width:68px;height:68px;object-fit:contain;margin-bottom:7px">
      <div style="font-size:20px;font-weight:700;color:var(--g)">الجامعة الأردنية</div>
      <div style="font-size:13px;font-weight:600;color:#333;margin:3px 0">عمادة شؤون الطلبة — Dean of Student Affairs</div>
      <div style="background:var(--g);color:#fff;padding:7px 22px;border-radius:7px;display:inline-block;margin:9px 0;font-size:15px;font-weight:700">تقرير الأنشطة الطلابية حسب التصنيف</div>
      <div style="font-size:12px;color:#333;font-weight:600;margin-top:2px">الفترة: ${pLabel}</div>
      <div style="font-size:11px;color:#aaa;margin-top:3px">تاريخ الإصدار: ${today()}</div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-bottom:12px">
      <div style="background:#F0FAF4;border:1px solid #C6E8D3;border-radius:var(--r);padding:10px;text-align:center"><div style="font-size:22px;font-weight:700;color:var(--g)">${totalActs}</div><div style="font-size:10.5px;color:var(--muted);margin-top:2px">عدد الأنشطة الفعلية</div></div>
      <div style="background:#F0FAF4;border:1px solid #C6E8D3;border-radius:var(--r);padding:10px;text-align:center"><div style="font-size:22px;font-weight:700;color:#1B5E9A">${totalAssign}</div><div style="font-size:10.5px;color:var(--muted);margin-top:2px">إجمالي الإسناد للتصنيفات</div></div>
    </div>
    <table style="width:100%;border-collapse:collapse;font-size:12px">
      <thead><tr style="background:#F0FAF4">
        <th style="padding:6px 9px;border:1px solid #C6E8D3;color:var(--g);text-align:center">#</th>
        <th style="padding:6px 9px;border:1px solid #C6E8D3;color:var(--g);text-align:right">التصنيف</th>
        <th style="padding:6px 9px;border:1px solid #C6E8D3;color:var(--g);text-align:center">عدد الأنشطة</th>
      </tr></thead>
      <tbody>
        ${cats.map((c,i)=>`<tr style="background:${i%2?'#F9FAFB':'#fff'}">
          <td style="padding:5px 9px;border:1px solid var(--border);text-align:center">${i+1}</td>
          <td style="padding:5px 9px;border:1px solid var(--border)">${c}</td>
          <td style="padding:5px 9px;border:1px solid var(--border);text-align:center;font-weight:700;color:var(--g)">${counts[c]||0}</td>
        </tr>`).join('')}
        ${uncategorized?`<tr style="background:#FFF7ED"><td style="padding:5px 9px;border:1px solid var(--border);text-align:center">—</td><td style="padding:5px 9px;border:1px solid var(--border);color:#9A6A1B">أنشطة بدون تصنيف</td><td style="padding:5px 9px;border:1px solid var(--border);text-align:center;font-weight:700;color:#9A6A1B">${uncategorized}</td></tr>`:''}
      </tbody>
    </table>
  </div>`;
}

function printStudentActivitiesReport() {
  const content = document.getElementById('sar-out');
  if(!content || !content.innerHTML.trim() || content.innerHTML.includes('جارٍ التحميل')){ alert('لا يوجد تقرير للطباعة'); return; }
  const fullDoc = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<title>تقرير الأنشطة الطلابية — عمادة شؤون الطلبة</title>
<style>
  *{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;box-sizing:border-box}
  :root{--g:#1B6B3A;--g2:#145229;--muted:#6B7280;--border:#E5E7EB;--r:8px;--rl:12px;--blue:#1B5E9A}
  body{font-family:'Segoe UI',Tahoma,Arial,sans-serif;direction:rtl;padding:8mm 10mm;color:#000;font-size:9.5pt;margin:0}
  img{max-width:100%}
  table{width:100%;border-collapse:collapse;font-size:8.5pt;margin-top:6px}
  th{background:#1B6B3A;color:#fff;padding:4px 6px;text-align:right;border:1px solid #ccc}
  td{padding:4px 6px;border:1px solid #ccc}
  tr:nth-child(even) td{background:#F0FAF4}
  @media print{@page{margin:5mm 8mm}}
</style>
</head>
<body>
${content.innerHTML}
</body></html>`;
  printDocument(fullDoc);
}

// ══════════════════════════════════════════
// تقرير حسب التصنيف (أنشطة تصنيف محدد)
// ══════════════════════════════════════════
let _catReportData = [];

async function loadCategoryReport() {
  const panel = document.getElementById('panel-cat_report');
  const cats = (typeof ACTIVITY_CATEGORIES!=='undefined') ? ACTIVITY_CATEGORIES : [];
  panel.innerHTML = `
  <div class="ph">
    <div><div class="pt"><i class="ti ti-category"></i> تقرير حسب التصنيفات</div><div class="ps">قائمة الأنشطة المندرجة تحت تصنيف محدد</div></div>
    <div style="display:flex;gap:6px">
      <button class="btn btn-b" onclick="printCategoryReport()"><i class="ti ti-printer"></i>طباعة / PDF</button>
    </div>
  </div>
  <div class="card" style="display:flex;align-items:flex-end;gap:10px;flex-wrap:wrap">
    <div class="fg" style="margin:0;min-width:300px;flex:1">
      <label>التصنيف</label>
      <select id="cat-sel" onchange="renderCategoryReport()" style="padding:8px;border:1px solid var(--border);border-radius:var(--r);font-family:inherit;width:100%">
        <option value="">اختر التصنيف...</option>
        ${cats.map(c=>`<option value="${c.replace(/"/g,'&quot;')}">${c}</option>`).join('')}
      </select>
    </div>
    <div class="fg" style="margin:0"><label>من تاريخ</label><input type="date" id="cat-from" onchange="renderCategoryReport()"></div>
    <div class="fg" style="margin:0"><label>إلى تاريخ</label><input type="date" id="cat-to" onchange="renderCategoryReport()"></div>
  </div>
  <div id="cat-out"><div style="padding:20px;text-align:center;color:var(--muted)">اختر تصنيفاً لعرض أنشطته.</div></div>`;

  _catReportData = (await api('/api/student_activities')) || [];
  renderCategoryReport();
}

function renderCategoryReport() {
  const cat  = document.getElementById('cat-sel')?.value || '';
  const from = document.getElementById('cat-from')?.value || '';
  const to   = document.getElementById('cat-to')?.value || '';
  const out  = document.getElementById('cat-out');
  if(!out) return;

  if(!cat){
    out.innerHTML = `<div style="padding:20px;text-align:center;color:var(--muted)">اختر تصنيفاً لعرض أنشطته.</div>`;
    return;
  }

  let rows = (Array.isArray(_catReportData)?_catReportData:[])
    .filter(r => Array.isArray(r.categories) && r.categories.includes(cat));
  if(from) rows = rows.filter(r => (r.date||'') >= from);
  if(to)   rows = rows.filter(r => (r.date||'') <= to);
  rows.sort((a,b)=>(a.date||'').localeCompare(b.date||''));

  const pLabel = from&&to ? `من ${from} إلى ${to}` : from ? `من ${from}` : to ? `حتى ${to}` : 'جميع الفترات';

  out.innerHTML = `
  <div style="background:#fff;border:1px solid var(--border);border-radius:var(--rl);padding:18px">
    <div style="text-align:center;padding:16px;border-bottom:3px solid var(--g);margin-bottom:14px">
      <img src="/logo.png" style="width:68px;height:68px;object-fit:contain;margin-bottom:7px">
      <div style="font-size:20px;font-weight:700;color:var(--g)">الجامعة الأردنية</div>
      <div style="font-size:13px;font-weight:600;color:#333;margin:3px 0">عمادة شؤون الطلبة — Dean of Student Affairs</div>
      <div style="background:var(--g);color:#fff;padding:7px 22px;border-radius:7px;display:inline-block;margin:9px 0;font-size:15px;font-weight:700">${cat}</div>
      <div style="font-size:12px;color:#333;font-weight:600;margin-top:2px">عدد الأنشطة: ${rows.length} — الفترة: ${pLabel}</div>
      <div style="font-size:11px;color:#aaa;margin-top:3px">تاريخ الإصدار: ${today()}</div>
    </div>
    <table style="width:100%;border-collapse:collapse;font-size:12px">
      <thead><tr style="background:#F0FAF4">
        <th style="padding:6px 9px;border:1px solid #C6E8D3;color:var(--g);text-align:center">#</th>
        <th style="padding:6px 9px;border:1px solid #C6E8D3;color:var(--g);text-align:right">عنوان النشاط</th>
        <th style="padding:6px 9px;border:1px solid #C6E8D3;color:var(--g);text-align:right">الجهة المنظمة</th>
        <th style="padding:6px 9px;border:1px solid #C6E8D3;color:var(--g);text-align:center">التاريخ</th>
      </tr></thead>
      <tbody>
        ${rows.length ? rows.map((r,i)=>`<tr style="background:${i%2?'#F9FAFB':'#fff'}">
          <td style="padding:5px 9px;border:1px solid var(--border);text-align:center">${i+1}</td>
          <td style="padding:5px 9px;border:1px solid var(--border)">${r.title||'-'}</td>
          <td style="padding:5px 9px;border:1px solid var(--border)">${r.organizer||'-'}</td>
          <td style="padding:5px 9px;border:1px solid var(--border);text-align:center">${r.date||'-'}</td>
        </tr>`).join('') : `<tr><td colspan="4" style="padding:14px;text-align:center;color:var(--muted)">لا توجد أنشطة ضمن هذا التصنيف في الفترة المحددة</td></tr>`}
      </tbody>
    </table>
  </div>`;
}

function printCategoryReport() {
  const cat = document.getElementById('cat-sel')?.value || '';
  const content = document.getElementById('cat-out');
  if(!cat || !content || content.innerHTML.includes('اختر تصنيفاً')){ alert('يرجى اختيار تصنيف أولاً'); return; }
  const fullDoc = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<title>تقرير حسب التصنيف — عمادة شؤون الطلبة</title>
<style>
  *{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;box-sizing:border-box}
  :root{--g:#1B6B3A;--g2:#145229;--muted:#6B7280;--border:#E5E7EB;--r:8px;--rl:12px;--blue:#1B5E9A}
  body{font-family:'Segoe UI',Tahoma,Arial,sans-serif;direction:rtl;padding:8mm 10mm;color:#000;font-size:9.5pt;margin:0}
  img{max-width:100%}
  table{width:100%;border-collapse:collapse;font-size:8.5pt;margin-top:6px}
  th{background:#1B6B3A;color:#fff;padding:4px 6px;text-align:right;border:1px solid #ccc}
  td{padding:4px 6px;border:1px solid #ccc}
  tr:nth-child(even) td{background:#F0FAF4}
  @media print{@page{margin:5mm 8mm}}
</style>
</head>
<body>
${content.innerHTML}
</body></html>`;
  printDocument(fullDoc);
}

// ══════════════════════════════════════════
// البحث الشامل
// ══════════════════════════════════════════
async function loadSearch() {
  document.getElementById('panel-search').innerHTML=`
  <div class="ph"><div><div class="pt"><i class="ti ti-search"></i> البحث الشامل</div><div class="ps">البحث في جميع بيانات النظام دفعة واحدة</div></div></div>
  <div class="card">
    <div style="display:flex;gap:7px;flex-wrap:wrap">
      <input type="text" id="sq" placeholder="ابحث في جميع البيانات..." style="flex:2;min-width:200px;padding:9px 12px;border:1px solid var(--border);border-radius:var(--r);font-family:inherit;font-size:14px" onkeydown="if(event.key==='Enter')doSearch()">
      <select id="ss" style="padding:9px 11px;border:1px solid var(--border);border-radius:var(--r);font-family:inherit">
        <option value="all">جميع البيانات</option>
        <option value="students">الطلبة والإنجازات</option>
        <option value="forms">النماذج الرسمية</option>
        <option value="quality">بيانات الجودة</option>
      </select>
      <button class="btn btn-g" onclick="doSearch()"><i class="ti ti-search"></i>بحث</button>
    </div>
  </div>
  <div id="s-out" style="margin-top:12px"><div style="text-align:center;padding:32px;color:var(--muted)"><i class="ti ti-search" style="font-size:40px;display:block;margin-bottom:8px"></i>أدخل كلمة البحث ثم اضغط بحث</div></div>`;
}

async function doSearch() {
  const q=g('sq'), scope=g('ss'); if(!q)return;
  const ST=['students','achievements'];
  const FT=['activity_requests','announcements','hall_bookings','participants','committees','meeting_invites','meeting_minutes'];
  const QT=Object.keys(QCFG);
  const AT=[...ST,...FT,...QT];
  let tables=scope==='students'?ST:scope==='forms'?FT:scope==='quality'?QT:AT;
  const TNAMES={students:'الطلبة المسجلون',achievements:'الإنجازات',activity_requests:'طلبات النشاط',announcements:'الإعلانات',hall_bookings:'حجوزات القاعات',participants:'أسماء المشاركين',committees:'اللجان',meeting_invites:'الدعوات',meeting_minutes:'المحاضر',...Object.fromEntries(QT.map(t=>[t,QCFG[t]?.title||t]))};
  const results=await Promise.all(tables.map(t=>api('/api/'+t+'?q='+encodeURIComponent(q)).then(r=>({table:t,rows:r||[]}))));
  const found=results.filter(r=>r.rows.length);
  const total=found.reduce((a,r)=>a+r.rows.length,0);
  if(!total){document.getElementById('s-out').innerHTML=`<div style="text-align:center;padding:32px;color:var(--muted)"><i class="ti ti-mood-sad" style="font-size:36px;display:block;margin-bottom:8px"></i>لا توجد نتائج مطابقة لـ "${q}"</div>`;return;}
  document.getElementById('s-out').innerHTML=`<div style="font-size:12px;color:var(--muted);margin-bottom:10px">النتائج: <strong style="color:var(--g)">${total}</strong> سجل في <strong>${found.length}</strong> جدول</div>`+
  found.map(({table,rows})=>`<div class="card" style="margin-bottom:10px">
    <div style="font-size:13px;font-weight:600;color:var(--g);margin-bottom:7px;display:flex;justify-content:space-between">
      <span>${TNAMES[table]||table}</span>
      <span style="background:#C6E8D3;color:var(--g);font-size:11px;padding:2px 8px;border-radius:20px">${rows.length} نتيجة</span>
    </div>
    <div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:11.5px">
      <tbody>${rows.slice(0,5).map(r=>`<tr style="border-bottom:1px solid var(--border)">${Object.entries(r).filter(([k])=>!['id','created_at','created_by','updated_at','updated_by','password','source','completed','students'].includes(k)).slice(0,7).map(([k,v])=>`<td style="padding:4px 8px">${String(v||'').substring(0,60)}</td>`).join('')}</tr>`).join('')}</tbody>
    </table></div>
    ${rows.length>5?`<div style="font-size:10px;color:var(--muted);margin-top:5px">+ ${rows.length-5} نتيجة أخرى</div>`:''}
  </div>`).join('');
}

// ══════════════════════════════════════════
// الأرشفة السنوية وإعادة الضبط (admin فقط)
// ══════════════════════════════════════════
async function loadArchive() {
  document.getElementById('panel-archive').innerHTML = `
  <div class="ph"><div><div class="pt"><i class="ti ti-archive"></i> الأرشفة السنوية وإعادة الضبط</div></div></div>

  <div class="card">
    <div class="ct"><i class="ti ti-download"></i>1) تنزيل نسخة أرشيفية كاملة من بيانات النظام</div>
    <p style="font-size:12.5px;color:var(--muted);line-height:1.8;margin:0 0 12px">
      يُنزِّل هذا الزر ملف JSON واحد يحتوي كل بيانات النظام الحالية (الطلبة، طلبات إقامة الأنشطة، الإعلانات، بيانات الجودة بكل أنواعها، اللجان، الاجتماعات، المشاركين...) لحفظه كأرشيف لهذا العام الدراسي على جهازك أو أي مساحة تخزين آمنة. <b>لا يشمل حسابات المستخدمين وكلمات المرور</b> — هذه تبقى دوماً على النظام ولا تُحذف أبداً.
    </p>
    <button class="btn btn-b" onclick="downloadArchive()"><i class="ti ti-download"></i> تنزيل الأرشيف الكامل (JSON)</button>
    <div id="archive-dl-msg" class="msg ok" style="display:none;margin-top:10px">✅ تم تنزيل الأرشيف — تأكدي من حفظه في مكان آمن قبل المتابعة لأي خطوة أخرى.</div>
  </div>

  <div class="card">
    <div class="ct"><i class="ti ti-file-type-pdf"></i>2) تنزيل نسخة PDF قابلة للطباعة (بنفس النماذج الرسمية)</div>
    <p style="font-size:12.5px;color:var(--muted);line-height:1.8;margin:0 0 12px">
      يُنشئ هذا الزر حزمة مضغوطة (ZIP) تحتوي 5 ملفات PDF منفصلة، كل ملف يجمع كل سجلات نوع معيّن بنفس تنسيق النموذج الرسمي (شعار الجامعة والحقول الرسمية)، كل سجل في صفحة مستقلة:
    </p>
    <ul style="font-size:12px;color:var(--muted);margin:0 0 12px;padding-inline-start:20px;line-height:1.9">
      <li>طلبات_اقامة_نشاط.pdf</li>
      <li>طلبات_اقامة_نشاط_خارجية.pdf</li>
      <li>الانشطة_الطلابية.pdf</li>
      <li>الانشطة_الطلابية_الخارجية.pdf</li>
      <li>اسماء_المشاركين.pdf</li>
    </ul>
    <button class="btn btn-b" id="bulk-pdf-btn" onclick="downloadBulkPDF()"><i class="ti ti-file-zip"></i> تنزيل حزمة PDF (ZIP)</button>
    <div id="bulk-pdf-status" class="msg" style="display:none;margin-top:10px"></div>
  </div>

  <div class="card" style="border:2px solid #F3C5C5;background:#FFF7F7">
    <div class="ct" style="color:#8A1F1F"><i class="ti ti-alert-triangle"></i>3) مسح بيانات النظام والبدء بعام دراسي جديد</div>
    <p style="font-size:12.5px;color:#791F1F;line-height:1.9;font-weight:600;margin:0 0 8px">
      ⚠️ تحذير: هذا الإجراء يحذف نهائياً ومن دون إمكانية تراجع كل بيانات: الطلبة، طلبات إقامة الأنشطة، الإعلانات، بيانات الجودة، اللجان، الاجتماعات، المشاركين، وكل الجداول الأخرى من الخادم الرئيسي. <u>حسابات المستخدمين وصلاحياتهم وجهاتهم لن تتأثر إطلاقاً وستبقى كما هي</u>.
    </p>
    <p style="font-size:12px;color:#791F1F;margin:0 0 14px">تأكدي أولاً من تنزيل الأرشيف الكامل (الخطوة 1) — ويُستحسن أيضاً حزمة PDF (الخطوة 2) — واحتفظي بنسخة منهما في مكان آمن، قبل المتابعة لهذه الخطوة.</p>
    <label style="font-size:12.5px;font-weight:600;display:block;margin-bottom:6px">للتأكيد، اكتبي العبارة التالية بالضبط: <b>نعم متأكد من الحذف</b></label>
    <input id="archive-confirm-text" type="text" style="max-width:320px">
    <div style="margin-top:12px">
      <button class="btn" style="background:#8A1F1F;color:#fff;border-color:#8A1F1F" onclick="resetYearData()"><i class="ti ti-trash"></i> مسح كل البيانات والبدء من جديد</button>
    </div>
    <div id="archive-reset-msg" class="msg" style="margin-top:10px"></div>
  </div>`;
}

async function downloadArchive() {
  try {
    const res = await fetch('/api/admin/export-archive', { headers: { 'Authorization': 'Bearer '+(TOKEN||'') } });
    if (!res.ok) { alert('تعذر تنزيل الأرشيف'); return; }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `ju-dsa-archive-${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
    const m = document.getElementById('archive-dl-msg'); if (m) m.style.display = 'block';
  } catch(e) { alert('تعذر الاتصال بالخادم لتنزيل الأرشيف'); }
}

// يبني ملف PDF واحد متعدد الصفحات من مجموعة سجلات (كل سجل = صفحة مستقلة)
async function buildPDFBlob(records, bodyBuilderFn) {
  const bodies = records.map(r => `<div style="page-break-after:always">${bodyBuilderFn(r)}</div>`).join('');
  const container = document.createElement('div');
  container.innerHTML = `<style>${PRINT_STYLES}</style>${bodies}`;
  container.style.cssText = 'position:fixed;left:-9999px;top:0;width:210mm;background:#fff';
  document.body.appendChild(container);
  try {
    const opts = {
      margin: 0,
      image: { type: 'jpeg', quality: 0.95 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['css'] }
    };
    return await html2pdf().set(opts).from(container).outputPdf('blob');
  } finally {
    document.body.removeChild(container);
  }
}

// يجمع كل الفئات الخمس المطلوبة في حزمة ZIP واحدة، كل فئة كملف PDF منفصل
async function downloadBulkPDF() {
  const statusEl = document.getElementById('bulk-pdf-status');
  const btn = document.getElementById('bulk-pdf-btn');
  const showStatus = (txt) => { if (statusEl) { statusEl.className='msg ok'; statusEl.style.display='block'; statusEl.textContent = txt; } };
  const showErr = (txt) => { if (statusEl) { statusEl.className='msg err'; statusEl.style.display='block'; statusEl.textContent = txt; } };
  if (typeof html2pdf === 'undefined' || typeof JSZip === 'undefined') {
    showErr('تعذّر تحميل مكتبات إنشاء PDF — تأكدي من اتصال الإنترنت وأعيدي المحاولة.');
    return;
  }
  if (btn) btn.disabled = true;
  try {
    const zip = new JSZip();
    let anyData = false;

    showStatus('⏳ جارٍ جلب البيانات...');
    const allAR   = await api('/api/activity_requests');
    const saList  = await getCombinedActivitiesList();
    const sa      = await api('/api/student_activities');
    const saExt   = await api('/api/student_activities_external');
    const parts   = await api('/api/participants');

    const internalAR = (allAR||[]).filter(r=>r.submitted_via!=='public_link');
    const externalAR  = (allAR||[]).filter(r=>r.submitted_via==='public_link');

    if (internalAR.length) {
      showStatus(`⏳ جارٍ تجهيز: طلبات إقامة نشاط (${internalAR.length})...`);
      const blob = await buildPDFBlob(internalAR, (r)=>{
        const cats = (typeof resolveReqCategories==='function')?resolveReqCategories(r, saList):(r.categories||[]);
        return prtHeader('نموذج طلب إقامة نشاط','DSA-02-01-05') + buildARBodyHTML(r, cats);
      });
      zip.file('طلبات_اقامة_نشاط.pdf', blob); anyData = true;
    }

    if (externalAR.length) {
      showStatus(`⏳ جارٍ تجهيز: طلبات إقامة نشاط خارجية (${externalAR.length})...`);
      const blob = await buildPDFBlob(externalAR, (r)=>{
        const cats = (typeof resolveReqCategories==='function')?resolveReqCategories(r, saList):(r.categories||[]);
        return prtHeader('نموذج طلب إقامة نشاط (خارجي)','DSA-02-01-05') + buildARBodyHTML(r, cats);
      });
      zip.file('طلبات_اقامة_نشاط_خارجية.pdf', blob); anyData = true;
    }

    if (sa && sa.length) {
      showStatus(`⏳ جارٍ تجهيز: الأنشطة الطلابية (${sa.length})...`);
      const blob = await buildPDFBlob(sa, (r)=> buildQRowBodyHTML('student_activities', r));
      zip.file('الانشطة_الطلابية.pdf', blob); anyData = true;
    }

    if (saExt && saExt.length) {
      showStatus(`⏳ جارٍ تجهيز: الأنشطة الطلابية الخارجية (${saExt.length})...`);
      const blob = await buildPDFBlob(saExt, (r)=> buildQRowBodyHTML('student_activities_external', r));
      zip.file('الانشطة_الطلابية_الخارجية.pdf', blob); anyData = true;
    }

    if (parts && parts.length) {
      showStatus(`⏳ جارٍ تجهيز: أسماء المشاركين (${parts.length})...`);
      const blob = await buildPDFBlob(parts, (r)=> prtHeader('نموذج أسماء الطلبة المشاركين في النشاط','DSA-02-01-02') + buildPartBodyHTML(r));
      zip.file('اسماء_المشاركين.pdf', blob); anyData = true;
    }

    if (!anyData) { showErr('لا توجد بيانات حالياً في أي من الفئات الخمس لتصديرها.'); return; }

    showStatus('⏳ جارٍ ضغط الملفات...');
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url; a.download = `ju-dsa-pdf-archive-${new Date().toISOString().slice(0,10)}.zip`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
    showStatus('✅ تم تجهيز الملفات وتنزيلها بنجاح.');
  } catch(e) {
    console.error(e);
    showErr('حدث خطأ أثناء التجهيز: ' + (e.message||'خطأ غير معروف'));
  } finally {
    if (btn) btn.disabled = false;
  }
}

async function resetYearData() {
  const txt = g('archive-confirm-text');
  if (txt !== 'نعم متأكد من الحذف') {
    showMsg('archive-reset-msg', 'يرجى كتابة عبارة التأكيد بالضبط كما هي مكتوبة أعلاه', true);
    return;
  }
  if (!confirm('تأكيد أخير: سيتم حذف جميع بيانات الأنشطة نهائياً من الخادم الرئيسي دون إمكانية التراجع. هل تأكدتِ من تنزيل نسخة الأرشيف والاحتفاظ بها؟')) return;
  const r = await api('/api/admin/reset-data', 'POST', { confirm: txt });
  if (r.error) { showMsg('archive-reset-msg', r.error, true); return; }
  showMsg('archive-reset-msg', r.message || 'تم مسح البيانات بنجاح.', false);
  document.getElementById('archive-confirm-text').value = '';
  loadDash();
}

// ══════════════════════════════════════════
// إدارة المستخدمين
// ══════════════════════════════════════════
async function loadUsers() {
  document.getElementById('panel-users').innerHTML=`
  <div class="ph"><div><div class="pt"><i class="ti ti-shield"></i> إدارة المستخدمين</div></div></div>
  <div class="card">
    <div class="ct"><i class="ti ti-user-plus"></i>إضافة مستخدم جديد</div>
    <div id="msg-users" class="msg"></div>
    <div class="g2">
      <div class="fg"><label>اسم المستخدم *</label><input id="u-un" type="text" placeholder="username"></div>
      <div class="fg"><label>الاسم الكامل *</label><input id="u-fn" type="text"></div>
      <div class="fg"><label>كلمة المرور *</label><input id="u-pw" type="password"></div>
      <div class="fg"><label>الصلاحية *</label><select id="u-role" onchange="toggleUserDept()"><option value="viewer">عرض فقط</option><option value="editor">مدخل بيانات</option><option value="coordinator">رئيس شعبة</option><option value="manager">مدير الدائرة</option><option value="dean">العميد</option><option value="admin">مدير النظام</option></select></div>
      <div class="fg full" id="u-dept-wrap" style="display:none">
        <label>الجهة المنظمة المرتبطة (للمنسّق أو المدير)</label>
        <select id="u-dept"><option value="">— بدون تقييد (يرى كل الطلبات) —</option>${DEANSHIP_DEPTS.map(d=>`<option>${d}</option>`).join('')}</select>
        <div style="font-size:11px;color:var(--muted);margin-top:4px">عند تحديد جهة، سيرى هذا المستخدم فقط طلبات إقامة النشاط (الداخلية والخارجية) الخاصة بهذه الجهة تحديداً.</div>
      </div>
    </div>
    <div style="display:flex;justify-content:flex-end"><button class="btn btn-g" onclick="addUser()">✔ إضافة</button></div>
  </div>
  <div class="tw"><table><thead><tr><th>#</th><th>اسم المستخدم</th><th>الاسم الكامل</th><th>الصلاحية</th><th>الجهة المرتبطة</th><th>تاريخ الإنشاء</th><th></th></tr></thead>
  <tbody id="tbl-users"></tbody></table></div>`;
  refreshUsers();
}

function toggleUserDept() {
  const show = ['coordinator','manager'].includes(g('u-role'));
  document.getElementById('u-dept-wrap').style.display = show ? 'block' : 'none';
}

async function refreshUsers() {
  const rows=await api('/api/users');
  document.getElementById('tbl-users').innerHTML=(rows||[]).map((r,i)=>`<tr>
    <td>${i+1}</td><td><strong>${r.username}</strong></td><td>${r.fullName}</td>
    <td><span class="rtag ${RCLS[r.role]||''}">${RLABELS[r.role]||r.role}</span></td>
    <td style="font-size:11px;color:var(--g)">${r.department||'-'}</td>
    <td>${r.createdAt ? new Date(r.createdAt).toLocaleDateString('ar-JO') : '-'}</td>
    <td><div class="rb">
      <button class="btn btn-sm" style="color:#1B5E9A;border-color:#1B5E9A" onclick="changeUserPassword('${r._id||r.id}','${r.username}')">🔑 تغيير كلمة السر</button>
      ${r.username!=='admin'?`<button class="btn btn-r" onclick="delUser('${r._id||r.id}')">🗑</button>`:''}
    </div></td>
  </tr>`).join('')||`<tr class="erow"><td colspan="7">لا يوجد مستخدمون</td></tr>`;
}

async function changeUserPassword(id, username) {
  const pw = prompt(`كلمة السر الجديدة للمستخدم "${username}" (4 خانات على الأقل):`, '');
  if (pw === null) return;
  if (pw.length < 4) { alert('يرجى إدخال كلمة سر لا تقل عن 4 خانات'); return; }
  const r = await api(`/api/users/${id}/change-password`, 'POST', { newPassword: pw });
  if (r.error) { alert(r.error); return; }
  alert('✅ '+(r.message||'تم تغيير كلمة السر بنجاح'));
}

async function addUser() {
  const data={username:g('u-un'),fullName:g('u-fn'),password:g('u-pw'),role:g('u-role'),department:g('u-dept')};
  if(!data.username||!data.fullName||!data.password){showMsg('msg-users','يرجى ملء جميع الحقول',true);return;}
  const r=await api('/api/users','POST',data);
  if(r.error){showMsg('msg-users',r.error,true);return;}
  showMsg('msg-users','تم إنشاء المستخدم بنجاح ✓');
  ['u-un','u-fn','u-pw'].forEach(id=>sg(id,''));
  refreshUsers();
}

async function delUser(id) {
  if(!confirm('هل تريد حذف هذا المستخدم؟'))return;
  await api('/api/users/'+id,'DELETE');
  refreshUsers();
}

function printReport() {
  const content = document.getElementById('rpt-out');
  if(!content || !content.innerHTML.trim()){
    alert('يرجى توليد التقرير أولاً');
    return;
  }
  const body = content.innerHTML;
  const fullDoc = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<title>التقرير الشامل — عمادة شؤون الطلبة</title>
<style>
  *{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;box-sizing:border-box}
  :root{--g:#1B6B3A;--g2:#145229;--muted:#6B7280;--border:#E5E7EB;--r:8px;--rl:12px;--blue:#1B5E9A}
  body{font-family:'Segoe UI',Tahoma,Arial,sans-serif;direction:rtl;padding:8mm 10mm;color:#000;font-size:9.5pt;margin:0}
  img{max-width:100%}
  table{width:100%;border-collapse:collapse;font-size:8.5pt;margin-top:6px}
  th{background:#1B6B3A;color:#fff;padding:4px 6px;text-align:right;border:1px solid #ccc}
  td{padding:4px 6px;border:1px solid #ccc}
  tr:nth-child(even) td{background:#F0FAF4}
  @media print{@page{margin:5mm 8mm}}
</style>
</head>
<body>
${body}
</body></html>`;
  printDocument(fullDoc);
}
