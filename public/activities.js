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
    <div style="display:flex;gap:8px;justify-content:flex-end;margin-bottom:14px">
      <button class="btn" onclick="document.getElementById('ar-form').style.display='none'">إلغاء</button>
      <button class="btn btn-b" onclick="saveAndPrintAR()"><i class="ti ti-printer"></i>حفظ وطباعة</button>
      <button class="btn btn-g" onclick="saveAR()"><i class="ti ti-device-floppy"></i>حفظ فقط</button>
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
  f.querySelectorAll('input:not([type=file]),select,textarea').forEach(el=>el.value='');
  document.getElementById('ar-sdate').valueAsDate=new Date();
  document.getElementById('ar-date').valueAsDate=new Date();
  f.scrollIntoView({behavior:'smooth'});
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
      actions+=`<button class="btn btn-sm btn-g" onclick="coordDecision('${r.id}','forward')">✅ قبول وتمرير</button><button class="btn btn-sm btn-r" onclick="coordDecision('${r.id}','reject')">❌ رفض</button>`;
    }
    if(status==='awaiting_manager' && ['manager','admin'].includes(role)){
      actions+=`<button class="btn btn-sm btn-g" onclick="mgrDecision('${r.id}','forward')">✅ موافقة وتمرير</button><button class="btn btn-sm btn-r" onclick="mgrDecision('${r.id}','reject')">❌ رفض نهائي</button>`;
    }
    if(status==='awaiting_dean' && ['dean','admin'].includes(role)){
      actions+=`<button class="btn btn-sm btn-g" onclick="openApprove('${r.id}','approve')">✅ اعتماد نهائي</button><button class="btn btn-sm" style="color:#8A4B0F;border-color:#8A4B0F" onclick="deanReturn('${r.id}')">↩️ إرجاع للمدير</button>`;
    }
    if(isAdmin && !['approved','rejected'].includes(status)){
      actions+=`<button class="btn btn-sm" style="background:#5B4636;color:#fff;border-color:#5B4636" onclick="openApprove('${r.id}','admin_approve')">🚀 اعتماد مباشر</button>`;
    }
    const returnNote = (status==='awaiting_manager' && r.dean_return_note) ? `<div style="font-size:10.5px;color:#8A4B0F;margin-top:3px">↩️ أعاده العميد: ${r.dean_return_note}</div>` : '';
    const rejNote = (status==='rejected' && r.rejection_note) ? `<div style="font-size:10.5px;color:#791F1F;margin-top:3px">السبب: ${r.rejection_note}</div>` : '';
    return `<tr>
    <td>${i+1}</td><td><strong>${r.title||'-'}</strong>${r.ref_code?`<div style="font-size:10.5px;color:var(--muted)">${r.ref_code}${r.submitted_via==='public_link'?' · <span style="color:#8A4B0F">🌐 من الرابط العام</span>':''}</div>`:''}</td><td>${r.type||'-'}</td>
    <td style="font-size:11px;color:var(--g)">${r.organizer||'-'}</td>
    <td>${r.student_name||'-'}</td><td>${r.activity_date||'-'}</td>
    <td>${stBadge(status)}${returnNote}${rejNote}</td>
    <td style="font-size:11px;color:var(--g)">${(cats&&cats.length)?cats.map(c=>`• ${c}`).join('<br>'):'-'}</td>
    <td><div class="rb">
      ${actions}
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

// ══ المدير: موافقة وتمرير / رفض نهائي ══
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
