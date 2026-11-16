// ══════════════════════════════════════════════════════════════
// ملف الطالب الموحد (admin/editor): بالرقم الجامعي يظهر ما للطالب في الأقسام كلها
// ══════════════════════════════════════════════════════════════
const profEsc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function loadStudentProfile() {
  const panel = document.getElementById('panel-student_profile');
  if (!panel) return;
  panel.innerHTML = `<div class="ph"><div><div class="pt">ملف الطالب الموحد</div><div class="ps">أدخلي الرقم الجامعي ليظهر كل ما للطالب: التفوق الفني والحضور والمشاركات والإنجازات والتقسيط</div></div></div>
  <div class="card" style="display:flex;gap:8px;flex-wrap:wrap">
    <input id="sp-id" type="text" inputmode="numeric" placeholder="الرقم الجامعي" style="flex:1;min-width:180px;padding:9px;border:1px solid var(--border);border-radius:var(--r)" onkeydown="if(event.key==='Enter')spSearch()">
    <button class="btn" style="background:var(--g);color:#fff" onclick="spSearch()"><i class="ti ti-search"></i> بحث</button></div>
  <div id="sp-res"></div>`;
}

async function spSearch(sidArg) {
  const sid = (sidArg || document.getElementById('sp-id').value).trim();
  const box = document.getElementById('sp-res');
  if (!sid) return;
  box.innerHTML = '<div class="card"><div class="center" style="padding:16px">جارٍ البحث...</div></div>';
  const r = await api('/api/student-profile/' + encodeURIComponent(sid));
  if (!r || r.error) { box.innerHTML = `<div class="card"><div class="center">${profEsc((r && r.error) || 'تعذّر التحميل')}</div></div>`; return; }
  const row = (k, v) => v ? `<div style="display:flex;justify-content:space-between;gap:10px;padding:6px 0;border-bottom:1px solid var(--border);font-size:13px"><span style="color:var(--muted)">${k}</span><b style="text-align:left">${profEsc(v)}</b></div>` : '';
  const sec = (t, body) => `<div class="card"><div style="font-weight:700;color:var(--g);margin-bottom:8px">${t}</div>${body}</div>`;
  const t = r.talent, at = r.attendance;
  let html = `<div class="card" style="background:#EAF7EE;border-color:#BFE5CB"><div style="font-size:18px;font-weight:800;color:var(--g)">${profEsc(r.name || 'طالب')}</div><div style="font-size:12.5px;color:var(--muted)">الرقم الجامعي: ${profEsc(r.student_id)}</div></div>`;
  html += sec('🎭 طالب تفوق فني', t ? row('النشاط', t.activity) + row('الكلية', t.college) + row('التخصص', t.major) + row('الجنس', t.gender) + row('سنة الالتحاق', t.excellence_year) + row('الهاتف', t.phone) : '<div style="color:var(--muted);font-size:13px">غير مسجَّل ضمن طلبة التفوق الفني</div>');
  if (t || at.total) {
    html += sec('📅 الحضور (التفوق الفني)', `<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:8px"><div class="card" style="margin:0;padding:8px 14px"><div style="font-size:11px;color:var(--muted)">زيارات هذا الشهر (${profEsc(at.month)})</div><div style="font-size:20px;font-weight:800;color:var(--g)">${at.this_month}</div></div><div class="card" style="margin:0;padding:8px 14px"><div style="font-size:11px;color:var(--muted)">إجمالي الزيارات</div><div style="font-size:20px;font-weight:800">${at.total}</div></div></div>
      ${at.recent.length ? `<div class="tw"><table><thead><tr><th>اليوم</th><th>التاريخ</th><th>الوقت</th></tr></thead><tbody>${at.recent.map(v => `<tr><td>${profEsc(v.day)}</td><td>${profEsc(v.date)}</td><td>${profEsc(v.time)}</td></tr>`).join('')}</tbody></table></div><div style="font-size:11px;color:var(--muted);margin-top:4px">آخر ${at.recent.length} زيارات</div>` : '<div style="color:var(--muted);font-size:13px">لا زيارات مسجَّلة</div>'}
      ${r.excuses.length ? `<div style="margin-top:8px;font-size:12.5px"><b>الأعذار:</b> ${r.excuses.map(e => `${profEsc(e.type)} (${profEsc(e.from)} → ${profEsc(e.to)})`).join('، ')}</div>` : ''}`);
  }
  html += sec(`📋 المشاركة في الأنشطة (${r.participations.length})`, r.participations.length ? `<div class="tw"><table><thead><tr><th>النشاط</th><th>التاريخ</th><th>الجهة</th><th>الحضور</th></tr></thead><tbody>${r.participations.map(p => `<tr><td>${profEsc(p.activity)}</td><td>${profEsc(p.date)}</td><td>${profEsc(p.organizer)}</td><td>${p.attended ? '✅ حاضر' : '—'}</td></tr>`).join('')}</tbody></table></div>` : '<div style="color:var(--muted);font-size:13px">لا مشاركات في كشوف الأنشطة</div>');
  html += sec(`🏆 الإنجازات والتكريم (${r.achievements.length})`, r.achievements.length ? `<div class="tw"><table><thead><tr><th>الإنجاز</th><th>التاريخ</th><th>النشاط</th><th>تكريم</th></tr></thead><tbody>${r.achievements.map(a => `<tr><td>${profEsc(a.work)}</td><td>${profEsc(a.date)}</td><td>${profEsc(a.activity)}</td><td>${a.honor ? '⭐ ' + profEsc(a.honor_reason) : '—'}</td></tr>`).join('')}</tbody></table></div>` : '<div style="color:var(--muted);font-size:13px">لا إنجازات مسجَّلة</div>');
  html += sec('💳 تقسيط الرسوم', r.installment ? row('الحالة', 'مدرج ضمن قائمة التقسيط') + row('الرقم التسلسلي', r.installment.serial_number) + row('الكلية', r.installment.college) : '<div style="color:var(--muted);font-size:13px">غير مدرج ضمن قائمة التقسيط</div>');
  box.innerHTML = html;
}

// ── بطاقة اللوحة الرئيسية: حضور التفوق الفني هذا الشهر ──
async function attDashCard() {
  const panel = document.getElementById('panel-dash'); if (!panel || document.getElementById('att-dash-card')) return;
  const month = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Amman' }).slice(0, 7);
  const [rep, today] = await Promise.all([api('/api/talent-attendance/report?month=' + month), api('/api/talent-attendance/today')]);
  if (!rep || !rep.summary || !today || !today.visits) return;
  const s = rep.summary;
  const div = document.createElement('div'); div.id = 'att-dash-card'; div.className = 'card';
  div.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:8px"><div style="font-weight:700;color:var(--g)">🎭 حضور طلبة التفوق الفني — ${profEsc(month)}</div><button class="btn btn-sm" onclick="ATT_TAB='report';go('talent_attendance')">فتح التقرير</button></div>
    <div style="display:flex;gap:8px;flex-wrap:wrap">${[['زيارات اليوم', today.visits.length, 'var(--g)'], ['مستوفون', s.met, '#1B6B3A'], ['غير مستوفين', s.not_met, '#c0392b'], ['معذورون', s.excused, '#7A3E8E'], ['إجمالي الزيارات', s.visits, '#333']].map(([t, v, c]) => `<div style="background:#f8faf8;border:1px solid var(--border);border-radius:8px;padding:8px 14px;min-width:100px"><div style="font-size:11px;color:var(--muted)">${t}</div><div style="font-size:20px;font-weight:800;color:${c}">${v}</div></div>`).join('')}</div>`;
  panel.insertBefore(div, panel.firstChild.nextSibling || null);
}
