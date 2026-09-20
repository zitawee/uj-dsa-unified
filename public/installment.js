// ══════════════════════════════════════════════════════════════
// نظام تقسيط الرسوم الجامعية — إدارة قائمة الطلبة المقبولين بالتقسيط (admin فقط)
// القائمة تصل من الشؤون المالية بأرقام جامعية وكليات، وتُلصَق هنا دفعة واحدة.
// الطالب يستعلم عن اسمه بنفسه من صفحة عامة منفصلة /installment.html بلا تسجيل دخول.
// ══════════════════════════════════════════════════════════════

let IN_LIST = [];

function inEsc(s) { return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

async function loadInstallmentPlan() {
  const panel = document.getElementById('panel-installment_plan');
  if (!panel) return;
  panel.innerHTML = `<div class="ph"><div><div class="pt">نظام تقسيط الرسوم الجامعية</div><div class="ps">إدارة قائمة الطلبة المقبولين بنظام التقسيط</div></div></div>
    <div class="card"><div class="center" style="padding:24px">جارٍ التحميل...</div></div>`;
  const r = await api('/api/installment_plan');
  if (!Array.isArray(r)) { panel.innerHTML = `<div class="card"><div class="center">تعذّر تحميل البيانات</div></div>`; return; }
  IN_LIST = r;
  inRender();
}

function inRender(filter = '') {
  const panel = document.getElementById('panel-installment_plan');
  const q = filter.trim();
  const rows = q ? IN_LIST.filter(r => String(r.university_id).includes(q) || (r.name||'').includes(q) || (r.college||'').includes(q)) : IN_LIST;
  panel.innerHTML = `
  <div class="ph"><div><div class="pt">نظام تقسيط الرسوم الجامعية</div><div class="ps">${IN_LIST.length} طالب/ة مدرَجون ضمن قائمة التقسيط — صفحة الاستعلام العامة: <a href="/installment.html" target="_blank">installment.html</a></div></div></div>
  <div class="card" style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
    <button class="btn btn-sm" style="background:var(--g);color:#fff" onclick="inOpenBulk()"><i class="ti ti-clipboard-plus"></i> لصق/تحديث القائمة</button>
    <button class="btn btn-sm" style="color:#c0392b" onclick="inClearAll()"><i class="ti ti-trash"></i> حذف كامل القائمة</button>
    <input id="in-search" type="text" placeholder="بحث برقم جامعي / اسم / كلية..." style="flex:1;min-width:200px;padding:8px;border:1px solid var(--border);border-radius:var(--r)" oninput="inRender(this.value)" value="${inEsc(q)}">
  </div>
  <div class="card">
    <div class="tw"><table>
      <thead><tr><th>#</th><th>الرقم الجامعي</th><th>الاسم</th><th>الكلية</th><th></th></tr></thead>
      <tbody>${rows.length ? rows.map((r,i) => `<tr>
          <td>${i+1}</td><td style="font-weight:700">${inEsc(r.university_id)}</td><td>${inEsc(r.name||'-')}</td><td>${inEsc(r.college||'-')}</td>
          <td><button class="btn btn-sm" style="color:#c0392b" onclick="inDeleteOne('${r.id}','${inEsc(r.university_id)}')"><i class="ti ti-trash"></i> حذف</button></td>
        </tr>`).join('') : `<tr><td colspan="5" class="center">${q ? 'لا توجد نتائج مطابقة' : 'لا توجد بيانات بعد — استخدمي زر "لصق/تحديث القائمة" لإضافة الطلبة'}</td></tr>`}</tbody>
    </table></div>
  </div>`;
}

function inOpenBulk() {
  const modal = document.getElementById('mod-installment');
  if (!modal) { alert('تعذّر فتح النافذة'); return; }
  modal.querySelector('.modal').innerHTML = `
    <h3>لصق/تحديث قائمة الطلبة المقبولين بالتقسيط</h3>
    <p style="font-size:12px;color:var(--muted);line-height:1.8;margin-bottom:10px">
      الصقي القائمة سطراً لكل طالب/ة، بالترتيب: <b>الرقم الجامعي</b> ثم <b>الاسم</b> (اختياري) ثم <b>الكلية</b> (اختياري) —
      يمكن الفصل بينها بفاصلة أو Tab (كما هو الحال عند اللصق من Excel مباشرة). مثال:<br>
      <code style="background:#f4f6f4;padding:2px 5px;border-radius:4px;display:inline-block;margin-top:4px">2021123456, أحمد محمد علي, كلية العلوم</code>
    </p>
    <div class="fg" style="margin-bottom:10px"><textarea id="in-bulk-text" rows="10" style="width:100%;padding:8px;border:1px solid var(--border);border-radius:var(--r);font-family:inherit;resize:vertical" placeholder="2021123456, أحمد محمد علي, كلية العلوم&#10;2020987654, سارة خالد, كلية الآداب"></textarea></div>
    <div class="fg" style="margin-bottom:12px">
      <label style="display:flex;align-items:center;gap:6px;font-weight:400;cursor:pointer"><input type="radio" name="in-mode" value="replace" checked> استبدال القائمة الحالية بالكامل بهذه القائمة</label>
      <label style="display:flex;align-items:center;gap:6px;font-weight:400;cursor:pointer;margin-top:4px"><input type="radio" name="in-mode" value="append"> إضافة/تحديث فوق القائمة الحالية (دون حذف الموجود)</label>
    </div>
    <div id="in-bulk-msg" class="msg"></div>
    <div style="display:flex;gap:8px">
      <button class="btn" style="flex:1;background:var(--g);color:#fff" onclick="inSaveBulk()"><i class="ti ti-device-floppy"></i> حفظ</button>
      <button class="btn" onclick="inCloseModal()">إغلاق</button>
    </div>`;
  modal.classList.add('open');
  if (!window.__inEscBound) {
    window.__inEscBound = true;
    document.addEventListener('keydown', e => { if (e.key === 'Escape') inCloseModal(); });
  }
}

function inCloseModal() { document.getElementById('mod-installment')?.classList.remove('open'); }

async function inSaveBulk() {
  const text = document.getElementById('in-bulk-text').value;
  const mode = document.querySelector('input[name="in-mode"]:checked')?.value || 'replace';
  const msg = document.getElementById('in-bulk-msg');
  if (!text.trim()) { msg.textContent = 'يرجى لصق القائمة أولاً'; msg.className = 'msg err'; return; }
  const r = await api('/api/installment_plan/bulk', 'POST', { text, mode });
  if (r.error) { msg.textContent = r.error; msg.className = 'msg err'; return; }
  inCloseModal();
  await loadInstallmentPlan();
  showMsg && showMsg('in-toast', r.message || 'تم الحفظ');
}

async function inDeleteOne(id, sid) {
  if (!confirm(`حذف الطالب صاحب الرقم الجامعي ${sid} من قائمة التقسيط؟`)) return;
  const r = await api('/api/installment_plan/' + id, 'DELETE');
  if (r.error) { alert(r.error); return; }
  await loadInstallmentPlan();
}

async function inClearAll() {
  if (!IN_LIST.length) return;
  if (!confirm(`سيتم حذف كامل قائمة التقسيط (${IN_LIST.length} طالب/ة). هل أنتِ متأكدة؟`)) return;
  const r = await api('/api/installment_plan', 'DELETE');
  if (r.error) { alert(r.error); return; }
  await loadInstallmentPlan();
}
