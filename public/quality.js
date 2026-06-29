
// تحويل نص متعدد الأسطر إلى HTML مرقّم
function fmtVal(val) {
  if(!val && val !== 0) return '-';
  const str = String(val);
  if(str.includes('\n')) {
    return str.split('\n').filter(Boolean).map((s,i)=>`${i+1}. ${s}`).join('<br>');
  }
  return str;
}
// ══════════════════════════════════════════
// جداول الجودة
// ══════════════════════════════════════════
const QCFG = {
  governance:{title:'مشاركة الطلبة في مجالس الحاكمية واللجان',cols:['committee','authority','student_id','student_name','college','level','meetings_count','date'],heads:['اللجنة','الجهة','الرقم الجامعي','الطالب','الكلية','المستوى','الاجتماعات','التاريخ'],fields:[{l:'اسم اللجنة*',id:'committee',t:'text'},{l:'الجهة',id:'authority',t:'text'},{l:'الرقم الجامعي',id:'student_id',t:'text'},{l:'اسم الطالب*',id:'student_name',t:'text'},{l:'الكلية',id:'college',t:'college'},{l:'التخصص',id:'major',t:'text'},{l:'المستوى الدراسي',id:'level',t:'year'},{l:'عدد الاجتماعات',id:'meetings_count',t:'number'},{l:'التاريخ*',id:'date',t:'date'}]},
  workshops:{title:'الدورات وورش العمل والمحاضرات والبرامج',cols:['name','authority','date','students_count','external_party','rating'],heads:['النشاط','الجهة','التاريخ','الطلبة','جهة خارجية','التقييم'],fields:[{l:'اسم النشاط*',id:'name',t:'text'},{l:'الجهة المنظِّمة',id:'authority',t:'text'},{l:'التاريخ*',id:'date',t:'date'},{l:'عدد الطلبة الحاضرين',id:'students_count',t:'number'},{l:'أسماء العاملين',id:'staff_names',t:'textarea'},{l:'أسماء القيادات',id:'leaders_names',t:'textarea'},{l:'جهة خارجية',id:'external_party',t:'yesno'},{l:'اسم الجهة الخارجية',id:'ext_name',t:'text'},{l:'أسماء المشاركين من الخارج',id:'ext_people',t:'textarea'},{l:'رقم تقييم النشاط',id:'rating',t:'number'}]},
  initiatives:{title:'مبادرات الإبداع والابتكار والريادة',cols:['name','type','date','participants_count','attendees_count','rating'],heads:['المبادرة','النوع','التاريخ','المشاركون','الحاضرون','التقييم'],fields:[{l:'اسم المبادرة*',id:'name',t:'text'},{l:'نوع المبادرة',id:'type',t:'text'},{l:'التاريخ*',id:'date',t:'date'},{l:'عدد الطلبة المشاركين',id:'participants_count',t:'number'},{l:'عدد الطلبة الحاضرين',id:'attendees_count',t:'number'},{l:'أسماء القيادات',id:'leaders_names',t:'textarea'},{l:'جهة خارجية',id:'external_party',t:'yesno'},{l:'اسم الجهة الخارجية',id:'ext_name',t:'text'},{l:'أسماء المشاركين من الخارج',id:'ext_people',t:'textarea'},{l:'رقم تقييم النشاط',id:'rating',t:'number'}]},
  external_acts:{title:'مشاركة الطلبة في الأنشطة الإبداعية الخارجية',cols:['name','type','date','students_count','external_party','rating'],heads:['النشاط','النوع','التاريخ','الطلبة','جهة خارجية','التقييم'],fields:[{l:'اسم النشاط*',id:'name',t:'text'},{l:'نوع النشاط',id:'type',t:'text'},{l:'التاريخ*',id:'date',t:'date'},{l:'عدد الطلبة الحاضرين',id:'students_count',t:'number'},{l:'أسماء القيادات',id:'leaders_names',t:'textarea'},{l:'جهة خارجية',id:'external_party',t:'yesno'},{l:'اسم الجهة الخارجية',id:'ext_name',t:'text'},{l:'أسماء المشاركين من الخارج',id:'ext_people',t:'textarea'},{l:'رقم تقييم النشاط',id:'rating',t:'number'}]},
  competitions:{title:'الأنشطة التي تعد الطلبة للمنافسات المحلية والدولية',cols:['name','type','date','students_count','trainer','rating'],heads:['النشاط','النوع','التاريخ','الطلبة','المدرب','التقييم'],fields:[{l:'اسم النشاط*',id:'name',t:'text'},{l:'نوع النشاط',id:'type',t:'text'},{l:'التاريخ*',id:'date',t:'date'},{l:'عدد الطلبة المشاركين',id:'students_count',t:'number'},{l:'اسم المدرب',id:'trainer',t:'text'},{l:'أسماء العاملين',id:'staff_names',t:'textarea'},{l:'جهة خارجية',id:'external_party',t:'yesno'},{l:'اسم الجهة الخارجية',id:'ext_name',t:'text'},{l:'أسماء المشاركين من الخارج',id:'ext_people',t:'textarea'},{l:'رقم تقييم النشاط',id:'rating',t:'number'}]},
  student_honors:{title:'تكريم الطلبة لإنجازاتهم وإبداعاتهم',cols:['student_id','student_name','reason','date'],heads:['الرقم الجامعي','اسم الطالب','سبب التكريم','تاريخ التكريم'],fields:[{l:'الرقم الجامعي',id:'student_id',t:'text'},{l:'اسم الطالب*',id:'student_name',t:'text'},{l:'سبب التكريم*',id:'reason',t:'text'},{l:'تاريخ التكريم*',id:'date',t:'date'},{l:'ملاحظات',id:'notes',t:'text'}]},
  staff_committees:{title:'مشاركة الموظفين في اللجان المجتمعية',cols:['staff_name','workplace','committee_name','committee_type','date'],heads:['الموظف','مكان العمل','اللجنة','النوع','التاريخ'],fields:[{l:'اسم الموظف*',id:'staff_name',t:'text'},{l:'جهة العمل',id:'workplace',t:'text'},{l:'الصفة الوظيفية',id:'job_title',t:'text'},{l:'اسم اللجنة*',id:'committee_name',t:'text'},{l:'نوع اللجنة',id:'committee_type',t:'select',opts:['وطنية','دولية']},{l:'تاريخ الاشتراك',id:'date',t:'date'}]},
  staff_training:{title:'خطة التدريب المتكاملة للموظفين',cols:['staff_name','workplace','course_name','date','reference_num'],heads:['الموظف','مكان العمل','الدورة','التاريخ','رقم الكتاب'],fields:[{l:'اسم الموظف*',id:'staff_name',t:'text'},{l:'مكان العمل',id:'workplace',t:'text'},{l:'الرقم الوظيفي',id:'employee_id',t:'text'},{l:'اسم الدورة*',id:'course_name',t:'text'},{l:'التاريخ*',id:'date',t:'date'},{l:'رقم الكتاب',id:'reference_num',t:'text'}]},
  staff_innovation:{title:'مشاركة الموظفين في أنشطة الإبداع والابتكار',cols:['staff_name','job_title','activity_name','date','rating'],heads:['الموظف','الوظيفة','النشاط','التاريخ','التقييم'],fields:[{l:'اسم الموظف*',id:'staff_name',t:'text'},{l:'الوظيفة',id:'job_title',t:'text'},{l:'مكان العمل',id:'workplace',t:'text'},{l:'اسم النشاط*',id:'activity_name',t:'text'},{l:'نوع النشاط',id:'activity_type',t:'text'},{l:'التاريخ*',id:'date',t:'date'},{l:'الجهة المشرفة',id:'supervising_authority',t:'text'},{l:'رقم تقييم النشاط',id:'rating',t:'number'}]},
  staff_honors:{title:'الموظفون الحاصلون على جوائز أو تكريم',cols:['staff_name','honor_type','reason','authority','date'],heads:['الموظف','نوع التكريم','السبب','الجهة','التاريخ'],fields:[{l:'اسم الموظف*',id:'staff_name',t:'text'},{l:'نوع التكريم',id:'honor_type',t:'select',opts:['شهادة','درع','مكافأة']},{l:'سبب التكريم*',id:'reason',t:'text'},{l:'جهة التكريم',id:'authority',t:'text'},{l:'التاريخ*',id:'date',t:'date'}]},
  uni_committees:{title:'اللجان الجامعية ومشاركة الموظفين',cols:['committee_name','committee_category','staff_name','participation_type','workplace','date'],heads:['اللجنة','التصنيف','الموظف','المشاركة','مكان العمل','التاريخ'],fields:[{l:'اسم اللجنة*',id:'committee_name',t:'text'},{l:'اسم الموظف*',id:'staff_name',t:'text'},{l:'تصنيف اللجنة',id:'committee_category',t:'text'},{l:'اسم المقرر',id:'secretary_name',t:'text'},{l:'نوع المشاركة',id:'participation_type',t:'select',opts:['رئيس','عضو']},{l:'وظيفة الموظف',id:'job_title',t:'text'},{l:'فئة الموظف',id:'staff_category',t:'text'},{l:'مكان العمل',id:'workplace',t:'text'},{l:'تاريخ الاشتراك',id:'date',t:'date'}]},
  community_svc:{title:'الخدمات التنموية والاستشارات للمجتمع',cols:['service_type','uni_party','community_party','date'],heads:['نوع الخدمة','الجهة الجامعية','الجهة المستفيدة','التاريخ'],fields:[{l:'نوع الخدمة*',id:'service_type',t:'text'},{l:'الجهة المقدِّمة من الجامعة',id:'uni_party',t:'text'},{l:'الجهة المستفيدة',id:'community_party',t:'text'},{l:'التاريخ*',id:'date',t:'date'},{l:'المشاركون من الجامعة',id:'uni_participants',t:'text'},{l:'المشاركون من المجتمع',id:'community_participants',t:'text'}]},
  awareness:{title:'الأنشطة والمحاضرات التوعوية',cols:['name','type','date','external_party','rating'],heads:['النشاط','النوع','التاريخ','جهة خارجية','التقييم'],fields:[{l:'اسم النشاط*',id:'name',t:'text'},{l:'نوع النشاط',id:'type',t:'select',opts:['ديني','توعوي','وطني','تثقيفي']},{l:'التاريخ*',id:'date',t:'date'},{l:'أسماء القيادات',id:'leaders_names',t:'textarea'},{l:'أسماء العاملين',id:'staff_names',t:'textarea'},{l:'جهة خارجية',id:'external_party',t:'yesno'},{l:'اسم الجهة الخارجية',id:'ext_name',t:'text'},{l:'أسماء المشاركين من الخارج',id:'ext_people',t:'textarea'},{l:'رقم تقييم النشاط',id:'rating',t:'number'}]},
  expert_acts:{title:'الأنشطة التي شارك بها الخبراء من المجتمع',cols:['name','date','authority','students_count','rating'],heads:['النشاط','التاريخ','الجهة','الطلبة','التقييم'],fields:[{l:'اسم النشاط*',id:'name',t:'text'},{l:'التاريخ*',id:'date',t:'date'},{l:'الجهة',id:'authority',t:'text'},{l:'عدد الطلبة',id:'students_count',t:'number'},{l:'أسماء الخبراء',id:'experts_names',t:'textarea'},{l:'أسماء العاملين',id:'staff_names',t:'textarea'},{l:'أسماء القيادات',id:'leaders_names',t:'textarea'},{l:'رقم تقييم النشاط',id:'rating',t:'number'}]},
  environment:{title:'أنشطة البيئة والتنمية المستدامة',cols:['name','authority','date','students_count','rating'],heads:['النشاط','الجهة','التاريخ','الطلبة','التقييم'],fields:[{l:'اسم النشاط*',id:'name',t:'text'},{l:'الجهة',id:'authority',t:'text'},{l:'التاريخ*',id:'date',t:'date'},{l:'عدد الطلبة المشاركين',id:'students_count',t:'number'},{l:'أسماء العاملين',id:'staff_names',t:'textarea'},{l:'أسماء القيادات',id:'leaders_names',t:'textarea'},{l:'جهة خارجية',id:'external_party',t:'text'},{l:'اسم الجهة الخارجية',id:'ext_name',t:'text'},{l:'أسماء المشاركين من الخارج',id:'ext_people',t:'textarea'},{l:'رقم تقييم النشاط',id:'rating',t:'number'}]},
  dialogues:{title:'الجلسات الحوارية عن التشريعات السياسية',cols:['title','date','students_count','rating'],heads:['العنوان','التاريخ','الطلبة','التقييم'],fields:[{l:'عنوان الجلسة*',id:'title',t:'text'},{l:'التاريخ*',id:'date',t:'date'},{l:'المتحدثون',id:'speakers',t:'textarea'},{l:'عدد الطلبة المشاركين',id:'students_count',t:'number'},{l:'أسماء العاملين',id:'staff_names',t:'textarea'},{l:'أسماء القيادات',id:'leaders_names',t:'textarea'},{l:'جهة خارجية',id:'external_party',t:'yesno'},{l:'اسم الجهة الخارجية',id:'ext_name',t:'text'},{l:'أسماء المشاركين من الخارج',id:'ext_people',t:'textarea'},{l:'رقم تقييم النشاط',id:'rating',t:'number'}]},
  campaigns:{title:'الحملات التوعوية والتثقيفية',cols:['title','date','external_party','students_count','rating'],heads:['العنوان','التاريخ','الجهة الخارجية','الطلبة','التقييم'],fields:[{l:'عنوان الحملة*',id:'title',t:'text'},{l:'التاريخ*',id:'date',t:'date'},{l:'جهة خارجية',id:'external_party',t:'yesno'},{l:'اسم الجهة الخارجية',id:'ext_name',t:'text'},{l:'أسماء المشاركين من الخارج',id:'ext_people',t:'textarea'},{l:'أسماء المتحدثين',id:'speakers',t:'textarea'},{l:'عدد الطلبة المشاركين',id:'students_count',t:'number'},{l:'أسماء العاملين',id:'staff_names',t:'textarea'},{l:'أسماء القيادات',id:'leaders_names',t:'textarea'},{l:'رقم تقييم النشاط',id:'rating',t:'number'}]},
};

function buildQField(f, table='') {
  const id=`qf-${f.id}`;
  // حقل text عادي -- يُبنى كـ input دائماً بغض النظر عن أي شيء آخر
  if(f.t==='text') return `<div class="fg"><label>${f.l}</label><input id="${id}" type="text"></div>`;
  // حقل الرقم الجامعي في جداول الطلبة — مع autoFill
  if(f.id==='student_id' && (table==='student_honors'||table==='governance'))
    return `<div class="fg"><label>${f.l}</label><input id="${id}" type="text" onblur="autoFillHonor()" placeholder="أدخل الرقم الجامعي لجلب البيانات تلقائياً..."></div>`;
  // textarea يجب أن يكون أولاً قبل أي شرط آخر
  if(f.t==='textarea')
    return `<div class="fg full"><label>${f.l}</label><textarea id="${id}" rows="3" style="resize:vertical;font-family:inherit;width:100%;padding:7px 10px;border:1px solid var(--border);border-radius:var(--r)" ></textarea></div>`;
  if(f.t==='date')   return `<div class="fg"><label>${f.l}</label><input id="${id}" type="date"></div>`;
  if(f.t==='number') return `<div class="fg"><label>${f.l}</label><input id="${id}" type="number" min="0"></div>`;
  if(f.t==='college')return `<div class="fg"><label>${f.l}</label><select id="${id}"><option value="">اختر الكلية...</option>${colOpts()}</select></div>`;
  if(f.t==='year')   return `<div class="fg"><label>${f.l}</label><select id="${id}"><option value="">اختر...</option>${selOpts(YEARS)}</select></div>`;
  if(f.t==='yesno')  return `<div class="fg"><label>${f.l}</label><select id="${id}"><option value="">اختر...</option><option>نعم</option><option>لا</option></select></div>`;
  if(f.t==='select') return `<div class="fg"><label>${f.l}</label><select id="${id}"><option value="">اختر...</option>${selOpts(f.opts||[])}</select></div>`;
  return `<div class="fg"><label>${f.l}</label><input id="${id}" type="text"></div>`;
}


// جلب اسم الطالب تلقائياً في نماذج الجودة
async function autoFillHonor() {
  const sid = document.getElementById('qf-student_id')?.value?.trim();
  if(!sid) return;
  const rows = await api('/api/students?q='+encodeURIComponent(sid));
  const r = (rows||[]).find(s=>s.student_id===sid)||(rows||[])[0];
  const nameEl = document.getElementById('qf-student_name');
  const colEl  = document.getElementById('qf-college');
  const majEl  = document.getElementById('qf-major');
  const levEl  = document.getElementById('qf-level');
  if(r){
    if(nameEl){ nameEl.value=r.name; nameEl.style.background='#F0FAF4'; nameEl.style.borderColor='#1B6B3A'; }
    if(colEl && r.college)  colEl.value = r.college;
    if(majEl && r.major)    majEl.value = r.major;
    if(levEl && r.study_level) levEl.value = r.study_level;
  } else if(nameEl){
    nameEl.style.background = '#fff';
    nameEl.style.borderColor = '#D4A017';
    nameEl.placeholder = 'الطالب غير موجود — اكتب الاسم يدوياً';
    nameEl.focus();
  }
}

async function loadQ(table) {
  const cfg = QCFG[table]; if(!cfg) return;
  const canEdit = ME?.role !== 'viewer';
  document.getElementById('panel-'+table).innerHTML = `
  <div class="ph">
    <div><div class="pt">${cfg.title}</div><div class="ps">بيانات الجودة</div></div>
    <div style="display:flex;gap:6px">
      ${canEdit?`<button class="btn btn-g" onclick="showQForm('${table}')"><i class="ti ti-plus"></i>إضافة سجل</button>`:''}
      <button class="btn" onclick="exportCSV('${table}')"><i class="ti ti-download"></i>CSV</button>
      <button class="btn btn-b" onclick="printQTable('${table}')"><i class="ti ti-printer"></i>طباعة</button>
    </div>
  </div>
  <div id="qform-${table}" style="display:none">
    <div class="card">
      <div class="ct"><i class="ti ti-plus"></i>إضافة سجل جديد</div>
      <div id="msg-${table}" class="msg"></div>
      <div class="g2">${cfg.fields.map(f=>buildQField(f,table)).join('')}</div>
      <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:8px">
        <button class="btn" onclick="document.getElementById('qform-${table}').style.display='none'">إلغاء</button>
        <button class="btn btn-g" onclick="saveQ('${table}')">✔ حفظ</button>
      </div>
    </div>
  </div>
  <div class="fb">
    <input type="text" id="qsf-${table}" placeholder="بحث..." oninput="loadQData('${table}')">
    <input type="date" id="qff-${table}" onchange="loadQData('${table}')">
    <input type="date" id="qft-${table}" onchange="loadQData('${table}')">
    <span style="font-size:11px;color:var(--muted)">من — إلى</span>
  </div>
  <div id="qcnt-${table}" style="font-size:11px;color:var(--muted);margin-bottom:5px"></div>
  <div class="tw"><table><thead><tr><th>#</th>${cfg.heads.map(h=>`<th>${h}</th>`).join('')}<th>المصدر / الكشف</th>${canEdit?'<th></th>':''}</tr></thead>
  <tbody id="qtbl-${table}"></tbody></table></div>`;
  loadQData(table);
}

async function loadQData(table) {
  const cfg=QCFG[table];
  const q=document.getElementById('qsf-'+table)?.value||'';
  const from=document.getElementById('qff-'+table)?.value||'';
  const to=document.getElementById('qft-'+table)?.value||'';
  const p=new URLSearchParams(); if(q)p.set('q',q); if(from)p.set('from',from); if(to)p.set('to',to);
  const rows=await api('/api/'+table+'?'+p);
  const canEdit=ME?.role!=='viewer';
  const cnt=document.getElementById('qcnt-'+table); if(cnt)cnt.textContent=`السجلات: ${rows?.length||0}`;
  const tbody=document.getElementById('qtbl-'+table); if(!tbody)return;
  tbody.innerHTML=(rows||[]).map((r,i)=>`<tr style="${r.source&&!r.completed?'background:#FFFBF0':''}">
    <td>${i+1}</td>
    ${cfg.cols.map(c=>`<td>${r[c]||'-'}</td>`).join('')}
    <td style="font-size:10px">
      ${r.source?`<span class="st st-p" style="font-size:10px">مرحَّل</span>`:'-'}
      ${r.attached_participant_id?`<span class="st st-a" style="font-size:10px;margin-right:4px;cursor:pointer" onclick="printPart('${r.attached_participant_id}')">📄 كشف أسماء 🖨️</span>`:''}
    </td>
    ${canEdit?`<td><div class="rb">
      ${r.source&&!r.completed?`<button class="btn btn-sm btn-g" onclick="markCompleteQ('${table}','${r.id}')">✅ مكتمل</button>`:''}
      <button class="btn btn-sm btn-b" onclick="editQRow('${table}','${r.id}')">✏️ تعديل</button>
      <button class="btn btn-sm btn-b" onclick="printQRow('${table}','${r.id}')">🖨️ طباعة</button>
      ${['workshops','initiatives','external_acts','competitions','awareness','expert_acts','environment','dialogues','campaigns','community_svc'].includes(table)?`<button class="btn btn-sm" style="background:#8B6914;color:#fff;border-color:#8B6914" onclick="openAttachModal('${table}','${r.id}','${r.name||r.title||''}')">${r.attached_participant_id?'📄 كشف مرفق':'📎 إرفاق كشف'}</button>`:''}
      <button class="btn btn-r" onclick="delRec('${table}','${r.id}',()=>loadQData('${table}'))">🗑</button>
    </div></td>`:''}
  </tr>`).join('')||`<tr class="erow"><td colspan="${cfg.cols.length+3}">لا توجد سجلات</td></tr>`;
  const c=document.getElementById('c-'+table); if(c) c.textContent=rows?.length||0;
}

async function markCompleteQ(table,id) {
  const r=await api(`/api/${table}/${id}`);
  await api(`/api/${table}/${id}`,'PUT',{...r,completed:true});
  loadQData(table); loadIncomplete();
}

function showQForm(table, record=null) {
  const f=document.getElementById('qform-'+table); f.style.display='block';
  // مسح جميع الحقول
  f.querySelectorAll('input:not([type=file]),select,textarea').forEach(el=>el.value='');

  if(record){
    const cfg=QCFG[table];
    // ملء الحقول بعد المسح مباشرة
    if(cfg) cfg.fields.forEach(fd=>{
      const el=document.getElementById('qf-'+fd.id);
      if(el){
        el.value = (record[fd.id] !== undefined && record[fd.id] !== null) ? record[fd.id] : '';
      }
    });
    // حفظ ID
    f.dataset.editId = String(record.id || record._id || '');
    const btn=f.querySelector('button.btn-g');
    if(btn){
      btn.textContent='✔ حفظ التعديلات';
      btn.setAttribute('onclick', `saveQ('${table}')`);
    }
    const msg=document.getElementById('msg-'+table);
    if(msg){msg.textContent='✏️ وضع التعديل — عدّل البيانات ثم احفظ';msg.className='msg warn';msg.style.display='block';}
  } else {
    delete f.dataset.editId;
    const btn=f.querySelector('button.btn-g');
    if(btn){btn.textContent='✔ حفظ';btn.setAttribute('onclick',`saveQ('${table}')`);}
  }
  f.scrollIntoView({behavior:'smooth'});
}

async function saveQ(table) {
  const cfg=QCFG[table];
  const data={};
  cfg.fields.forEach(f=>{
    const el=document.getElementById('qf-'+f.id);
    if(!el){ data[f.id]=''; return; }
    data[f.id] = el.value !== undefined ? el.value : '';
  });
  // التحقق من الحقول الإلزامية — يتحقق من أول حقل نصي إلزامي فقط
  const form2=document.getElementById('qform-'+table);
  const isEditing = form2?.dataset.editId;
  if(!isEditing){
    // البحث عن أول حقل نصي إلزامي وقراءته من data
    const firstRequired = cfg.fields.find(f=>
      f.l.includes('*') && (f.t==='text'||f.t==='textarea')
    );
    if(firstRequired){
      const val = (data[firstRequired.id]||'').toString().trim();
      if(!val){
        showMsg('msg-'+table,`يرجى ملء: ${firstRequired.l.replace(/\*/g,'').trim()}`,true);
        return;
      }
    }
  }
  const form=document.getElementById('qform-'+table);
  const editId=form?.dataset.editId;
  let r;
  if(editId){
    // تعديل سجل موجود
    const old=await api('/api/'+table+'/'+editId);
    r=await api('/api/'+table+'/'+editId,'PUT',{...old,...data});
  } else {
    r=await api('/api/'+table,'POST',data);
  }
  if(r.error){showMsg('msg-'+table,r.error,true);return;}
  showMsg('msg-'+table,'تم الحفظ بنجاح ✓');
  form.style.display='none';
  delete form.dataset.editId;
  loadQData(table);
}

// ══════════════════════════════════════════
// النماذج العامة (الإعلانات، القاعات، اللجان، الاجتماعات)
// ══════════════════════════════════════════
const FCFG = {
  announcements:{title:'الإعلانات عن الفعاليات',code:'',cols:['title','type','date','location','organizer'],heads:['العنوان','النوع','التاريخ','المكان','الجهة'],fields:[{l:'عنوان الفعالية*',id:'title',t:'text'},{l:'نوع الفعالية',id:'type',t:'select',opts:['مبادرة','محاضرة','دورة تدريبية','ورشة','معرض','مسابقة','أخرى']},{l:'التاريخ*',id:'date',t:'date'},{l:'الوقت',id:'time',t:'text'},{l:'المكان',id:'location',t:'text'},{l:'الجهة المنظِّمة',id:'organizer',t:'text'},{l:'للتواصل',id:'contact',t:'text'},{l:'وصف',id:'description',t:'text'},{l:'ملاحظات',id:'notes',t:'text'}]},
  hall_bookings:{title:'حجز المدرجات والقاعات',code:'DSA-06-28-01',cols:['hall','day','date','time_from','time_to','purpose','supervisor'],heads:['المكان','اليوم','التاريخ','من','إلى','الغرض','المشرف'],fields:[{l:'المكان*',id:'hall',t:'select',opts:['مدرج الحسن بن طلال','المدرج الصغير','قاعة الإعلام والاتصال','قاعة المعارض الكبرى','قاعة معاذ الكساسبة','قاعة اجتماعات العمادة','حديقة العمادة الداخلية','الصوتيات']},{l:'اليوم*',id:'day',t:'select',opts:['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت']},{l:'التاريخ*',id:'date',t:'date'},{l:'من الساعة',id:'time_from',t:'text'},{l:'إلى الساعة',id:'time_to',t:'text'},{l:'الغرض*',id:'purpose',t:'text'},{l:'اسم المشرف',id:'supervisor',t:'text'}]},
  committees:{title:'تشكيل لجنة / مجلس',code:'AQC-02-10-01',cols:['name','type','date','ref_num','meeting_freq','secretary'],heads:['اللجنة','النوع','التاريخ','رقم الكتاب','آلية الاجتماع','المقرر'],fields:[{l:'اسم اللجنة*',id:'name',t:'text'},{l:'رقم الكتاب',id:'ref_num',t:'text'},{l:'تاريخ التشكيل',id:'date',t:'date'},{l:'نوع اللجنة',id:'type',t:'select',opts:['دائمة','مؤقتة']},{l:'آلية الاجتماع',id:'meeting_freq',t:'select',opts:['أسبوعياً','كل أسبوعين','شهرياً','أخرى']},{l:'الهدف العام',id:'goal',t:'text'},{l:'المهام',id:'tasks',t:'text'},{l:'أسماء الأعضاء',id:'members',t:'textarea'},{l:'المقرر',id:'secretary',t:'text'},{l:'أمين السر',id:'ameen',t:'text'}]},
  meeting_invites:{title:'دعوات حضور الاجتماعات',code:'AQC-04-01-01',cols:['committee','subject','session_num','date','time','location'],heads:['اللجنة','الموضوع','رقم الجلسة','التاريخ','الوقت','المكان'],fields:[{l:'اللجنة*',id:'committee',t:'text'},{l:'الموضوع*',id:'subject',t:'text'},{l:'رقم الجلسة',id:'session_num',t:'text'},{l:'التاريخ*',id:'date',t:'date2'},{l:'الوقت',id:'time',t:'text'},{l:'طبيعة الاجتماع',id:'nature',t:'select',opts:['عادي وجاهي','عادي عن بعد','عادي مدمج','طارئ وجاهي','طارئ عن بعد']},{l:'المكان',id:'location',t:'text'},{l:'المدعوّون',id:'invitees',t:'textarea'},{l:'جدول الأعمال',id:'agenda',t:'text'},{l:'أمين السر',id:'ameen',t:'text'},{l:'رئيس اللجنة',id:'head',t:'text'}]},
  meeting_minutes:{title:'محاضر الاجتماعات',code:'AQC-04-01-02',cols:['committee','session_num','date','time','chair'],heads:['اللجنة','رقم الجلسة','التاريخ','الوقت','الرئيس'],fields:[{l:'اللجنة*',id:'committee',t:'text'},{l:'رقم الجلسة',id:'session_num',t:'text'},{l:'التاريخ*',id:'date',t:'date2'},{l:'الوقت',id:'time',t:'text'},{l:'نوع الاجتماع',id:'nature',t:'select',opts:['دوري وجاهي','دوري عن بعد','دوري مدمج','طارئ']},{l:'رئيس الجلسة',id:'chair',t:'text'},{l:'الحاضرون (الاسم - المنصب)',id:'present',t:'textarea'},{l:'المعتذرون',id:'absent',t:'textarea'},{l:'أمين السر',id:'ameen',t:'text'},{l:'البنود والقرارات',id:'items',t:'textarea'},{l:'وقت الانتهاء',id:'end_time',t:'text'}]},
};


function autoFillDay(dateVal) {
  if(!dateVal) return;
  const days = ['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
  const d = new Date(dateVal);
  const dayName = days[d.getDay()];
  // البحث عن حقل اليوم في النموذج
  const dayEl = document.getElementById('ff-day') || document.getElementById('qf-day');
  if(dayEl) dayEl.value = dayName;
}

function buildFF(f,pfx='ff') {
  const id=`${pfx}-${f.id}`;
  // حقل اللجنة في دعوات الاجتماع — مع اقتراح تلقائي
  if(f.id==='committee' && pfx==='ff')
    return `<div class="fg" id="comm-wrapper" style="position:relative">
      <label>${f.l}</label>
      <input id="${id}" type="text" oninput="showCommitteeSuggest(this.value)" onfocus="loadCommitteesList();showCommitteeSuggest(this.value)" autocomplete="off" style="padding:7px 10px;border:1px solid var(--border);border-radius:var(--r);font-family:inherit;width:100%">
      <div id="comm-suggest" style="display:none;position:absolute;top:100%;right:0;left:0;background:#fff;border:1px solid var(--border);border-radius:var(--r);box-shadow:0 4px 12px rgba(0,0,0,.1);z-index:100;max-height:200px;overflow-y:auto"></div>
    </div>`;
  if(f.t==='textarea') return `<div class="fg full"><label>${f.l}</label><textarea id="${id}" rows="3" style="resize:vertical;font-family:inherit;width:100%;padding:7px 10px;border:1px solid var(--border);border-radius:var(--r)"></textarea></div>`;
  if(f.t==='date'||f.t==='date2'){
    // إذا كان في نموذج حجز القاعة — يملأ اليوم تلقائياً
    const onchange = f.id==='date'?`onchange="autoFillDay(this.value)"`:'' ;
    return `<div class="fg"><label>${f.l}</label><input id="${id}" type="date" ${onchange}></div>`;
  }
  if(f.t==='number') return `<div class="fg"><label>${f.l}</label><input id="${id}" type="number"></div>`;
  if(f.t==='select') return `<div class="fg"><label>${f.l}</label><select id="${id}"><option value="">اختر...</option>${selOpts(f.opts||[])}</select></div>`;
  return `<div class="fg"><label>${f.l}</label><input id="${id}" type="text"></div>`;
}


async function markFComplete(table, id) {
  const r = await api('/api/'+table+'/'+id);
  if(!r||r.error){alert('تعذر تحميل السجل');return;}
  const res = await api('/api/'+table+'/'+id,'PUT',{...r,completed:true});
  if(res.error){alert('خطأ في الحفظ');return;}
  loadFData(table);
  // تحديث العداد
  const stats = await api('/api/stats');
  const el=document.getElementById('c-inc');
  if(el) el.textContent=stats.incomplete||0;
}

async function loadForm(table) {
  const cfg=FCFG[table]; if(!cfg) return;
  const canEdit=ME?.role!=='viewer';
  document.getElementById('panel-'+table).innerHTML=`
  <div class="ph">
    <div><div class="pt">${cfg.title}</div>${cfg.code?`<div class="pc">${cfg.code}</div>`:''}</div>
    <div style="display:flex;gap:6px">
      ${canEdit?`<button class="btn btn-g" onclick="showFF('${table}')"><i class="ti ti-plus"></i>إضافة جديد</button>`:''}
      <button class="btn" onclick="exportCSV('${table}')"><i class="ti ti-download"></i>CSV</button>
    </div>
  </div>
  <div id="ff-${table}" style="display:none">
    <div class="card">
      <div class="ct"><i class="ti ti-plus"></i>إضافة سجل جديد</div>
      <div id="msg-${table}" class="msg"></div>
      <div class="g2">${cfg.fields.map(f=>buildFF(f,'ff')).join('')}</div>
      <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:8px">
        <button class="btn" onclick="document.getElementById('ff-${table}').style.display='none'">إلغاء</button>
        <button class="btn btn-g" onclick="saveFF('${table}')">✔ حفظ</button>
      </div>
    </div>
  </div>
  <div class="fb"><input type="text" id="ffs-${table}" placeholder="بحث..." oninput="loadFData('${table}')"></div>
  <div class="tw"><table><thead><tr><th>#</th>${cfg.heads.map(h=>`<th>${h}</th>`).join('')}<th>الحالة</th>${canEdit?'<th></th>':''}</tr></thead>
  <tbody id="ftbl-${table}"></tbody></table></div>`;
  loadFData(table);
}

async function loadFData(table) {
  const cfg=FCFG[table];
  const q=document.getElementById('ffs-'+table)?.value||'';
  const p=new URLSearchParams(); if(q)p.set('q',q);
  const rows=await api('/api/'+table+'?'+p);
  const canEdit=ME?.role!=='viewer';
  document.getElementById('ftbl-'+table).innerHTML=(rows||[]).map((r,i)=>`<tr style="${r.source&&!r.completed?'background:#FFFBF0':''}">
    <td>${i+1}</td>${cfg.cols.map(c=>`<td>${r[c]||'-'}</td>`).join('')}
    ${r.source&&!r.completed?`<td><span class="st st-p" style="font-size:10px">غير مكتمل</span></td>`:(r.source?`<td><span class="st st-a" style="font-size:10px">مكتمل</span></td>`:'<td></td>')}
    ${canEdit?`<td><div class="rb">
      ${r.source&&!r.completed?`<button class="btn btn-sm btn-g" onclick="markFComplete('${table}','${r.id}')">✅ مكتمل</button>`:''}
      ${table==='announcements'?`<button class="btn btn-sm btn-b" onclick="printAnnouncement('${r.id}')">🖨️ طباعة</button>`:''}
      ${table==='hall_bookings'?`<button class="btn btn-sm btn-b" onclick="printHallBooking('${r.id}')">🖨️ طباعة</button>`:''}
      ${table==='committees'?`<button class="btn btn-sm btn-b" onclick="printCommittee('${r.id}')">🖨️ طباعة</button>`:''}
      ${table==='meeting_invites'?`<button class="btn btn-sm btn-b" onclick="printInvite('${r.id}')">🖨️ طباعة</button>`:''}
      ${table==='meeting_minutes'?`<button class="btn btn-sm btn-b" onclick="printMinutes('${r.id}')">🖨️ طباعة</button>`:''}
      ${table==='meeting_minutes'&&(r.source&&!r.completed)?`<button class="btn btn-sm" style="color:#1B5E9A;border-color:#1B5E9A" onclick="editMinutes('${r.id}')">✏️ تعديل</button>`:''}
      <button class="btn btn-r" onclick="delRec('${table}','${r.id}',()=>loadFData('${table}'))">🗑</button>
    </div></td>`:''}
  </tr>`).join('')||`<tr class="erow"><td colspan="${cfg.cols.length+3}">لا توجد سجلات</td></tr>`;
  const c=document.getElementById('c-'+table); if(c)c.textContent=rows?.length||0;
}

function showFF(table) {
  const f=document.getElementById('ff-'+table); f.style.display='block';
  // مسح جميع الحقول بما فيها date
  f.querySelectorAll('input:not([type=file]),select,textarea').forEach(el=>{el.value='';});
  f.scrollIntoView({behavior:'smooth'});
}

async function saveFF(table) {
  const cfg=FCFG[table];
  const data={};
  // نطاق البحث محصور داخل نموذج هذا الجدول فقط — لتفادي تعارض المعرّفات
  // المكرّرة (مثل ff-date) الموجودة في نماذج أخرى مفتوحة في الصفحة
  const form=document.getElementById('ff-'+table);
  cfg.fields.forEach(f=>{
    const el = form ? form.querySelector('[id="ff-'+f.id+'"]') : document.getElementById('ff-'+f.id);
    if(!el){ data[f.id]=''; return; }
    // date inputs تحتاج معالجة خاصة
    if(el.type==='date'){
      data[f.id] = el.value || '';
    } else if(el.tagName==='TEXTAREA'){
      data[f.id] = el.value || '';
    } else if(el.tagName==='SELECT'){
      data[f.id] = el.value || '';
    } else {
      data[f.id] = el.value || '';
    }
  });
  // التحقق من الحقول الإلزامية (يتجاهل حقول التاريخ لأنها تُقرأ بشكل مختلف)
  const missing=cfg.fields.find(f=>{
    if(!f.l.includes('*')) return false;
    if(f.t==='date'||f.t==='date2') return false; // التاريخ اختياري في التحقق
    const val=(data[f.id]||'').trim();
    return !val;
  });
  if(missing){showMsg('msg-'+table,`يرجى ملء: ${missing.l.replace(/\*/g,'').trim()}`,true);return;}
  const r=await api('/api/'+table,'POST',data);
  if(r.error){showMsg('msg-'+table,r.error,true);return;}
  showMsg('msg-'+table,'تم الحفظ بنجاح ✓');
  document.getElementById('ff-'+table).style.display='none';
  // ترحيل دعوة الاجتماع ← محضر الاجتماع تلقائياً
  if(table==='meeting_invites'){
    // ترحيل للمحضر — نستخدم data المحفوظة مباشرة
    const minutesData = {
      committee:   data.committee   || '',
      session_num: data.session_num || '',
      date:        data.date        || '',
      time:        data.time        || '',
      nature:      data.nature      || '',
      chair:       data.head        || '',
      present:     '',
      absent:      '',
      ameen:       data.ameen       || '',
      items:       '',
      end_time:    '',
      source:      `مرحَّل من دعوة اجتماع — ${data.committee}`,
      completed:   false
    };
    await api('/api/meeting_minutes','POST', minutesData);
  }
  loadFData(table);
}

// ══════════════════════════════════════════
// نموذج أسماء المشاركين
// ══════════════════════════════════════════
async function loadParticipants() {
  const canEdit=ME?.role!=='viewer';
  document.getElementById('panel-participants').innerHTML=`
  <div class="ph">
    <div><div class="pt"><i class="ti ti-list-check"></i> أسماء الطلبة المشاركين في النشاط</div><div class="pc">DSA-02-01-02</div></div>
    <div style="display:flex;gap:6px">
      ${canEdit?`<button class="btn btn-g" onclick="showPForm()"><i class="ti ti-plus"></i>نموذج جديد</button>`:''}
      <button class="btn btn-b" onclick="printBlankPart()"><i class="ti ti-printer"></i>طباعة فارغ</button>
    </div>
  </div>
  <div id="part-form" style="display:none">
    <div id="msg-participants" class="msg"></div>
    <div class="card">
      <div class="ct"><i class="ti ti-info-circle"></i>بيانات النشاط</div>
      <div class="g2">
        <div class="fg"><label>اسم النشاط *</label><input id="pf-act" type="text"></div>
        <div class="fg"><label>يوم وتاريخ عقد النشاط *</label><input id="pf-date" type="date"></div>
        <div class="fg"><label>الجهة المسؤولة</label><input id="pf-org" type="text"></div>
        <div class="fg"><label>رقم النشاط للتقييم</label><input id="pf-eval" type="text"></div>
      </div>
    </div>
    <div class="card">
      <div class="ct"><i class="ti ti-users"></i>أسماء الطلبة المشاركين
        <div style="margin-right:auto;display:flex;gap:6px;flex-wrap:wrap">
          <button class="btn btn-sm" onclick="addPartRow()">➕ إضافة طالب</button>
          <button class="btn btn-sm" style="background:#217346;color:#fff;border-color:#217346" onclick="document.getElementById('pf-import').click()">📥 استيراد CSV/Excel</button>
          <input type="file" id="pf-import" accept=".csv,.xlsx,.xls" style="display:none" onchange="importPart(this)">
          <span id="pf-cnt" style="font-size:11px;color:var(--g);font-weight:600;align-self:center"></span>
        </div>
      </div>
      <div style="font-size:11px;color:var(--muted);background:#F9FAFB;padding:6px 10px;border-radius:6px;border:1px solid #eee;margin-bottom:8px">💡 أعمدة الاستيراد: الاسم / الرقم الجامعي / الجنس / الجنسية / الكلية / التخصص / المستوى / رقم الهاتف</div>
      <div id="part-rows"></div>
    </div>
    <div class="card">
      <div class="ct"><i class="ti ti-users-group"></i>المشرفون والموظفون</div>
      <div class="g2">
        <div class="fg"><label>المشرفون</label><textarea id="pf-sups" placeholder="الاسم الأول&#10;الاسم الثاني"></textarea></div>
        <div class="fg"><label>الموظفون</label><textarea id="pf-staff" placeholder="الاسم الأول&#10;الاسم الثاني"></textarea></div>
      </div>
    </div>
    <div style="display:flex;gap:8px;justify-content:flex-end;margin-bottom:14px">
      <button class="btn" onclick="document.getElementById('part-form').style.display='none'">إلغاء</button>
      <button class="btn btn-b" onclick="saveAndPrintPart()"><i class="ti ti-printer"></i>حفظ وطباعة</button>
      <button class="btn btn-g" onclick="savePart()"><i class="ti ti-device-floppy"></i>حفظ فقط</button>
    </div>
  </div>
  <div class="fb"><input type="text" id="ptf-q" placeholder="بحث..." oninput="filterPart()"></div>
  <div class="tw"><table><thead><tr><th>#</th><th>اسم النشاط</th><th>التاريخ</th><th>الجهة</th><th>عدد المشاركين</th><th></th></tr></thead>
  <tbody id="tbl-part"></tbody></table></div>`;
  addPartRow(); filterPart();
}

function showPForm() {
  const f=document.getElementById('part-form'); f.style.display='block';
  f.querySelectorAll('input:not([type=file]),select,textarea').forEach(el=>el.value='');
  document.getElementById('part-rows').innerHTML='';
  document.getElementById('pf-cnt').textContent='';
  addPartRow(); f.scrollIntoView({behavior:'smooth'});
}

function partRowHTML(s={}) {
  const colSel=COLS.map(c=>`<option${s.college===c?' selected':''}>${c}</option>`).join('');
  const yrSel=YEARS.map(y=>`<option${s.year===y?' selected':''}>${y}</option>`).join('');
  return `<div class="g3 part-row" style="margin-bottom:7px;border-bottom:1px solid var(--border);padding-bottom:7px">
    <div class="fg"><label>الاسم الكامل</label><input type="text" class="pr-name" value="${s.name||''}"></div>
    <div class="fg"><label>الرقم الجامعي</label><input type="text" class="pr-id" value="${s.id||''}"></div>
    <div class="fg"><label>الجنس</label><select class="pr-gender"><option value="">...</option><option${s.gender==='ذكر'?' selected':''}>ذكر</option><option${s.gender==='أنثى'?' selected':''}>أنثى</option></select></div>
    <div class="fg"><label>الجنسية</label><input type="text" class="pr-nat" value="${s.nationality||''}" placeholder="أردني..."></div>
    <div class="fg"><label>الكلية</label><select class="pr-col"><option value="">اختر...</option>${colSel}</select></div>
    <div class="fg"><label>التخصص</label><input type="text" class="pr-major" value="${s.major||''}"></div>
    <div class="fg"><label>المستوى</label><select class="pr-year"><option value="">...</option>${yrSel}</select></div>
    <div class="fg"><label>رقم الهاتف</label><input type="text" class="pr-phone" value="${s.phone||''}"></div>
    <div class="fg" style="align-self:flex-end"><button class="btn btn-r" onclick="this.closest('.part-row').remove();updatePartCnt()">حذف</button></div>
  </div>`;
}

function addPartRow() {
  const c=document.getElementById('part-rows'); if(!c) return;
  const div=document.createElement('div'); div.innerHTML=partRowHTML();
  c.appendChild(div.firstElementChild); updatePartCnt();
}

function updatePartCnt() {
  const n=document.querySelectorAll('.part-row').length;
  const el=document.getElementById('pf-cnt'); if(el) el.textContent=n>0?`${n} طالب`:'';
}

function getPartStudents() {
  return [...document.querySelectorAll('.part-row')].map(r=>({
    name:r.querySelector('.pr-name')?.value||'',id:r.querySelector('.pr-id')?.value||'',
    gender:r.querySelector('.pr-gender')?.value||'',nationality:r.querySelector('.pr-nat')?.value||'',
    college:r.querySelector('.pr-col')?.value||'',major:r.querySelector('.pr-major')?.value||'',
    year:r.querySelector('.pr-year')?.value||'',phone:r.querySelector('.pr-phone')?.value||'',
  })).filter(s=>s.name||s.id);
}

const COLMAP={name:['الاسم','اسم الطالب','الاسم الكامل','name','full_name'],id:['الرقم الجامعي','الرقم','student_id','id'],gender:['الجنس','gender'],nationality:['الجنسية','nationality'],college:['الكلية','college'],major:['التخصص','major'],year:['المستوى','المستوى الدراسي','year','level'],phone:['رقم الهاتف','الهاتف','phone']};
function findC(headers,field){const cands=COLMAP[field]||[];for(const h of headers){const hl=h.trim().toLowerCase();for(const c of cands){if(hl===c.toLowerCase()||hl.includes(c.toLowerCase()))return h;}}return null;}
function parseCSV(text){text=text.replace(/^\uFEFF/,'');const lines=text.split(/\r?\n/).filter(l=>l.trim());if(lines.length<2)return null;const headers=lines[0].split(',').map(h=>h.replace(/^"|"$/g,'').trim());const rows=[];for(let i=1;i<lines.length;i++){const vals=[];let cur='',inQ=false;for(const ch of lines[i]+','){if(ch==='"'){inQ=!inQ;}else if(ch===','&&!inQ){vals.push(cur.trim());cur='';}else cur+=ch;}if(vals.some(v=>v)){const row={};headers.forEach((h,idx)=>row[h]=vals[idx]||'');rows.push(row);}}return{headers,rows};}

async function importPart(input) {
  const file=input.files[0]; if(!file) return; input.value='';
  const ext=file.name.split('.').pop().toLowerCase();
  let parsed;
  if(ext==='csv'){const text=await new Promise((res,rej)=>{const r=new FileReader();r.onload=e=>res(e.target.result);r.onerror=rej;r.readAsText(file,'UTF-8');});parsed=parseCSV(text);}
  else if(ext==='xlsx'||ext==='xls'){
    if(!window.XLSX){await new Promise((res,rej)=>{const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';s.onload=res;s.onerror=rej;document.head.appendChild(s);});}
    const buf=await file.arrayBuffer();const wb=XLSX.read(buf,{type:'array'});const ws=wb.Sheets[wb.SheetNames[0]];const data=XLSX.utils.sheet_to_json(ws,{header:1});
    if(data.length<2){alert('الملف فارغ');return;}
    const headers=data[0].map(h=>String(h||'').trim());
    const rows=data.slice(1).filter(r=>r.some(v=>v)).map(r=>{const obj={};headers.forEach((h,i)=>obj[h]=String(r[i]||'').trim());return obj;});
    parsed={headers,rows};
  }else{alert('صيغة غير مدعومة');return;}
  if(!parsed||!parsed.rows.length){alert('لا توجد بيانات');return;}
  const nameCol=findC(parsed.headers,'name');
  if(!nameCol){alert(`لم يُعثر على عمود الاسم.\nالأعمدة: ${parsed.headers.join('، ')}`);return;}
  const c=document.getElementById('part-rows'); let added=0;
  parsed.rows.forEach(row=>{
    const get=f=>{const col=findC(parsed.headers,f);return col?(row[col]||''):'';};
    const s={name:get('name'),id:get('id'),gender:get('gender'),nationality:get('nationality'),college:get('college'),major:get('major'),year:get('year'),phone:get('phone')};
    if(s.name||s.id){const div=document.createElement('div');div.innerHTML=partRowHTML(s);c.appendChild(div.firstElementChild);added++;}
  });
  updatePartCnt(); alert(`✅ تم استيراد ${added} طالب بنجاح`);
}

async function savePart() {
  const data={activity:g('pf-act'),date:g('pf-date'),organizer:g('pf-org'),eval_num:g('pf-eval'),students:getPartStudents(),supervisors:g('pf-sups'),staff:g('pf-staff')};
  if(!data.activity){showMsg('msg-participants','يرجى إدخال اسم النشاط',true);return null;}
  const r=await api('/api/participants','POST',data);
  if(r.error){showMsg('msg-participants',r.error,true);return null;}
  showMsg('msg-participants','تم الحفظ بنجاح ✓');
  document.getElementById('part-form').style.display='none';
  filterPart(); return r.id;
}

async function saveAndPrintPart() {
  const id=await savePart(); if(id) setTimeout(()=>printPart(id),500);
}

async function filterPart() {
  const q=g('ptf-q'); const p=new URLSearchParams(); if(q)p.set('q',q);
  const rows=await api('/api/participants?'+p);
  const canEdit=ME?.role!=='viewer';
  document.getElementById('tbl-part').innerHTML=(rows||[]).map((r,i)=>`<tr>
    <td>${i+1}</td><td><strong>${r.activity||'-'}</strong></td><td>${r.date||'-'}</td>
    <td>${r.organizer||'-'}</td><td>${(r.students||[]).length||0}</td>
    <td><div class="rb">
      <button class="btn btn-sm btn-b" onclick="printPart('${r.id}')">🖨️ طباعة</button>
      ${canEdit?`<button class="btn btn-r" onclick="delRec('participants','${r.id}',filterPart)">🗑</button>`:''}
    </div></td>
  </tr>`).join('')||`<tr class="erow"><td colspan="6">لا توجد نماذج</td></tr>`;
  const cnt=document.getElementById('c-participants'); if(cnt) cnt.textContent=rows?.length||0;
}

// ══ طباعة الإعلانات ══
async function printAnnouncement(id) {
  const r = await api('/api/announcements/'+id);
  if(!r||r.error)return;
  const html = `<div class="ph2">
    <img src="/logo.png" class="plogo" alt="شعار الجامعة الأردنية">
    <div class="puni"><div class="ar">الجامعة الأردنية</div><div class="en">The University of Jordan</div><div class="dep">عمادة شؤون الطلبة — Dean of Student Affairs</div></div>
    <div class="pmeta"><div><strong>تاريخ الطباعة:</strong> ${today()}</div></div>
  </div>
  <div class="ptitle">إعلان عن فعالية / نشاط</div>
  <div class="fr"><span class="fl">اسم / عنوان الفعالية:</span><span class="fv">${r.title||''}</span></div>
  <div class="fr"><span class="fl">نوع الفعالية:</span><span class="fv">${r.type||''}</span></div>
  <div class="fr"><span class="fl">تاريخ الفعالية:</span><span class="fv">${r.date||''}</span></div>
  <div class="fr"><span class="fl">الوقت:</span><span class="fv">${r.time||''}</span></div>
  <div class="fr"><span class="fl">مكان الفعالية:</span><span class="fv">${r.location||''}</span></div>
  <div class="fr"><span class="fl">الجهة المنظِّمة:</span><span class="fv">${r.organizer||''}</span></div>
  <div class="fr"><span class="fl">للتواصل والاستفسار:</span><span class="fv">${r.contact||''}</span></div>
  <div class="fr" style="min-height:50px"><span class="fl">وصف الفعالية:</span><span class="fv">${r.description||''}</span></div>
  <div class="fr" style="min-height:40px"><span class="fl">ملاحظات:</span><span class="fv">${r.notes||''}</span></div>
  <div style="margin-top:14px;font-size:8pt">
    <div class="fg2">
      <div><strong>موافقة الأستاذ الدكتور عميد شؤون الطلبة:</strong><br><br>الاسم والتوقيع: ......................................</div>
      <div><strong>التاريخ:</strong><br><br>.......................................</div>
    </div>
  </div>`;
  openPrint(html);
}

// ══ طباعة محاضر الاجتماعات ══
async function printMinutes(id) {
  const r = await api('/api/meeting_minutes/'+id);
  if(!r||r.error)return;
  const present=(r.present||'').split('\n').filter(Boolean);
  const html = `<div class="ph2">
    <img src="/logo.png" class="plogo" alt="شعار الجامعة الأردنية">
    <div class="puni"><div class="ar">الجامعة الأردنية</div><div class="en">The University of Jordan</div><div class="dep">عمادة شؤون الطلبة — Dean of Student Affairs</div></div>
    <div class="pmeta"><div><strong>رقم النموذج:</strong> AQC-04-01-02</div><div><strong>تاريخ الطباعة:</strong> ${today()}</div></div>
  </div>
  <div class="ptitle">نموذج محضر اجتماع مجلس / لجنة</div>
  <div style="font-size:9.5pt;margin:7px 0">
    عقد مجلس/لجنة <strong>${r.committee||'...........'}</strong> جلسته رقم (<strong>${r.session_num||'...'}</strong>)
    الساعة <strong>${r.time||'.........'}</strong> يوم <strong>${r.date||'.........'}</strong>
    اجتماعاً (<strong>${r.nature||'دورياً'}</strong>) برئاسة <strong>${r.chair||'.........'}</strong>، وحضور السادة الأعضاء:
  </div>
  <table class="ptbl">
    <thead><tr><th>الاسم والمنصب</th><th>التوقيع</th></tr></thead>
    <tbody>${present.length?present.map(s=>`<tr><td>${s}</td><td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td></tr>`).join(''):Array(6).fill('<tr><td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td><td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td></tr>').join('')}</tbody>
  </table>
  ${r.absent?`<div style="margin-top:7px;font-size:9pt"><strong>واعتذر من عدم الحضور:</strong><br>${(r.absent||'').split('\n').filter(Boolean).map((s,i)=>`${i+1}. ${s}`).join('<br>')}</div>`:''}
  <div style="margin:7px 0;font-size:9pt">وقام <strong>${r.ameen||'...................'}</strong> بأمانة سر الجلسة.</div>
  <div class="psub">البنود التي نوقشت والقرارات</div>
  <div style="padding:7px 0;font-size:9pt;white-space:pre-wrap;border:1px solid #ccc;padding:8px;min-height:60px">${r.items||''}</div>
  <div style="margin-top:9px;font-size:9pt">وانتهت الجلسة الساعة <strong>${r.end_time||'.........'}</strong></div>
  <div class="sg2" style="margin-top:12px">
    <div class="sbox"><div class="st2">أمين السر</div><div style="font-size:8.5pt;padding:4px">${r.ameen||''}</div><div class="sl2">التوقيع: .................</div></div>
    <div></div>
    <div class="sbox"><div class="st2">رئيس المجلس / اللجنة</div><div style="font-size:8.5pt;padding:4px">${r.chair||''}</div><div class="sl2">التوقيع: .................</div></div>
  </div>`;
  openPrint(html);
}

async function editQRow(table, id) {
  const record = await api('/api/'+table+'/'+id);
  if(!record||record.error){alert('تعذر تحميل السجل');return;}
  // إظهار فورم التعديل مع البيانات
  showQForm(table, record);
}

async function printQRow(table, id) {
  const record = await api('/api/'+table+'/'+id);
  if(!record||record.error){alert('تعذر تحميل السجل');return;}
  const cfg = QCFG[table]; if(!cfg) return;

  // بناء محتوى الطباعة بجميع الحقول
  const rows = cfg.fields.map(f=>{
    const val = record[f.id];
    if(!val && val!==0) return '';
    const label = f.l.replace(/\*/g,'').trim();
    const display = String(val).includes('\n') ? String(val).split('\n').filter(Boolean).map((s,i)=>`${i+1}. ${s}`).join('<br>') : val;
    return `<div class="fr"><span class="fl">${label}:</span><span class="fv" style="white-space:normal">${display}</span></div>`;
  }).filter(Boolean).join('');

  const html = `<div class="ph2">
    <img src="/logo.png" class="plogo" alt="شعار الجامعة الأردنية">
    <div class="puni">
      <div class="ar">الجامعة الأردنية</div>
      <div class="en">The University of Jordan</div>
      <div class="dep">عمادة شؤون الطلبة — Dean of Student Affairs</div>
    </div>
    <div class="pmeta">
      <div><strong>متوافق مع معايير </strong></div>
      <div><strong>تاريخ الطباعة:</strong> ${today()}</div>
    </div>
  </div>
  <div class="ptitle">${cfg.title}</div>
  ${rows}
  ${record.source?`<div style="margin-top:10px;font-size:8pt;color:#888;border-top:1px solid #ddd;padding-top:6px">المصدر: ${record.source}</div>`:''}
  <div style="margin-top:14px;font-size:8pt">
    <div class="fg2">
      <div><strong>توقيع المسؤول:</strong><br><br>الاسم والتوقيع: ......................................</div>
      <div><strong>التاريخ:</strong><br><br>.......................................</div>
    </div>
  </div>`;
  openPrint(html);
}

// ══ تعديل محضر الاجتماع (إكمال البيانات الناقصة) ══
async function editMinutes(id) {
  const record = await api('/api/meeting_minutes/'+id);
  if(!record||record.error){alert('تعذر تحميل السجل');return;}

  // الانتقال للوح محاضر الاجتماعات
  const nav = document.querySelector('.ni[onclick*="meeting_minutes"]');
  if(nav) go('meeting_minutes', nav);

  setTimeout(()=>{
    const panel = document.getElementById('panel-meeting_minutes');
    if(!panel) return;

    // بناء نموذج مخصص مع البيانات مُدمجة مباشرةً
    const natures = ['دوري وجاهي','دوري عن بعد','دوري مدمج','طارئ'];
    const natOpts = natures.map(n=>`<option${record.nature===n?' selected':''}>${n}</option>`).join('');

    const editForm = document.createElement('div');
    editForm.id = 'edit-minutes-form';
    editForm.style.cssText = 'background:#fff;border:2px solid #1B5E9A;border-radius:12px;padding:16px;margin-bottom:14px';
    editForm.innerHTML = `
      <div style="font-size:13px;font-weight:600;color:#1B5E9A;margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid var(--border)">
        ✏️ إكمال محضر الاجتماع
      </div>
      <div class="msg warn" style="display:block;margin-bottom:10px">البيانات المرحّلة من الدعوة تظهر مكتملة — أضف البيانات الناقصة فقط</div>
      <div class="g2">
        <div class="fg"><label>اللجنة / المجلس</label>
          <input id="em-committee" type="text" value="${record.committee||''}" style="background:#F9FAFB;color:var(--muted)" readonly></div>
        <div class="fg"><label>رقم الجلسة</label>
          <input id="em-session" type="text" value="${record.session_num||''}" style="background:#F9FAFB;color:var(--muted)" readonly></div>
        <div class="fg"><label>التاريخ</label>
          <input id="em-date" type="date" value="${record.date||''}" style="background:#F9FAFB;color:var(--muted)" readonly></div>
        <div class="fg"><label>الوقت</label>
          <input id="em-time" type="text" value="${record.time||''}" style="background:#F9FAFB;color:var(--muted)" readonly></div>
        <div class="fg"><label>نوع الاجتماع</label>
          <input id="em-nature" type="text" value="${record.nature||''}" style="background:#F9FAFB;color:var(--muted)" readonly></div>
        <div class="fg"><label>رئيس الجلسة</label>
          <input id="em-chair" type="text" value="${record.chair||''}" style="background:#F9FAFB;color:var(--muted)" readonly></div>
        <div class="fg"><label>أمين السر</label>
          <input id="em-ameen" type="text" value="${record.ameen||''}" style="background:#F9FAFB;color:var(--muted)" readonly></div>
      </div>
      <div style="border-top:2px dashed #C6E8D3;margin:12px 0;padding-top:12px">
        <div style="font-size:12px;font-weight:600;color:var(--g);margin-bottom:8px">⬇️ البيانات التي تحتاج إكمالها:</div>
        <div class="fg full" style="margin-bottom:8px"><label>الحاضرون (الاسم - المنصب)</label>
          <textarea id="em-present" rows="4" style="resize:vertical;font-family:inherit;width:100%;padding:7px 10px;border:1px solid var(--border);border-radius:var(--r)">${record.present||''}</textarea></div>
        <div class="fg full" style="margin-bottom:8px"><label>المعتذرون</label>
          <textarea id="em-absent" rows="3" style="resize:vertical;font-family:inherit;width:100%;padding:7px 10px;border:1px solid var(--border);border-radius:var(--r)">${record.absent||''}</textarea></div>
        <div class="fg full" style="margin-bottom:8px"><label>البنود والقرارات</label>
          <textarea id="em-items" rows="5" style="resize:vertical;font-family:inherit;width:100%;padding:7px 10px;border:1px solid var(--border);border-radius:var(--r)">${record.items||''}</textarea></div>
        <div class="fg"><label>وقت الانتهاء</label>
          <input id="em-end" type="text" value="${record.end_time||''}" style="padding:7px 10px;border:1px solid var(--border);border-radius:var(--r);width:100%"></div>
      </div>
      <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px">
        <button class="btn" onclick="document.getElementById('edit-minutes-form').remove()">إلغاء</button>
        <button class="btn btn-b" onclick="saveEditedMinutes2('${id}')">💾 حفظ المحضر</button>
      </div>`;

    // إزالة نموذج تعديل سابق إن وجد
    const old = document.getElementById('edit-minutes-form');
    if(old) old.remove();

    // إدراج النموذج في أعلى اللوح
    panel.insertBefore(editForm, panel.firstChild);
    editForm.scrollIntoView({behavior:'smooth'});
  }, 400);
}

async function saveEditedMinutes2(id) {
  const getV = eid => { const el=document.getElementById(eid); return el?el.value:''; };
  const record = await api('/api/meeting_minutes/'+id);
  if(!record||record.error){alert('تعذر تحميل السجل');return;}

  const data = {
    ...record,
    present:  getV('em-present'),
    absent:   getV('em-absent'),
    items:    getV('em-items'),
    end_time: getV('em-end'),
    completed: true
  };

  const r = await api('/api/meeting_minutes/'+id,'PUT',data);
  if(r.error){alert('خطأ في الحفظ: '+r.error);return;}

  document.getElementById('edit-minutes-form')?.remove();
  alert('✅ تم حفظ المحضر بنجاح');
  loadFData('meeting_minutes');
}

async function saveEditedMinutes(oldId) {
  const f = document.getElementById('ff-meeting_minutes');
  // البحث محصور داخل نموذج المحضر لتفادي تعارض المعرّفات المكرّرة بين النماذج
  const getV = id => { const el=(f&&f.querySelector('[id="'+id+'"]'))||document.getElementById(id); return el?el.value:''; };

  const data = {
    committee:   getV('ff-committee'),
    session_num: getV('ff-session_num'),
    date:        getV('ff-date'),
    time:        getV('ff-time'),
    nature:      getV('ff-nature'),
    chair:       getV('ff-chair'),
    present:     getV('ff-present'),
    absent:      getV('ff-absent'),
    ameen:       getV('ff-ameen'),
    items:       getV('ff-items'),
    end_time:    getV('ff-end_time'),
    completed:   true   // يصبح مكتملاً بعد الحفظ
  };

  if(!data.committee){showMsg('msg-meeting_minutes','يرجى ملء اسم اللجنة',true);return;}

  const old = await api('/api/meeting_minutes/'+oldId);
  const r = await api('/api/meeting_minutes/'+oldId,'PUT',{...old,...data});
  if(r.error){showMsg('msg-meeting_minutes',r.error,true);return;}

  // إعادة النموذج لوضعه الطبيعي
  f.style.border='';f.style.borderRadius='';f.style.padding='';
  f.style.display='none';
  delete f.dataset.editId;
  const btn=f.querySelector('.btn-g');
  if(btn){btn.textContent='✔ حفظ';btn.onclick=()=>saveFF('meeting_minutes');}

  showMsg('msg-meeting_minutes','✅ تم حفظ المحضر بنجاح');
  loadFData('meeting_minutes');
}

// ══ طباعة دعوة الاجتماع ══
async function printInvite(id) {
  const r = await api('/api/meeting_invites/'+id);
  if(!r||r.error)return;

  const invitees=(r.invitees||'').split('\n').filter(Boolean);
  const agenda=(r.agenda||'').split('\n').filter(Boolean);

  const html=`<div class="ph2">
    <img src="/logo.png" class="plogo" alt="شعار الجامعة الأردنية">
    <div class="puni">
      <div class="ar">الجامعة الأردنية</div>
      <div class="en">The University of Jordan</div>
      <div class="dep">عمادة شؤون الطلبة — Dean of Student Affairs</div>
    </div>
    <div class="pmeta">
      <div><strong>رقم النموذج:</strong> AQC-04-01-01</div>
      <div><strong>تاريخ الطباعة:</strong> ${today()}</div>
    </div>
  </div>
  <div class="ptitle">نموذج دعوة حضور اجتماع</div>
  <div class="fr"><span class="fl">اللجنة / المجلس:</span><span class="fv">${r.committee||''}</span></div>
  <div class="fr"><span class="fl">الموضوع:</span><span class="fv">${r.subject||''}</span></div>
  <div class="fr"><span class="fl">رقم الجلسة:</span><span class="fv">${r.session_num||''}</span></div>
  <div class="fr"><span class="fl">التاريخ:</span><span class="fv">${r.date||''}</span></div>
  <div class="fr"><span class="fl">الساعة:</span><span class="fv">${r.time||''}</span></div>
  <div class="fr"><span class="fl">طبيعة الاجتماع ومكانه:</span><span class="fv">${r.nature||''} ${r.location?'— '+r.location:''}</span></div>
  <div class="psub">أسماء المدعوّين للاجتماع</div>
  <div style="padding:5px 0;font-size:9pt">
    ${invitees.length
      ? invitees.map((s,i)=>`<div style="padding:3px 0;border-bottom:1px dotted #ddd">${i+1}. ${s}</div>`).join('')
      : '<div style="color:#999">لم يُحدَّد</div>'}
  </div>
  <div class="psub">جدول الأعمال</div>
  <div style="padding:5px 0;font-size:9pt">
    ${agenda.length
      ? agenda.map((s,i)=>`<div style="padding:3px 0;border-bottom:1px dotted #ddd">${i+1}. ${s}</div>`).join('')
      : '<div style="color:#999">ما يستجد من أعمال</div>'}
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:16px">
    <div class="sbox">
      <div class="st2">أمين السر</div>
      <div style="font-size:8.5pt;padding:4px;min-height:20px">${r.ameen||'...................'}</div>
      <div class="sl2">التوقيع: .................</div>
    </div>
    <div class="sbox">
      <div class="st2">مقرر / رئيس اللجنة / المجلس</div>
      <div style="font-size:8.5pt;padding:4px;min-height:20px">${r.head||'...................'}</div>
      <div class="sl2">التوقيع: .................</div>
    </div>
  </div>`;
  openPrint(html);
}

// ══ طباعة حجز القاعة / المدرج ══
async function printHallBooking(id) {
  const r = await api('/api/hall_bookings/'+id);
  if(!r||r.error)return;
  const halls=['مدرج الحسن بن طلال','المدرج الصغير','قاعة الإعلام والاتصال','قاعة المعارض الكبرى','قاعة معاذ الكساسبة','قاعة اجتماعات العمادة','حديقة العمادة الداخلية','الصوتيات'];
  const html=`<div class="ph2">
    <img src="/logo.png" class="plogo">
    <div class="puni"><div class="ar">الجامعة الأردنية</div><div class="en">The University of Jordan</div><div class="dep">عمادة شؤون الطلبة — Dean of Student Affairs</div></div>
    <div class="pmeta"><div><strong>رقم النموذج:</strong> DSA-06-28-01</div><div><strong>تاريخ الطباعة:</strong> ${today()}</div></div>
  </div>
  <div class="ptitle">نموذج حجز المدرجات / القاعات / مرافق العمادة</div>
  <div style="font-size:9.5pt;margin:7px 0">الأستاذ الدكتور عميد شؤون الطلبة المحترم<br>تحية طيبة وبعد،<br>أرجو التكرم بالموافقة على حجز:</div>
  <div style="display:flex;flex-wrap:wrap;gap:12px;margin-bottom:12px;font-size:9pt">
    ${halls.map(h=>`<span><span class="chk">${r.hall===h?'✓':''}</span> ${h}</span>`).join('')}
  </div>
  <div class="fr">
    <span class="fl">في يوم / تاريخ:</span>
    <span class="fv" style="flex:2">${r.day||''} &nbsp;&nbsp;&nbsp; ${r.date||''}</span>
    <span class="fl" style="min-width:80px">من الساعة:</span>
    <span class="fv" style="flex:1">${r.time_from||''}</span>
    <span class="fl" style="min-width:80px">إلى الساعة:</span>
    <span class="fv" style="flex:1">${r.time_to||''}</span>
  </div>
  <div class="fr"><span class="fl">لغايات:</span><span class="fv">${r.purpose||''}</span></div>
  <div class="fg3">
    <div class="fr"><span class="fl">اسم مشرف النشاط:</span><span class="fv">${r.supervisor||''}</span></div>
    <div class="fr"><span class="fl">التوقيع:</span><span class="fv"></span></div>
    <div class="fr"><span class="fl">التاريخ:</span><span class="fv">${r.date||''}</span></div>
  </div>
  <div class="dbox" style="margin-top:14px">
    <div class="fr"><span class="fl">موافقة الدائرة المختصة:</span>
      <span><span class="chk"></span> موافق &nbsp;&nbsp; <span class="chk"></span> غير موافق</span>
      <span style="margin-right:16px">التوقيع: .............. التاريخ: ..............</span>
    </div>
    <div class="fr"><span class="fl">تنسيب مدير دائرة الخدمات:</span>
      <span><span class="chk"></span> متوافر &nbsp;&nbsp; <span class="chk"></span> غير متوافر</span>
      <span style="margin-right:16px">التوقيع: .............. التاريخ: ..............</span>
    </div>
    <div class="fr" style="margin-top:6px"><span class="fl">موافقة عميد شؤون الطلبة:</span>
      <span><span class="chk"></span> موافق &nbsp;&nbsp; <span class="chk"></span> غير موافق</span>
      <span style="margin-right:16px">التوقيع: .............. التاريخ: ..............</span>
    </div>
  </div>`;
  openPrint(html);
}

// ══ طباعة نموذج تشكيل لجنة / مجلس ══
async function printCommittee(id) {
  const r = await api('/api/committees/'+id);
  if(!r||r.error)return;
  const members=(r.members||'').split('\n').filter(Boolean);
  const html=`<div class="ph2">
    <img src="/logo.png" class="plogo">
    <div class="puni"><div class="ar">الجامعة الأردنية</div><div class="en">The University of Jordan</div><div class="dep">عمادة شؤون الطلبة — Dean of Student Affairs</div></div>
    <div class="pmeta"><div><strong>رقم النموذج:</strong> AQC-02-10-01</div><div><strong>تاريخ الطباعة:</strong> ${today()}</div></div>
  </div>
  <div class="ptitle">نموذج تشكيل لجنة / مجلس</div>
  <div class="fr"><span class="fl">اسم اللجنة / المجلس:</span><span class="fv">${r.name||''}</span></div>
  <div class="fr"><span class="fl">تاريخ التشكيل:</span><span class="fv">${r.date||''}</span></div>
  <div class="fr"><span class="fl">رقم الكتاب:</span><span class="fv">${r.ref_num||''}</span></div>
  <div class="fr"><span class="fl">نوع اللجنة:</span>
    <span>
      <span class="chk" style="background:${(r.type||'').trim()==='دائمة'?'#1B6B3A':'#fff'};color:#fff;font-size:8pt;line-height:10px;display:inline-flex;align-items:center;justify-content:center">${(r.type||'').trim()==='دائمة'?'✓':''}</span> دائمة 
      &nbsp;&nbsp;&nbsp;
      <span class="chk" style="background:${(r.type||'').trim()==='مؤقتة'?'#1B6B3A':'#fff'};color:#fff;font-size:8pt;line-height:10px;display:inline-flex;align-items:center;justify-content:center">${(r.type||'').trim()==='مؤقتة'?'✓':''}</span> مؤقتة
    </span>
  </div>
  <div class="fr" style="min-height:40px"><span class="fl">الهدف العام:</span><span class="fv">${r.goal||''}</span></div>
  <div class="fr" style="min-height:40px"><span class="fl">المهام:</span><span class="fv">${r.tasks||''}</span></div>
  <div class="fr"><span class="fl">آلية الاجتماع:</span>
    <div style="display:flex;gap:14px;font-size:8.5pt">
      ${['أسبوعياً','كل أسبوعين','شهرياً','أخرى'].map(f=>`<span><span class="chk" style="background:${(r.meeting_freq||'').trim()===f?'#1B6B3A':'#fff'};color:#fff;font-size:8pt;display:inline-flex;align-items:center;justify-content:center">${(r.meeting_freq||'').trim()===f?'✓':''}</span> ${f}</span>`).join('')}
    </div>
  </div>
  <div class="fr"><span class="fl">المقرر:</span><span class="fv">${r.secretary||''}</span></div>
  <div class="fr"><span class="fl">أمين السر:</span><span class="fv">${r.ameen||''}</span></div>
  <div class="psub">أسماء أعضاء اللجنة / المجلس</div>
  <table class="ptbl">
    <thead><tr><th>ت</th><th>الاسم والمنصب</th><th>التوقيع</th></tr></thead>
    <tbody>${members.length
      ? members.map((m,i)=>`<tr><td>${i+1}</td><td>${m}</td><td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td></tr>`).join('')
      : Array(8).fill(0).map((_,i)=>`<tr><td>${i+1}</td><td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td><td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td></tr>`).join('')}
    </tbody>
  </table>`;
  openPrint(html);
}

// ══════════════════════════════════════════
// إرفاق كشف الأسماء بسجلات الجودة
// ══════════════════════════════════════════
let ATTACH_TABLE = '', ATTACH_ID = '', ATTACH_NAME = '';

async function openAttachModal(table, id, name) {
  ATTACH_TABLE = table; ATTACH_ID = id; ATTACH_NAME = name;

  // جلب كشوفات الأسماء
  const parts = await api('/api/participants');

  // بناء المودال
  const existing = document.getElementById('attach-modal');
  if(existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'attach-modal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;z-index:2000';
  modal.innerHTML = `
  <div style="background:#fff;border-radius:12px;padding:22px;width:90%;max-width:600px;max-height:80vh;display:flex;flex-direction:column;box-shadow:0 20px 60px rgba(0,0,0,.3)">
    <div style="font-size:15px;font-weight:600;color:var(--g);margin-bottom:12px;display:flex;justify-content:space-between;align-items:center">
      <span>📎 إرفاق كشف أسماء المشاركين</span>
      <button onclick="document.getElementById('attach-modal').remove()" style="background:none;border:none;font-size:18px;cursor:pointer;color:var(--muted)">✕</button>
    </div>
    <div style="font-size:12px;color:var(--muted);margin-bottom:10px">السجل: <strong style="color:var(--g)">${name}</strong></div>
    <input type="text" id="attach-search" placeholder="🔍 بحث في كشوفات الأسماء..." oninput="filterAttach()"
      style="padding:8px 12px;border:1px solid var(--border);border-radius:var(--r);font-family:inherit;margin-bottom:10px;width:100%">
    <div id="attach-list" style="flex:1;overflow-y:auto;border:1px solid var(--border);border-radius:var(--r)">
      ${!(parts||[]).length
        ? '<div style="text-align:center;padding:24px;color:var(--muted)">لا توجد كشوفات محفوظة</div>'
        : (parts||[]).map(p=>`
        <div class="attach-item" data-id="${p.id}" data-name="${p.activity||''}" data-date="${p.date||''}"
          style="padding:10px 14px;border-bottom:1px solid var(--border);cursor:pointer;display:flex;justify-content:space-between;align-items:center"
          onclick="selectAttach('${p.id}')" onmouseover="this.style.background='#F0FAF4'" onmouseout="this.style.background=''">
          <div>
            <div style="font-weight:600;font-size:13px">${p.activity||'-'}</div>
            <div style="font-size:11px;color:var(--muted)">${p.date||''} — ${(p.students||[]).length} طالب — ${p.organizer||''}</div>
          </div>
          <span style="font-size:11px;background:#C6E8D3;color:var(--g);padding:2px 8px;border-radius:20px">${(p.students||[]).length} طالب</span>
        </div>`).join('')}
    </div>
    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px">
      <button class="btn" onclick="document.getElementById('attach-modal').remove()">إلغاء</button>
    </div>
  </div>`;
  document.body.appendChild(modal);

  // تخزين الكشوفات للفلترة
  window._attachParts = parts || [];
}

function filterAttach() {
  const q = document.getElementById('attach-search')?.value?.toLowerCase() || '';
  document.querySelectorAll('.attach-item').forEach(el => {
    const name = el.dataset.name?.toLowerCase() || '';
    const date = el.dataset.date?.toLowerCase() || '';
    el.style.display = (!q || name.includes(q) || date.includes(q)) ? '' : 'none';
  });
}

async function selectAttach(partId) {
  if(!ATTACH_TABLE || !ATTACH_ID) return;

  // جلب السجل الحالي وإضافة الكشف المرفق
  const rec = await api('/api/'+ATTACH_TABLE+'/'+ATTACH_ID);
  if(!rec||rec.error){alert('تعذر تحميل السجل');return;}

  const r = await api('/api/'+ATTACH_TABLE+'/'+ATTACH_ID,'PUT',{
    ...rec,
    attached_participant_id: partId
  });
  if(r.error){alert('خطأ في الحفظ: '+r.error);return;}

  document.getElementById('attach-modal')?.remove();
  alert('✅ تم إرفاق الكشف بنجاح');
  loadQData(ATTACH_TABLE);
}

async function printAttachedParticipants(table, recordId) {
  // جلب السجل لمعرفة الكشف المرفق
  const rec = await api('/api/'+table+'/'+recordId);
  if(!rec||rec.error||!rec.attached_participant_id){
    alert('لا يوجد كشف مرفق بهذا السجل');return;
  }
  // طباعة كشف الأسماء
  printPart(rec.attached_participant_id);
}

// ══ اختيار اللجنة من قائمة في دعوات الاجتماع ══
async function loadCommitteesList() {
  const rows = await api('/api/committees');
  window._committeesList = rows || [];
}

function showCommitteeSuggest(val) {
  const list = window._committeesList || [];
  const box = document.getElementById('comm-suggest');
  if(!box) return;
  if(!val || val.length < 1) { box.style.display='none'; return; }
  const filtered = list.filter(c => (c.name||'').includes(val)).slice(0,8);
  if(!filtered.length) { box.style.display='none'; return; }
  box.innerHTML = filtered.map(c => `
    <div onclick="selectCommittee(${JSON.stringify(c).replace(/"/g,'&quot;')})"
      style="padding:8px 12px;cursor:pointer;border-bottom:1px solid var(--border);font-size:12px"
      onmouseover="this.style.background='#F0FAF4'" onmouseout="this.style.background=''">
      <div style="font-weight:600">${c.name}</div>
      <div style="font-size:10px;color:var(--muted)">
        ${c.date?'تاريخ التشكيل: '+c.date:''} 
        ${c.ref_num?' | رقم الكتاب: '+c.ref_num:''}
      </div>
    </div>`).join('');
  box.style.display = 'block';
}

function selectCommittee(c) {
  if(typeof c === 'string') try{c=JSON.parse(c);}catch(e){return;}
  const el = document.getElementById('ff-committee');
  if(el) el.value = c.name||'';
  const box = document.getElementById('comm-suggest');
  if(box) box.style.display='none';
}

// إغلاق القائمة عند النقر خارجها
document.addEventListener('click', e=>{
  if(!e.target.closest('#comm-wrapper')){
    const box=document.getElementById('comm-suggest');
    if(box) box.style.display='none';
  }
});

// ══ تقرير اللجان ══
async function printCommitteesReport() {
  const rows = await api('/api/committees');
  if(!rows||!rows.length){alert('لا توجد لجان مشكّلة');return;}

  // لكل لجنة نحسب عدد اجتماعاتها من محاضر الاجتماعات
  const minutes = await api('/api/meeting_minutes');

  const today = new Date().toLocaleDateString('ar-JO',{year:'numeric',month:'long',day:'numeric'});

  const html = `<div class="ph2">
    <img src="/logo.png" class="plogo">
    <div class="puni">
      <div class="ar">الجامعة الأردنية</div>
      <div class="en">The University of Jordan</div>
      <div class="dep">عمادة شؤون الطلبة — Dean of Student Affairs</div>
    </div>
    <div class="pmeta">
      <div><strong>تاريخ الطباعة:</strong> ${today}</div>
      <div><strong>إجمالي اللجان:</strong> ${rows.length}</div>
    </div>
  </div>
  <div class="ptitle">تقرير اللجان والمجالس</div>
  <table class="ptbl">
    <thead>
      <tr>
        <th>#</th>
        <th>اسم اللجنة</th>
        <th>تاريخ التشكيل</th>
        <th>رقم الكتاب</th>
        <th>نوع اللجنة</th>
        <th>المهام</th>
        <th>الهدف العام</th>
        <th>المقرر</th>
        <th>عدد الاجتماعات</th>
      </tr>
    </thead>
    <tbody>
      ${rows.map((r,i)=>{
        const meetCount = (minutes||[]).filter(m=>(m.committee||'').includes(r.name||'')).length;
        return `<tr>
          <td>${i+1}</td>
          <td><strong>${r.name||'-'}</strong></td>
          <td>${r.date||'-'}</td>
          <td>${r.ref_num||'-'}</td>
          <td>${r.type||'-'}</td>
          <td style="font-size:7.5pt">${r.tasks||'-'}</td>
          <td style="font-size:7.5pt">${r.goal||'-'}</td>
          <td>${r.secretary||'-'}</td>
          <td style="text-align:center;font-weight:700;color:#1B6B3A">${meetCount}</td>
        </tr>`;
      }).join('')}
    </tbody>
  </table>
  <div style="margin-top:8px;font-size:8pt;color:#666">
    إجمالي اللجان: <strong>${rows.length}</strong> | 
    إجمالي الاجتماعات: <strong>${(minutes||[]).length}</strong>
  </div>`;
  openPrint(html);
}
