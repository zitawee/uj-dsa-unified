// ══════════════════════════════════════════════════════════════
// لوحة تعليمات النشاط — لوحة الإدارة (admin/editor)
// وحدة مستقلة، تعليمات باتجاه واحد فقط (الإدارة → الطلبة)، مع تنبيه
// بريدي فوري تلقائي عبر Brevo عند نشر أي تعليمة جديدة
// ══════════════════════════════════════════════════════════════

let IB_BOARDS = [];
let IB_BOARD = null; // اللوحة المفتوحة حالياً، أو null لعرض القائمة الرئيسية

function ibEsc(s) { return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function ibDate(d) { if (!d) return ''; try { return new Date(d).toLocaleString('ar-JO', { year:'numeric', month:'long', day:'numeric', hour:'2-digit', minute:'2-digit' }); } catch(e) { return ''; } }

async function loadInstructions() {
  const panel = document.getElementById('panel-activity_instructions');
  if (!panel) return;
  panel.innerHTML = `<div class="ph"><div><div class="pt">تعليمات النشاط</div><div class="ps">لوحة تعليمات باتجاه واحد لكل نشاط، مع تنبيه بريدي فوري عند كل نشر</div></div></div>
    <div class="card"><div class="center" style="padding:24px">جارٍ التحميل...</div></div>`;
  const boards = await api('/api/activity_instructions');
  if (!Array.isArray(boards)) { panel.innerHTML = `<div class="card"><div class="center">تعذّر تحميل البيانات</div></div>`; return; }
  IB_BOARDS = boards;
  IB_BOARD = null;
  ibRenderList();
}

function ibRenderList() {
  const panel = document.getElementById('panel-activity_instructions');
  panel.innerHTML = `
  <div class="ph"><div><div class="pt">تعليمات النشاط</div><div class="ps">لوحة تعليمات باتجاه واحد لكل نشاط، مع تنبيه بريدي فوري عند كل نشر</div></div></div>
  <div class="card"><button class="btn btn-sm" style="background:var(--g);color:#fff" onclick="ibOpenNewBoard()"><i class="ti ti-plus"></i> إنشاء لوحة تعليمات جديدة</button></div>
  <div class="card">
    <div class="tw"><table>
      <thead><tr><th>#</th><th>النشاط</th><th>عدد التعليمات</th><th>تاريخ الإنشاء</th><th>إجراءات</th></tr></thead>
      <tbody>${IB_BOARDS.length ? IB_BOARDS.map((b,i)=>`
        <tr>
          <td>${i+1}</td>
          <td>${ibEsc(b.activity_name)}</td>
          <td>${(b.posts||[]).length}</td>
          <td>${ibDate(b.createdAt)}</td>
          <td style="white-space:nowrap">
            <button class="btn btn-sm" onclick="ibOpenBoard('${b.id}')"><i class="ti ti-eye"></i> فتح</button>
            <button class="btn btn-sm" onclick="ibCopyLink('${b.id}')"><i class="ti ti-link"></i> نسخ الرابط</button>
            <button class="btn btn-sm" style="color:#c0392b" onclick="ibDeleteBoard('${b.id}')"><i class="ti ti-trash"></i></button>
          </td>
        </tr>`).join('') : `<tr><td colspan="5" class="center">لا توجد لوحات تعليمات بعد</td></tr>`}
      </tbody>
    </table></div>
  </div>
  <div class="modal-ov" id="ib-modal" onclick="if(event.target===this) ibCloseModal()"><div class="modal" style="max-width:560px;max-height:88vh;overflow-y:auto" id="ib-modal-body"></div></div>`;

  if (!window.__ibEscBound) {
    window.__ibEscBound = true;
    document.addEventListener('keydown', e => { if (e.key === 'Escape') ibCloseModal(); });
  }
}
function ibCloseModal() { document.getElementById('ib-modal')?.classList.remove('open'); }

function ibCopyLink(id) {
  const link = window.location.origin + '/instructions.html?board=' + id;
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(link).then(()=>alert('تم نسخ الرابط ✓')).catch(()=>prompt('انسخي الرابط يدوياً:', link));
  } else { prompt('انسخي الرابط يدوياً:', link); }
}

async function ibOpenNewBoard() {
  const parts = await api('/api/participants');
  const list = Array.isArray(parts) ? parts : [];
  document.getElementById('ib-modal-body').innerHTML = `
    <h3>إنشاء لوحة تعليمات جديدة</h3>
    <div class="fg"><label>اختر النشاط (من قائمة أسماء المشاركين)</label>
      <select id="ib-new-act">
        <option value="">اختر...</option>
        ${list.map(p => `<option value="${p.id}">${ibEsc(p.activity)} — ${ibEsc(p.date||'')} (${(p.students||[]).length} مشارك، ${(p.students||[]).filter(s=>s.attended).length} حاضر)</option>`).join('')}
      </select>
    </div>
    <div class="fg"><label>التنبيه البريدي والاطّلاع يكونان مقابل:</label>
      <div style="display:flex;gap:16px;margin-top:4px">
        <label style="display:flex;align-items:center;gap:6px;font-weight:400;font-size:13px"><input type="radio" name="ib-vs" value="all" checked> كل المشاركين المسجَّلين</label>
        <label style="display:flex;align-items:center;gap:6px;font-weight:400;font-size:13px"><input type="radio" name="ib-vs" value="attended"> الحاضرين فقط</label>
      </div>
    </div>
    <div style="display:flex;gap:8px">
      <button class="btn" style="flex:1;background:var(--g);color:#fff" onclick="ibCreateBoard()"><i class="ti ti-plus"></i> إنشاء</button>
      <button class="btn" onclick="ibCloseModal()">إغلاق</button>
    </div>`;
  document.getElementById('ib-modal').classList.add('open');
}

async function ibCreateBoard() {
  const sel = document.getElementById('ib-new-act');
  const activity_id = sel.value;
  if (!activity_id) { alert('يرجى اختيار النشاط'); return; }
  const activity_name = sel.options[sel.selectedIndex].textContent.split(' — ')[0];
  const verify_source = document.querySelector('input[name="ib-vs"]:checked').value;
  const r = await api('/api/activity_instructions', 'POST', { activity_id, activity_name, verify_source });
  if (r.error) { alert(r.error); return; }
  ibCloseModal();
  await loadInstructions();
  ibOpenBoard(r.id);
}

async function ibDeleteBoard(id) {
  if (!confirm('حذف لوحة التعليمات هذه بكل ما نُشر عليها؟ لا يمكن التراجع.')) return;
  const r = await api('/api/activity_instructions/'+id, 'DELETE');
  if (r.error) { alert(r.error); return; }
  loadInstructions();
}

async function ibOpenBoard(id) {
  const b = await api('/api/activity_instructions/'+id);
  if (b.error) { alert(b.error); return; }
  IB_BOARD = b;
  ibRenderBoard();
}
function ibBackToList() { IB_BOARD = null; ibRenderList(); }

function ibRenderBoard() {
  const panel = document.getElementById('panel-activity_instructions');
  const b = IB_BOARD;
  const posts = (b.posts||[]).slice().sort((x,y) => new Date(y.posted_at) - new Date(x.posted_at));
  panel.innerHTML = `
  <div class="ph"><div><div class="pt">${ibEsc(b.activity_name)}</div><div class="ps">لوحة التعليمات — ${posts.length} تعليمة منشورة</div></div></div>
  <div class="card">
    <button class="btn btn-sm" onclick="ibBackToList()"><i class="ti ti-arrow-right"></i> كل اللوحات</button>
    <button class="btn btn-sm" onclick="ibCopyLink('${b.id}')"><i class="ti ti-link"></i> نسخ رابط اللوحة</button>
  </div>
  <div class="card">
    <div style="font-weight:700;color:var(--g);font-size:12.5px;margin-bottom:6px">نشر تعليمة جديدة</div>
    <div class="fg"><label>نص التعليمة</label><textarea id="ib-new-text" style="min-height:80px" placeholder="اكتب التعليمة هنا..."></textarea></div>
    <div class="fg"><label>رابط (اختياري)</label><input type="text" id="ib-new-link" placeholder="https://..."></div>
    <button class="btn btn-sm" style="background:var(--g);color:#fff" onclick="ibPost('${b.id}')"><i class="ti ti-send"></i> نشر وإرسال تنبيه بريدي</button>
    <div id="ib-post-msg" class="msg"></div>
  </div>
  <div class="card">
    ${posts.length ? posts.map(p => `
      <div style="border:1px solid var(--border);border-radius:var(--r);padding:10px 12px;margin-bottom:8px">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px">
          <div style="flex:1">
            <div style="font-size:11px;color:var(--muted);margin-bottom:4px">${ibDate(p.posted_at)}</div>
            <div style="font-size:13px;white-space:pre-wrap">${ibEsc(p.text)}</div>
            ${p.link ? `<div style="font-size:11.5px;color:var(--g);margin-top:4px;word-break:break-all">${ibEsc(p.link)}</div>` : ''}
          </div>
          <div style="white-space:nowrap">
            <button class="btn btn-sm" onclick="ibEditPost('${b.id}','${p.id}')"><i class="ti ti-pencil"></i></button>
            <button class="btn btn-sm" style="color:#c0392b" onclick="ibDeletePost('${b.id}','${p.id}')"><i class="ti ti-trash"></i></button>
          </div>
        </div>
      </div>`).join('') : `<div class="center">لا توجد تعليمات منشورة بعد</div>`}
  </div>`;
}

async function ibPost(boardId) {
  const text = document.getElementById('ib-new-text').value.trim();
  const link = document.getElementById('ib-new-link').value.trim();
  const msgEl = document.getElementById('ib-post-msg');
  const show = (t, err) => { msgEl.textContent = t; msgEl.className = 'msg ' + (err?'err':'ok'); msgEl.style.display = 'block'; };
  if (!text) { show('يرجى كتابة نص التعليمة', true); return; }
  show('جارٍ النشر والإرسال...');
  const r = await api('/api/activity_instructions/'+boardId+'/post', 'POST', { text, link });
  if (r.error) { show(r.error, true); return; }
  await ibOpenBoard(boardId);
  setTimeout(() => { const m = document.getElementById('ib-post-msg'); if (m) { m.textContent = r.message; m.className = 'msg ok'; m.style.display = 'block'; } }, 50);
}

async function ibDeletePost(boardId, postId) {
  if (!confirm('حذف هذه التعليمة نهائياً؟')) return;
  const posts = (IB_BOARD.posts||[]).filter(p => p.id !== postId);
  const r = await api('/api/activity_instructions/'+boardId, 'PUT', { posts });
  if (r.error) { alert(r.error); return; }
  IB_BOARD.posts = posts;
  ibRenderBoard();
}

function ibEditPost(boardId, postId) {
  const p = (IB_BOARD.posts||[]).find(x => x.id === postId);
  if (!p) return;
  document.getElementById('ib-modal-body').innerHTML = `
    <h3>تعديل التعليمة</h3>
    <div class="fg"><label>نص التعليمة</label><textarea id="ib-edit-text" style="min-height:80px">${ibEsc(p.text)}</textarea></div>
    <div class="fg"><label>رابط (اختياري)</label><input type="text" id="ib-edit-link" value="${ibEsc(p.link||'')}"></div>
    <div style="display:flex;gap:8px">
      <button class="btn" style="flex:1;background:var(--g);color:#fff" onclick="ibSaveEditPost('${boardId}','${postId}')"><i class="ti ti-device-floppy"></i> حفظ</button>
      <button class="btn" onclick="ibCloseModal()">إغلاق</button>
    </div>`;
  document.getElementById('ib-modal').classList.add('open');
}

async function ibSaveEditPost(boardId, postId) {
  const text = document.getElementById('ib-edit-text').value.trim();
  if (!text) { alert('يرجى كتابة نص التعليمة'); return; }
  const link = document.getElementById('ib-edit-link').value.trim();
  const posts = (IB_BOARD.posts||[]).map(p => p.id === postId ? { ...p, text, link } : p);
  const r = await api('/api/activity_instructions/'+boardId, 'PUT', { posts });
  if (r.error) { alert(r.error); return; }
  IB_BOARD.posts = posts;
  ibCloseModal();
  ibRenderBoard();
}
