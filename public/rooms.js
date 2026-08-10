// ══════════════════════════════════════════════════════════════
// نظام حجز الغرف الفندقية — لوحة الإدارة (Admin فقط)
// وحدة مستقلة عن باقي النظام، قابلة لإعادة الاستخدام لأي نشاط/رحلة
// ══════════════════════════════════════════════════════════════

let RB_CYCLES = [];
let RB_CYCLE = null; // دورة الحجز المفتوحة حالياً (تفاصيل كاملة)، أو null لعرض القائمة الرئيسية
const RB_CAP_LABEL = { 1:'فردية', 2:'مزدوجة', 3:'ثلاثية' };

function rbEsc(s) { return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function rbGenId() { const c='ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let s=''; for(let i=0;i<8;i++) s+=c[Math.floor(Math.random()*c.length)]; return s; }
function rbDate(d) { if (!d) return ''; try { return new Date(d).toLocaleDateString('ar-JO', { year:'numeric', month:'long', day:'numeric' }); } catch(e) { return ''; } }

async function loadRoomBooking() {
  const panel = document.getElementById('panel-room_booking');
  if (!panel) return;
  panel.innerHTML = `<div class="ph"><div><div class="pt">نظام حجز الغرف</div><div class="ps">توزيع الطلبة على الغرف الفندقية حسب الجنس، لكل نشاط رحلة على حدة</div></div></div>
    <div class="card"><div class="center" style="padding:24px">جارٍ التحميل...</div></div>`;
  const cycles = await api('/api/room_booking/cycles');
  if (!Array.isArray(cycles)) { panel.innerHTML = `<div class="card"><div class="center">تعذّر تحميل البيانات</div></div>`; return; }
  RB_CYCLES = cycles;
  RB_CYCLE = null;
  rbRenderList();
}

function rbRenderList() {
  const panel = document.getElementById('panel-room_booking');
  panel.innerHTML = `
  <div class="ph"><div><div class="pt">نظام حجز الغرف</div><div class="ps">توزيع الطلبة على الغرف الفندقية حسب الجنس، لكل نشاط رحلة على حدة</div></div></div>
  <div class="card"><button class="btn btn-sm" style="background:var(--g);color:#fff" onclick="rbOpenNewCycle()"><i class="ti ti-plus"></i> إنشاء دورة حجز جديدة</button></div>
  <div class="card">
    <div class="tw"><table>
      <thead><tr><th>#</th><th>النشاط</th><th>عدد الفنادق</th><th>تاريخ الإنشاء</th><th>إجراءات</th></tr></thead>
      <tbody>${RB_CYCLES.length ? RB_CYCLES.map((c,i)=>`
        <tr>
          <td>${i+1}</td>
          <td>${rbEsc(c.activity_name)}</td>
          <td>${(c.hotels||[]).length}</td>
          <td>${rbDate(c.createdAt)}</td>
          <td style="white-space:nowrap">
            <button class="btn btn-sm" onclick="rbOpenCycle('${c.id}')"><i class="ti ti-door"></i> فتح</button>
            <button class="btn btn-sm" style="color:#c0392b" onclick="rbDeleteCycle('${c.id}')"><i class="ti ti-trash"></i></button>
          </td>
        </tr>`).join('') : `<tr><td colspan="5" class="center">لا توجد دورات حجز بعد</td></tr>`}
      </tbody>
    </table></div>
  </div>
  <div class="modal-ov" id="rb-modal" onclick="if(event.target===this) rbCloseModal()"><div class="modal" style="max-width:560px;max-height:88vh;overflow-y:auto" id="rb-modal-body"></div></div>`;

  if (!window.__rbEscBound) {
    window.__rbEscBound = true;
    document.addEventListener('keydown', e => { if (e.key === 'Escape') rbCloseModal(); });
  }
}
function rbCloseModal() { document.getElementById('rb-modal')?.classList.remove('open'); }

async function rbOpenNewCycle() {
  const parts = await api('/api/participants');
  const list = Array.isArray(parts) ? parts : [];
  document.getElementById('rb-modal-body').innerHTML = `
    <h3>إنشاء دورة حجز جديدة</h3>
    <div class="fg"><label>اختر النشاط (من قائمة أسماء المشاركين)</label>
      <select id="rb-new-act">
        <option value="">اختر...</option>
        ${list.map(p => `<option value="${p.id}">${rbEsc(p.activity)} — ${rbEsc(p.date||'')} (${(p.students||[]).length} مشارك)</option>`).join('')}
      </select>
    </div>
    <div style="font-size:11.5px;color:var(--muted);margin-bottom:10px">سيتم التحقق لاحقاً من الرقم الجامعي لكل طالب مقابل قائمة مشاركي هذا النشاط تحديداً.</div>
    <div style="display:flex;gap:8px">
      <button class="btn" style="flex:1;background:var(--g);color:#fff" onclick="rbCreateCycle()"><i class="ti ti-plus"></i> إنشاء</button>
      <button class="btn" onclick="rbCloseModal()">إغلاق</button>
    </div>`;
  document.getElementById('rb-modal').classList.add('open');
}

async function rbCreateCycle() {
  const sel = document.getElementById('rb-new-act');
  const activity_id = sel.value;
  if (!activity_id) { alert('يرجى اختيار النشاط'); return; }
  const activity_name = sel.options[sel.selectedIndex].textContent.split(' — ')[0];
  const r = await api('/api/room_booking/cycles', 'POST', { activity_id, activity_name });
  if (r.error) { alert(r.error); return; }
  rbCloseModal();
  await loadRoomBooking();
  rbOpenCycle(r.id);
}

async function rbDeleteCycle(id) {
  if (!confirm('حذف دورة الحجز هذه بكل فنادقها وبيانات الغرف؟ لا يمكن التراجع.')) return;
  const r = await api('/api/room_booking/cycles/'+id, 'DELETE');
  if (r.error) { alert(r.error); return; }
  loadRoomBooking();
}

async function rbOpenCycle(id) {
  const c = await api('/api/room_booking/cycles/'+id);
  if (c.error) { alert(c.error); return; }
  RB_CYCLE = c;
  rbRenderCycle();
}

function rbBackToList() { RB_CYCLE = null; rbRenderList(); }

async function rbSaveCycleHotels() {
  const r = await api('/api/room_booking/cycles/'+RB_CYCLE.id, 'PUT', { hotels: RB_CYCLE.hotels });
  if (r.error) { alert(r.error); return false; }
  return true;
}

function rbRenderCycle() {
  const panel = document.getElementById('panel-room_booking');
  const c = RB_CYCLE;
  const hotels = c.hotels || [];
  panel.innerHTML = `
  <div class="ph"><div><div class="pt">${rbEsc(c.activity_name)}</div><div class="ps">إدارة الفنادق وتوزيع الغرف لهذا النشاط</div></div></div>
  <div class="card">
    <button class="btn btn-sm" onclick="rbBackToList()"><i class="ti ti-arrow-right"></i> كل دورات الحجز</button>
    <button class="btn btn-sm" style="background:var(--g);color:#fff" onclick="rbOpenHotelForm()"><i class="ti ti-plus"></i> إضافة فندق</button>
  </div>
  <div class="card">
    ${hotels.length ? hotels.map(h => rbHotelCardHTML(h)).join('') : `<div class="center">لا توجد فنادق مضافة بعد لهذه الدورة</div>`}
  </div>
  <div class="modal-ov" id="rb-modal" onclick="if(event.target===this) rbCloseModal()"><div class="modal" style="max-width:560px;max-height:88vh;overflow-y:auto" id="rb-modal-body"></div></div>`;
}

function rbHotelCardHTML(h) {
  const rooms = h.rooms || [];
  const male = rooms.filter(r=>r.gender==='ذكر');
  const female = rooms.filter(r=>r.gender==='أنثى');
  const occCount = rooms.reduce((a,r)=>a+(r.occupants||[]).length, 0);
  const capCount = rooms.reduce((a,r)=>a+r.capacity, 0);
  const link = window.location.origin + '/rooms.html?hotel=' + h.id;
  return `<div style="border:1px solid var(--border);border-radius:var(--r);padding:12px;margin-bottom:10px">
    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
      <div>
        <div style="font-weight:700;color:var(--g)">${rbEsc(h.name)}</div>
        <div style="font-size:11.5px;color:var(--muted)">
          ذكور: ${male.length} غرفة (${male.reduce((a,r)=>a+(r.occupants||[]).length,0)}/${male.reduce((a,r)=>a+r.capacity,0)}) —
          إناث: ${female.length} غرفة (${female.reduce((a,r)=>a+(r.occupants||[]).length,0)}/${female.reduce((a,r)=>a+r.capacity,0)}) —
          الإجمالي: ${occCount}/${capCount}
          ${h.close_date ? ` — الرابط مفتوح حتى ${rbDate(h.close_date)}` : ' — الرابط مفتوح بلا تاريخ إغلاق'}
        </div>
      </div>
      <div style="white-space:nowrap">
        <button class="btn btn-sm" onclick="rbCopyLink('${h.id}')"><i class="ti ti-link"></i> نسخ الرابط</button>
        <button class="btn btn-sm" onclick="rbViewHotel('${h.id}')"><i class="ti ti-eye"></i> عرض الغرف</button>
        <button class="btn btn-sm" onclick="rbOpenHotelForm('${h.id}')"><i class="ti ti-pencil"></i> تعديل</button>
        <button class="btn btn-sm" style="color:#c0392b" onclick="rbDeleteHotel('${h.id}')"><i class="ti ti-trash"></i></button>
      </div>
    </div>
  </div>`;
}

function rbCopyLink(hotelId) {
  const link = window.location.origin + '/rooms.html?hotel=' + hotelId;
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(link).then(()=>alert('تم نسخ رابط التسجيل ✓')).catch(()=>prompt('انسخي الرابط يدوياً:', link));
  } else { prompt('انسخي الرابط يدوياً:', link); }
}

async function rbDeleteHotel(hotelId) {
  if (!confirm('حذف هذا الفندق وكل بيانات غرفه؟')) return;
  RB_CYCLE.hotels = (RB_CYCLE.hotels||[]).filter(h => h.id !== hotelId);
  const ok = await rbSaveCycleHotels();
  if (ok) rbRenderCycle();
}

// ── نموذج إضافة/تعديل فندق (اسم، تاريخ إغلاق، عدد الغرف حسب النوع والجنس) ──
function rbOpenHotelForm(hotelId) {
  const h = hotelId ? (RB_CYCLE.hotels||[]).find(x=>x.id===hotelId) : null;
  const counts = { male: {1:0,2:0,3:0}, female: {1:0,2:0,3:0} };
  if (h) {
    (h.rooms||[]).forEach(r => {
      const key = r.gender === 'ذكر' ? 'male' : 'female';
      counts[key][r.capacity] = (counts[key][r.capacity]||0) + 1;
    });
  }
  document.getElementById('rb-modal-body').innerHTML = `
    <h3>${h ? 'تعديل الفندق' : 'إضافة فندق جديد'}</h3>
    <div class="fg"><label>اسم الفندق</label><input type="text" id="rb-h-name" value="${rbEsc(h?.name||'')}" placeholder="مثال: فندق A"></div>
    <div class="fg"><label>تاريخ إغلاق رابط التسجيل (اختياري)</label><input type="date" id="rb-h-close" value="${h?.close_date||''}"></div>
    <div style="font-weight:700;color:var(--g);font-size:12.5px;margin:10px 0 4px">عدد الغرف — ذكور</div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:0 8px">
      <div class="fg"><label>فردية</label><input type="number" min="0" id="rb-h-m1" value="${counts.male[1]}"></div>
      <div class="fg"><label>مزدوجة</label><input type="number" min="0" id="rb-h-m2" value="${counts.male[2]}"></div>
      <div class="fg"><label>ثلاثية</label><input type="number" min="0" id="rb-h-m3" value="${counts.male[3]}"></div>
    </div>
    <div style="font-weight:700;color:var(--g);font-size:12.5px;margin:10px 0 4px">عدد الغرف — إناث</div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:0 8px">
      <div class="fg"><label>فردية</label><input type="number" min="0" id="rb-h-f1" value="${counts.female[1]}"></div>
      <div class="fg"><label>مزدوجة</label><input type="number" min="0" id="rb-h-f2" value="${counts.female[2]}"></div>
      <div class="fg"><label>ثلاثية</label><input type="number" min="0" id="rb-h-f3" value="${counts.female[3]}"></div>
    </div>
    ${h ? `<div style="font-size:11px;color:var(--muted);margin-bottom:8px">تخفيض عدد الغرف لن يحذف أي غرفة بها طلبة مسجَّلون بالفعل — سيتم فقط حذف الغرف الفارغة الزائدة.</div>` : ''}
    <div style="display:flex;gap:8px;margin-top:8px">
      <button class="btn" style="flex:1;background:var(--g);color:#fff" onclick="rbSaveHotel('${hotelId||''}')"><i class="ti ti-device-floppy"></i> حفظ</button>
      <button class="btn" onclick="rbCloseModal()">إغلاق</button>
    </div>`;
  document.getElementById('rb-modal').classList.add('open');
}

// يدمج عدد الغرف الجديد مع الغرف الحالية لنفس (الجنس + السعة) دون حذف أي غرفة مشغولة
function rbMergeRoomsFor(existingRooms, gender, capacity, desiredCount) {
  const same = existingRooms.filter(r => r.gender===gender && r.capacity===capacity);
  let result = same.slice();
  if (result.length < desiredCount) {
    for (let i=result.length; i<desiredCount; i++) result.push({ id: rbGenId(), gender, capacity, occupants: [] });
  } else if (result.length > desiredCount) {
    let toRemove = result.length - desiredCount;
    result = result.filter(r => {
      if (toRemove > 0 && (!r.occupants || !r.occupants.length)) { toRemove--; return false; }
      return true;
    });
  }
  return result;
}

async function rbSaveHotel(hotelId) {
  const name = document.getElementById('rb-h-name').value.trim();
  if (!name) { alert('يرجى إدخال اسم الفندق'); return; }
  const close_date = document.getElementById('rb-h-close').value || null;
  const gv = id => parseInt(document.getElementById(id).value) || 0;

  let h = hotelId ? (RB_CYCLE.hotels||[]).find(x=>x.id===hotelId) : null;
  const isNew = !h;
  if (isNew) h = { id: rbGenId(), name: '', close_date: null, rooms: [] };
  h.name = name; h.close_date = close_date;

  let rooms = [];
  rooms = rooms.concat(rbMergeRoomsFor(h.rooms||[], 'ذكر', 1, gv('rb-h-m1')));
  rooms = rooms.concat(rbMergeRoomsFor(h.rooms||[], 'ذكر', 2, gv('rb-h-m2')));
  rooms = rooms.concat(rbMergeRoomsFor(h.rooms||[], 'ذكر', 3, gv('rb-h-m3')));
  rooms = rooms.concat(rbMergeRoomsFor(h.rooms||[], 'أنثى', 1, gv('rb-h-f1')));
  rooms = rooms.concat(rbMergeRoomsFor(h.rooms||[], 'أنثى', 2, gv('rb-h-f2')));
  rooms = rooms.concat(rbMergeRoomsFor(h.rooms||[], 'أنثى', 3, gv('rb-h-f3')));
  h.rooms = rooms;

  RB_CYCLE.hotels = RB_CYCLE.hotels || [];
  if (isNew) RB_CYCLE.hotels.push(h);
  else RB_CYCLE.hotels = RB_CYCLE.hotels.map(x => x.id === h.id ? h : x);

  const ok = await rbSaveCycleHotels();
  if (!ok) return;
  rbCloseModal();
  rbRenderCycle();
}

// ── عرض تفصيلي لغرف فندق (للقراءة + طباعة + تصدير) ──
function rbViewHotel(hotelId) {
  const h = (RB_CYCLE.hotels||[]).find(x=>x.id===hotelId);
  if (!h) return;
  const male = (h.rooms||[]).filter(r=>r.gender==='ذكر');
  const female = (h.rooms||[]).filter(r=>r.gender==='أنثى');
  function block(title, rooms) {
    if (!rooms.length) return `<div style="font-size:12px;color:var(--muted);margin-bottom:10px">لا توجد غرف ${title}</div>`;
    return `<div style="font-weight:700;color:var(--g);font-size:12.5px;margin:10px 0 4px">${title}</div>` + rooms.map((r,i) => `
      <div style="border:1px solid var(--border);border-radius:var(--r);padding:8px 10px;margin-bottom:6px">
        <div style="font-size:12.5px;font-weight:700">غرفة ${i+1} — ${RB_CAP_LABEL[r.capacity]} (${(r.occupants||[]).length}/${r.capacity})</div>
        ${(r.occupants||[]).map(o=>`<div style="font-size:11.5px;padding:3px 0;border-top:1px dashed var(--border)">${rbEsc(o.name)} — ${rbEsc(o.uni_id)} — ${rbEsc(o.nationality)||'—'} — ${rbEsc(o.phone)||'—'}</div>`).join('') || `<div style="font-size:11px;color:var(--muted)">لا يوجد أحد بعد</div>`}
      </div>`).join('');
  }
  document.getElementById('rb-modal-body').innerHTML = `
    <h3>غرف ${rbEsc(h.name)}</h3>
    ${block('الذكور', male)}
    ${block('الإناث', female)}
    <div style="display:flex;gap:8px;margin-top:12px">
      <button class="btn" style="flex:1" onclick="rbPrintHotel('${hotelId}')"><i class="ti ti-printer"></i> طباعة</button>
      <button class="btn" style="flex:1" onclick="rbExportHotelExcel('${hotelId}')"><i class="ti ti-file-spreadsheet"></i> تصدير Excel</button>
      <button class="btn" onclick="rbCloseModal()">إغلاق</button>
    </div>`;
  document.getElementById('rb-modal').classList.add('open');
}

function rbPrintHotel(hotelId) {
  const h = (RB_CYCLE.hotels||[]).find(x=>x.id===hotelId);
  if (!h) return;
  function tbl(title, rooms) {
    if (!rooms.length) return '';
    const bodyRows = [];
    rooms.forEach((r,i) => {
      const occ = r.occupants||[];
      if (!occ.length) { bodyRows.push(`<tr><td>${i+1}</td><td>${RB_CAP_LABEL[r.capacity]}</td><td colspan="3" style="color:#999">لا يوجد أحد</td></tr>`); return; }
      occ.forEach((o,oi) => {
        bodyRows.push(`<tr>${oi===0?`<td rowspan="${occ.length}">${i+1}</td><td rowspan="${occ.length}">${RB_CAP_LABEL[r.capacity]}</td>`:''}<td>${rbEsc(o.name)}</td><td>${rbEsc(o.uni_id)}</td><td>${rbEsc(o.nationality)||'—'} — ${rbEsc(o.phone)||'—'}</td></tr>`);
      });
    });
    return `<div class="psub">${title}</div><table class="ptbl"><thead><tr><th>الغرفة</th><th>النوع</th><th>الاسم</th><th>الرقم الجامعي</th><th>الجنسية / الهاتف</th></tr></thead><tbody>${bodyRows.join('')}</tbody></table>`;
  }
  const html = `
    <div class="ph2">
      <img src="/logo.png" class="plogo" alt="شعار الجامعة الأردنية">
      <div class="puni"><div class="ar">الجامعة الأردنية</div><div class="en">The University of Jordan</div><div class="dep">عمادة شؤون الطلبة — Dean of Student Affairs</div></div>
      <div class="pmeta">${rbDate(new Date())}</div>
    </div>
    <div class="ptitle">توزيع الغرف — ${rbEsc(h.name)} — ${rbEsc(RB_CYCLE.activity_name)}</div>
    ${tbl('الذكور', (h.rooms||[]).filter(r=>r.gender==='ذكر'))}
    ${tbl('الإناث', (h.rooms||[]).filter(r=>r.gender==='أنثى'))}`;
  openPrint(html);
}

function rbExportHotelExcel(hotelId) {
  const h = (RB_CYCLE.hotels||[]).find(x=>x.id===hotelId);
  if (!h) return;
  const sheetRows = [];
  (h.rooms||[]).forEach((r,i) => {
    const occ = r.occupants||[];
    if (!occ.length) { sheetRows.push({ 'الجنس': r.gender, 'رقم الغرفة': i+1, 'النوع': RB_CAP_LABEL[r.capacity], 'الاسم':'', 'الرقم الجامعي':'', 'الجنسية':'', 'الهاتف':'' }); return; }
    occ.forEach(o => sheetRows.push({ 'الجنس': r.gender, 'رقم الغرفة': i+1, 'النوع': RB_CAP_LABEL[r.capacity], 'الاسم': o.name, 'الرقم الجامعي': o.uni_id, 'الجنسية': o.nationality||'', 'الهاتف': o.phone||'' }));
  });
  const ws = XLSX.utils.json_to_sheet(sheetRows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'توزيع الغرف');
  XLSX.writeFile(wb, `توزيع_الغرف_${(h.name||'فندق').replace(/[\\/:*?"<>|]/g,'')}_${new Date().toISOString().slice(0,10)}.xlsx`);
}
