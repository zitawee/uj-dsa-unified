// ══════════════════════════════════════════════════════════════
// الأمان والنسخ الاحتياطي (admin فقط): نسخة احتياطية كاملة + سجل العمليات
// ══════════════════════════════════════════════════════════════
const secEsc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

async function loadSecurity() {
  const panel = document.getElementById('panel-security');
  if (!panel) return;
  panel.innerHTML = `<div class="ph"><div><div class="pt">الأمان والنسخ الاحتياطي</div><div class="ps">نسخة احتياطية كاملة لبيانات النظام، وسجل بالعمليات التي أُجريت</div></div></div>
  <div class="card" id="sec-backup"><div class="center" style="padding:16px">جارٍ التحميل...</div></div>
  <div class="card"><div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:8px">
    <b>سجل العمليات</b>
    <input id="sec-q" type="text" placeholder="بحث باسم المستخدم أو العملية..." style="flex:1;min-width:180px;padding:7px;border:1px solid var(--border);border-radius:var(--r)" onkeydown="if(event.key==='Enter')secLoadAudit()">
    <button class="btn btn-sm" onclick="secLoadAudit()"><i class="ti ti-refresh"></i> تحديث</button></div>
    <div class="tw" style="max-height:60vh;overflow:auto"><table><thead><tr><th>الوقت</th><th>المستخدم</th><th>الدور</th><th>العملية</th><th>العنوان</th></tr></thead><tbody id="sec-audit"><tr><td colspan="5" class="center">جارٍ التحميل...</td></tr></tbody></table></div></div>`;
  secLoadBackup(); secLoadAudit();
}

async function secLoadBackup() {
  const box = document.getElementById('sec-backup'); if (!box) return;
  const r = await api('/api/admin/backup-info');
  if (!r || r.error) { box.innerHTML = `<div class="center">${secEsc((r && r.error) || 'تعذّر التحميل')}</div>`; return; }
  const last = r.last_backup_at ? new Date(r.last_backup_at).toLocaleString('ar-JO', { dateStyle: 'medium', timeStyle: 'short' }) : 'لم تُنزَّل نسخة بعد';
  const days = r.last_backup_at ? Math.floor((Date.now() - new Date(r.last_backup_at)) / 86400000) : null;
  const warn = days === null || days > 7;
  const total = r.collections.reduce((n, c) => n + c.count, 0);
  box.innerHTML = `<div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:8px">
      <b>💾 النسخة الاحتياطية</b>
      <button class="btn btn-sm" style="background:var(--g);color:#fff" id="sec-bk-btn" onclick="secDownloadBackup()"><i class="ti ti-download"></i> تنزيل نسخة احتياطية كاملة</button></div>
    <div style="font-size:12.5px;padding:8px 10px;border-radius:8px;${warn ? 'background:#FFF4E5;border:1px solid #F5D8A8;color:#7A4B00' : 'background:#EAF7EE;border:1px solid #BFE5CB;color:#1B6B3A'}">
      آخر نسخة: <b>${secEsc(last)}</b>${r.last_backup_by ? ' — بواسطة ' + secEsc(r.last_backup_by) : ''}${warn ? ' — يُنصح بتنزيل نسخة أسبوعياً على الأقل' : ''}</div>
    <div style="font-size:11.5px;color:var(--muted);margin:8px 0">الملف يحتوي كل بيانات النظام (${total} سجل في ${r.collections.length} مجموعة) بما فيها بيانات الطلبة وحسابات المستخدمين (كلمات المرور مشفَّرة). احفظه في مكان آمن ولا ترسله عبر واتساب أو البريد.</div>
    <details style="font-size:12px"><summary style="cursor:pointer">تفاصيل المجموعات</summary><div style="margin-top:6px;columns:2">${r.collections.map(c => `<div>${secEsc(c.name)}: <b>${c.count}</b></div>`).join('')}</div></details>`;
}

async function secDownloadBackup() {
  const btn = document.getElementById('sec-bk-btn'); btn.disabled = true; btn.textContent = 'جارٍ إعداد النسخة...';
  try {
    const res = await fetch('/api/admin/backup', { headers: { Authorization: 'Bearer ' + (TOKEN || '') } });
    if (!res.ok) { let m = 'تعذّر إعداد النسخة'; try { m = (await res.json()).error || m; } catch (e) {} alert(m); return; }
    const blob = await res.blob();
    const cd = res.headers.get('Content-Disposition') || '';
    const name = (cd.match(/filename="([^"]+)"/) || [])[1] || 'ju-dsa-backup.json';
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove();
  } catch (e) { alert('تعذّر تنزيل النسخة. تحقّق من الاتصال وأعد المحاولة.'); }
  finally { secLoadBackup(); secLoadAudit(); }
}

async function secLoadAudit() {
  const tb = document.getElementById('sec-audit'); if (!tb) return;
  const q = (document.getElementById('sec-q') || {}).value || '';
  const r = await api('/api/admin/audit-log?limit=300' + (q ? '&q=' + encodeURIComponent(q) : ''));
  if (!Array.isArray(r)) { tb.innerHTML = '<tr><td colspan="5" class="center">تعذّر التحميل</td></tr>'; return; }
  tb.innerHTML = r.length ? r.map(x => `<tr><td style="white-space:nowrap;font-size:12px">${secEsc(new Date(x.at).toLocaleString('ar-JO', { dateStyle: 'short', timeStyle: 'short' }))}</td><td>${secEsc(x.user)}</td><td style="font-size:11px">${secEsc(x.role)}</td><td style="direction:ltr;text-align:right;font-size:12px">${secEsc(x.action)}</td><td style="font-size:11px;color:var(--muted)">${secEsc(x.ip)}</td></tr>`).join('') : '<tr><td colspan="5" class="center">لا توجد عمليات مسجَّلة</td></tr>';
}
