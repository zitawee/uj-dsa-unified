// ══════════════════════════════════════════
// مرفقات محلية (تُخزَّن داخل متصفح هذا الجهاز فقط عبر IndexedDB)
// لا تُرفع لأي خادم أو خدمة سحابية، ولا تظهر لأي مستخدم آخر أو من جهاز آخر
// ══════════════════════════════════════════

const LA_TABLES = ['governance','student_honors','staff_innovation','staff_honors','community_svc'];
const LA_DB_NAME = 'dsa_local_attachments_v1';
const LA_STORE = 'files';

function laOpenDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(LA_DB_NAME, 1);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(LA_STORE)) {
        const store = db.createObjectStore(LA_STORE, { keyPath: 'fid', autoIncrement: true });
        store.createIndex('recKey', 'recKey', { unique: false });
      }
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = (e) => reject(e.target.error);
  });
}

async function laAddFiles(table, id, fileList) {
  const db = await laOpenDB();
  const recKey = table + '|' + id;
  return new Promise((resolve, reject) => {
    const tx = db.transaction(LA_STORE, 'readwrite');
    const store = tx.objectStore(LA_STORE);
    Array.from(fileList).forEach((file) => {
      store.add({
        recKey, table, recordId: String(id),
        name: file.name, type: file.type, size: file.size,
        addedAt: Date.now(), file
      });
    });
    tx.oncomplete = () => resolve(true);
    tx.onerror = (e) => reject(e.target.error);
  });
}

async function laGetFiles(table, id) {
  const db = await laOpenDB();
  const recKey = table + '|' + id;
  return new Promise((resolve, reject) => {
    const tx = db.transaction(LA_STORE, 'readonly');
    const idx = tx.objectStore(LA_STORE).index('recKey');
    const req = idx.getAll(recKey);
    req.onsuccess = () => resolve((req.result || []).sort((a, b) => b.addedAt - a.addedAt));
    req.onerror = (e) => reject(e.target.error);
  });
}

async function laCountFiles(table, id) {
  try { const rows = await laGetFiles(table, id); return rows.length; }
  catch { return 0; }
}

async function laDeleteFile(fid) {
  const db = await laOpenDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(LA_STORE, 'readwrite');
    tx.objectStore(LA_STORE).delete(fid);
    tx.oncomplete = () => resolve(true);
    tx.onerror = (e) => reject(e.target.error);
  });
}

function laEsc(s) { return String(s || '').replace(/'/g, "\\'").replace(/"/g, '&quot;'); }

function laLabel(r) {
  return r.name || r.title || r.committee || r.student_name || r.activity_name || r.reason || r.service_type || r.committee_name || '';
}

function laFmtSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1024 / 1024).toFixed(1) + ' MB';
}

function laFmtDate(ts) {
  const d = new Date(ts);
  return d.toLocaleDateString('ar-EG') + ' ' + d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
}

function laUpdateBadge(table, id, count) {
  const b = document.getElementById(`la-badge-${table}-${id}`);
  if (b) b.textContent = count > 0 ? `📎 مرفقات محلية (${count})` : '📎 إرفاق محلي';
}

async function laRefreshBadges(table, ids) {
  for (const id of ids) {
    const n = await laCountFiles(table, id);
    laUpdateBadge(table, id, n);
  }
}

async function openLocalAttachModal(table, id, label) {
  const existing = document.getElementById('la-modal'); if (existing) existing.remove();
  const modal = document.createElement('div');
  modal.id = 'la-modal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;z-index:2000';
  modal.innerHTML = `
  <div style="background:#fff;border-radius:12px;padding:22px;width:90%;max-width:560px;max-height:82vh;display:flex;flex-direction:column;box-shadow:0 20px 60px rgba(0,0,0,.3)">
    <div style="font-size:15px;font-weight:600;color:var(--g);margin-bottom:8px;display:flex;justify-content:space-between;align-items:center">
      <span>📎 مرفقات محلية (على هذا الجهاز فقط)</span>
      <button onclick="document.getElementById('la-modal').remove()" style="background:none;border:none;font-size:18px;cursor:pointer;color:var(--muted)">✕</button>
    </div>
    <div style="font-size:12px;color:var(--muted);margin-bottom:10px">السجل: <strong style="color:var(--g)">${label || ''}</strong></div>
    <div style="font-size:11px;background:#FFF8E1;border:1px solid #F0D98A;color:#8B6914;border-radius:var(--r);padding:8px 10px;margin-bottom:10px;line-height:1.6">
      ⚠️ هذه المرفقات تُخزَّن داخل متصفح هذا الجهاز فقط، ولن تظهر لأي مستخدم آخر أو من جهاز/متصفح آخر، ولن تُرفع إلى الخادم أو الإنترنت.
      مسح بيانات التصفح (الكاش/سجلّ التصفح) من إعدادات المتصفح سيؤدي إلى حذفها نهائياً.
    </div>
    <input type="file" id="la-file-input" multiple style="margin-bottom:10px;font-size:12px">
    <div id="la-list" style="flex:1;overflow-y:auto;border:1px solid var(--border);border-radius:var(--r);min-height:60px">جارٍ التحميل...</div>
    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px">
      <button class="btn" onclick="document.getElementById('la-modal').remove()">إغلاق</button>
    </div>
  </div>`;
  document.body.appendChild(modal);

  document.getElementById('la-file-input').addEventListener('change', async (e) => {
    if (!e.target.files.length) return;
    await laAddFiles(table, id, e.target.files);
    e.target.value = '';
    renderLaList(table, id, label);
  });

  renderLaList(table, id, label);
}

async function renderLaList(table, id, label) {
  const listEl = document.getElementById('la-list'); if (!listEl) return;
  const files = await laGetFiles(table, id);
  listEl.innerHTML = !files.length
    ? '<div style="text-align:center;padding:20px;color:var(--muted);font-size:12px">لا توجد مرفقات محلية بعد</div>'
    : files.map(f => `
    <div style="padding:9px 12px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;gap:8px">
      <div style="min-width:0;cursor:pointer" onclick="laOpenFile(${f.fid})" title="فتح الملف في نافذة جديدة">
        <div style="font-weight:600;font-size:12.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#1B5E9A;text-decoration:underline">${f.name}</div>
        <div style="font-size:10.5px;color:var(--muted)">${laFmtSize(f.size)} — ${laFmtDate(f.addedAt)}</div>
      </div>
      <div style="display:flex;gap:6px;flex-shrink:0">
        <button class="btn btn-sm btn-b" onclick="laDownload(${f.fid})">⬇️ تنزيل</button>
        <button class="btn btn-sm btn-r" onclick="laRemove(${f.fid},'${table}','${id}','${laEsc(label)}')">🗑</button>
      </div>
    </div>`).join('');
  laUpdateBadge(table, id, files.length);
}

async function laOpenFile(fid) {
  const db = await laOpenDB();
  const tx = db.transaction(LA_STORE, 'readonly');
  const req = tx.objectStore(LA_STORE).get(fid);
  req.onsuccess = () => {
    const rec = req.result; if (!rec) return;
    const url = URL.createObjectURL(rec.file);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  };
}

async function laDownload(fid) {
  const db = await laOpenDB();
  const tx = db.transaction(LA_STORE, 'readonly');
  const req = tx.objectStore(LA_STORE).get(fid);
  req.onsuccess = () => {
    const rec = req.result; if (!rec) return;
    const url = URL.createObjectURL(rec.file);
    const a = document.createElement('a'); a.href = url; a.download = rec.name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 3000);
  };
}

async function laRemove(fid, table, id, label) {
  if (!confirm('حذف هذا المرفق المحلي نهائياً؟ لا يمكن التراجع.')) return;
  await laDeleteFile(fid);
  renderLaList(table, id, label);
}
