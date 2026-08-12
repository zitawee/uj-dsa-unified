// ══════════════════════════════════════════════════════════════
// تعليمات النشاط — نافذة إدارة مرتبطة مباشرة بسجل "أسماء المشاركين"
// (participant_id نفسه، بلا معرّف/رابط مستقل) — Admin فقط، بنفس تقييد
// إرسال البريد الجماعي لأن نشر تعليمة يُرسل بريداً جماعياً أيضاً.
// تُحذف تلقائياً مع حذف طلب النشاط لأنها جزء من نفس سجل المشاركين.
// ══════════════════════════════════════════════════════════════

let IB_PARTICIPANT = null;

function ibEsc(s) { return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function ibDate(d) { if (!d) return ''; try { return new Date(d).toLocaleString('ar-JO', { year:'numeric', month:'long', day:'numeric', hour:'2-digit', minute:'2-digit' }); } catch(e) { return ''; } }

function ibCopyLink(participantId) {
  const link = window.location.origin + '/instructions.html?id=' + participantId;
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(link).then(()=>alert('تم نسخ رابط التعليمات ✓')).catch(()=>prompt('انسخي الرابط يدوياً:', link));
  } else { prompt('انسخي الرابط يدوياً:', link); }
}

async function openInstructionsModal(participantId) {
  const doc = await api('/api/participants/'+participantId);
  if (doc.error) { alert(doc.error); return; }
  IB_PARTICIPANT = doc;
  ibRenderModal();
  if (!window.__ibEscBound) {
    window.__ibEscBound = true;
    document.addEventListener('keydown', e => { if (e.key === 'Escape') document.getElementById('mod-instructions')?.classList.remove('open'); });
  }
}
function ibCloseModal() { document.getElementById('mod-instructions')?.classList.remove('open'); }

function ibRenderModal() {
  const p = IB_PARTICIPANT;
  const posts = (p.instructions||[]).slice().sort((a,b) => new Date(b.posted_at) - new Date(a.posted_at));
  const modal = document.getElementById('mod-instructions');
  modal.querySelector('.modal').innerHTML = `
    <h3>📋 تعليمات النشاط — ${ibEsc(p.activity)}</h3>
    <button class="btn btn-sm" style="margin-bottom:10px" onclick="ibCopyLink('${p.id}')"><i class="ti ti-link"></i> نسخ رابط التعليمات</button>
    <div class="fg"><label>الاطّلاع والتنبيه البريدي يكونان مقابل:</label>
      <div style="display:flex;gap:16px">
        <label style="display:flex;align-items:center;gap:6px;font-weight:400;font-size:13px"><input type="radio" name="ib-vs" value="all" ${p.instructions_verify_source!=='attended'?'checked':''} onchange="ibChangeVerifySource('all')"> كل المسجَّلين</label>
        <label style="display:flex;align-items:center;gap:6px;font-weight:400;font-size:13px"><input type="radio" name="ib-vs" value="attended" ${p.instructions_verify_source==='attended'?'checked':''} onchange="ibChangeVerifySource('attended')"> الحاضرين فقط</label>
      </div>
    </div>
    <div style="font-weight:700;color:var(--g);font-size:12.5px;margin:10px 0 4px">نشر تعليمة جديدة</div>
    <div class="fg"><label>نص التعليمة</label><textarea id="ib-new-text" style="min-height:70px" placeholder="اكتب التعليمة هنا..."></textarea></div>
    <div class="fg"><label>رابط (اختياري)</label><input type="text" id="ib-new-link" placeholder="https://..."></div>
    <button class="btn btn-sm" style="background:var(--g);color:#fff;width:100%" onclick="ibPost('${p.id}')"><i class="ti ti-send"></i> نشر وإرسال تنبيه بريدي</button>
    <div id="ib-post-msg" class="msg"></div>
    <div style="font-weight:700;color:var(--g);font-size:12.5px;margin:14px 0 6px">التعليمات المنشورة (${posts.length})</div>
    <div style="max-height:240px;overflow-y:auto">
      ${posts.length ? posts.map(post => `
        <div style="border:1px solid var(--border);border-radius:var(--r);padding:8px 10px;margin-bottom:6px">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px">
            <div style="flex:1">
              <div style="font-size:10.5px;color:var(--muted);margin-bottom:3px">${ibDate(post.posted_at)}</div>
              <div style="font-size:12.5px;white-space:pre-wrap">${ibEsc(post.text)}</div>
              ${post.link ? `<div style="font-size:11px;color:var(--g);margin-top:3px;word-break:break-all">${ibEsc(post.link)}</div>` : ''}
            </div>
            <div style="white-space:nowrap">
              <button class="btn btn-sm" onclick="ibEditPost('${p.id}','${post.id}')"><i class="ti ti-pencil"></i></button>
              <button class="btn btn-sm" style="color:#c0392b" onclick="ibDeletePost('${p.id}','${post.id}')"><i class="ti ti-trash"></i></button>
            </div>
          </div>
        </div>`).join('') : `<div style="font-size:12px;color:var(--muted)">لا توجد تعليمات منشورة بعد</div>`}
    </div>
    <button class="btn" style="width:100%;margin-top:10px" onclick="ibCloseModal()">إغلاق</button>`;
  modal.classList.add('open');
}

async function ibChangeVerifySource(val) {
  IB_PARTICIPANT.instructions_verify_source = val;
  await api('/api/participants/'+IB_PARTICIPANT.id, 'PUT', { instructions_verify_source: val });
}

async function ibPost(participantId) {
  const text = document.getElementById('ib-new-text').value.trim();
  const link = document.getElementById('ib-new-link').value.trim();
  const msgEl = document.getElementById('ib-post-msg');
  const show = (t, err) => { msgEl.textContent = t; msgEl.className = 'msg ' + (err?'err':'ok'); msgEl.style.display = 'block'; };
  if (!text) { show('يرجى كتابة نص التعليمة', true); return; }
  show('جارٍ النشر والإرسال...');
  const r = await api('/api/participants/'+participantId+'/post-instruction', 'POST', { text, link });
  if (r.error) { show(r.error, true); return; }
  const doc = await api('/api/participants/'+participantId);
  IB_PARTICIPANT = doc;
  ibRenderModal();
  setTimeout(() => { const m = document.getElementById('ib-post-msg'); if (m) { m.textContent = r.message; m.className = 'msg ok'; m.style.display = 'block'; } }, 50);
}

async function ibDeletePost(participantId, postId) {
  if (!confirm('حذف هذه التعليمة نهائياً؟')) return;
  const instructions = (IB_PARTICIPANT.instructions||[]).filter(p => p.id !== postId);
  const r = await api('/api/participants/'+participantId, 'PUT', { instructions });
  if (r.error) { alert(r.error); return; }
  IB_PARTICIPANT.instructions = instructions;
  ibRenderModal();
}

function ibEditPost(participantId, postId) {
  const post = (IB_PARTICIPANT.instructions||[]).find(p => p.id === postId);
  if (!post) return;
  const modal = document.getElementById('mod-instructions');
  modal.querySelector('.modal').innerHTML = `
    <h3>تعديل التعليمة</h3>
    <div class="fg"><label>نص التعليمة</label><textarea id="ib-edit-text" style="min-height:80px">${ibEsc(post.text)}</textarea></div>
    <div class="fg"><label>رابط (اختياري)</label><input type="text" id="ib-edit-link" value="${ibEsc(post.link||'')}"></div>
    <div style="display:flex;gap:8px">
      <button class="btn" style="flex:1;background:var(--g);color:#fff" onclick="ibSaveEditPost('${participantId}','${postId}')"><i class="ti ti-device-floppy"></i> حفظ</button>
      <button class="btn" onclick="ibRenderModal()">رجوع</button>
    </div>`;
}

async function ibSaveEditPost(participantId, postId) {
  const text = document.getElementById('ib-edit-text').value.trim();
  if (!text) { alert('يرجى كتابة نص التعليمة'); return; }
  const link = document.getElementById('ib-edit-link').value.trim();
  const instructions = (IB_PARTICIPANT.instructions||[]).map(p => p.id === postId ? { ...p, text, link } : p);
  const r = await api('/api/participants/'+participantId, 'PUT', { instructions });
  if (r.error) { alert(r.error); return; }
  IB_PARTICIPANT.instructions = instructions;
  ibRenderModal();
}
