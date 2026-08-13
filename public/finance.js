// ══════════════════════════════════════════════════════════════
// النظام المالي لرسوم الأنشطة — Admin فقط
// توثيق تحصيل نقدي/CliQ يدوي (وليس بوابة دفع فعلية)، مرتبط مباشرة
// بسجل "أسماء المشاركين" لكل نشاط. يدعم سند قبض واحد يشمل عدة طلبة
// معاً (دفع شخص عن زملائه المسجَّلين بالفعل)، برقم تسلسلي عام واحد
// عبر كل الأنشطة. الاسترجاع مستقل لكل طالب على حدة.
// ══════════════════════════════════════════════════════════════

let FI_PARTICIPANT = null;

function fiEsc(s) { return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function fiDate(d) { if (!d) return ''; try { return new Date(d).toLocaleString('ar-JO', { year:'numeric', month:'long', day:'numeric', hour:'2-digit', minute:'2-digit' }); } catch(e) { return ''; } }
function fiMoney(n) { return (Number(n)||0).toFixed(3) + ' د.أ'; }

async function openFinanceModal(participantId) {
  const doc = await api('/api/participants/'+participantId);
  if (doc.error) { alert(doc.error); return; }
  FI_PARTICIPANT = doc;
  fiRenderMain();
  if (!window.__fiEscBound) {
    window.__fiEscBound = true;
    document.addEventListener('keydown', e => { if (e.key === 'Escape') document.getElementById('mod-finance')?.classList.remove('open'); });
  }
}
function fiCloseModal() { document.getElementById('mod-finance')?.classList.remove('open'); }
async function fiReload() {
  const doc = await api('/api/participants/'+FI_PARTICIPANT.id);
  if (!doc.error) FI_PARTICIPANT = doc;
}

function fiRenderMain() {
  const p = FI_PARTICIPANT;
  const students = p.students || [];
  const modal = document.getElementById('mod-finance');

  if (!p.fee_amount) {
    modal.querySelector('.modal').innerHTML = `
      <h3>💰 الرسوم المالية — ${fiEsc(p.activity)}</h3>
      <div style="font-size:12px;color:var(--muted);margin-bottom:10px">لم يتم تحديد رسوم هذا النشاط بعد. حدّديها أولاً قبل تسجيل أي دفعات.</div>
      <div class="fg"><label>رسوم النشاط للطالب الواحد (دينار)</label><input type="number" id="fi-fee-input" min="0" step="0.001" placeholder="مثال: 25"></div>
      <div id="fi-msg" class="msg"></div>
      <div style="display:flex;gap:8px">
        <button class="btn" style="flex:1;background:var(--g);color:#fff" onclick="fiSaveFee()"><i class="ti ti-device-floppy"></i> حفظ</button>
        <button class="btn" onclick="fiCloseModal()">إغلاق</button>
      </div>`;
    modal.classList.add('open');
    return;
  }

  const paid = students.filter(s => s.payment_status === 'paid');
  const refunded = students.filter(s => s.payment_status === 'refunded');
  const totalCollected = paid.reduce((a,s) => a + (Number(s.payment_amount)||0), 0);
  const totalRefunded = refunded.reduce((a,s) => a + (Number(s.refund_amount)||0), 0);
  const net = totalCollected - totalRefunded;

  modal.querySelector('.modal').innerHTML = `
    <h3>💰 الرسوم المالية — ${fiEsc(p.activity)}</h3>
    <div style="font-size:12.5px;margin-bottom:10px">رسوم الطالب الواحد: <strong>${fiMoney(p.fee_amount)}</strong> <button class="btn btn-sm" onclick="fiEditFee()">تعديل</button></div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:12px">
      <div style="border:1px solid var(--border);border-radius:var(--r);padding:8px;text-align:center"><div style="font-size:11px;color:var(--muted)">المسجَّلون</div><div style="font-weight:700">${students.length}</div></div>
      <div style="border:1px solid var(--border);border-radius:var(--r);padding:8px;text-align:center"><div style="font-size:11px;color:var(--muted)">الدافعون</div><div style="font-weight:700">${paid.length}</div></div>
      <div style="border:1px solid var(--border);border-radius:var(--r);padding:8px;text-align:center"><div style="font-size:11px;color:var(--muted)">الصافي المُحصَّل</div><div style="font-weight:700;color:var(--g)">${fiMoney(net)}</div></div>
    </div>
    <div style="font-size:11.5px;color:var(--muted);margin-bottom:10px">إجمالي المُحصَّل: ${fiMoney(totalCollected)} — إجمالي المُسترجَع: ${fiMoney(totalRefunded)}</div>
    <div style="display:flex;gap:8px;margin-bottom:10px">
      <button class="btn btn-sm" style="flex:1;background:var(--g);color:#fff" onclick="fiOpenPayFlow()"><i class="ti ti-plus"></i> تسجيل دفعة جديدة</button>
      <button class="btn btn-sm" onclick="fiExportExcel()"><i class="ti ti-file-spreadsheet"></i> تصدير Excel</button>
    </div>
    <div class="tw" style="max-height:280px"><table>
      <thead><tr><th>#</th><th>الاسم</th><th>الرقم الجامعي</th><th>الحالة</th><th>المبلغ</th><th>السند</th><th>إجراءات</th></tr></thead>
      <tbody>${students.map((s,i) => `
        <tr>
          <td>${i+1}</td><td>${fiEsc(s.name)}</td><td>${fiEsc(s.id)}</td>
          <td>${fiStatusBadge(s.payment_status)}</td>
          <td>${s.payment_status==='paid'?fiMoney(s.payment_amount):(s.payment_status==='refunded'?'مُسترجَع '+fiMoney(s.refund_amount):'—')}</td>
          <td>${s.receipt_no?`<a href="#" onclick="fiPrintReceipt(${s.receipt_no});return false" style="color:var(--g)">#${s.receipt_no}</a>`:'—'}</td>
          <td>${s.payment_status==='paid'?`<button class="btn btn-sm" style="color:#c0392b" onclick="fiOpenRefund('${fiEsc(s.id)}')">استرجاع</button>`:''}</td>
        </tr>`).join('')}</tbody>
    </table></div>
    <button class="btn" style="width:100%;margin-top:10px" onclick="fiCloseModal()">إغلاق</button>`;
  modal.classList.add('open');
}

function fiStatusBadge(status) {
  if (status === 'paid') return '<span class="st st-a">✅ مدفوع</span>';
  if (status === 'refunded') return '<span class="st st-r">↩️ مُسترجَع</span>';
  return '<span class="st st-p">🟡 لم يدفع</span>';
}

function fiEditFee() {
  const modal = document.getElementById('mod-finance');
  modal.querySelector('.modal').innerHTML = `
    <h3>💰 الرسوم المالية — ${fiEsc(FI_PARTICIPANT.activity)}</h3>
    <div class="fg"><label>رسوم النشاط للطالب الواحد (دينار)</label><input type="number" id="fi-fee-input" min="0" step="0.001" value="${FI_PARTICIPANT.fee_amount||''}"></div>
    <div style="font-size:11px;color:var(--muted);margin-bottom:8px">تغيير الرسوم لا يؤثر على الدفعات المسجَّلة مسبقاً، فقط على أي دفعات جديدة.</div>
    <div id="fi-msg" class="msg"></div>
    <div style="display:flex;gap:8px">
      <button class="btn" style="flex:1;background:var(--g);color:#fff" onclick="fiSaveFee()"><i class="ti ti-device-floppy"></i> حفظ</button>
      <button class="btn" onclick="fiRenderMain()">رجوع</button>
    </div>`;
}

async function fiSaveFee() {
  const val = parseFloat(document.getElementById('fi-fee-input').value);
  const msgEl = document.getElementById('fi-msg');
  if (isNaN(val) || val <= 0) { msgEl.textContent = 'يرجى إدخال رسوم صحيحة أكبر من صفر'; msgEl.className = 'msg err'; msgEl.style.display = 'block'; return; }
  const r = await api('/api/participants/'+FI_PARTICIPANT.id, 'PUT', { fee_amount: val });
  if (r.error) { msgEl.textContent = r.error; msgEl.className = 'msg err'; msgEl.style.display = 'block'; return; }
  await fiReload();
  fiRenderMain();
}

function fiOpenPayFlow() {
  const p = FI_PARTICIPANT;
  const unpaid = (p.students||[]).filter(s => s.payment_status !== 'paid');
  const modal = document.getElementById('mod-finance');
  if (!unpaid.length) {
    modal.querySelector('.modal').innerHTML = `<h3>تسجيل دفعة جديدة</h3><div class="center">كل الطلبة المسجَّلين دفعوا بالفعل.</div><button class="btn" style="width:100%" onclick="fiRenderMain()">رجوع</button>`;
    return;
  }
  modal.querySelector('.modal').innerHTML = `
    <h3>تسجيل دفعة جديدة</h3>
    <div class="fg"><label>اسم من قام بالدفع</label><input type="text" id="fi-payer-name" placeholder="اسم الطالب أو من دفع نيابة عنه/عن مجموعته"></div>
    <div class="fg"><label>طريقة الدفع</label><select id="fi-method"><option value="cash">نقداً</option><option value="cliq">كليك (CliQ)</option></select></div>
    <div class="fg"><label>الطلبة المشمولون بهذا السند (يمكن اختيار أكثر من طالب)</label>
      <div style="max-height:220px;overflow-y:auto;border:1px solid var(--border);border-radius:8px">
        ${unpaid.map(s => `<label style="display:flex;align-items:center;gap:8px;padding:7px 10px;border-bottom:1px solid var(--border);font-weight:400;font-size:12.5px;cursor:pointer"><input type="checkbox" class="fi-pay-cb" value="${fiEsc(s.id)}" onchange="fiUpdatePayTotal()"> ${fiEsc(s.name)} <span style="color:var(--muted);font-size:11px">— ${fiEsc(s.id)}</span></label>`).join('')}
      </div>
    </div>
    <div style="font-size:13px;font-weight:700;margin-bottom:8px">الإجمالي: <span id="fi-pay-total">${fiMoney(0)}</span></div>
    <div id="fi-pay-msg" class="msg"></div>
    <div style="display:flex;gap:8px">
      <button class="btn" style="flex:1;background:var(--g);color:#fff" onclick="fiSubmitPay()"><i class="ti ti-cash"></i> تسجيل الدفع وإصدار السند</button>
      <button class="btn" onclick="fiRenderMain()">رجوع</button>
    </div>`;
}

function fiUpdatePayTotal() {
  const count = document.querySelectorAll('.fi-pay-cb:checked').length;
  document.getElementById('fi-pay-total').textContent = fiMoney(count * (FI_PARTICIPANT.fee_amount||0));
}

async function fiSubmitPay() {
  const payer_name = document.getElementById('fi-payer-name').value.trim();
  const payment_method = document.getElementById('fi-method').value;
  const student_ids = Array.from(document.querySelectorAll('.fi-pay-cb:checked')).map(el => el.value);
  const msgEl = document.getElementById('fi-pay-msg');
  const show = (t, err) => { msgEl.textContent = t; msgEl.className = 'msg ' + (err?'err':'ok'); msgEl.style.display = 'block'; };
  if (!payer_name) { show('يرجى إدخال اسم من قام بالدفع', true); return; }
  if (!student_ids.length) { show('يرجى اختيار طالب واحد على الأقل', true); return; }
  show('جارٍ التسجيل...');
  const r = await api('/api/participants/'+FI_PARTICIPANT.id+'/pay', 'POST', { payer_name, payment_method, student_ids });
  if (r.error) { show(r.error, true); return; }
  await fiReload();
  fiRenderMain();
  setTimeout(() => { if (confirm(r.message + '\nهل تريدين طباعة السند الآن؟')) fiPrintReceipt(r.receipt_no); }, 100);
}

function fiOpenRefund(uniId) {
  const s = (FI_PARTICIPANT.students||[]).find(x => x.id === uniId);
  if (!s) return;
  const modal = document.getElementById('mod-finance');
  modal.querySelector('.modal').innerHTML = `
    <h3>استرجاع مبلغ — ${fiEsc(s.name)}</h3>
    <div style="font-size:12px;color:var(--muted);margin-bottom:10px">المبلغ المدفوع أصلاً: ${fiMoney(s.payment_amount)} (سند رقم ${s.receipt_no})</div>
    <div class="fg"><label>المبلغ المُسترجَع (دينار)</label><input type="number" id="fi-refund-amount" min="0" step="0.001" value="${s.payment_amount}"></div>
    <div style="font-size:11px;color:var(--muted);margin-bottom:8px">يمكن تعديل المبلغ إن وُجد خصم إداري (استرجاع جزئي).</div>
    <div class="fg"><label>سبب الاسترجاع</label><textarea id="fi-refund-reason" style="min-height:60px" placeholder="مثال: انسحاب الطالب من النشاط"></textarea></div>
    <div id="fi-refund-msg" class="msg"></div>
    <div style="display:flex;gap:8px">
      <button class="btn" style="flex:1;background:#c0392b;color:#fff" onclick="fiSubmitRefund('${fiEsc(uniId)}')"><i class="ti ti-receipt-refund"></i> تسجيل الاسترجاع</button>
      <button class="btn" onclick="fiRenderMain()">رجوع</button>
    </div>`;
}

async function fiSubmitRefund(uniId) {
  const refund_amount = parseFloat(document.getElementById('fi-refund-amount').value);
  const reason = document.getElementById('fi-refund-reason').value.trim();
  const msgEl = document.getElementById('fi-refund-msg');
  const show = (t, err) => { msgEl.textContent = t; msgEl.className = 'msg ' + (err?'err':'ok'); msgEl.style.display = 'block'; };
  if (isNaN(refund_amount) || refund_amount < 0) { show('يرجى إدخال مبلغ صحيح', true); return; }
  show('جارٍ التسجيل...');
  const r = await api('/api/participants/'+FI_PARTICIPANT.id+'/refund', 'POST', { id: uniId, refund_amount, reason });
  if (r.error) { show(r.error, true); return; }
  await fiReload();
  fiRenderMain();
}

async function fiPrintReceipt(receiptNo) {
  const r = await api('/api/payment_receipts/'+receiptNo);
  if (r.error) { alert(r.error); return; }
  const html = `
    <div class="ph2">
      <img src="/logo.png" class="plogo" alt="شعار الجامعة الأردنية">
      <div class="puni"><div class="ar">الجامعة الأردنية</div><div class="en">The University of Jordan</div><div class="dep">عمادة شؤون الطلبة — Dean of Student Affairs</div></div>
      <div class="pmeta">رقم السند: ${r.receipt_no}<br>${fiDate(r.createdAt)}</div>
    </div>
    <div class="ptitle">سند قبض</div>
    <div class="fg2">
      <div class="fr"><div class="fl">النشاط</div><div class="fv">${fiEsc(r.activity_name)}</div></div>
      <div class="fr"><div class="fl">طريقة الدفع</div><div class="fv">${r.payment_method==='cliq'?'كليك (CliQ)':'نقداً'}</div></div>
      <div class="fr"><div class="fl">دُفع بواسطة</div><div class="fv">${fiEsc(r.payer_name)}</div></div>
      <div class="fr"><div class="fl">المبلغ الإجمالي</div><div class="fv" style="font-weight:700">${fiMoney(r.total_amount)}</div></div>
    </div>
    <div class="psub">الطلبة المشمولون بهذا السند (${(r.students||[]).length})</div>
    <table class="ptbl"><thead><tr><th>#</th><th>الاسم</th><th>الرقم الجامعي</th><th>المبلغ</th></tr></thead><tbody>
      ${(r.students||[]).map((s,i)=>`<tr><td>${i+1}</td><td>${fiEsc(s.name)}</td><td>${fiEsc(s.uni_id)}</td><td>${fiMoney(r.fee_amount)}</td></tr>`).join('')}
    </tbody></table>
    <div style="margin-top:44px;display:grid;grid-template-columns:1fr 1fr;gap:20px;text-align:center;font-size:10.5pt">
      <div><div style="border-top:1px solid #333;padding-top:6px">توقيع المستلم</div></div>
      <div><div style="border-top:1px solid #333;padding-top:6px">توقيع الموظف المسؤول</div></div>
    </div>`;
  openPrint(html);
}

function fiExportExcel() {
  const p = FI_PARTICIPANT;
  const students = p.students || [];
  if (!students.length) { alert('لا يوجد مسجَّلون للتصدير'); return; }
  const sheetRows = students.map((s,i) => ({
    '#': i+1, 'الاسم': s.name||'', 'الرقم الجامعي': s.id||'',
    'حالة الدفع': s.payment_status==='paid'?'مدفوع':(s.payment_status==='refunded'?'مُسترجَع':'لم يدفع'),
    'المبلغ المدفوع': s.payment_amount||'', 'طريقة الدفع': s.payment_method==='cliq'?'كليك':(s.payment_method==='cash'?'نقداً':''),
    'رقم السند': s.receipt_no||'', 'دُفع بواسطة': s.paid_by||'', 'تاريخ الدفع': fiDate(s.paid_at),
    'مبلغ الاسترجاع': s.refund_amount||'', 'سبب الاسترجاع': s.refund_reason||'', 'تاريخ الاسترجاع': fiDate(s.refund_at),
  }));
  const ws = XLSX.utils.json_to_sheet(sheetRows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'الرسوم المالية');
  XLSX.writeFile(wb, `الرسوم_المالية_${(p.activity||'نشاط').replace(/[\\/:*?"<>|]/g,'')}_${new Date().toISOString().slice(0,10)}.xlsx`);
}
