// ══════════════════════════════════════════
// طلبات إقامة النشاط — مع نظام الاعتماد والترحيل
// ══════════════════════════════════════════
async function loadAR() {
  const canEdit = canEditGlobal();
  const isAdmin = ME?.role === 'admin';
  document.getElementById('panel-activity_requests').innerHTML = `
  <div class="ph">
    <div><div class="pt"><i class="ti ti-file-plus"></i> طلبات إقامة نشاط</div><div class="pc">DSA-02-01-05</div></div>
    <div style="display:flex;gap:6px">
      ${canEditGlobal()?`<button class="btn btn-g" onclick="showARForm()"><i class="ti ti-plus"></i>طلب جديد</button>`:''}
      <button class="btn btn-b" onclick="printBlankAR()"><i class="ti ti-printer"></i>طباعة فارغ</button>
      <a class="btn" href="/apply.html" target="_blank" style="text-decoration:none">🔗 رابط تقديم عام</a>
      <a class="btn" href="/track.html" target="_blank" style="text-decoration:none">🔗 رابط تتبّع الطالب</a>
    </div>
  </div>
  <div id="ar-form" style="display:none">
    <div id="msg-ar" class="msg"></div>
    <div id="ar-form-title" style="font-size:14px;font-weight:700;color:var(--g);margin-bottom:10px">طلب جديد</div>
    <div class="card">
      <div class="ct"><i class="ti ti-info-circle"></i>بيانات النشاط</div>
      <div class="g2">
        <div class="fg"><label>نوع النشاط *</label><select id="ar-type"><option value="">اختر...</option><option>مبادرة</option><option>محاضرة</option><option>دورة تدريبية</option><option>ورشة</option><option>معرض</option><option>مسابقة</option><option>جلسة</option><option>حملة</option><option>أخرى</option></select></div>
        <div class="fg"><label>اسم / عنوان الفعالية *</label><input id="ar-title" type="text"></div>
        <div class="fg full"><label>اسم الفعالية في الإعلان (إن اختلف)</label><input id="ar-adtitle" type="text"></div>
        <div class="fg full"><label>وصف النشاط *</label><textarea id="ar-desc"></textarea></div>
        <div class="fg full"><label>أهداف النشاط</label><textarea id="ar-goals"></textarea></div>
        <div class="fg"><label>نوع الحضور</label><input id="ar-aud" type="text" placeholder="طلبة، أكاديميين..."></div>
        <div class="fg"><label>التكلفة المالية</label><input id="ar-cost" type="text"></div>
      </div>
    </div>
    <div class="card">
      <div class="ct"><i class="ti ti-user"></i>مقدم الطلب</div>
      <div class="g3">
        <div class="fg full"><label>الجهة المنظمة *</label><select id="ar-org"><option value="">اختر الجهة المنظمة (دائرة العمادة)...</option>${DEANSHIP_DEPTS.map(d=>`<option>${d}</option>`).join('')}</select></div>
        <div class="fg"><label>اسم الطالب مقدم النشاط</label><input id="ar-sname" type="text"></div>
        <div class="fg"><label>الرقم الجامعي</label><input id="ar-sid" type="text"></div>
        <div class="fg"><label>رقم الهاتف</label><input id="ar-phone" type="text"></div>
        <div class="fg"><label>الكلية</label><select id="ar-col"><option value="">اختر الكلية...</option>${colOpts()}</select></div>
        <div class="fg"><label>تاريخ تقديم الطلب</label><input id="ar-sdate" type="date"></div>
      </div>
    </div>
    <div class="card">
      <div class="ct"><i class="ti ti-calendar"></i>موعد ومكان النشاط</div>
      <div class="g3">
        <div class="fg"><label>تاريخ انعقاد النشاط *</label><input id="ar-date" type="date"></div>
        <div class="fg"><label>من الساعة</label><input id="ar-tfrom" type="time"></div>
        <div class="fg"><label>إلى الساعة</label><input id="ar-tto" type="time"></div>
        <div class="fg full"><label>مكان انعقاد النشاط</label><input id="ar-loc" type="text"></div>
        <div class="fg full"><label>الخدمات المساندة المطلوبة</label><textarea id="ar-srv" placeholder="حجز قاعة، مخاطبة الأمن، احتساب نقطة نشاط..."></textarea></div>
      </div>
    </div>
    <div class="card">
      <div class="ct"><i class="ti ti-user-check"></i>مشرف النشاط</div>
      <div class="g3">
        <div class="fg"><label>اسم المشرف *</label><input id="ar-sup" type="text"></div>
        <div class="fg"><label>الكلية</label><select id="ar-supcol"><option value="">اختر الكلية...</option>${colOpts()}</select></div>
        <div class="fg"><label>رقم الهاتف</label><input id="ar-supph" type="text"></div>
      </div>
    </div>
    <div class="card">
      <div class="ct"><i class="ti ti-info-circle"></i>مشاركة جهة خارجية</div>
      <div class="g2">
        <div class="fg"><label>مشاركة جهة خارجية</label><select id="ar-guest"><option value="">اختر...</option><option>نعم</option><option>لا</option></select></div>
        <div class="fg"><label>اسم الجهة الخارجية</label><input id="ar-ext-name" type="text" placeholder="اسم الجهة..."></div>
        <div class="fg full"><label>أسماء المشاركين من الخارج</label><textarea id="ar-ext-people" rows="3" style="resize:vertical;font-family:inherit;width:100%;padding:7px 10px;border:1px solid var(--border);border-radius:var(--r)" placeholder="الاسم الأول&#10;الاسم الثاني&#10;..."></textarea></div>
      </div>
    </div>
    <div id="ar-savebtns" style="display:flex;gap:8px;justify-content:flex-end;margin-bottom:14px">
      <button class="btn" onclick="document.getElementById('ar-form').style.display='none'">إلغاء</button>
      <button class="btn btn-b" onclick="saveAndPrintAR()"><i class="ti ti-printer"></i>حفظ وطباعة</button>
      <button class="btn btn-g" onclick="saveAR()"><i class="ti ti-device-floppy"></i>حفظ فقط</button>
    </div>
    <div id="ar-editbtns" style="display:none;gap:8px;justify-content:flex-end;margin-bottom:14px">
      <button class="btn" onclick="document.getElementById('ar-form').style.display='none'">إلغاء</button>
      <button class="btn btn-g" onclick="saveEditAR()"><i class="ti ti-device-floppy"></i>حفظ التعديلات</button>
    </div>
  </div>
  <div class="fb">
    <input type="text" id="arf-q" placeholder="بحث..." oninput="filterAR()">
    <select id="arf-st" onchange="filterAR()"><option value="">جميع الحالات</option><option value="pending">🟡 قيد مراجعة المنسّق</option><option value="awaiting_manager">🟠 قيد مراجعة المدير</option><option value="awaiting_dean">🔵 قيد اعتماد العميد</option><option value="approved">✅ معتمد</option><option value="rejected">❌ مرفوض</option></select>
  </div>
  <div class="tw"><table><thead><tr>
    <th>#</th><th>عنوان الفعالية</th><th>النوع</th><th>الجهة المنظمة</th><th>مقدم الطلب</th><th>تاريخ النشاط</th><th>الحالة</th><th>التصنيفات المعتمدة</th><th></th>
  </tr></thead><tbody id="tbl-ar"></tbody></table></div>`;

  document.getElementById('ar-sdate').valueAsDate = new Date();
  document.getElementById('ar-date').valueAsDate = new Date();
  filterAR();
}

function showARForm() {
  const f=document.getElementById('ar-form'); f.style.display='block';
  delete f.dataset.editId;
  f.querySelectorAll('input:not([type=file]),select,textarea').forEach(el=>el.value='');
  document.getElementById('ar-sdate').valueAsDate=new Date();
  document.getElementById('ar-date').valueAsDate=new Date();
  const t=document.getElementById('ar-form-title'); if(t) t.textContent='طلب جديد';
  document.getElementById('ar-savebtns').style.display='flex';
  document.getElementById('ar-editbtns').style.display='none';
  f.scrollIntoView({behavior:'smooth'});
}

// ══ تعديل بيانات النشاط (متاح لمنسّق الفعالية/المدير أثناء مرحلتهما فقط، للتصحيح بعد الإرجاع) ══
async function editContentAR(id) {
  const r=await api('/api/activity_requests/'+id); if(!r||r.error){alert('تعذر تحميل بيانات الطلب');return;}
  const f=document.getElementById('ar-form'); f.style.display='block';
  f.dataset.editId=id;
  const set=(id2,val)=>{ const el=document.getElementById(id2); if(el) el.value=val||''; };
  set('ar-type',r.type); set('ar-title',r.title); set('ar-adtitle',r.ad_title);
  set('ar-desc',r.description); set('ar-goals',r.goals); set('ar-aud',r.audience); set('ar-cost',r.cost);
  set('ar-org',r.organizer); set('ar-sname',r.student_name); set('ar-sid',r.student_id);
  set('ar-phone',r.phone); set('ar-col',r.college); set('ar-sdate',r.submit_date);
  set('ar-date',r.activity_date); set('ar-tfrom',r.time_from); set('ar-tto',r.time_to);
  set('ar-loc',r.location); set('ar-srv',r.services);
  set('ar-sup',r.supervisor); set('ar-supcol',r.sup_college); set('ar-supph',r.sup_phone);
  set('ar-guest',r.guests); set('ar-ext-name',r.ext_name); set('ar-ext-people',r.ext_people);
  const t=document.getElementById('ar-form-title'); if(t) t.textContent='✏️ تعديل بيانات الطلب — '+(r.ref_code||'');
  document.getElementById('ar-savebtns').style.display='none';
  document.getElementById('ar-editbtns').style.display='flex';
  f.scrollIntoView({behavior:'smooth'});
}

async function saveEditAR() {
  const f=document.getElementById('ar-form'); const id=f.dataset.editId;
  if(!id) return;
  const data = {
    type:g('ar-type'),title:g('ar-title'),ad_title:g('ar-adtitle'),
    description:g('ar-desc'),goals:g('ar-goals'),audience:g('ar-aud'),cost:g('ar-cost'),
    organizer:g('ar-org'),
    student_name:g('ar-sname'),student_id:g('ar-sid'),phone:g('ar-phone'),
    college:g('ar-col'),submit_date:g('ar-sdate'),
    activity_date:g('ar-date'),time_from:g('ar-tfrom'),time_to:g('ar-tto'),
    location:g('ar-loc'),services:g('ar-srv'),
    supervisor:g('ar-sup'),sup_college:g('ar-supcol'),sup_phone:g('ar-supph'),
    guests:g('ar-guest'),ext_name:g('ar-ext-name'),ext_people:document.getElementById('ar-ext-people')?.value||''
  };
  if (!data.title){showMsg('msg-ar','يرجى ملء عنوان الفعالية (حقل إلزامي)',true);return;}
  const r=await api(`/api/activity_requests/${id}/edit-content`,'POST',data);
  if(r.error){showMsg('msg-ar',r.error,true);return;}
  showMsg('msg-ar','تم حفظ التعديلات بنجاح ✓');
  f.style.display='none'; delete f.dataset.editId;
  filterAR(); loadDash();
}

// إيجاد تصنيفات الطلب من سجل «الأنشطة الطلابية» المرتبط (المصدر الأصح)، مع التراجع لنسخة الطلب
function resolveReqCategories(req, saList){
  const fallback = Array.isArray(req.categories) ? req.categories : [];
  if(!Array.isArray(saList)) return fallback;
  const rid = String(req.id || req._id || '');
  if(!rid) return fallback;
  let sa = saList.find(s => String(s.request_id||'') === rid);
  if(!sa) sa = saList.find(s => s.source && String(s.source).includes('رقم '+rid)); // السجلات القديمة
  if(sa && Array.isArray(sa.categories)) return sa.categories;
  return fallback;
}

async function filterAR() {
  const q=g('arf-q'), st=g('arf-st');
  const p=new URLSearchParams(); if(q)p.set('q',q);
  const rows=await api('/api/activity_requests?'+p);
  const saList=await api('/api/student_activities'); // المصدر الأصح للتصنيفات
  const role=ME?.role;
  const isAdmin=role==='admin';
  const canEdit=canEditGlobal();
  const filtered=(rows||[]).filter(r=>!st||(r.status||'pending')===st);
  document.getElementById('tbl-ar').innerHTML=filtered.map((r,i)=>{
    const cats=resolveReqCategories(r, saList);
    const status=r.status||'pending';
    let actions='';
    if(status==='pending' && ['coordinator','admin'].includes(role)){
      actions+=`<button class="btn btn-sm btn-g" onclick="coordDecision('${r.id}','forward')">✅ قبول وتمرير</button><button class="btn btn-sm btn-r" onclick="coordDecision('${r.id}','reject')">❌ رفض</button><button class="btn btn-sm" style="color:#1B5E9A;border-color:#1B5E9A" onclick="editContentAR('${r.id}')">✏️ تعديل</button>`;
    }
    if(status==='awaiting_manager' && ['manager','admin'].includes(role)){
      actions+=`<button class="btn btn-sm btn-g" onclick="mgrDecision('${r.id}','forward')">✅ موافقة وتمرير</button><button class="btn btn-sm" style="color:#8A4B0F;border-color:#8A4B0F" onclick="mgrReturn('${r.id}')">↩️ إرجاع للمنسّق</button><button class="btn btn-sm btn-r" onclick="mgrDecision('${r.id}','reject')">❌ رفض نهائي</button><button class="btn btn-sm" style="color:#1B5E9A;border-color:#1B5E9A" onclick="editContentAR('${r.id}')">✏️ تعديل</button>`;
    }
    if(status==='awaiting_dean' && ['dean','admin'].includes(role)){
      actions+=`<button class="btn btn-sm btn-g" onclick="openApprove('${r.id}','approve')">✅ اعتماد نهائي</button><button class="btn btn-sm" style="color:#8A4B0F;border-color:#8A4B0F" onclick="deanReturn('${r.id}')">↩️ إرجاع للمدير</button>`;
    }
    if(isAdmin && !['approved','rejected'].includes(status)){
      actions+=`<button class="btn btn-sm" style="background:#5B4636;color:#fff;border-color:#5B4636" onclick="openApprove('${r.id}','admin_approve')">🚀 اعتماد مباشر</button>`;
    }
    const mgrReturnNote = (status==='pending' && r.manager_return_note) ? `<div style="font-size:10.5px;color:#8A4B0F;margin-top:3px">↩️ أعاده المدير: ${r.manager_return_note}</div>` : '';
    const returnNote = (status==='awaiting_manager' && r.dean_return_note) ? `<div style="font-size:10.5px;color:#8A4B0F;margin-top:3px">↩️ أعاده العميد: ${r.dean_return_note}</div>` : '';
    const rejNote = (status==='rejected' && r.rejection_note) ? `<div style="font-size:10.5px;color:#791F1F;margin-top:3px">السبب: ${r.rejection_note}</div>` : '';
    return `<tr>
    <td>${i+1}</td><td><strong>${r.title||'-'}</strong>${r.ref_code?`<div style="font-size:10.5px;color:var(--muted)">${r.ref_code}${r.submitted_via==='public_link'?' · <span style="color:#8A4B0F">🌐 من الرابط العام</span>':''}</div>`:''}</td><td>${r.type||'-'}</td>
    <td style="font-size:11px;color:var(--g)">${r.organizer||'-'}</td>
    <td>${r.student_name||'-'}</td><td>${r.activity_date||'-'}</td>
    <td>${stBadge(status)}${mgrReturnNote}${returnNote}${rejNote}</td>
    <td style="font-size:11px;color:var(--g)">${(cats&&cats.length)?cats.map(c=>`• ${c}`).join('<br>'):'-'}</td>
    <td><div class="rb">
      ${actions}
      <button class="btn btn-sm" style="color:#1B5E9A;border-color:#1B5E9A" onclick="viewAR('${r.id}')">👁️ عرض</button>
      <button class="btn btn-sm btn-b" onclick="printAR('${r.id}')">🖨️ طباعة</button>
      ${canEdit?`<button class="btn btn-r" onclick="delRec('activity_requests','${r.id}',filterAR)">🗑</button>`:''}
    </div></td>
  </tr>`;}).join('')||`<tr class="erow"><td colspan="9">لا توجد طلبات</td></tr>`;
  const cnt=document.getElementById('c-activity_requests'); if(cnt) cnt.textContent=filtered.length;
}

async function saveAR() {
  const data = {
    type:g('ar-type'),title:g('ar-title'),ad_title:g('ar-adtitle'),
    description:g('ar-desc'),goals:g('ar-goals'),audience:g('ar-aud'),cost:g('ar-cost'),
    organizer:g('ar-org'),
    student_name:g('ar-sname'),student_id:g('ar-sid'),phone:g('ar-phone'),
    college:g('ar-col'),submit_date:g('ar-sdate'),
    activity_date:g('ar-date'),time_from:g('ar-tfrom'),time_to:g('ar-tto'),
    location:g('ar-loc'),services:g('ar-srv'),
    supervisor:g('ar-sup'),sup_college:g('ar-supcol'),sup_phone:g('ar-supph'),
    guests:g('ar-guest'),ext_name:g('ar-ext-name'),ext_people:document.getElementById('ar-ext-people')?.value||'',
    status:'pending'
  };
  if (!data.title){showMsg('msg-ar','يرجى ملء عنوان الفعالية (حقل إلزامي)',true);return null;}
  const r=await api('/api/activity_requests','POST',data);
  if(r.error){showMsg('msg-ar',r.error,true);return null;}
  showMsg('msg-ar',`تم حفظ الطلب بنجاح ✓ — الرقم المرجعي للمتابعة: ${r.ref_code||'-'}`);
  document.getElementById('ar-form').style.display='none';
  // ترحيل تلقائي لنموذج الإعلانات
  await api('/api/announcements','POST',{
    title:      data.title,
    type:       data.type,
    date:       data.activity_date,
    time:       data.time_from ? `${data.time_from} — ${data.time_to||''}` : '',
    location:   data.location,
    organizer:  data.student_name,
    contact:    data.phone,
    description:data.description,
    notes:      '',
    source:     `مرحَّل من طلب نشاط — ${data.title}`,
    completed:  false
  });
  filterAR(); loadDash();
  return r.id;
}

async function saveAndPrintAR() {
  const id=await saveAR();
  if(id) setTimeout(()=>printAR(id),500);
}

// ══ الاعتماد والترحيل ══
let APPROVE_ACTION = 'approve'; // 'approve' (العميد) أو 'admin_approve' (تجاوز مدير النظام)

function openApprove(id, action='approve') {
  APPROVE_ID=id; APPROVE_ACTION=action;
  // بناء قائمة التصنيفات التسعة كخيارات متعددة
  const box=document.getElementById('approve-cats');
  if(box){
    box.innerHTML = ACTIVITY_CATEGORIES.map((c,i)=>`
      <label style="display:flex;align-items:center;gap:8px;padding:7px 9px;border:1px solid var(--border);border-radius:var(--r);margin-bottom:5px;cursor:pointer;font-size:12.5px">
        <input type="checkbox" class="approve-cat" value="${c.replace(/"/g,'&quot;')}" style="width:16px;height:16px;cursor:pointer">
        <span>${c}</span>
      </label>`).join('');
  }
  sg('approve-note','');
  document.getElementById('mod-approve').classList.add('open');
}
function closeModal() { document.getElementById('mod-approve').classList.remove('open'); APPROVE_ID=null; }

async function confirmApprove() {
  const checked = Array.from(document.querySelectorAll('.approve-cat:checked')).map(el=>el.value);
  if(!checked.length){alert('يرجى اختيار تصنيف واحد على الأقل من قائمة الأنشطة');return;}
  if(!APPROVE_ID){closeModal();return;}
  const r=await api(`/api/activity_requests/${APPROVE_ID}/decision`,'POST',{
    action: APPROVE_ACTION, categories: checked, note: g('approve-note')
  });
  if(r.error){alert(r.error);return;}
  closeModal();
  alert('✅ '+(r.message||'تم الاعتماد وإنشاء سجل في الأنشطة الطلابية بنجاح!'));
  filterAR(); loadDash();
}

// ══ منسّق الفعالية: قبول وتمرير / رفض ══
async function coordDecision(id, action) {
  let note='';
  if(action==='reject'){ note=prompt('سبب الرفض:',''); if(note===null) return; }
  else if(!confirm('تأكيد قبول الطلب وتمريره إلى المدير؟')) return;
  const r=await api(`/api/activity_requests/${id}/decision`,'POST',{action, note});
  if(r.error){alert(r.error);return;}
  filterAR(); loadDash();
}

// ══ المدير: إرجاع الطلب للمنسّق لإجراء تعديل على بيانات النشاط ══
async function mgrReturn(id) {
  const note=prompt('سبب الإرجاع لمنسّق الفعالية (سيظهر له لإجراء التعديل اللازم):','');
  if(note===null) return;
  const r=await api(`/api/activity_requests/${id}/decision`,'POST',{action:'return', note});
  if(r.error){alert(r.error);return;}
  filterAR(); loadDash();
}
async function mgrDecision(id, action) {
  let note='';
  if(action==='reject'){
    note=prompt('سبب الرفض النهائي (سيُنهى الطلب ولن يعود لأي مرحلة):',''); if(note===null) return;
  } else if(!confirm('تأكيد الموافقة وتمرير الطلب إلى العميد؟')) return;
  const r=await api(`/api/activity_requests/${id}/decision`,'POST',{action, note});
  if(r.error){alert(r.error);return;}
  filterAR(); loadDash();
}

// ══ العميد: إرجاع الطلب للمدير مع سبب (بدون اعتماد) ══
async function deanReturn(id) {
  const note=prompt('سبب الإرجاع للمدير (سيظهر له لإجراء التعديل اللازم):','');
  if(note===null) return;
  const r=await api(`/api/activity_requests/${id}/decision`,'POST',{action:'reject', note});
  if(r.error){alert(r.error);return;}
  filterAR(); loadDash();
}

// ══ مشاهدة تفاصيل طلب النشاط داخل نافذة (بدون طباعة) ══
function vrow(label, val, color) {
  if(!val && val!==0) return '';
  return `<div style="display:flex;gap:10px;padding:7px 0;border-bottom:1px solid var(--border);font-size:12.5px">
    <span style="color:var(--muted);min-width:150px;flex-shrink:0">${label}</span>
    <span style="font-weight:600;${color?`color:${color}`:''}">${String(val).replace(/\n/g,'<br>')}</span>
  </div>`;
}
function vsec(title) { return `<div style="font-size:12.5px;font-weight:700;color:var(--g);margin:16px 0 4px">${title}</div>`; }

async function viewAR(id) {
  const r=await api('/api/activity_requests/'+id); if(!r||r.error){alert('تعذر تحميل بيانات الطلب');return;}
  const saList=await api('/api/student_activities');
  const cats=(typeof resolveReqCategories==='function')?resolveReqCategories(r, saList):(r.categories||[]);
  const existing=document.getElementById('view-ar-modal'); if(existing) existing.remove();
  const modal=document.createElement('div');
  modal.id='view-ar-modal';
  modal.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;z-index:2000;padding:16px';
  modal.innerHTML=`
  <div style="background:#fff;border-radius:12px;padding:22px;width:100%;max-width:680px;max-height:88vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,.3)">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;margin-bottom:6px">
      <div>
        <div style="font-size:16px;font-weight:700;color:var(--g)">👁️ ${r.title||'-'}</div>
        <div style="margin-top:6px">${stBadge(r.status||'pending')} ${r.ref_code?`<span style="font-size:11px;color:var(--muted);margin-right:8px">${r.ref_code}</span>`:''} ${r.submitted_via==='public_link'?`<span style="font-size:11px;color:#8A4B0F;margin-right:8px">🌐 من الرابط العام</span>`:''}</div>
      </div>
      <button onclick="document.getElementById('view-ar-modal').remove()" style="background:none;border:none;font-size:18px;cursor:pointer;color:var(--muted);flex-shrink:0">✕</button>
    </div>

    ${vsec('بيانات النشاط')}
    ${vrow('نوع النشاط', r.type)}
    ${vrow('وصف النشاط', r.description)}
    ${vrow('أهداف النشاط', r.goals)}
    ${vrow('نوع الحضور', r.audience)}
    ${vrow('التكلفة المالية', r.cost)}
    ${vrow('الجهة المنظمة', r.organizer, '#1B6B3A')}
    ${cats&&cats.length?vrow('تصنيفات الجودة المعتمدة', cats.map((c,i)=>`${i+1}. ${c}`).join('\n')):''}

    ${vsec('موعد ومكان النشاط')}
    ${vrow('تاريخ انعقاد النشاط', r.activity_date)}
    ${vrow('من الساعة — إلى', (r.time_from||r.time_to)?`${r.time_from||'-'} — ${r.time_to||'-'}`:'')}
    ${vrow('مكان الانعقاد', r.location)}
    ${vrow('الخدمات المساندة المطلوبة', r.services)}

    ${vsec('مقدّم الطلب')}
    ${vrow('الاسم', r.student_name)}
    ${vrow('الرقم الجامعي', r.student_id)}
    ${vrow('الهاتف', r.phone)}
    ${vrow('الكلية', r.college)}
    ${vrow('تاريخ التقديم', r.submit_date)}

    ${(r.supervisor||r.sup_college||r.sup_phone)?vsec('مشرف النشاط'):''}
    ${vrow('الاسم', r.supervisor)}
    ${vrow('الكلية', r.sup_college)}
    ${vrow('الهاتف', r.sup_phone)}

    ${(r.guests||r.ext_name||r.ext_people)?vsec('مشاركة جهة خارجية'):''}
    ${vrow('مشاركة جهة خارجية', r.guests)}
    ${vrow('اسم الجهة الخارجية', r.ext_name)}
    ${vrow('أسماء المشاركين من الخارج', r.ext_people)}

    ${vsec('مسار الاعتماد')}
    ${vrow('منسّق الفعالية', r.coordinator_by ? `${r.coordinator_by} — ${(r.coordinator_at||'').split('T')[0]||r.coordinator_at}` : '')}
    ${vrow('إرجاع المدير للمنسّق', r.manager_return_note ? `${r.manager_return_by||''} — ${r.manager_return_note}` : '', '#8A4B0F')}
    ${vrow('المدير', r.manager_by ? `${r.manager_by} — ${(r.manager_at||'').split('T')[0]||r.manager_at}` : '')}
    ${vrow('العميد (الاعتماد النهائي)', r.approved_by ? `${r.approved_by} — ${(r.approved_at||'').split('T')[0]||r.approved_at}` : '', '#27500A')}
    ${vrow('إرجاع العميد للمدير', r.dean_return_note ? `${r.dean_return_by||''} — ${r.dean_return_note}` : '', '#8A4B0F')}
    ${vrow('سبب الرفض النهائي', r.rejection_note ? `(${r.rejected_stage==='coordinator'?'من المنسّق':'من المدير'}) ${r.rejection_note}` : '', '#791F1F')}
    ${r.admin_override?vrow('ملاحظة', 'تم الاعتماد مباشرة من مدير النظام (تجاوز التسلسل)', '#5B4636'):''}

    <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:18px">
      <button class="btn" onclick="document.getElementById('view-ar-modal').remove()">إغلاق</button>
      <button class="btn btn-b" onclick="printAR('${r.id}')">🖨️ طباعة</button>
    </div>
  </div>`;
  document.body.appendChild(modal);
}
