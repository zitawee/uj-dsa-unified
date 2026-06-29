// ══════════════════════════════════════════
// طلبات إقامة النشاط — مع نظام الاعتماد والترحيل
// ══════════════════════════════════════════
async function loadAR() {
  const canEdit = ME?.role !== 'viewer';
  const isAdmin = ME?.role === 'admin';
  document.getElementById('panel-activity_requests').innerHTML = `
  <div class="ph">
    <div><div class="pt"><i class="ti ti-file-plus"></i> طلبات إقامة نشاط</div><div class="pc">DSA-02-01-05</div></div>
    <div style="display:flex;gap:6px">
      ${canEdit?`<button class="btn btn-g" onclick="showARForm()"><i class="ti ti-plus"></i>طلب جديد</button>`:''}
      <button class="btn btn-b" onclick="printBlankAR()"><i class="ti ti-printer"></i>طباعة فارغ</button>
    </div>
  </div>
  <div id="ar-form" style="display:none">
    <div id="msg-ar" class="msg"></div>
    <div class="card">
      <div class="ct"><i class="ti ti-info-circle"></i>بيانات النشاط</div>
      <div class="g2">
        <div class="fg"><label>نوع النشاط *</label><select id="ar-type"><option value="">اختر...</option><option>مبادرة</option><option>محاضرة</option><option>دورة تدريبية</option><option>ورشة</option><option>معرض</option><option>مسابقة</option><option>أخرى</option></select></div>
        <div class="fg"><label>اسم / عنوان الفعالية *</label><input id="ar-title" type="text"></div>
        <div class="fg full"><label>اسم الفعالية في الإعلان (إن اختلف)</label><input id="ar-adtitle" type="text"></div>
        <div class="fg full"><label>وصف النشاط *</label><textarea id="ar-desc"></textarea></div>
        <div class="fg full"><label>أهداف النشاط</label><textarea id="ar-goals"></textarea></div>
        <div class="fg"><label>نوع الحضور</label><input id="ar-aud" type="text" placeholder="طلبة، أكاديميين..."></div>
        <div class="fg"><label>التكلفة المالية</label><input id="ar-cost" type="text"></div>
        <div class="fg full" style="background:#F0FAF4;padding:10px;border-radius:var(--r);border:1px solid #C6E8D3">
          <label style="color:var(--g);font-weight:700">الجدول المستهدف في الجودة *</label>
          <select id="ar-qtbl" style="margin-top:5px;padding:8px;border:1px solid #C6E8D3;border-radius:var(--r);font-family:inherit;width:100%">
            <option value="">اختر الجدول المناسب...</option>
            ${Object.entries(QTBL_LABELS).map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}
          </select>
          <div style="font-size:11px;color:var(--g);margin-top:4px">✅ عند اعتماد الطلب سيُرحَّل تلقائياً لهذا الجدول في بيانات الجودة</div>
        </div>
      </div>
    </div>
    <div class="card">
      <div class="ct"><i class="ti ti-user"></i>مقدم الطلب</div>
      <div class="g3">
        <div class="fg"><label>اسم الطالب مقدم النشاط *</label><input id="ar-sname" type="text"></div>
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
        <div class="fg"><label>الكلية</label><input id="ar-supcol" type="text"></div>
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
    <select id="arf-st" onchange="filterAR()"><option value="">جميع الحالات</option><option value="pending">🟡 قيد الانتظار</option><option value="approved">✅ معتمد</option><option value="rejected">❌ مرفوض</option></select>
  </div>
  <div class="tw"><table><thead><tr>
    <th>#</th><th>عنوان الفعالية</th><th>النوع</th><th>الجدول المستهدف</th><th>مقدم الطلب</th><th>تاريخ النشاط</th><th>الحالة</th><th>رُحِّل إلى</th><th></th>
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

async function filterAR() {
  const q=g('arf-q'), st=g('arf-st');
  const p=new URLSearchParams(); if(q)p.set('q',q);
  const rows=await api('/api/activity_requests?'+p);
  const isAdmin=ME?.role==='admin';
  const canEdit=ME?.role!=='viewer';
  const filtered=(rows||[]).filter(r=>!st||(r.status||'pending')===st);
  document.getElementById('tbl-ar').innerHTML=filtered.map((r,i)=>`<tr>
    <td>${i+1}</td><td><strong>${r.title||'-'}</strong></td><td>${r.type||'-'}</td>
    <td style="font-size:11px;color:var(--g)">${QTBL_LABELS[r.quality_table]||'-'}</td>
    <td>${r.student_name||'-'}</td><td>${r.activity_date||'-'}</td>
    <td>${stBadge(r.status||'pending')}</td>
    <td style="font-size:11px;color:var(--g)">${r.transferred_to?QTBL_LABELS[r.transferred_to]||r.transferred_to:'-'}</td>
    <td><div class="rb">
      ${isAdmin&&(!r.status||r.status==='pending')?`<button class="btn btn-sm btn-g" onclick="openApprove('${r.id}')">✅ اعتماد</button><button class="btn btn-sm btn-r" onclick="rejectAR('${r.id}')">❌ رفض</button>`:''}
      <button class="btn btn-sm btn-b" onclick="printAR('${r.id}')">🖨️ طباعة</button>
      ${canEdit?`<button class="btn btn-r" onclick="delRec('activity_requests','${r.id}',filterAR)">🗑</button>`:''}
    </div></td>
  </tr>`).join('')||`<tr class="erow"><td colspan="9">لا توجد طلبات</td></tr>`;
  const cnt=document.getElementById('c-activity_requests'); if(cnt) cnt.textContent=filtered.length;
}

async function saveAR() {
  const data = {
    type:g('ar-type'),title:g('ar-title'),ad_title:g('ar-adtitle'),
    description:g('ar-desc'),goals:g('ar-goals'),audience:g('ar-aud'),cost:g('ar-cost'),
    quality_table:g('ar-qtbl'),
    student_name:g('ar-sname'),student_id:g('ar-sid'),phone:g('ar-phone'),
    college:g('ar-col'),submit_date:g('ar-sdate'),
    activity_date:g('ar-date'),time_from:g('ar-tfrom'),time_to:g('ar-tto'),
    location:g('ar-loc'),services:g('ar-srv'),
    supervisor:g('ar-sup'),sup_college:g('ar-supcol'),sup_phone:g('ar-supph'),
    guests:g('ar-guest'),ext_name:g('ar-ext-name'),ext_people:document.getElementById('ar-ext-people')?.value||'',
    status:'pending'
  };
  if (!data.title||!data.student_name){showMsg('msg-ar','يرجى ملء الحقول الإلزامية',true);return null;}
  if (!data.quality_table){showMsg('msg-ar','يرجى اختيار الجدول المستهدف في الجودة',true);return null;}
  const r=await api('/api/activity_requests','POST',data);
  if(r.error){showMsg('msg-ar',r.error,true);return null;}
  showMsg('msg-ar','تم حفظ الطلب بنجاح ✓');
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
function openApprove(id) {
  APPROVE_ID=id;
  sg('approve-tbl',''); sg('approve-note','');
  document.getElementById('mod-approve').classList.add('open');
}
function closeModal() { document.getElementById('mod-approve').classList.remove('open'); APPROVE_ID=null; }

async function confirmApprove() {
  const target=g('approve-tbl');
  if(!target){alert('يرجى اختيار الجدول المستهدف');return;}
  if(!APPROVE_ID){closeModal();return;}
  const req=await api('/api/activity_requests/'+APPROVE_ID);
  if(req.error){alert('تعذر جلب البيانات');return;}
  await api('/api/activity_requests/'+APPROVE_ID,'PUT',{
    ...req,status:'approved',transferred_to:target,
    approved_by:ME.fullName,approved_at:new Date().toISOString(),approval_note:g('approve-note')
  });
  const qRec=buildQRecord(req,target);
  await api('/api/'+target,'POST',qRec);
  closeModal();
  alert('✅ تم الاعتماد وترحيل البيانات لجدول الجودة بنجاح!');
  filterAR(); loadDash();
}

function buildQRecord(req, target) {
  const base={name:req.title,date:req.activity_date,authority:req.sup_college||'عمادة شؤون الطلبة',external_party:req.guests==='نعم'?'نعم':'لا',source:`مُرحَّل من طلب نشاط رقم ${req.id} — ${req.title}`,completed:false};
  const map={
    workshops:{...base,students_count:'',staff_names:req.supervisor||'',leaders_names:'',rating:''},
    initiatives:{...base,type:req.type||'',participants_count:'',attendees_count:'',leaders_names:'',rating:''},
    external_acts:{...base,type:req.type||'',students_count:'',leaders_names:'',rating:''},
    competitions:{...base,type:req.type||'',students_count:'',trainer:req.supervisor||'',staff_names:''},
    awareness:{...base,type:req.type||'',leaders_names:'',staff_names:req.supervisor||'',rating:''},
    staff_innovation:{staff_name:req.supervisor||'',job_title:'',workplace:req.sup_college||'',activity_name:req.title,activity_type:req.type||'',date:req.activity_date,supervising_authority:'عمادة شؤون الطلبة',rating:'',source:base.source,completed:false},
    expert_acts:{...base,students_count:'',experts_names:'',staff_names:req.supervisor||'',leaders_names:'',rating:''},
    environment:{...base,students_count:'',staff_names:req.supervisor||'',leaders_names:'',rating:''},
    dialogues:{title:req.title,date:req.activity_date,speakers:req.supervisor||'',students_count:'',staff_names:'',leaders_names:'',rating:'',source:base.source,completed:false},
    campaigns:{title:req.title,date:req.activity_date,external_party:req.guests==='نعم'?'نعم':'لا',students_count:'',speakers:req.supervisor||'',staff_names:'',leaders_names:'',source:base.source,completed:false},
  };
  return map[target]||base;
}

async function rejectAR(id) {
  const note=prompt('سبب الرفض (اختياري):','');
  if(note===null)return;
  const req=await api('/api/activity_requests/'+id);
  await api('/api/activity_requests/'+id,'PUT',{...req,status:'rejected',rejected_by:ME.fullName,rejected_at:new Date().toISOString(),rejection_note:note});
  filterAR(); loadDash();
}
