// ══════════════════════════════════════════
// الطلبات غير المكتملة
// ══════════════════════════════════════════
async function loadIncomplete() {
  const rows = await api('/api/incomplete');
  const TNAMES = {workshops:'الدورات وورش العمل',initiatives:'مبادرات الإبداع',external_acts:'الأنشطة الخارجية',competitions:'أنشطة المنافسات',awareness:'الأنشطة التوعوية',environment:'أنشطة البيئة',dialogues:'الجلسات الحوارية',campaigns:'الحملات التوعوية',expert_acts:'أنشطة الخبراء',community_svc:'الخدمات المجتمعية'};
  document.getElementById('panel-incomplete').innerHTML = `
  <div class="ph"><div><div class="pt"><i class="ti ti-alert-circle" style="color:#633806"></i> الطلبات غير المكتملة</div><div class="ps">سجلات رُحِّلت من النماذج وتحتاج إدخال بيانات إضافية</div></div></div>
  ${!(rows||[]).length ? `<div style="text-align:center;padding:40px;color:var(--muted)"><i class="ti ti-circle-check" style="font-size:48px;color:#27500A;display:block;margin-bottom:10px"></i>لا توجد طلبات غير مكتملة</div>` : `
  <div class="msg warn" style="display:block">⚠️ هذه السجلات رُحِّلت من نماذج الأنشطة المعتمدة وتحتاج إدخال بيانات إضافية — اضغط على "تعديل" لإكمالها.</div>
  <div class="tw"><table><thead><tr><th>#</th><th>الجدول</th><th>اسم النشاط</th><th>التاريخ</th><th>المصدر</th><th></th></tr></thead>
  <tbody>${(rows||[]).map((r,i)=>`<tr>
    <td>${i+1}</td>
    <td><span class="st st-p">${TNAMES[r._table]||r._table}</span></td>
    <td><strong>${r.name||r.title||'-'}</strong></td>
    <td>${r.date||'-'}</td>
    <td style="font-size:10px;color:var(--g)">${r.source||'-'}</td>
    <td><div class="rb">
      <button class="btn btn-sm btn-b" onclick="goEditQ('${r._table}','${r.id}')">✏️ تعديل</button>
      <button class="btn btn-sm btn-g" onclick="markComplete('${r._table}','${r.id}')">✅ مكتمل</button>
    </div></td>
  </tr>`).join('')}</tbody></table></div>`}`;
}

async function markComplete(table, id) {
  const r = await api('/api/'+table+'/'+id);
  await api('/api/'+table+'/'+id, 'PUT', {...r, completed:true});
  loadIncomplete();
  // تحديث العداد من API
  const stats = await api('/api/stats');
  const el=document.getElementById('c-inc');
  if(el) el.textContent=stats.incomplete||0;
}

async function goEditQ(table, id) {
  const nav = document.querySelector(`.ni[onclick*="go('${table}'"]`);
  if (nav) go(table, nav);
}

// ══════════════════════════════════════════
// الطلبة
// ══════════════════════════════════════════
async function loadStudents() {
  const canEdit = ME?.role !== 'viewer';
  document.getElementById('panel-students').innerHTML = `
  <div class="ph">
    <div><div class="pt"><i class="ti ti-users"></i> الطلبة المسجلون في الأنشطة</div></div>
    <div style="display:flex;gap:6px">
      ${canEdit ? `<button class="btn btn-g" onclick="showStudForm()"><i class="ti ti-plus"></i>تسجيل طالب</button>` : ''}
      <button class="btn" onclick="exportCSV('students')"><i class="ti ti-download"></i>CSV</button>
    </div>
  </div>
  <div id="stud-form" style="display:none">
    <div class="card">
      <div class="ct"><i class="ti ti-user-plus"></i>تسجيل طالب جديد</div>
      <div id="msg-students" class="msg"></div>
      <div class="g3">
        <div class="fg"><label>الرقم الجامعي *</label><input id="fs-id" type="text"></div>
        <div class="fg"><label>الاسم الكامل *</label><input id="fs-name" type="text"></div>
        <div class="fg"><label>الجنس *</label><select id="fs-gender"><option value="">اختر...</option><option>ذكر</option><option>أنثى</option></select></div>
        <div class="fg"><label>الجنسية</label><input id="fs-nat" type="text" placeholder="أردني..."></div>
        <div class="fg"><label>الكلية *</label><select id="fs-col"><option value="">اختر الكلية...</option>${colOpts()}</select></div>
        <div class="fg"><label>التخصص *</label><input id="fs-major" type="text"></div>
        <div class="fg"><label>المستوى الدراسي</label><select id="fs-level"><option value="">اختر...</option>${selOpts(YEARS)}</select></div>
        <div class="fg"><label>سنة القبول *</label><input id="fs-year" type="number" placeholder="2024"></div>
        <div class="fg"><label>نوع القبول</label><select id="fs-admit"><option value="">اختر...</option>${selOpts(ADMIT)}</select></div>
        <div class="fg"><label>رقم الهاتف</label><input id="fs-phone" type="tel"></div>
        <div class="fg"><label>النشاط *</label><select id="fs-act"><option value="">اختر النشاط...</option>${actOpts()}</select></div>
        <div class="fg"><label>تاريخ الالتحاق *</label><input id="fs-join" type="date"></div>
      </div>
      <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:8px">
        <button class="btn" onclick="document.getElementById('stud-form').style.display='none'">إلغاء</button>
        <button class="btn btn-g" onclick="saveStudent()">✔ تسجيل</button>
      </div>
    </div>
  </div>
  <div class="fb">
    <input type="text" id="sf-q" placeholder="بحث بالاسم أو الرقم..." oninput="filterStudents()">
    <select id="sf-act" onchange="filterStudents()"><option value="">جميع الأنشطة</option>${actOpts()}</select>
    <select id="sf-col" onchange="filterStudents()"><option value="">جميع الكليات</option>${colOpts()}</select>
    <select id="sf-gen" onchange="filterStudents()"><option value="">كل الجنسين</option><option>ذكر</option><option>أنثى</option></select>
  </div>
  <div id="stud-cnt" style="font-size:11px;color:var(--muted);margin-bottom:5px"></div>
  <div class="tw"><table><thead><tr>
    <th>#</th><th>الرقم الجامعي</th><th>الاسم</th><th>الجنس</th><th>الجنسية</th><th>الكلية</th><th>التخصص</th><th>المستوى</th><th>نوع القبول</th><th>النشاط</th><th>تاريخ الالتحاق</th><th>الهاتف</th>${canEdit?'<th></th>':''}
  </tr></thead><tbody id="tbl-students"></tbody></table></div>`;
  document.getElementById('fs-join').valueAsDate = new Date();
  filterStudents();
}

function showStudForm() {
  const f = document.getElementById('stud-form'); f.style.display='block';
  f.querySelectorAll('input:not([type=file]),select').forEach(el=>el.value='');
  document.getElementById('fs-join').valueAsDate = new Date();
  f.scrollIntoView({behavior:'smooth'});
}

async function filterStudents() {
  const q=g('sf-q'), act=g('sf-act'), col=g('sf-col'), gen=g('sf-gen');
  const p = new URLSearchParams();
  if(q) p.set('q',q); if(act) p.set('activity',act); if(col) p.set('college',col); if(gen) p.set('gender',gen);
  const rows = await api('/api/students?'+p);
  const canEdit = ME?.role !== 'viewer';
  document.getElementById('stud-cnt').textContent = `النتائج: ${rows?.length||0} طالب`;
  document.getElementById('tbl-students').innerHTML = (rows||[]).map((r,i)=>`<tr>
    <td style="color:var(--muted)">${i+1}</td>
    <td><strong>${r.student_id||'-'}</strong></td><td>${r.name||'-'}</td>
    <td>${r.gender||'-'}</td><td>${r.nationality||'-'}</td>
    <td style="font-size:11px">${r.college||'-'}</td><td>${r.major||'-'}</td>
    <td>${r.study_level||'-'}</td><td>${r.admit_type||'-'}</td>
    <td>${badge(r.activity||'')}</td><td>${r.join_date||'-'}</td><td>${r.phone||'-'}</td>
    ${canEdit?`<td><button class="btn btn-r" onclick="delRec('students','${r.id}',filterStudents)">🗑</button></td>`:''}
  </tr>`).join('') || `<tr class="erow"><td colspan="13">لا توجد نتائج</td></tr>`;
  const cnt = document.getElementById('c-students'); if(cnt) cnt.textContent=rows?.length||0;
}

async function saveStudent() {
  const data = {student_id:g('fs-id'),name:g('fs-name'),gender:g('fs-gender'),nationality:g('fs-nat'),college:g('fs-col'),major:g('fs-major'),study_level:g('fs-level'),admit_year:g('fs-year'),admit_type:g('fs-admit'),phone:g('fs-phone'),activity:g('fs-act'),join_date:g('fs-join')};
  if (!data.student_id||!data.name||!data.gender||!data.college||!data.major||!data.admit_year||!data.activity||!data.join_date)
    {showMsg('msg-students','يرجى ملء جميع الحقول الإلزامية',true);return;}
  const r = await api('/api/students','POST',data);
  if (r.error) {showMsg('msg-students',r.error,true);return;}
  showMsg('msg-students','تم التسجيل بنجاح ✓');
  document.getElementById('stud-form').style.display='none';
  filterStudents(); loadDash();
}

// ══════════════════════════════════════════
// الإنجازات والتكريم
// ══════════════════════════════════════════
async function loadAchievements() {
  const canEdit = ME?.role !== 'viewer';
  document.getElementById('panel-achievements').innerHTML = `
  <div class="ph">
    <div><div class="pt"><i class="ti ti-trophy"></i> الإنجازات والتكريم</div></div>
    <div style="display:flex;gap:6px">
      ${canEdit ? `<button class="btn btn-g" onclick="showAchForm()"><i class="ti ti-plus"></i>إضافة إنجاز</button>` : ''}
      <button class="btn btn-b" onclick="printAchievements()"><i class="ti ti-printer"></i>طباعة</button>
      <button class="btn" onclick="exportCSV('achievements')"><i class="ti ti-download"></i>CSV</button>
    </div>
  </div>
  <div id="ach-form" style="display:none">
    <div class="card">
      <div class="ct"><i class="ti ti-award"></i>إضافة إنجاز أو مشاركة</div>
      <div id="msg-achievements" class="msg"></div>
      <div class="g2">
        <div class="fg"><label>الرقم الجامعي *</label><input id="fa-sid" type="text" onblur="autoFill()"></div>
        <div class="fg"><label>اسم الطالب *</label><input id="fa-sname" type="text" placeholder="يُملأ تلقائياً أو اكتب الاسم يدوياً"></div>
        <div class="fg full"><label>الإنجاز / المشاركة *</label><input id="fa-work" type="text"></div>
        <div class="fg"><label>تاريخ الإنجاز *</label><input id="fa-date" type="date"></div>
        <div class="fg"><label>النشاط المرتبط</label><select id="fa-act"><option value="">اختر...</option>${actOpts()}</select></div>
        <div class="fg"><label>حاصل على تكريم</label><select id="fa-honor"><option value="">اختر...</option><option>نعم</option><option>لا</option></select></div>
        <div class="fg"><label>سبب التكريم</label><input id="fa-hreason" type="text" placeholder="يظهر عند اختيار نعم"></div>
      </div>
      <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:8px">
        <button class="btn" onclick="document.getElementById('ach-form').style.display='none'">إلغاء</button>
        <button class="btn btn-g" onclick="saveAch()">✔ إضافة الإنجاز</button>
      </div>
    </div>
  </div>
  <div class="fb">
    <input type="text" id="af-q" placeholder="بحث..." oninput="filterAch()">
    <select id="af-act" onchange="filterAch()"><option value="">جميع الأنشطة</option>${actOpts()}</select>
    <select id="af-hon" onchange="filterAch()"><option value="">الكل</option><option value="yes">مكرَّمون فقط</option></select>
  </div>
  <div class="tw"><table><thead><tr>
    <th>#</th><th>الرقم الجامعي</th><th>اسم الطالب</th><th>الإنجاز / المشاركة</th><th>التاريخ</th><th>النشاط</th><th>تكريم</th><th>سبب التكريم</th>${canEdit?'<th></th>':''}
  </tr></thead><tbody id="tbl-ach"></tbody></table></div>`;
  document.getElementById('fa-date').valueAsDate = new Date();
  filterAch();
}

function showAchForm() {
  const f=document.getElementById('ach-form'); f.style.display='block';
  f.querySelectorAll('input:not([type=file]),select').forEach(el=>el.value='');
  // إعادة تنسيق حقل الاسم
  const nameEl=document.getElementById('fa-sname');
  if(nameEl){
    nameEl.style.background='';
    nameEl.style.borderColor='';
    nameEl.placeholder='يُملأ تلقائياً أو اكتب الاسم يدوياً';
  }
  document.getElementById('fa-date').valueAsDate=new Date();
  f.scrollIntoView({behavior:'smooth'});
}

async function autoFill() {
  const sid=g('fa-sid'); if(!sid) return;
  const rows=await api('/api/students?q='+encodeURIComponent(sid));
  const r=(rows||[]).find(s=>s.student_id===sid)||(rows||[])[0];
  const nameEl=document.getElementById('fa-sname');
  if(r){
    // طالب موجود — ملء تلقائي
    sg('fa-sname',r.name);
    if(!g('fa-act'))sg('fa-act',r.activity);
    if(nameEl){
      nameEl.style.background='#F0FAF4';
      nameEl.style.borderColor='#1B6B3A';
      nameEl.placeholder='تم جلب الاسم تلقائياً';
    }
  } else {
    // طالب غير موجود — السماح بالكتابة اليدوية
    if(nameEl){
      nameEl.value='';
      nameEl.style.background='#fff';
      nameEl.style.borderColor='#D4A017';
      nameEl.placeholder='الطالب غير موجود في السجل — اكتب الاسم يدوياً';
      nameEl.focus();
    }
  }
}

async function filterAch() {
  const q=g('af-q'), act=g('af-act'), hon=g('af-hon');
  const p=new URLSearchParams(); if(q)p.set('q',q); if(act)p.set('activity',act);
  const rows=await api('/api/achievements?'+p);
  const canEdit=ME?.role!=='viewer';
  let filtered=rows||[];
  if(hon==='yes') filtered=filtered.filter(r=>r.honor==='نعم');
  document.getElementById('tbl-ach').innerHTML=filtered.map((r,i)=>`<tr>
    <td>${i+1}</td><td><strong>${r.student_id||'-'}</strong></td><td>${r.student_name||'-'}</td>
    <td>${r.work||'-'}</td><td>${r.ach_date||'-'}</td><td>${badge(r.activity||'')}</td>
    <td>${r.honor==='نعم'?'<span class="st st-a">✅ نعم</span>':'-'}</td>
    <td style="font-size:11px">${r.honor_reason||'-'}</td>
    ${canEdit?`<td><button class="btn btn-r" onclick="delRec('achievements','${r.id}',filterAch)">🗑</button></td>`:''}
  </tr>`).join('')||`<tr class="erow"><td colspan="9">لا توجد إنجازات</td></tr>`;
  const cnt=document.getElementById('c-achievements'); if(cnt) cnt.textContent=filtered.length;
}

async function saveAch() {
  const honor=g('fa-honor');
  const data={student_id:g('fa-sid'),student_name:g('fa-sname').trim()||g('fa-sname'),work:g('fa-work'),ach_date:g('fa-date'),activity:g('fa-act'),honor,honor_reason:g('fa-hreason')};
  if(!data.student_id){showMsg('msg-achievements','يرجى إدخال الرقم الجامعي',true);return;}
  if(!data.student_name){showMsg('msg-achievements','يرجى إدخال اسم الطالب',true);return;}
  if(!data.work||!data.ach_date){showMsg('msg-achievements','يرجى ملء الحقول الإلزامية',true);return;}
  const r=await api('/api/achievements','POST',data);
  if(r.error){showMsg('msg-achievements',r.error,true);return;}
  // ترحيل تلقائي لجدول تكريم الطلبة إذا كان مكرَّماً
  if(honor==='نعم'&&data.student_name){
    await api('/api/student_honors','POST',{
      student_id:data.student_id,
      student_name:data.student_name,
      reason:data.honor_reason||data.work,
      date:data.ach_date,
      notes:'مرحَّل تلقائياً من الإنجازات',
      source:'achievements'
    });
  }
  showMsg('msg-achievements','تم الحفظ بنجاح ✓');
  document.getElementById('ach-form').style.display='none';
  filterAch(); loadDash();
}

// تصدير CSV مع Token
async function exportCSV(table) {
  const res = await fetch('/api/export/'+table, {
    headers: { 'Authorization': 'Bearer '+(TOKEN||'') }
  });
  if(!res.ok){ alert('يرجى تسجيل الدخول أولاً'); return; }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href=url; a.download=table+'.csv'; a.click();
  URL.revokeObjectURL(url);
}

// طباعة بطاقة طالب
function printStudent(r) {
  if(typeof r === 'string') try { r=JSON.parse(r); } catch(e){ return; }
  const[bg,fg]=({"المرسم الجامعي":["#EEEDFE","#3C3489"],"الموسيقى":["#E1F5EE","#085041"],"الخط العربي":["#FAEEDA","#633806"],"الحرف اليدوية":["#FAECE7","#712B13"],"المسرح الجامعي":["#FBE8F5","#5D1A4A"],"الأداء الحركي":["#EAF3DE","#27500A"],"المناظرات":["#E8F4FD","#0A4A6B"],"الأنشطة الحزبية":["#FBEAF0","#72243E"]})[r.activity]||["#eee","#555"];
  const html=`<div class="ph2">
    <img src="/logo.png" class="plogo">
    <div class="puni"><div class="ar">الجامعة الأردنية</div><div class="en">The University of Jordan</div><div class="dep">عمادة شؤون الطلبة — Dean of Student Affairs</div></div>
    <div class="pmeta"><div><strong>تاريخ الطباعة:</strong> ${new Date().toLocaleDateString('ar-JO',{year:'numeric',month:'long',day:'numeric'})}</div></div>
  </div>
  <div class="ptitle">بطاقة تسجيل طالب في الأنشطة الجامعية</div>
  <div style="background:${bg};border-radius:8px;padding:10px;text-align:center;margin-bottom:10px">
    <div style="font-size:14pt;font-weight:700;color:${fg}">${r.activity||''}</div>
    <div style="font-size:9pt;color:${fg};margin-top:2px">النشاط الجامعي</div>
  </div>
  <div class="fg2">
    <div class="fr"><span class="fl">الرقم الجامعي:</span><span class="fv">${r.student_id||''}</span></div>
    <div class="fr"><span class="fl">الاسم الكامل:</span><span class="fv">${r.name||''}</span></div>
    <div class="fr"><span class="fl">الجنس:</span><span class="fv">${r.gender||''}</span></div>
    <div class="fr"><span class="fl">الجنسية:</span><span class="fv">${r.nationality||''}</span></div>
    <div class="fr"><span class="fl">الكلية:</span><span class="fv">${r.college||''}</span></div>
    <div class="fr"><span class="fl">التخصص:</span><span class="fv">${r.major||''}</span></div>
    <div class="fr"><span class="fl">المستوى الدراسي:</span><span class="fv">${r.study_level||''}</span></div>
    <div class="fr"><span class="fl">سنة القبول:</span><span class="fv">${r.admit_year||''}</span></div>
    <div class="fr"><span class="fl">نوع القبول:</span><span class="fv">${r.admit_type||''}</span></div>
    <div class="fr"><span class="fl">رقم الهاتف:</span><span class="fv">${r.phone||''}</span></div>
    <div class="fr"><span class="fl">تاريخ الالتحاق:</span><span class="fv">${r.join_date||''}</span></div>
  </div>
  <div style="margin-top:16px;display:grid;grid-template-columns:1fr 1fr;gap:10px">
    <div class="sbox"><div class="st2">توقيع الطالب</div><div class="sl2">التوقيع: .................</div></div>
    <div class="sbox"><div class="st2">توقيع المسؤول</div><div class="sl2">التوقيع: .................</div></div>
  </div>`;
  openPrint(html);
}

// ══ طباعة تقرير الإنجازات والتكريم ══
async function printAchievements() {
  const q=document.getElementById('af-q')?.value||'';
  const act=document.getElementById('af-act')?.value||'';
  const hon=document.getElementById('af-hon')?.value||'';
  const p=new URLSearchParams();
  if(q)p.set('q',q); if(act)p.set('activity',act);
  const rows=await api('/api/achievements?'+p);
  let filtered=rows||[];
  if(hon==='yes') filtered=filtered.filter(r=>r.honor==='نعم');

  const today=new Date().toLocaleDateString('ar-JO',{year:'numeric',month:'long',day:'numeric'});
  const honorCount=filtered.filter(r=>r.honor==='نعم').length;

  const html=`<div class="ph2">
    <img src="/logo.png" class="plogo">
    <div class="puni">
      <div class="ar">الجامعة الأردنية</div>
      <div class="en">The University of Jordan</div>
      <div class="dep">عمادة شؤون الطلبة — Dean of Student Affairs</div>
    </div>
    <div class="pmeta">
      <div><strong>تاريخ الطباعة:</strong> ${today}</div>
      <div><strong>إجمالي السجلات:</strong> ${filtered.length}</div>
      <div><strong>المكرَّمون:</strong> ${honorCount}</div>
    </div>
  </div>
  <div class="ptitle">تقرير الإنجازات والتكريم</div>
  ${act?`<div style="font-size:9pt;margin-bottom:8px;color:#1B6B3A"><strong>النشاط:</strong> ${act}</div>`:''}
  <table class="ptbl">
    <thead>
      <tr>
        <th>#</th>
        <th>الرقم الجامعي</th>
        <th>اسم الطالب</th>
        <th>الإنجاز / المشاركة</th>
        <th>التاريخ</th>
        <th>النشاط</th>
        <th>تكريم</th>
        <th>سبب التكريم</th>
      </tr>
    </thead>
    <tbody>
      ${filtered.map((r,i)=>`<tr>
        <td>${i+1}</td>
        <td>${r.student_id||'-'}</td>
        <td>${r.student_name||'-'}</td>
        <td>${r.work||'-'}</td>
        <td>${r.ach_date||'-'}</td>
        <td>${r.activity||'-'}</td>
        <td style="text-align:center">${r.honor==='نعم'?'✅':'−'}</td>
        <td>${r.honor_reason||'-'}</td>
      </tr>`).join('')}
    </tbody>
  </table>
  <div style="margin-top:10px;font-size:8pt;color:#666;display:flex;justify-content:space-between">
    <span>إجمالي الإنجازات: <strong>${filtered.length}</strong></span>
    <span>المكرَّمون: <strong>${honorCount}</strong></span>
  </div>
  <div style="margin-top:14px;display:grid;grid-template-columns:1fr 1fr;gap:10px">
    <div class="sbox"><div class="st2">توقيع المسؤول</div><div class="sl2">الاسم والتوقيع: .................</div></div>
    <div class="sbox"><div class="st2">التاريخ</div><div class="sl2">.......................................</div></div>
  </div>`;
  openPrint(html);
}
