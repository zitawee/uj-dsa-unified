
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


async function printAR(id) {
  const r=await api('/api/activity_requests/'+id); if(!r||r.error)return;
  const html=prtHeader('نموذج طلب إقامة نشاط','DSA-02-01-05')+`
  <div class="fr"><span class="fl">نوع النشاط:</span><div style="display:flex;gap:10px;flex:1;font-size:8pt">${['مبادرة','محاضرة','دورة تدريبية','ورشة','معرض','مسابقة','أخرى'].map(t=>`<span><span class="chk">${r.type===t?'✓':''}</span> ${t}</span>`).join('')}</div></div>
  <div class="fr"><span class="fl">اسم / عنوان الفعالية:</span><span class="fv">${r.title||''}</span></div>
  <div class="fr"><span class="fl">اسم الفعالية في الإعلان:</span><span class="fv">${r.ad_title||''}</span></div>
  <div class="fr" style="min-height:42px"><span class="fl">وصف النشاط:</span><span class="fv">${r.description||''}</span></div>
  <div class="fr" style="min-height:42px"><span class="fl">أهداف النشاط:</span><span class="fv">${r.goals||''}</span></div>
  <div class="fr"><span class="fl">نوع الحضور:</span><span class="fv">${r.audience||''}</span></div>
  <div class="fr"><span class="fl">التكلفة المالية:</span><span class="fv">${r.cost||''}</span></div>
  <div class="fr"><span class="fl">الجدول المستهدف في الجودة:</span><span class="fv" style="color:#1B6B3A;font-weight:600">${QTBL_LABELS[r.quality_table]||''}</span></div>
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
  <div class="psub">معلومات إضافية</div>
  <table class="ptbl"><tr><th>البيان</th><th>الإجابة</th></tr>
    <tr><td>هل يوجد راعٍ أو داعم؟</td><td>${r.sponsor||'-'}</td></tr>
    <tr><td>هل سيتم إظهار بانر لداعم؟</td><td>${r.banner||'-'}</td></tr>
    <tr><td>هل يوجد ضيوف من خارج الجامعة؟</td><td>${r.guests||'-'}</td></tr>
    <tr><td>هل سيتم توزيع مواد أو ضيافة؟</td><td>${r.materials||'-'}</td></tr>
  </table>
  ${prtApproval()}
  <div style="margin-top:9px;font-size:8pt">
    <div class="fg2">
      <div><strong>موافقة مساعد العميد لشؤون الطلبة:</strong><br>الاسم والتوقيع: ......................................</div>
      <div><strong>موافقة عميد الكلية المعني:</strong><br>الاسم والتوقيع: ......................................</div>
    </div>
    <div style="margin-top:6px"><strong>اسم رئيس الاتحاد:</strong> ..............................  <strong>توقيع/ختم رئيس اتحاد الطلبة:</strong> ..............................</div>
  </div>
  ${r.status==='approved'?`<div style="margin-top:10px;border:3px solid #27500A;border-radius:8px;padding:6px 14px;display:inline-block;color:#27500A;font-weight:700;font-size:10pt;transform:rotate(-5deg)">✅ معتمد — ${r.approved_by||''} — ${(r.approved_at||'').split('T')[0]}</div>`:''}`;
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

async function printPart(id) {
  const r=await api('/api/participants/'+id); if(!r||r.error)return;
  const students=r.students||[];
  const html=prtHeader('نموذج أسماء الطلبة المشاركين في النشاط','DSA-02-01-02')+`
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
  const QTBLS=['governance','workshops','initiatives','external_acts','competitions','student_honors','staff_committees','staff_training','staff_innovation','staff_honors','uni_committees','community_svc','awareness','expert_acts','environment','dialogues','campaigns'];
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
      <div class="fg"><label>الصلاحية *</label><select id="u-role"><option value="viewer">عرض فقط</option><option value="editor">مدخل بيانات</option><option value="admin">مدير</option></select></div>
    </div>
    <div style="display:flex;justify-content:flex-end"><button class="btn btn-g" onclick="addUser()">✔ إضافة</button></div>
  </div>
  <div class="tw"><table><thead><tr><th>#</th><th>اسم المستخدم</th><th>الاسم الكامل</th><th>الصلاحية</th><th>تاريخ الإنشاء</th><th></th></tr></thead>
  <tbody id="tbl-users"></tbody></table></div>`;
  refreshUsers();
}

async function refreshUsers() {
  const rows=await api('/api/users');
  document.getElementById('tbl-users').innerHTML=(rows||[]).map((r,i)=>`<tr>
    <td>${i+1}</td><td><strong>${r.username}</strong></td><td>${r.fullName}</td>
    <td><span class="rtag ${RCLS[r.role]||''}">${RLABELS[r.role]||r.role}</span></td>
    <td>${new Date(r.created_at).toLocaleDateString('ar-JO')}</td>
    <td>${r.username!=='admin'?`<button class="btn btn-r" onclick="delUser('${r._id||r.id}')">🗑</button>`:''}</td>
  </tr>`).join('')||`<tr class="erow"><td colspan="6">لا يوجد مستخدمون</td></tr>`;
}

async function addUser() {
  const data={username:g('u-un'),fullName:g('u-fn'),password:g('u-pw'),role:g('u-role')};
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
  const win = window.open('','_blank','width=960,height=720');
  win.document.write(`<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<title>التقرير الشامل — عمادة شؤون الطلبة</title>
<style>
  *{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;box-sizing:border-box}
  body{font-family:'Segoe UI',Tahoma,Arial,sans-serif;direction:rtl;padding:8mm 10mm;color:#000;font-size:9.5pt;margin:0}
  img{max-width:100%}
  table{width:100%;border-collapse:collapse;font-size:8.5pt;margin-top:6px}
  th{background:#1B6B3A;color:#fff;padding:4px 6px;text-align:right;border:1px solid #ccc}
  td{padding:4px 6px;border:1px solid #ccc}
  tr:nth-child(even) td{background:#F0FAF4}
  .no-print{text-align:center;margin-bottom:12px}
  @media print{.no-print{display:none}@page{margin:5mm 8mm}}
</style>
</head>
<body>
<div class="no-print">
  <button onclick="window.print()" style="background:#1B6B3A;color:#fff;border:none;padding:7px 22px;border-radius:6px;font-size:13px;cursor:pointer;margin-left:8px">🖨️ طباعة / حفظ PDF</button>
  <button onclick="window.close()" style="background:#666;color:#fff;border:none;padding:7px 22px;border-radius:6px;font-size:13px;cursor:pointer">✕ إغلاق</button>
</div>
${content.innerHTML}
</body></html>`);
  win.document.close();
  setTimeout(()=>win.print(), 800);
}
