const express  = require('express');
const bcrypt   = require('bcryptjs');
const mongoose = require('mongoose');
const path     = require('path');
const fs       = require('fs');

const app  = express();
app.set('trust proxy', true);
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('❌ متغيّر البيئة MONGODB_URI غير مضبوط. يجب ضبطه من إعدادات Railway (Variables) قبل التشغيل.');
  process.exit(1);
}

// ══ MongoDB Schema ══
const recordSchema = new mongoose.Schema({}, { strict: false, timestamps: true });
const userSchema = new mongoose.Schema({
  username:   { type: String, required: true, unique: true },
  password:   { type: String, required: true },
  fullName:   { type: String, required: true },
  role:       { type: String, required: true },
  department: { type: String, default: '' },
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

// ══ سجل تاريخي (Audit Log): يحفظ نسخة من أي سجل قبل كل تعديل أو حذف، لإتاحة الاسترجاع لاحقاً ══
const recordHistorySchema = new mongoose.Schema({
  table: String, record_id: String, snapshot: mongoose.Schema.Types.Mixed,
  action: String, // 'update' أو 'delete'
  changed_by: String, changed_at: { type: Date, default: Date.now }
});
const RecordHistory = mongoose.model('RecordHistory', recordHistorySchema);
// الجداول التي يُفعَّل لها السجل التاريخي حالياً (يمكن توسيعها لاحقاً)
const HISTORY_TABLES = ['participants'];

// ══ توليد رقم مرجعي فريد لطلبات إقامة النشاط (لتتبّع الطالب لطلبه) ══
function genRefCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return 'AR-' + s;
}

// بناء سجل «الأنشطة الطلابية» المُرحَّل من طلب معتمد (نفس منطق الواجهة buildStudentActivityRecord)
function buildActivityRecordFromRequest(req, categories) {
  return {
    title:          req.title || '',
    organizer:      req.organizer || '',
    activity_type:  req.type || '',
    date:           req.activity_date || '',
    students_count: '',
    staff_names:    '',
    leaders_names:  '',
    external_party: req.guests === 'نعم' ? 'نعم' : 'لا',
    ext_name:       req.ext_name || '',
    ext_people:     req.ext_people || '',
    rating:         '',
    categories:     categories,
    request_id:     String(req._id),
    source:         `مُرحَّل من طلب نشاط رقم ${req._id} — ${req.title}`,
    completed:      false
  };
}

// بناء سجل «أسماء الطلبة المشاركين» المُرحَّل من طلب معتمد (بالحقول المشتركة فقط، بدون طلبة بعد)
function buildParticipantsRecordFromRequest(req) {
  return {
    activity:     req.title || '',
    date:         req.activity_date || '',
    organizer:    req.organizer || '',
    eval_num:     '',
    students:     [],
    supervisors:  '',
    staff:        '',
    max_capacity: null,
    request_id:   String(req._id),
    source:       `مُرحَّل من طلب نشاط رقم ${req._id} — ${req.title}`,
  };
}

// بناء سجل «استبانة تقييم فعالية» المُرحَّل من طلب معتمد (بالحقول المشتركة فقط، بدون إجابات بعد)
function buildEvalRecordFromRequest(req) {
  return {
    activity:   req.title || '',
    date:       req.activity_date || '',
    organizer:  req.organizer || '',
    responses:  [],
    request_id: String(req._id),
    source:     `مُرحَّل من طلب نشاط رقم ${req._id} — ${req.title}`,
  };
}

// دوائر العمادة (يجب أن تطابق حرفياً قائمة DEANSHIP_DEPTS في public/app.js)
const DEANSHIP_DEPTS = [
  'دائرة الهيئات والخدمات الطلابية',
  'دائرة الرعاية الصحية',
  'دائرة الإرشاد الطلابي',
  'دائرة النشاطات الرياضية',
  'دائرة المنازل الداخلية',
  'دائرة الخدمات الفنية والتطوير',
  'دائرة النشاطات الثقافية والحزبية',
  'مكتب شؤون الطلبة الدوليين',
  'اتحاد طلبة الجامعة الأردنية'
];

// الدائرة الوحيدة المخوَّلة بالموافقة/الرفض على طلبات حجز أماكنها
const FACILITIES_DEPT = 'دائرة الخدمات الفنية والتطوير';
const SPORTS_DEPT = 'دائرة النشاطات الرياضية';
// الأماكن الخاضعة لموافقة مدير دائرة الخدمات الفنية والتطوير
const FACILITIES_PLACES = ['مدرج الحسن بن طلال','مدرج الأردن','قاعة الإعلام والاتصال','قاعة المعارض الكبرى','قاعة معاذ الكساسبة','قاعة اجتماعات العمادة','حديقة العمادة الداخلية','حديقة العمادة الخارجية','بهو مدرج الحسن'];
// الأماكن الخاضعة لموافقة مدير دائرة النشاطات الرياضية
const SPORTS_PLACES = ['الصالة الرياضية','استاد الجامعة','صالة التايكواندو','مضمار استاد الجامعة'];
// نفس قائمة الأماكن الكاملة تُستخدم أيضاً في نموذج «حجز القاعات» اليدوي — مصدر واحد مشترك
const HALLS_LIST = [...FACILITIES_PLACES, ...SPORTS_PLACES];
const AR_WEEKDAYS = ['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
function weekdayNameFromDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d.getTime())) return '';
  return AR_WEEKDAYS[d.getDay()] || '';
}

const TABLES = [
  'students','achievements',
  'governance','student_activities','student_activities_external','workshops','initiatives','external_acts','competitions',
  'student_honors','community_svc','staff_committees','awareness','expert_acts',
  'staff_training','staff_innovation','staff_honors','uni_committees',
  'environment','dialogues','campaigns',
  'activity_requests','announcements','hall_bookings',
  'participants','committees','meeting_invites','meeting_minutes','activity_evaluations'
];

const models = {};
TABLES.forEach(t => {
  models[t] = mongoose.model(t, new mongoose.Schema({}, { strict:false, timestamps:true }));
});

// ══ بند مؤقت: التفوق الفني — نموذج مستقل تماماً (ليس ضمن TABLES/CRUD العام)
// لسهولة إزالته لاحقاً بالكامل بمجرد حذف هذا القسم + سطر الشريط الجانبي + صفحة talent.html
// الوصول لبياناته مقصور على admin فقط (وفق الطلب) ══
const TalentApp = mongoose.model('talent_excellence', new mongoose.Schema({}, { strict:false, timestamps:true }));
const TalentSettings = mongoose.model('talent_excellence_settings', new mongoose.Schema({}, { strict:false }));
function genTalentRef() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = ''; for (let i=0;i<6;i++) s += chars[Math.floor(Math.random()*chars.length)];
  return 'TE-' + s;
}

// ══ نظام حجز الغرف الفندقية — وحدة مستقلة قابلة لإعادة الاستخدام لأي نشاط
// (رحلات، معسكرات...)، الوصول لإدارتها مقصور على admin فقط.
// دورة حجز واحدة = نشاط واحد (مرتبط بسجل من جدول "أسماء المشاركين")،
// وتحتها عدة فنادق، كل فندق له رابط تسجيل عام مستقل وغرف خاصة به ══
const BookingCycle = mongoose.model('room_booking_cycles', new mongoose.Schema({}, { strict:false, timestamps:true }));
function genBookingId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = ''; for (let i=0;i<8;i++) s += chars[Math.floor(Math.random()*chars.length)];
  return s;
}
async function findBookingHotel(hotelId) {
  const cycle = await BookingCycle.findOne({ 'hotels.id': hotelId });
  if (!cycle) return null;
  const hotel = (cycle.hotels || []).find(h => h.id === hotelId);
  if (!hotel) return null;
  return { cycle, hotel };
}
// يجلب سجل الطالب من قائمة المشاركين، مع مراعاة إعداد الدورة (كل المشاركين، أو الحاضرين فقط)
function rbFindStudent(participantsDoc, cycle, uniId) {
  let list = participantsDoc?.students || [];
  if (cycle.verify_source === 'attended') list = list.filter(s => s.attended);
  return list.find(s => (s.id || '').trim() === uniId);
}

// ══ الدورات التدريبية — كتالوج دورات مقدَّمة من جهات خارجية (TAG.Global وغيرها)
// كل دورة لها حد أقصى للتسجيل (يحدّده admin يدوياً حسب الحصة الرسمية الواردة من
// الجهة المنظِّمة)، والطالب يُسمح له بالتسجيل في دورة واحدة فقط من كل الكتالوج ══
const TrainingCourse = mongoose.model('training_courses', new mongoose.Schema({}, { strict:false, timestamps:true }));
function genCourseId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = ''; for (let i=0;i<8;i++) s += chars[Math.floor(Math.random()*chars.length)];
  return s;
}

// ══ تعليمات النشاط: مُخزَّنة مباشرة داخل سجل "أسماء المشاركين" (participants) نفسه
// (حقل instructions[] + instructions_verify_source) — بلا معرّف/رابط مستقل خاص بها،
// فتُحذف تلقائياً مع حذف طلب النشاط ضمن آلية الحذف التتابعي الحالية دون أي كود إضافي،
// ويُعاد استخدام نفس participant_id المستخدم أصلاً لرابطَي التسجيل والتقييم ══

// ══ النظام المالي لرسوم الأنشطة (Admin فقط) — توثيق تحصيل نقدي/CliQ يدوي، وليس بوابة
// دفع فعلية. حالة الدفع/الاسترجاع تُخزَّن لكل طالب داخل نفس سجل "أسماء المشاركين"
// (student.payment_status/payment_amount/receipt_no/paid_by/...)، فتُحذف تلقائياً مع
// حذف طلب النشاط كباقي البيانات. سندات القبض توثَّق في مجموعة مستقلة PaymentReceipt
// لأنها قد تشمل عدة طلبة تحت رقم واحد (دفع شخص عن زميله)، وبرقم تسلسلي عام واحد
// عبر كل الأنشطة معاً (وليس لكل نشاط على حدة) عبر عدّاد ذرّي مستقل ══
const PaymentReceipt = mongoose.model('payment_receipts', new mongoose.Schema({}, { strict:false, timestamps:true }));
const Counter = mongoose.model('counters', new mongoose.Schema({ _id: String, seq: { type: Number, default: 0 } }));
async function nextReceiptNo() {
  const c = await Counter.findByIdAndUpdate('receipt_no', { $inc: { seq: 1 } }, { upsert: true, new: true });
  return c.seq;
}

// ══ اتصال MongoDB ══
mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('✅ MongoDB متصل — dsa_unified');
    await initAdmin();
  })
  .catch(err => console.error('❌ خطأ في الاتصال:', err));

async function initAdmin() {
  const exists = await User.findOne({ username: 'admin' });
  if (!exists) {
    await User.create({
      username: 'admin',
      password: bcrypt.hashSync('admin123', 10),
      fullName: 'مدير النظام',
      role: 'admin'
    });
    console.log('✅ admin / admin123');
  }
}

app.use(express.json({ limit: '50mb' }));
// يُخدَّم قبل express.static ليُحقن بيانات Open Graph الخاصة بفعالية بعينها عند وجود ?id= في الرابط
// (المتصفح العادي يعرض نفس الصفحة تماماً؛ الفرق يظهر فقط لبرامج فيسبوك/واتساب عند قراءة الصفحة لبناء بطاقة المعاينة)
function escHtml(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
app.get('/events.html', async (req, res) => {
  const filePath = path.join(__dirname, 'public', 'events.html');
  try {
    let html = fs.readFileSync(filePath, 'utf8');
    const id = req.query.id;
    if (id) {
      const doc = await models['announcements'].findById(id).lean().catch(()=>null);
      if (doc) {
        const title = `${doc.title || 'فعالية'} — عمادة شؤون الطلبة`;
        const descParts = [];
        // علامة LRM (U+200E) تُجبر الأرقام/التاريخ على الظهور بترتيبها الصحيح داخل نص عربي (RTL)،
        // لأن دمج تاريخ مثل 2026-08-14 مباشرة بعد نص عربي يجعل بعض التطبيقات (كواتساب) تعرضه معكوساً
        const lrm = '\u200E';
        if (doc.date) descParts.push(`بتاريخ ${lrm}${doc.date}${lrm}`);
        if (doc.organizer) descParts.push(`الجهة المنظِّمة: ${doc.organizer}`);
        if (doc.location) descParts.push(`المكان: ${doc.location}`);
        const desc = (descParts.join(' — ') || 'فعالية طلابية في الجامعة الأردنية').slice(0, 200);
        const url = `https://ju-dsa.up.railway.app/events.html?id=${id}`;
        html = html
          .replace(/<title>[\s\S]*?<\/title>/, `<title>${escHtml(title)}</title>`)
          .replace(/<meta property="og:title"[^>]*>/, `<meta property="og:title" content="${escHtml(title)}">`)
          .replace(/<meta property="og:description"[^>]*>/, `<meta property="og:description" content="${escHtml(desc)}">`)
          .replace(/<meta property="og:url"[^>]*>/, `<meta property="og:url" content="${url}">`)
          .replace(/<meta name="twitter:title"[^>]*>/, `<meta name="twitter:title" content="${escHtml(title)}">`)
          .replace(/<meta name="twitter:description"[^>]*>/, `<meta name="twitter:description" content="${escHtml(desc)}">`);
      }
    }
    res.send(html);
  } catch(e) {
    res.sendFile(filePath);
  }
});

app.use(express.static(path.join(__dirname, 'public')));

// ══ Sessions ══
const sessions = {};

// ══ تقديم عام لطلب إقامة نشاط (بدون تسجيل دخول) — كابتشا + حد للطلبات ══
const publicCaptchas = {};   // token -> { answer, expires }
const publicRateLog  = {};   // ip -> [timestamps]
const PUBLIC_RATE_LIMIT = 3;           // عدد الطلبات
const PUBLIC_RATE_WINDOW_MS = 60*60*1000; // خلال ساعة واحدة
// ملاحظة: حدّ المعدّل (checkPublicRateLimit) مُعرَّف أدناه لكنه غير مُفعَّل حالياً على
// /api/public/activity-requests ولا /api/public/participants/:id/register بناءً على طلب صريح
// (لا حاجة لتقييد زمني حالياً على أي من البوابتين). الكابتشا وحدها هي الحماية الفعّالة الآن.
// إن احتجتم إعادة تفعيله مستقبلاً: أعيدوا استدعاء checkPublicRateLimit(ip) في بداية كل مسار.

function checkPublicRateLimit(ip) {
  const now = Date.now();
  const log = (publicRateLog[ip] || []).filter(t => now - t < PUBLIC_RATE_WINDOW_MS);
  publicRateLog[ip] = log;
  if (log.length >= PUBLIC_RATE_LIMIT) return false;
  log.push(now);
  return true;
}

app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user || !bcrypt.compareSync(password, user.password))
      return res.status(401).json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
    const token = Math.random().toString(36).substr(2) + Date.now().toString(36);
    sessions[token] = { id: user._id, username: user.username, fullName: user.fullName, role: user.role, department: user.department||'' };
    res.json({ token, user: sessions[token] });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/logout', (req, res) => {
  delete sessions[(req.headers.authorization||'').replace('Bearer ','')];
  res.json({ ok: true });
});

// ══ سؤال حسابي بسيط لمنع الإسبام (بدون تسجيل دخول) ══
app.get('/api/public/captcha', (req, res) => {
  const a = Math.floor(Math.random()*8)+1, b = Math.floor(Math.random()*8)+1;
  const token = Math.random().toString(36).substr(2) + Date.now().toString(36);
  publicCaptchas[token] = { answer: a+b, expires: Date.now() + 10*60*1000 };
  res.json({ token, question: `${a} + ${b}` });
});

// ══ تقديم طلب إقامة نشاط علناً بدون تسجيل دخول ══
app.post('/api/public/activity-requests', async (req, res) => {
  try {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';

    const { captcha_token, captcha_answer } = req.body;
    const cap = publicCaptchas[captcha_token];
    if (!cap || Date.now() > cap.expires || Number(captcha_answer) !== cap.answer)
      return res.status(400).json({ error: 'إجابة التحقق غير صحيحة، يرجى المحاولة من جديد' });
    delete publicCaptchas[captcha_token];

    const data = { ...req.body };
    delete data.captcha_token; delete data.captcha_answer;
    if (!data.title) return res.status(400).json({ error: 'يرجى ملء عنوان الفعالية' });

    data.ref_code = genRefCode();
    data.status = 'pending';
    data.submitted_via = 'public_link';
    data.submitted_ip = ip;

    const doc = await models['activity_requests'].create(data);
    res.json({ id: doc._id, ref_code: doc.ref_code, message: 'تم استلام طلبك بنجاح' });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ══ بند مؤقت: التفوق الفني — تقديم عام بدون تسجيل دخول ══
// يتحقق من: فتح الرابط (حسب تاريخ إغلاق يحدده admin)، الكابتشا، الحقول الإلزامية، عدم تكرار رقم الهاتف
app.get('/api/public/talent-excellence/status', async (req, res) => {
  try {
    const s = await TalentSettings.findOne({ key: 'talent_excellence' }).lean();
    const closeDate = s?.close_date || null;
    const todayStr = new Date().toISOString().slice(0,10);
    const open = !closeDate || closeDate >= todayStr;
    res.json({ open, close_date: closeDate });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/public/talent-excellence', async (req, res) => {
  try {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';

    const { captcha_token, captcha_answer } = req.body;
    const cap = publicCaptchas[captcha_token];
    if (!cap || Date.now() > cap.expires || Number(captcha_answer) !== cap.answer)
      return res.status(400).json({ error: 'إجابة التحقق غير صحيحة، يرجى المحاولة من جديد' });
    delete publicCaptchas[captcha_token];

    const s = await TalentSettings.findOne({ key: 'talent_excellence' }).lean();
    const closeDate = s?.close_date || null;
    const todayStr = new Date().toISOString().slice(0,10);
    if (closeDate && closeDate < todayStr)
      return res.status(400).json({ error: 'عذراً، انتهت مدة استقبال طلبات التفوق الفني' });

    const data = { ...req.body };
    delete data.captcha_token; delete data.captcha_answer;

    const fullName = (data.full_name || '').trim();
    const phone = (data.phone || '').trim();
    if (!fullName || !phone) return res.status(400).json({ error: 'يرجى إدخال الاسم الكامل ورقم الهاتف' });
    if (!/^07\d{8}$/.test(phone)) return res.status(400).json({ error: 'صيغة رقم الهاتف غير صحيحة (يجب أن يبدأ بـ 07 ويتكون من 10 خانات)' });
    if (data.phone_alt && !/^07\d{8}$/.test(String(data.phone_alt).trim()))
      return res.status(400).json({ error: 'صيغة رقم الهاتف البديل غير صحيحة' });
    if (!Array.isArray(data.activity_types) || !data.activity_types.length)
      return res.status(400).json({ error: 'يرجى اختيار نوع نشاط واحد على الأقل' });
    if (!data.photo || !String(data.photo).startsWith('data:image/'))
      return res.status(400).json({ error: 'يرجى إرفاق الصورة الشخصية (إلزامية)' });
    if (!data.agree) return res.status(400).json({ error: 'يرجى الموافقة على إقرار صحة البيانات' });

    const dup = await TalentApp.findOne({ $or: [{ phone }, ...(data.phone_alt ? [{ phone: data.phone_alt }] : [])] }).lean();
    if (dup) return res.status(400).json({ error: 'يوجد طلب مسبق بنفس رقم الهاتف — لا يُسمح بالتقديم أكثر من مرة' });

    data.ref_code = genTalentRef();
    data.status = 'pending';
    data.certs_received = false;
    data.submitted_ip = ip;

    const doc = await TalentApp.create(data);
    res.json({ id: doc._id, ref_code: doc.ref_code, message: 'تم استلام طلبك بنجاح' });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ══ نظام حجز الغرف الفندقية — تسجيل عام بدون تسجيل دخول (بحسب الرقم الجامعي) ══
app.get('/api/public/room-booking/:hotelId/status', async (req, res) => {
  try {
    const found = await findBookingHotel(req.params.hotelId);
    if (!found) return res.status(404).json({ error: 'الرابط غير صحيح' });
    const { cycle, hotel } = found;
    const todayStr = new Date().toISOString().slice(0,10);
    const open = !hotel.close_date || hotel.close_date >= todayStr;
    res.json({ open, close_date: hotel.close_date || null, hotel_name: hotel.name, activity_name: cycle.activity_name });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/public/room-booking/:hotelId/verify', async (req, res) => {
  try {
    const found = await findBookingHotel(req.params.hotelId);
    if (!found) return res.status(404).json({ error: 'الرابط غير صحيح' });
    const uniId = (req.body.uni_id || '').trim();
    if (!uniId) return res.status(400).json({ error: 'يرجى إدخال الرقم الجامعي' });
    const participantsDoc = await models['participants'].findById(found.cycle.activity_id).lean();
    const student = rbFindStudent(participantsDoc, found.cycle, uniId);
    if (!student) return res.status(404).json({ error: found.cycle.verify_source === 'attended' ? 'رقمك الجامعي غير مسجَّل ضمن الحاضرين فعلياً لهذا النشاط' : 'رقمك الجامعي غير مسجَّل ضمن قائمة المشاركين في هذا النشاط' });
    if (!student.gender) return res.status(400).json({ error: 'بيانات الجنس غير مكتملة في سجلك ضمن قائمة المشاركين، يرجى مراجعة الإدارة' });
    res.json({ name: student.name, gender: student.gender, nationality: student.nationality || '', phone: student.phone || '' });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/public/room-booking/:hotelId/rooms', async (req, res) => {
  try {
    const found = await findBookingHotel(req.params.hotelId);
    if (!found) return res.status(404).json({ error: 'الرابط غير صحيح' });
    const { cycle, hotel } = found;
    const uniId = (req.query.uni_id || '').trim();
    if (!uniId) return res.status(400).json({ error: 'يرجى إدخال الرقم الجامعي' });
    const participantsDoc = await models['participants'].findById(cycle.activity_id).lean();
    const student = rbFindStudent(participantsDoc, cycle, uniId);
    if (!student) return res.status(404).json({ error: cycle.verify_source === 'attended' ? 'رقمك الجامعي غير مسجَّل ضمن الحاضرين فعلياً لهذا النشاط' : 'رقمك الجامعي غير مسجَّل ضمن قائمة المشاركين في هذا النشاط' });
    const rooms = (hotel.rooms || []).filter(r => r.gender === student.gender).map(r => ({
      id: r.id, type: r.type, capacity: r.capacity, occupants: r.occupants || [],
      mine: (r.occupants || []).some(o => o.uni_id === uniId),
    }));
    res.json({ rooms, my_gender: student.gender, my_name: student.name });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/public/room-booking/:hotelId/join', async (req, res) => {
  try {
    const found = await findBookingHotel(req.params.hotelId);
    if (!found) return res.status(404).json({ error: 'الرابط غير صحيح' });
    const { cycle, hotel } = found;
    const todayStr = new Date().toISOString().slice(0,10);
    if (hotel.close_date && hotel.close_date < todayStr) return res.status(403).json({ error: 'عذراً، انتهت مهلة التسجيل لهذا الفندق' });
    const uniId = (req.body.uni_id || '').trim();
    const roomId = req.body.room_id;
    if (!uniId || !roomId) return res.status(400).json({ error: 'بيانات ناقصة' });
    const participantsDoc = await models['participants'].findById(cycle.activity_id).lean();
    const student = rbFindStudent(participantsDoc, cycle, uniId);
    if (!student) return res.status(404).json({ error: cycle.verify_source === 'attended' ? 'رقمك الجامعي غير مسجَّل ضمن الحاضرين فعلياً لهذا النشاط' : 'رقمك الجامعي غير مسجَّل ضمن قائمة المشاركين في هذا النشاط' });
    const targetRoom = (hotel.rooms || []).find(r => r.id === roomId);
    if (!targetRoom) return res.status(404).json({ error: 'الغرفة غير موجودة' });
    if (targetRoom.gender !== student.gender) return res.status(403).json({ error: 'هذه الغرفة غير مخصَّصة لجنسك' });
    const alreadyInTarget = (targetRoom.occupants || []).some(o => o.uni_id === uniId);
    if (!alreadyInTarget && (targetRoom.occupants || []).length >= targetRoom.capacity)
      return res.status(400).json({ error: 'هذه الغرفة ممتلئة بالكامل' });
    // إزالته من أي غرفة أخرى ضمن نفس الفندق أولاً (لدعم تبديل الغرفة)
    hotel.rooms.forEach(r => { r.occupants = (r.occupants || []).filter(o => o.uni_id !== uniId); });
    targetRoom.occupants = targetRoom.occupants || [];
    targetRoom.occupants.push({ uni_id: uniId, name: student.name, nationality: student.nationality || '', phone: student.phone || '', joined_at: new Date() });
    cycle.markModified('hotels');
    await cycle.save();
    res.json({ message: 'تم الانضمام للغرفة بنجاح' });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ══ الدورات التدريبية — تسجيل عام بدون تسجيل دخول ══
app.get('/api/public/training-courses', async (req, res) => {
  try {
    const docs = await TrainingCourse.find().sort({ createdAt: -1 }).lean();
    const todayStr = new Date().toISOString().slice(0,10);
    res.json(docs.map(d => {
      const regs = d.registrants || [];
      const open = (!d.close_date || d.close_date >= todayStr) && regs.length < (d.cap || 0);
      return {
        id: String(d._id), name: d.name, organizer: d.organizer, hours: d.hours,
        quota_note: d.quota_note, description: d.description || '',
        seats_left: Math.max(0, (d.cap||0) - regs.length), cap: d.cap || 0, open,
      };
    }));
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/public/training-courses/:id/register', async (req, res) => {
  try {
    const doc = await TrainingCourse.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'الدورة غير موجودة' });
    const todayStr = new Date().toISOString().slice(0,10);
    if (doc.close_date && doc.close_date < todayStr) return res.status(403).json({ error: 'انتهت مهلة التسجيل لهذه الدورة' });
    const regs = doc.registrants || [];
    if (regs.length >= (doc.cap || 0)) return res.status(400).json({ error: 'اكتمل العدد المسموح به لهذه الدورة' });

    const uniId = (req.body.id || '').trim();
    const name = (req.body.name || '').trim();
    if (!uniId || !name) return res.status(400).json({ error: 'يرجى إدخال الاسم والرقم الجامعي' });
    if (regs.some(s => (s.id||'').trim() === uniId)) return res.status(400).json({ error: 'أنت مسجَّل بالفعل في هذه الدورة' });

    // منع التسجيل في أكثر من دورة واحدة عبر كل الكتالوج
    const others = await TrainingCourse.find({ 'registrants.id': uniId }).lean();
    if (others.length) return res.status(400).json({ error: 'أنت مسجَّل بالفعل في دورة أخرى — يُسمح بالتسجيل في دورة واحدة فقط' });

    regs.push({
      name, id: uniId,
      gender: req.body.gender||'', nationality: req.body.nationality||'',
      college: req.body.college||'', major: req.body.major||'', year: req.body.year||'',
      phone: req.body.phone||'', email: req.body.email||'',
      selected: false, registered_at: new Date(),
    });
    doc.registrants = regs;
    doc.markModified('registrants');
    await doc.save();
    res.json({ message: 'تم تسجيلك في الدورة بنجاح' });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ══ تعليمات النشاط — عرض عام بدون تسجيل دخول (تحقّق بالرقم الجامعي، بلا كتابة)
// المعرِّف :id هنا هو نفسه معرِّف سجل "أسماء المشاركين" (participant_id) المستخدم
// أصلاً لرابطَي التسجيل والتقييم — بلا أي معرّف/جدول مستقل ══
function instrFindStudent(participantsDoc, uniId) {
  let list = participantsDoc?.students || [];
  if (participantsDoc?.instructions_verify_source === 'attended') list = list.filter(s => s.attended);
  return list.find(s => (s.id || '').trim() === uniId);
}

app.get('/api/public/instructions/:id/status', async (req, res) => {
  try {
    const doc = await models['participants'].findById(req.params.id).lean();
    if (!doc) return res.status(404).json({ error: 'الرابط غير صحيح' });
    res.json({ activity_name: doc.activity });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/public/instructions/:id/verify', async (req, res) => {
  try {
    const doc = await models['participants'].findById(req.params.id).lean();
    if (!doc) return res.status(404).json({ error: 'الرابط غير صحيح' });
    const uniId = (req.body.id || '').trim();
    if (!uniId) return res.status(400).json({ error: 'يرجى إدخال الرقم الجامعي' });
    const student = instrFindStudent(doc, uniId);
    if (!student) return res.status(404).json({ error: doc.instructions_verify_source === 'attended' ? 'رقمك الجامعي غير مسجَّل ضمن الحاضرين فعلياً لهذا النشاط' : 'رقمك الجامعي غير مسجَّل ضمن قائمة المشاركين في هذا النشاط' });
    const posts = (doc.instructions || []).slice().sort((a,b) => new Date(b.posted_at) - new Date(a.posted_at));
    res.json({ name: student.name, activity_name: doc.activity, posts });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ══ رابط عام لتسجيل الطلبة المشاركين في نشاط (بدون تسجيل دخول) ══
// يعرض فقط بيانات النشاط الأساسية (بدون قائمة الطلبة) للتحقق من صحة الرابط
// ══ قائمة عامة بالإعلانات/الفعاليات (سابقة وقادمة) — بحقول آمنة فقط، بلا بيانات شخصية ══
app.get('/api/public/events', async (req, res) => {
  try {
    const docs = await models['announcements'].find({}).sort({ date: -1 }).lean();
    const reqIds = docs.map(d => d.request_id).filter(Boolean);
    const parts = reqIds.length ? await models['participants'].find({ request_id: { $in: reqIds } }).lean() : [];
    const evals = reqIds.length ? await models['activity_evaluations'].find({ request_id: { $in: reqIds } }).lean() : [];
    const partByReq = {};
    parts.forEach(p => { partByReq[p.request_id] = String(p._id); });
    const evalByReq = {};
    evals.forEach(e => { evalByReq[e.request_id] = String(e._id); });
    res.json(docs.map(d => ({
      id: String(d._id), title: d.title || '', type: d.type || '', date: d.date || '', time: d.time || '',
      location: d.location || '', organizer: d.organizer || '', description: d.description || '', goals: d.goals || '',
      participant_id: d.request_id ? (partByReq[d.request_id] || null) : null,
      eval_id: d.request_id ? (evalByReq[d.request_id] || null) : null
    })));
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/public/participants-info/:id', async (req, res) => {
  try {
    const doc = await models['participants'].findById(req.params.id).lean();
    if (!doc) return res.status(404).json({ error: 'رابط غير صالح أو تمت إزالة النشاط' });
    res.json({
      activity: doc.activity || '', date: doc.date || '', organizer: doc.organizer || '',
      max_capacity: doc.max_capacity || null,
      registered_count: Array.isArray(doc.students) ? doc.students.length : 0,
      level_field_type: doc.level_field_type || 'level',
      reg_expiry: doc.reg_expiry || doc.date || null,
    });
  } catch(e) { res.status(404).json({ error: 'رابط غير صالح' }); }
});

// يضيف طالباً واحداً إلى قائمة المشاركين لنشاط معيّن — كابتشا + حدّ معدّل + منع التكرار بالرقم الجامعي
app.post('/api/public/participants/:id/register', async (req, res) => {
  try {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';

    const { captcha_token, captcha_answer } = req.body;
    const cap = publicCaptchas[captcha_token];
    if (!cap || Date.now() > cap.expires || Number(captcha_answer) !== cap.answer)
      return res.status(400).json({ error: 'إجابة التحقق غير صحيحة، يرجى المحاولة من جديد' });
    delete publicCaptchas[captcha_token];

    const doc = await models['participants'].findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'رابط التسجيل غير صالح' });

    const todayStr = new Date().toISOString().slice(0,10);
    const effectiveExpiry = doc.reg_expiry || doc.date || null;
    if (effectiveExpiry && effectiveExpiry < todayStr)
      return res.status(400).json({ error: 'عذراً، انتهت صلاحية رابط التسجيل لهذا النشاط' });

    const students = Array.isArray(doc.students) ? doc.students : [];
    const capLimit = doc.max_capacity ? Number(doc.max_capacity) : null;
    if (capLimit && students.length >= capLimit)
      return res.status(400).json({ error: 'عذراً، اكتمل العدد المسموح به من التسجيل لهذا النشاط' });

    const name  = (req.body.name   || '').trim();
    const uniId = (req.body.uni_id || '').trim();
    if (!name || !uniId)
      return res.status(400).json({ error: 'يرجى إدخال الاسم الكامل والرقم الجامعي' });

    if (students.some(s => (s.id || '').trim() === uniId))
      return res.status(400).json({ error: 'أنت مسجَّل مسبقاً في هذا النشاط بنفس الرقم الجامعي' });

    students.push({
      name, id: uniId,
      gender: req.body.gender || '', nationality: req.body.nationality || '',
      college: req.body.college || '', major: req.body.major || '',
      year: req.body.year || '', phone: req.body.phone || '', email: req.body.email || '',
    });
    doc.students = students;
    doc.markModified('students');
    await doc.save();

    res.json({ ok: true, message: 'تم تسجيل حضورك بنجاح ضمن قائمة المشاركين', count: students.length });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// تسجيل حضور طالب مسجَّل مسبقاً فقط (لا يُقبل حضور غير مسجَّل بالكشف الأصلي) — بلا كابتشا لضمان السرعة عند الباب
app.post('/api/public/participants/:id/attend', async (req, res) => {
  try {
    const doc = await models['participants'].findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'رابط الحضور غير صالح' });

    const uniId = (req.body.uni_id || '').trim();
    if (!uniId) return res.status(400).json({ error: 'يرجى إدخال الرقم الجامعي' });

    const students = Array.isArray(doc.students) ? doc.students : [];
    const idx = students.findIndex(s => (s.id || '').trim() === uniId);
    if (idx === -1)
      return res.status(404).json({ error: 'أنت غير مسجَّل في هذا النشاط. يرجى التسجيل أولاً من رابط التسجيل قبل تسجيل الحضور' });

    if (students[idx].attended) {
      return res.json({ ok: true, already: true, name: students[idx].name, message: 'تم تسجيل حضورك مسبقاً لهذا النشاط' });
    }

    students[idx].attended = true;
    students[idx].attend_time = new Date().toISOString();
    doc.students = students;
    doc.markModified('students');
    await doc.save();

    res.json({ ok: true, name: students[idx].name, message: 'تم تسجيل حضورك بنجاح' });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ══ تسجيل/إلغاء حضور طالب معيّن مباشرة من شاشة تعديل المشاركين (استخدام داخلي للموظفين) ══
app.post('/api/participants/:id/mark-attendance', auth(['admin','editor','coordinator','manager']), async (req, res) => {
  try {
    const doc = await models['participants'].findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'السجل غير موجود' });
    if (['coordinator','manager'].includes(req.user.role) && req.user.department && doc.organizer && doc.organizer !== req.user.department)
      return res.status(403).json({ error: 'هذا السجل لا يتبع الجهة المرتبطة بحسابك' });

    const uniId = (req.body.uni_id || '').trim();
    const attended = !!req.body.attended;
    if (!uniId) return res.status(400).json({ error: 'الرقم الجامعي مفقود' });

    const students = Array.isArray(doc.students) ? doc.students : [];
    const idx = students.findIndex(s => (s.id || '').trim() === uniId);
    if (idx === -1) return res.status(404).json({ error: 'لم يُعثَر على هذا الطالب ضمن كشف المشاركين' });

    students[idx].attended = attended;
    students[idx].attend_time = attended ? new Date().toISOString() : '';
    doc.students = students;
    doc.markModified('students');
    await doc.save();

    res.json({ ok: true, attended, attend_time: students[idx].attend_time, message: attended ? 'تم تسجيل الحضور' : 'تم إلغاء تسجيل الحضور' });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ══ إرسال بريد إلكتروني جماعي لمشاركي/حاضري نشاط عبر Brevo (بند مستقل قابل للإزالة بسهولة:
// يكفي حذف هذا القسم + متغيّر BREVO_API_KEY من Railway + زر "📧 إرسال بريد" من quality.js) ══
async function sendBrevoEmail(toEmail, toName, subject, htmlContent) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) throw new Error('لم يتم ضبط مفتاح خدمة البريد (BREVO_API_KEY) بعد من إعدادات Railway');
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': apiKey, 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({
      sender: { name: 'عمادة شؤون الطلبة — الجامعة الأردنية', email: process.env.BREVO_SENDER_EMAIL || 'no-reply@ju.edu.jo' },
      to: [{ email: toEmail, name: toName || undefined }],
      subject,
      htmlContent,
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(()=> '');
    throw new Error('فشل إرسال البريد لـ ' + toEmail + ': ' + res.status + ' ' + body.slice(0,200));
  }
}

app.post('/api/participants/:id/send-email', auth(['admin']), async (req, res) => {
  try {
    const doc = await models['participants'].findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'السجل غير موجود' });
    if (['coordinator','manager'].includes(req.user.role) && req.user.department && doc.organizer && doc.organizer !== req.user.department)
      return res.status(403).json({ error: 'هذا السجل لا يتبع الجهة المرتبطة بحسابك' });

    const { subject, message, target } = req.body;
    if (!subject || !message) return res.status(400).json({ error: 'يرجى إدخال عنوان ونص الرسالة' });

    let students = Array.isArray(doc.students) ? doc.students : [];
    if (target === 'attended') students = students.filter(s => s.attended);
    students = students.filter(s => (s.email || '').trim());
    if (!students.length) return res.status(400).json({ error: 'لا يوجد أي طالب ضمن هذه المجموعة لديه بريد إلكتروني مُسجَّل' });

    const htmlContent = `<div dir="rtl" style="font-family:Tajawal,Arial,sans-serif;font-size:15px;line-height:1.8;color:#222">${String(message).replace(/\n/g,'<br>')}</div>`;
    const results = await Promise.allSettled(students.map(s => sendBrevoEmail(s.email.trim(), s.name, subject, htmlContent)));
    const sent = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.length - sent;
    const firstError = results.find(r => r.status === 'rejected')?.reason?.message || '';

    doc.email_sent = sent > 0 ? true : doc.email_sent;
    doc.email_sent_at = sent > 0 ? new Date() : doc.email_sent_at;
    doc.email_sent_count = sent > 0 ? sent : doc.email_sent_count;
    await doc.save();

    res.json({
      ok: sent > 0, sent, failed, total: students.length,
      message: sent > 0
        ? `تم إرسال ${sent} رسالة بنجاح${failed?` (فشل ${failed})`:''}`
        : `فشل إرسال كل الرسائل (${failed}). السبب: ${firstError || 'غير معروف'}`,
    });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

const EVAL_QUESTIONS = [
  'طريقة الإعلان عن الفعالية مناسبة',
  'تم دعوتي للحضور قبل مدة مناسبة',
  'برنامج الفعالية وأهدافها واضحة ومحكمة',
  'مدة وتوقيت الفعالية مناسب',
  'الموضوعات التي تضمّنتها الفعالية مرتبطة بالأهداف وحقّقتها',
  'موضوعات الفعالية متكاملة وتسير في تسلسل منطقي',
  'موضوعات الفعالية مثيرة ومرتبطة باهتماماتي',
  'تم إعطاء الفرصة للمشاركين للاستفسار وتقديم المقترحات',
  'أضافت الفعالية لي معارف وخبرات جديدة',
  'تم التعامل مع المشاركين باحترام ومهنية',
  'مكان الفعالية مناسب',
  'أنا راضٍ عن الفعالية بشكل عام',
];
// خيارات الإجابة الخمسة (يجب أن تطابق حرفياً قائمة EVAL_SCALE في public/eval.html)
const EVAL_SCALE = ['ممتازة','جيدة جداً','جيد','مقبول','ضعيف'];

// ══ رابط عام لاستبانة تقييم فعالية (بدون تسجيل دخول) ══
app.get('/api/public/eval-info/:id', async (req, res) => {
  try {
    const doc = await models['activity_evaluations'].findById(req.params.id).lean();
    if (!doc) return res.status(404).json({ error: 'رابط غير صالح أو تمت إزالة النشاط' });
    res.json({
      activity: doc.activity || '', date: doc.date || '', organizer: doc.organizer || '',
      response_count: Array.isArray(doc.responses) ? doc.responses.length : 0,
    });
  } catch(e) { res.status(404).json({ error: 'رابط غير صالح' }); }
});

// يضيف إجابة استبانة واحدة — كابتشا فقط (بلا حدّ معدّل، بنفس سياسة apply/register) + منع التكرار بالرقم الجامعي
app.post('/api/public/eval/:id/submit', async (req, res) => {
  try {
    const { captcha_token, captcha_answer } = req.body;
    const cap = publicCaptchas[captcha_token];
    if (!cap || Date.now() > cap.expires || Number(captcha_answer) !== cap.answer)
      return res.status(400).json({ error: 'إجابة التحقق غير صحيحة، يرجى المحاولة من جديد' });
    delete publicCaptchas[captcha_token];

    const doc = await models['activity_evaluations'].findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'رابط الاستبانة غير صالح' });

    const uniId = (req.body.uni_id || '').trim();
    if (!uniId) return res.status(400).json({ error: 'يرجى إدخال الرقم الجامعي' });

    const responses = Array.isArray(doc.responses) ? doc.responses : [];
    if (responses.some(r => (r.uni_id || '').trim() === uniId))
      return res.status(400).json({ error: 'لقد قمتِ/قمتَ بتعبئة هذه الاستبانة مسبقاً بنفس الرقم الجامعي' });

    const answers = Array.isArray(req.body.answers) ? req.body.answers : [];
    if (answers.length !== EVAL_QUESTIONS.length || answers.some(a => !EVAL_SCALE.includes(a)))
      return res.status(400).json({ error: 'يرجى الإجابة على جميع الأسئلة' });

    responses.push({
      uni_id: uniId,
      answers,
      comments: (req.body.comments || '').trim(),
      submitted_at: new Date().toISOString(),
    });
    doc.responses = responses;
    doc.markModified('responses');
    await doc.save();

    res.json({ ok: true, message: 'تم إرسال تقييمك بنجاح، شاكرين لك وقتك', count: responses.length });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

function auth(roles = []) {
  return (req, res, next) => {
    const u = sessions[(req.headers.authorization||'').replace('Bearer ','')];
    if (!u) return res.status(401).json({ error: 'يرجى تسجيل الدخول' });
    if (roles.length && !roles.includes(u.role))
      return res.status(403).json({ error: 'ليس لديك صلاحية' });
    req.user = u; next();
  };
}

// ══ Users ══
app.get('/api/users', auth(['admin']), async (req, res) => {
  const users = await User.find({}, { password: 0 });
  res.json(users);
});

app.post('/api/users', auth(['admin']), async (req, res) => {
  try {
    const { username, password, fullName, role, department } = req.body;
    if (!username||!password||!fullName||!role)
      return res.status(400).json({ error: 'يرجى ملء جميع الحقول' });
    const exists = await User.findOne({ username });
    if (exists) return res.status(400).json({ error: 'اسم المستخدم موجود بالفعل' });
    const user = await User.create({ username, password: bcrypt.hashSync(password,10), fullName, role, department: department||'' });
    res.json({ id: user._id, message: 'تم إنشاء المستخدم' });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/users/:id', auth(['admin']), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (user?.username === 'admin')
      return res.status(400).json({ error: 'لا يمكن حذف المدير الرئيسي' });
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'تم الحذف' });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/users/:id/change-password', auth(['admin']), async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 4)
      return res.status(400).json({ error: 'يرجى إدخال كلمة سر لا تقل عن 4 خانات' });
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'المستخدم غير موجود' });
    user.password = bcrypt.hashSync(newPassword, 10);
    await user.save();
    res.json({ message: 'تم تغيير كلمة السر بنجاح' });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ══ بند مؤقت: التفوق الفني — إدارة داخلية (admin فقط) ══
app.get('/api/talent_excellence', auth(['admin']), async (req, res) => {
  try {
    let query = {};
    const { q, status, activity, governorate } = req.query;
    if (status) query.status = status;
    if (governorate) query.governorate = governorate;
    if (activity) query.activity_types = activity;
    let docs = await TalentApp.find(query).sort({ createdAt: -1 }).lean();
    if (q) {
      const ql = q.toLowerCase();
      docs = docs.filter(d => JSON.stringify(d).toLowerCase().includes(ql));
    }
    res.json(docs.map(d => ({ ...d, id: String(d._id), _id: String(d._id) })));
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/talent_excellence/settings', auth(['admin']), async (req, res) => {
  try {
    const s = await TalentSettings.findOne({ key: 'talent_excellence' }).lean();
    res.json({ close_date: s?.close_date || null, committee_members: s?.committee_members || [] });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/talent_excellence/settings', auth(['admin']), async (req, res) => {
  try {
    await TalentSettings.findOneAndUpdate(
      { key: 'talent_excellence' },
      { key: 'talent_excellence', close_date: req.body.close_date || null, committee_members: Array.isArray(req.body.committee_members) ? req.body.committee_members : [] },
      { upsert: true }
    );
    res.json({ message: 'تم الحفظ' });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/talent_excellence/:id', auth(['admin']), async (req, res) => {
  try {
    const doc = await TalentApp.findById(req.params.id).lean();
    if (!doc) return res.status(404).json({ error: 'غير موجود' });
    res.json({ ...doc, id: String(doc._id), _id: String(doc._id) });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/talent_excellence/:id', auth(['admin']), async (req, res) => {
  try {
    await TalentApp.findByIdAndUpdate(req.params.id, { ...req.body, updated_by: req.user.username, updatedAt: new Date() }, { new: true });
    res.json({ message: 'تم التحديث' });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/talent_excellence/:id', auth(['admin']), async (req, res) => {
  try {
    await TalentApp.findByIdAndDelete(req.params.id);
    res.json({ message: 'تم الحذف' });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ══ نظام حجز الغرف الفندقية — إدارة داخلية (admin فقط) ══
app.get('/api/room_booking/cycles', auth(['admin']), async (req, res) => {
  try {
    const docs = await BookingCycle.find().sort({ createdAt: -1 }).lean();
    res.json(docs.map(d => ({ ...d, id: String(d._id), _id: String(d._id) })));
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/room_booking/cycles', auth(['admin']), async (req, res) => {
  try {
    if (!req.body.activity_id || !req.body.activity_name) return res.status(400).json({ error: 'يرجى اختيار النشاط' });
    const verify_source = req.body.verify_source === 'attended' ? 'attended' : 'all';
    const doc = await BookingCycle.create({ activity_id: req.body.activity_id, activity_name: req.body.activity_name, verify_source, hotels: [], created_by: req.user.username });
    res.json({ id: doc._id, message: 'تم إنشاء دورة الحجز' });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/room_booking/cycles/:id', auth(['admin']), async (req, res) => {
  try {
    const doc = await BookingCycle.findById(req.params.id).lean();
    if (!doc) return res.status(404).json({ error: 'غير موجود' });
    res.json({ ...doc, id: String(doc._id), _id: String(doc._id) });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// تحديث كامل قائمة الفنادق (يشمل إضافة/تعديل فندق أو إعدادات غرفه) — استبدال كامل لمصفوفة hotels
app.put('/api/room_booking/cycles/:id', auth(['admin']), async (req, res) => {
  try {
    if (!Array.isArray(req.body.hotels)) return res.status(400).json({ error: 'بيانات غير صحيحة' });
    const update = { hotels: req.body.hotels, updated_by: req.user.username, updatedAt: new Date() };
    if (req.body.verify_source === 'attended' || req.body.verify_source === 'all') update.verify_source = req.body.verify_source;
    await BookingCycle.findByIdAndUpdate(req.params.id, update);
    res.json({ message: 'تم الحفظ' });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/room_booking/cycles/:id', auth(['admin']), async (req, res) => {
  try {
    await BookingCycle.findByIdAndDelete(req.params.id);
    res.json({ message: 'تم الحذف' });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ══ الدورات التدريبية — إدارة داخلية (admin وeditor) ══
app.get('/api/training_courses', auth(['admin','editor']), async (req, res) => {
  try {
    const docs = await TrainingCourse.find().sort({ createdAt: -1 }).lean();
    res.json(docs.map(d => ({ ...d, id: String(d._id), _id: String(d._id) })));
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/training_courses', auth(['admin','editor']), async (req, res) => {
  try {
    if (!req.body.name || !req.body.cap) return res.status(400).json({ error: 'يرجى إدخال اسم الدورة والحد الأقصى للتسجيل' });
    const doc = await TrainingCourse.create({
      name: req.body.name, organizer: req.body.organizer||'', hours: req.body.hours||'',
      quota_note: req.body.quota_note||'', cap: Number(req.body.cap)||0,
      close_date: req.body.close_date||null, description: req.body.description||'',
      registrants: [], created_by: req.user.username,
    });
    res.json({ id: doc._id, message: 'تم إنشاء الدورة' });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/training_courses/:id', auth(['admin','editor']), async (req, res) => {
  try {
    const doc = await TrainingCourse.findById(req.params.id).lean();
    if (!doc) return res.status(404).json({ error: 'غير موجود' });
    res.json({ ...doc, id: String(doc._id), _id: String(doc._id) });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/training_courses/:id', auth(['admin','editor']), async (req, res) => {
  try {
    const update = { updated_by: req.user.username, updatedAt: new Date() };
    ['name','organizer','hours','quota_note','cap','close_date','description'].forEach(k => {
      if (req.body[k] !== undefined) update[k] = k==='cap' ? Number(req.body[k]) : req.body[k];
    });
    if (Array.isArray(req.body.registrants)) update.registrants = req.body.registrants;
    await TrainingCourse.findByIdAndUpdate(req.params.id, update);
    res.json({ message: 'تم الحفظ' });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/training_courses/:id', auth(['admin','editor']), async (req, res) => {
  try {
    await TrainingCourse.findByIdAndDelete(req.params.id);
    res.json({ message: 'تم الحذف' });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ══ تعليمات النشاط — إدارة داخلية (Admin فقط، بنفس تقييد إرسال البريد الجماعي
// لأن نشر تعليمة يُرسل بريداً جماعياً أيضاً). لا CRUD مستقلاً — التعليمات تُقرأ/تُعدَّل
// كجزء من سجل "أسماء المشاركين" نفسه (عبر PUT /api/participants/:id العام،
// بحقلي instructions و instructions_verify_source). المسار الوحيد المخصَّص هنا هو
// النشر (لأنه يُشغِّل إرسال البريد كأثر جانبي، وليس مجرد تعديل بيانات) ══
app.post('/api/participants/:id/post-instruction', auth(['admin']), async (req, res) => {
  try {
    const doc = await models['participants'].findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'السجل غير موجود' });
    const text = (req.body.text || '').trim();
    const link = (req.body.link || '').trim();
    if (!text) return res.status(400).json({ error: 'يرجى كتابة نص التعليمة' });

    const post = { id: genCourseId(), text, link, posted_at: new Date(), posted_by: req.user.username };
    doc.instructions = doc.instructions || [];
    doc.instructions.push(post);
    doc.markModified('instructions');
    await doc.save();

    // إرسال التنبيه البريدي
    let sent = 0, failed = 0;
    try {
      let students = doc.students || [];
      if (doc.instructions_verify_source === 'attended') students = students.filter(s => s.attended);
      students = students.filter(s => (s.email || '').trim());
      const subject = 'تعليمة جديدة — ' + doc.activity;
      const linkLine = link ? `<p><a href="${link}">${link}</a></p>` : '';
      const htmlContent = `<div dir="rtl" style="font-family:Tajawal,Arial,sans-serif;font-size:15px;line-height:1.8;color:#222">
        <p><strong>${doc.activity}</strong></p>
        <p>${text.replace(/\n/g,'<br>')}</p>
        ${linkLine}
      </div>`;
      const results = await Promise.allSettled(students.map(s => sendBrevoEmail(s.email.trim(), s.name, subject, htmlContent)));
      sent = results.filter(r => r.status === 'fulfilled').length;
      failed = results.length - sent;
    } catch(e) { failed = -1; }

    res.json({ message: `تم نشر التعليمة${sent?` وإرسال تنبيه بريدي لـ ${sent} مشارك`:''}${failed>0?` (فشل ${failed})`:''}`, post_id: post.id, sent, failed });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ══ النظام المالي — تسجيل دفعة (فردية أو جماعية بسند واحد) لطلبة مسجَّلين بالفعل في النشاط ══
app.post('/api/participants/:id/pay', auth(['admin']), async (req, res) => {
  try {
    const doc = await models['participants'].findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'السجل غير موجود' });
    const payerName = (req.body.payer_name || '').trim();
    const method = req.body.payment_method === 'cliq' ? 'cliq' : 'cash';
    const uniIds = Array.isArray(req.body.student_ids) ? req.body.student_ids.map(x => String(x).trim()).filter(Boolean) : [];
    if (!payerName) return res.status(400).json({ error: 'يرجى إدخال اسم من قام بالدفع' });
    if (!uniIds.length) return res.status(400).json({ error: 'يرجى اختيار طالب واحد على الأقل' });
    const feeAmount = Number(doc.fee_amount) || 0;
    if (!feeAmount) return res.status(400).json({ error: 'يرجى تحديد رسوم النشاط أولاً' });

    const students = doc.students || [];
    const covered = [];
    for (const uid of uniIds) {
      const idx = students.findIndex(s => (s.id||'').trim() === uid);
      if (idx === -1) return res.status(404).json({ error: `الرقم الجامعي ${uid} غير مسجَّل ضمن هذا النشاط` });
      if (students[idx].payment_status === 'paid') return res.status(400).json({ error: `${students[idx].name} مدفوع بالفعل` });
      covered.push({ idx, uni_id: uid, name: students[idx].name });
    }

    const receipt_no = await nextReceiptNo();
    const total_amount = feeAmount * covered.length;
    const receipt = await PaymentReceipt.create({
      receipt_no, activity_id: String(doc._id), activity_name: doc.activity,
      payer_name: payerName, payment_method: method, fee_amount: feeAmount, total_amount,
      students: covered.map(c => ({ uni_id: c.uni_id, name: c.name })),
      created_by: req.user.username,
    });

    const now = new Date();
    covered.forEach(c => {
      students[c.idx].payment_status = 'paid';
      students[c.idx].payment_amount = feeAmount;
      students[c.idx].payment_method = method;
      students[c.idx].receipt_no = receipt_no;
      students[c.idx].paid_by = payerName;
      students[c.idx].paid_at = now;
    });
    doc.students = students;
    doc.markModified('students');
    await doc.save();

    res.json({ message: `تم تسجيل الدفع بنجاح — سند رقم ${receipt_no}`, receipt_no, receipt_id: receipt._id });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/participants/:id/refund', auth(['admin']), async (req, res) => {
  try {
    const doc = await models['participants'].findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'السجل غير موجود' });
    const uniId = (req.body.id || '').trim();
    const refundAmount = Number(req.body.refund_amount);
    const reason = (req.body.reason || '').trim();
    if (!uniId) return res.status(400).json({ error: 'بيانات ناقصة' });
    if (isNaN(refundAmount) || refundAmount < 0) return res.status(400).json({ error: 'يرجى إدخال مبلغ استرجاع صحيح' });
    const students = doc.students || [];
    const idx = students.findIndex(s => (s.id||'').trim() === uniId);
    if (idx === -1) return res.status(404).json({ error: 'الطالب غير موجود ضمن هذا النشاط' });
    if (students[idx].payment_status !== 'paid') return res.status(400).json({ error: 'هذا الطالب ليس في حالة "مدفوع"' });
    students[idx].payment_status = 'refunded';
    students[idx].refund_amount = refundAmount;
    students[idx].refund_reason = reason;
    students[idx].refund_at = new Date();
    students[idx].refund_by = req.user.username;
    doc.students = students;
    doc.markModified('students');
    await doc.save();
    res.json({ message: 'تم تسجيل الاسترجاع بنجاح' });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/payment_receipts/:receiptNo', auth(['admin']), async (req, res) => {
  try {
    const r = await PaymentReceipt.findOne({ receipt_no: Number(req.params.receiptNo) }).lean();
    if (!r) return res.status(404).json({ error: 'السند غير موجود' });
    res.json({ ...r, id: String(r._id) });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// إزالة نشاط بالكامل من تتبّع النظام المالي (إلغاء الرسوم وأي بيانات دفع/استرجاع مرتبطة
// بطلبته) — لا يحذف سجل "أسماء المشاركين" نفسه، ولا سندات القبض الصادرة فعلياً (تبقى
// كسجل تدقيق دائم رغم أن النشاط لن يظهر بعد الآن في شاشة النظام المالي)
app.post('/api/participants/:id/finance/reset', auth(['admin']), async (req, res) => {
  try {
    const doc = await models['participants'].findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'السجل غير موجود' });
    doc.fee_amount = null;
    const fields = ['payment_status','payment_amount','payment_method','receipt_no','paid_by','paid_at','refund_amount','refund_reason','refund_at','refund_by'];
    doc.students = (doc.students || []).map(s => {
      const copy = { ...(s.toObject ? s.toObject() : s) };
      fields.forEach(f => delete copy[f]);
      return copy;
    });
    doc.markModified('students');
    await doc.save();
    res.json({ message: 'تم إلغاء تتبّع النظام المالي لهذا النشاط' });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ══ CRUD لجميع الجداول ══
TABLES.forEach(table => {
  const Model = models[table];

  app.get(`/api/${table}`, auth(), async (req, res) => {
    try {
      let query = {};
      const { q, activity, college, gender, status } = req.query;
      if (activity) query.activity = activity;
      if (college)  query.college  = college;
      if (gender)   query.gender   = gender;
      if (status)   query.status   = status;
      if (req.query.from || req.query.to) {
        query['$or'] = [
          { date:      { ...(req.query.from?{$gte:req.query.from}:{}), ...(req.query.to?{$lte:req.query.to}:{}) } },
          { join_date: { ...(req.query.from?{$gte:req.query.from}:{}), ...(req.query.to?{$lte:req.query.to}:{}) } },
          { ach_date:  { ...(req.query.from?{$gte:req.query.from}:{}), ...(req.query.to?{$lte:req.query.to}:{}) } },
        ];
      }
      let docs = await Model.find(query).sort({ createdAt: -1 }).lean();
      if (q) {
        const ql = q.toLowerCase();
        docs = docs.filter(d => JSON.stringify(d).toLowerCase().includes(ql));
      }
      res.json(docs.map(d => ({ ...d, id: String(d._id), _id: String(d._id) })));
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  app.get(`/api/${table}/:id`, auth(), async (req, res) => {
    try {
      const doc = await Model.findById(req.params.id).lean();
      if (!doc) return res.status(404).json({ error: 'غير موجود' });
      res.json({ ...doc, id: String(doc._id), _id: String(doc._id) });
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  const postRoles = ['activity_requests','announcements'].includes(table) ? ['admin','editor','coordinator','manager'] : ['admin','editor'];
  app.post(`/api/${table}`, auth(postRoles), async (req, res) => {
    try {
      const body = { ...req.body };
      if (table === 'activity_requests') {
        if (!body.ref_code) body.ref_code = genRefCode();
        if (!body.status) body.status = 'pending';
      }
      const doc = await Model.create({ ...body, created_by: req.user.username });
      res.json({ id: doc._id, ref_code: doc.ref_code, message: 'تم الحفظ بنجاح' });
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  const AR_QUALITY = ['student_activities','student_activities_external','participants'];
  const putRoles = AR_QUALITY.includes(table) ? ['admin','editor','coordinator','manager'] : ['admin','editor'];
  app.put(`/api/${table}/:id`, auth(putRoles), async (req, res) => {
    try {
      const existing = await Model.findById(req.params.id);
      if (AR_QUALITY.includes(table) && ['coordinator','manager'].includes(req.user.role) && req.user.department) {
        if (existing && existing.organizer && existing.organizer !== req.user.department)
          return res.status(403).json({ error: 'هذا السجل لا يتبع الجهة المرتبطة بحسابك' });
      }
      if (HISTORY_TABLES.includes(table) && existing) {
        await RecordHistory.create({ table, record_id: req.params.id, snapshot: existing.toObject(), action: 'update', changed_by: req.user.username });
      }
      await Model.findByIdAndUpdate(req.params.id,
        { ...req.body, updated_by: req.user.username, updatedAt: new Date() },
        { new: true }
      );
      res.json({ message: 'تم التحديث' });
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  app.delete(`/api/${table}/:id`, auth(['admin']), async (req, res) => {
    try {
      if (HISTORY_TABLES.includes(table)) {
        const existingForHistory = await Model.findById(req.params.id);
        if (existingForHistory) {
          await RecordHistory.create({ table, record_id: req.params.id, snapshot: existingForHistory.toObject(), action: 'delete', changed_by: req.user.username });
        }
      }
      const deleted = await Model.findByIdAndDelete(req.params.id);
      // ══ حذف تسلسلي (Cascade Delete): عند حذف طلب نشاط أو سجل جودة نشاط،
      // تُحذف تلقائياً سجلات «أسماء المشاركين» و«استبانة تقييم الفعالية» و«الإعلان المُرحَّل» و«حجز القاعة» المرتبطة
      // بنفس النشاط (عبر request_id المشترك) — فيتوقف رابط التسجيل ورابط الاستبانة فوراً ويُحذف الإعلان وحجز القاعة.
      if (deleted && ['activity_requests','student_activities','student_activities_external'].includes(table)) {
        // معرّف الطلب الأصلي: للسجل في activity_requests هو _id نفسه، ولبقية الجداول هو حقل request_id
        const reqId = table === 'activity_requests' ? String(deleted._id) : (deleted.request_id || null);
        if (reqId) {
          await models['participants'].deleteMany({ request_id: reqId });
          await models['activity_evaluations'].deleteMany({ request_id: reqId });
          await models['announcements'].deleteMany({ request_id: reqId });
          await models['hall_bookings'].deleteMany({ request_id: reqId });
          // عند حذف الطلب الأصلي نفسه، تُحذف أيضاً سجلات الجودة المُرحَّلة منه
          if (table === 'activity_requests') {
            await models['student_activities'].deleteMany({ request_id: reqId });
            await models['student_activities_external'].deleteMany({ request_id: reqId });
          }
        }
      }
      res.json({ message: 'تم الحذف' });
    } catch(e) { res.status(500).json({ error: e.message }); }
  });
});

// ══ السجل التاريخي: عرض النسخ السابقة لسجل مُعيّن (قبل كل تعديل/حذف) ══
app.get('/api/record-history/:table/:recordId', auth(), async (req, res) => {
  try {
    const { table, recordId } = req.params;
    if (!HISTORY_TABLES.includes(table)) return res.json([]);
    const rows = await RecordHistory.find({ table, record_id: recordId }).sort({ changed_at: -1 }).limit(30).lean();
    res.json(rows.map(r => ({ id: String(r._id), action: r.action, changed_by: r.changed_by, changed_at: r.changed_at, snapshot: r.snapshot })));
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ══ استرجاع نسخة سابقة من السجل التاريخي ══
app.post('/api/record-history/:historyId/restore', auth(), async (req, res) => {
  try {
    const hist = await RecordHistory.findById(req.params.historyId).lean();
    if (!hist) return res.status(404).json({ error: 'النسخة غير موجودة' });
    if (!HISTORY_TABLES.includes(hist.table)) return res.status(400).json({ error: 'هذا الجدول لا يدعم الاسترجاع' });
    if (req.user.role==='manager' || req.user.role==='coordinator') {
      // نفس قيد الجهة المطبَّق على التعديل العادي
      if (req.user.department && hist.snapshot.organizer && hist.snapshot.organizer !== req.user.department)
        return res.status(403).json({ error: 'هذا السجل لا يتبع الجهة المرتبطة بحسابك' });
    } else if (!['admin','editor'].includes(req.user.role)) {
      return res.status(403).json({ error: 'غير مصرَّح لك بهذا الإجراء' });
    }
    const Model = models[hist.table];
    const { _id, __v, createdAt, updatedAt, ...data } = hist.snapshot;
    const existing = await Model.findById(hist.record_id);
    if (existing) {
      // حفظ نسخة من الحالة الحالية أيضاً قبل الاسترجاع، حتى يمكن التراجع عن الاسترجاع نفسه إن لزم
      await RecordHistory.create({ table: hist.table, record_id: hist.record_id, snapshot: existing.toObject(), action: 'update', changed_by: req.user.username });
      await Model.findByIdAndUpdate(hist.record_id, { ...data, updated_by: req.user.username, updatedAt: new Date() });
    } else {
      await Model.create({ ...data, _id: hist.record_id, updated_by: req.user.username });
    }
    res.json({ message: 'تم استرجاع النسخة بنجاح' });
  } catch(e) { res.status(500).json({ error: e.message }); }
});
app.post('/api/activity_requests/:id/send-logistics', auth(['dean','admin']), async (req, res) => {
  try {
    const Model = models['activity_requests'];
    const doc = await Model.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'الطلب غير موجود' });
    if ((doc.status||'pending') !== 'awaiting_dean') return res.status(400).json({ error: 'هذا الإجراء متاح فقط أثناء مرحلة اعتماد العميد' });
    const places = Array.isArray(doc.svc_places) ? doc.svc_places : [];
    const needsFacilities = places.some(p => FACILITIES_PLACES.includes(p));
    const needsSports = places.some(p => SPORTS_PLACES.includes(p));
    if (!needsFacilities && !needsSports) return res.status(400).json({ error: 'لم يُطلَب أي مكان يحتاج موافقة ضمن هذا الطلب' });
    const now = new Date().toISOString();
    const update = {};
    if (needsFacilities) { update.facilities_review_status = 'pending'; update.facilities_review_sent_by = req.user.fullName; update.facilities_review_sent_at = now; update.facilities_review_by=''; update.facilities_review_at=''; update.facilities_review_note=''; }
    if (needsSports) { update.sports_review_status = 'pending'; update.sports_review_sent_by = req.user.fullName; update.sports_review_sent_at = now; update.sports_review_by=''; update.sports_review_at=''; update.sports_review_note=''; }
    await Model.findByIdAndUpdate(doc._id, update);
    res.json({ message: 'تم تحويل طلب الخدمات اللوجستية للجهات المعنية' });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// دالة مشتركة: موافقة/رفض مدير دائرة على الأماكن الخاصة بدائرته ضمن طلب مُحال إليه
async function logisticsDecision(req, res, { dept, places, statusField, byField, atField, noteField, bookingIdsField }) {
  try {
    if (req.user.role==='manager' && req.user.department !== dept)
      return res.status(403).json({ error: `هذا الإجراء مخصص لمدير ${dept} فقط` });
    const Model = models['activity_requests'];
    const doc = await Model.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'الطلب غير موجود' });
    if (doc[statusField] !== 'pending') return res.status(400).json({ error: 'لا يوجد طلب بانتظار ردّك لهذا النشاط' });
    const { action, note } = req.body;
    const now = new Date().toISOString();
    if (action === 'approve') {
      const myPlaces = (doc.svc_places||[]).filter(p => places.includes(p));
      const bookingIds = [];
      for (const place of myPlaces) {
        const booking = await models['hall_bookings'].create({
          hall: place, day: weekdayNameFromDate(doc.activity_date), date: doc.activity_date || '',
          time_from: doc.time_from || '', time_to: doc.time_to || '', purpose: doc.title || '', supervisor: doc.supervisor || '',
          confirmed: false, request_id: String(doc._id), created_by: req.user.username,
          source: `محجوز مبدئياً بانتظار الاعتماد النهائي للنشاط — ${doc.title}`
        });
        bookingIds.push(String(booking._id));
      }
      await Model.findByIdAndUpdate(doc._id, { [statusField]:'approved', [byField]:req.user.fullName, [atField]:now, [noteField]:note||'', [bookingIdsField]:bookingIds });
      return res.json({ message: 'تمت الموافقة على الأماكن المطلوبة، وتم إنشاء حجز مبدئي بانتظار اعتماد العميد النهائي' });
    }
    if (action === 'reject') {
      await Model.findByIdAndUpdate(doc._id, { [statusField]:'rejected', [byField]:req.user.fullName, [atField]:now, [noteField]:note||'' });
      return res.json({ message: 'تم إرسال الرفض للعميد' });
    }
    return res.status(400).json({ error: 'إجراء غير معروف' });
  } catch(e) { res.status(500).json({ error: e.message }); }
}

// ══ مدير دائرة الخدمات الفنية والتطوير: موافقة/رفض الأماكن الخاصة بدائرته ══
app.post('/api/activity_requests/:id/facilities-decision', auth(['manager','admin']), (req, res) =>
  logisticsDecision(req, res, { dept: FACILITIES_DEPT, places: FACILITIES_PLACES, statusField:'facilities_review_status', byField:'facilities_review_by', atField:'facilities_review_at', noteField:'facilities_review_note', bookingIdsField:'facilities_booking_ids' })
);

// ══ مدير دائرة النشاطات الرياضية: موافقة/رفض الأماكن الخاصة بدائرته ══
app.post('/api/activity_requests/:id/sports-decision', auth(['manager','admin']), (req, res) =>
  logisticsDecision(req, res, { dept: SPORTS_DEPT, places: SPORTS_PLACES, statusField:'sports_review_status', byField:'sports_review_by', atField:'sports_review_at', noteField:'sports_review_note', bookingIdsField:'sports_booking_ids' })
);

// ══ مسار قرارات طلب إقامة النشاط (منسّق ← مدير ← عميد) ══
app.post('/api/activity_requests/:id/decision', auth(), async (req, res) => {
  try {
    const Model = models['activity_requests'];
    const doc = await Model.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'الطلب غير موجود' });
    const { action, note, categories } = req.body;
    const role = req.user.role;
    const status = doc.status || 'pending';
    const now = new Date().toISOString();

    // اعتماد مباشر من مدير النظام (تجاوز كل المراحل)
    if (action === 'admin_approve') {
      if (role !== 'admin') return res.status(403).json({ error: 'هذا الإجراء مخصص لمدير النظام فقط' });
      if (['approved','rejected'].includes(status)) return res.status(400).json({ error: 'الطلب منتهي بالفعل' });
      if (!Array.isArray(categories) || !categories.length) return res.status(400).json({ error: 'يرجى اختيار تصنيف واحد على الأقل' });
      await Model.findByIdAndUpdate(doc._id, {
        status: 'approved', approved_by: req.user.fullName, approved_at: now,
        approval_note: note || '', categories, admin_override: true
      });
      const participantsDoc1 = await models['participants'].create({ ...buildParticipantsRecordFromRequest(doc), created_by: req.user.username });
      await models[doc.submitted_via==='public_link'?'student_activities_external':'student_activities'].create({ ...buildActivityRecordFromRequest(doc, categories), created_by: req.user.username, attached_participant_id: String(participantsDoc1._id) });
      await models['activity_evaluations'].create({ ...buildEvalRecordFromRequest(doc), created_by: req.user.username });
      return res.json({ message: 'تم الاعتماد المباشر بنجاح' });
    }

    if (status === 'pending') {
      if (!['coordinator','admin'].includes(role)) return res.status(403).json({ error: 'هذا الإجراء مخصص لمنسّق الفعالية فقط' });
      if (role==='coordinator' && req.user.department && doc.organizer !== req.user.department)
        return res.status(403).json({ error: 'هذا الطلب لا يتبع الجهة المنظمة المرتبطة بحسابك' });
      if (action === 'forward') {
        await Model.findByIdAndUpdate(doc._id, {
          status: 'awaiting_manager', coordinator_by: req.user.fullName, coordinator_at: now,
          manager_return_note: '', manager_return_by: '', manager_return_at: ''
        });
        return res.json({ message: 'تم تمرير الطلب إلى المدير' });
      }
      if (action === 'reject') {
        await Model.findByIdAndUpdate(doc._id, { status: 'rejected', rejected_by: req.user.fullName, rejected_at: now, rejection_note: note || '', rejected_stage: 'coordinator' });
        return res.json({ message: 'تم رفض الطلب' });
      }
      return res.status(400).json({ error: 'إجراء غير معروف' });
    }

    if (status === 'awaiting_manager') {
      if (!['manager','admin'].includes(role)) return res.status(403).json({ error: 'هذا الإجراء مخصص للمدير فقط' });
      if (role==='manager' && req.user.department && doc.organizer !== req.user.department)
        return res.status(403).json({ error: 'هذا الطلب لا يتبع الجهة المنظمة المرتبطة بحسابك' });
      if (action === 'forward') {
        await Model.findByIdAndUpdate(doc._id, {
          status: 'awaiting_dean', manager_by: req.user.fullName, manager_at: now,
          dean_return_note: '', dean_return_by: '', dean_return_at: ''
        });
        return res.json({ message: 'تمت الموافقة وتمرير الطلب إلى العميد' });
      }
      if (action === 'return') {
        await Model.findByIdAndUpdate(doc._id, {
          status: 'pending', manager_return_by: req.user.fullName, manager_return_at: now, manager_return_note: note || '',
          dean_return_note: '', dean_return_by: '', dean_return_at: ''
        });
        return res.json({ message: 'تم إرجاع الطلب إلى منسّق الفعالية لإجراء التعديل' });
      }
      if (action === 'reject') {
        await Model.findByIdAndUpdate(doc._id, { status: 'rejected', rejected_by: req.user.fullName, rejected_at: now, rejection_note: note || '', rejected_stage: 'manager' });
        return res.json({ message: 'تم رفض الطلب نهائياً' });
      }
      return res.status(400).json({ error: 'إجراء غير معروف' });
    }

    if (status === 'awaiting_dean') {
      if (!['dean','admin'].includes(role)) return res.status(403).json({ error: 'هذا الإجراء مخصص للعميد فقط' });
      const allBookingIds = [...(doc.facilities_booking_ids||[]), ...(doc.sports_booking_ids||[])];
      if (action === 'approve') {
        if (!Array.isArray(categories) || !categories.length) return res.status(400).json({ error: 'يرجى اختيار تصنيف واحد على الأقل' });
        await Model.findByIdAndUpdate(doc._id, { status: 'approved', approved_by: req.user.fullName, approved_at: now, approval_note: note || '', categories });
        const participantsDoc2 = await models['participants'].create({ ...buildParticipantsRecordFromRequest(doc), created_by: req.user.username });
        await models[doc.submitted_via==='public_link'?'student_activities_external':'student_activities'].create({ ...buildActivityRecordFromRequest(doc, categories), created_by: req.user.username, attached_participant_id: String(participantsDoc2._id) });
        await models['activity_evaluations'].create({ ...buildEvalRecordFromRequest(doc), created_by: req.user.username });
        // تأكيد كل الحجوزات المبدئية للأماكن (إن وُجدت) بعد الاعتماد النهائي
        for (const bId of allBookingIds) {
          await models['hall_bookings'].findByIdAndUpdate(bId, { confirmed: true, source: `تم تأكيد الحجز — النشاط معتمَد نهائياً — ${doc.title}` });
        }
        return res.json({ message: 'تم الاعتماد النهائي بنجاح' });
      }
      if (action === 'final_reject') {
        // إلغاء كل الحجوزات المبدئية للأماكن (إن وُجدت) لأن الطلب رُفض نهائياً
        for (const bId of allBookingIds) { await models['hall_bookings'].findByIdAndDelete(bId); }
        await Model.findByIdAndUpdate(doc._id, {
          status: 'rejected', rejected_by: req.user.fullName, rejected_at: now, rejection_note: note || '', rejected_stage: 'dean',
          facilities_booking_ids: [], facilities_review_status: '', facilities_review_by: '', facilities_review_at: '', facilities_review_note: '',
          sports_booking_ids: [], sports_review_status: '', sports_review_by: '', sports_review_at: '', sports_review_note: ''
        });
        return res.json({ message: 'تم رفض الطلب نهائياً' });
      }
      if (action === 'reject') {
        // إلغاء كل الحجوزات المبدئية للأماكن (إن وُجدت) لأن الطلب عاد خطوة للخلف ويحتاج مراجعة من جديد
        for (const bId of allBookingIds) { await models['hall_bookings'].findByIdAndDelete(bId); }
        await Model.findByIdAndUpdate(doc._id, {
          status: 'awaiting_manager', dean_return_by: req.user.fullName, dean_return_at: now, dean_return_note: note || '',
          facilities_booking_ids: [], facilities_review_status: '', facilities_review_by: '', facilities_review_at: '', facilities_review_note: '', facilities_review_sent_by: '', facilities_review_sent_at: '',
          sports_booking_ids: [], sports_review_status: '', sports_review_by: '', sports_review_at: '', sports_review_note: '', sports_review_sent_by: '', sports_review_sent_at: ''
        });
        return res.json({ message: 'تم إرجاع الطلب إلى المدير' });
      }
      return res.status(400).json({ error: 'إجراء غير معروف' });
    }

    if (status === 'rejected' && action === 'reopen') {
      if (!['coordinator','admin'].includes(role)) return res.status(403).json({ error: 'إعادة الفتح مخصصة لمنسّق الفعالية فقط' });
      if (role==='coordinator' && req.user.department && doc.organizer !== req.user.department)
        return res.status(403).json({ error: 'هذا الطلب لا يتبع الجهة المنظمة المرتبطة بحسابك' });
      await Model.findByIdAndUpdate(doc._id, {
        status: 'pending',
        rejected_by: '', rejected_at: '', rejection_note: '', rejected_stage: '',
        reopened_by: req.user.fullName, reopened_at: now
      });
      return res.json({ message: 'تمت إعادة فتح الطلب — يمكنك الآن تعديل بياناته وتمريره من جديد' });
    }

    return res.status(400).json({ error: 'الحالة الحالية للطلب لا تسمح بأي إجراء' });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ══ تعديل بيانات طلب النشاط (مسموح فقط للمنسّق/المدير أثناء مرحلتهما لإجراء تصحيح) ══
const AR_EDITABLE_FIELDS = [
  'type','title','ad_title','description','goals','audience','cost','organizer',
  'student_name','student_id','phone','college','submit_date',
  'activity_date','time_from','time_to','location',
  'svc_places','svc_activity_point','svc_community_service','svc_security','svc_other',
  'supervisor','sup_college','sup_phone','guests','ext_name','ext_people'
];
app.post('/api/activity_requests/:id/edit-content', auth(), async (req, res) => {
  try {
    const Model = models['activity_requests'];
    const doc = await Model.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'الطلب غير موجود' });
    const role = req.user.role;
    const status = doc.status || 'pending';
    if (status === 'pending' && !['coordinator','admin'].includes(role))
      return res.status(403).json({ error: 'التعديل في هذه المرحلة مخصص لمنسّق الفعالية فقط' });
    if (status === 'pending' && role==='coordinator' && req.user.department && doc.organizer !== req.user.department)
      return res.status(403).json({ error: 'هذا الطلب لا يتبع الجهة المنظمة المرتبطة بحسابك' });
    if (status === 'awaiting_manager' && !['manager','admin'].includes(role))
      return res.status(403).json({ error: 'التعديل في هذه المرحلة مخصص للمدير فقط' });
    if (status === 'awaiting_manager' && role==='manager' && req.user.department && doc.organizer !== req.user.department)
      return res.status(403).json({ error: 'هذا الطلب لا يتبع الجهة المنظمة المرتبطة بحسابك' });
    if (!['pending','awaiting_manager'].includes(status) && role !== 'admin')
      return res.status(403).json({ error: 'لا يمكن تعديل بيانات الطلب في هذه المرحلة' });

    const update = {};
    AR_EDITABLE_FIELDS.forEach(f => { if (req.body[f] !== undefined) update[f] = req.body[f]; });
    if (!update.title) return res.status(400).json({ error: 'يرجى ملء عنوان الفعالية' });
    await Model.findByIdAndUpdate(doc._id, update);
    res.json({ message: 'تم حفظ التعديلات بنجاح' });
  } catch(e) { res.status(500).json({ error: e.message }); }
});
app.get('/api/track', async (req, res) => {
  try {
    const { ref, sid } = req.query;
    if (!ref || !sid) return res.status(400).json({ error: 'يرجى إدخال الرقم المرجعي والرقم الجامعي' });
    const doc = await models['activity_requests'].findOne({
      ref_code: String(ref).trim().toUpperCase(),
      student_id: String(sid).trim()
    }).lean();
    if (!doc) return res.status(404).json({ error: 'لم يتم العثور على طلب مطابق. تأكد من الرقم المرجعي والرقم الجامعي' });
    const labels = {
      pending: 'قيد مراجعة منسّق الفعالية',
      awaiting_manager: 'قيد مراجعة المدير',
      awaiting_dean: 'قيد اعتماد العميد',
      approved: 'تم الاعتماد النهائي ✅',
      rejected: 'تم رفض الطلب ❌'
    };
    const status = doc.status || 'pending';
    res.json({
      title: doc.title, activity_date: doc.activity_date, submit_date: doc.submit_date,
      status, status_label: labels[status] || status,
      rejection_note: status === 'rejected' ? (doc.rejection_note || '') : '',
      dean_return_note: status === 'awaiting_manager' ? (doc.dean_return_note || '') : ''
    });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ══ إحصائيات ══
app.get('/api/stats', auth(), async (req, res) => {
  try {
    const stats = {};
    await Promise.all(TABLES.map(async t => {
      stats[t] = await models[t].countDocuments();
    }));
    const pendingQuery = { status: { $in: ['pending','awaiting_manager','awaiting_dean'] } };
    if (['coordinator','manager'].includes(req.user.role) && req.user.department) pendingQuery.organizer = req.user.department;
    stats.pending_requests = await models['activity_requests'].countDocuments(pendingQuery);
    const Q = ['student_activities','student_activities_external','community_svc'];
    let incomplete = 0;
    const incQuery = {
      source: { $exists: true, $ne: null, $ne: '' },
      $or: [{ completed: { $exists: false } }, { completed: false }]
    };
    if (['coordinator','manager'].includes(req.user.role) && req.user.department) incQuery.organizer = req.user.department;
    await Promise.all(Q.map(async t => {
      incomplete += await models[t].countDocuments(incQuery);
    }));
    stats.incomplete = incomplete;
    res.json(stats);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ══ إحصائيات لكل جهة/دائرة (تظهر للجميع في لوحة التحكم الرئيسية) ══
app.get('/api/dept-stats', auth(), async (req, res) => {
  try {
    const result = {};
    DEANSHIP_DEPTS.forEach(d => { result[d] = { pending: 0, incomplete: 0, activities: 0, activities_external: 0 }; });

    const pendingAgg = await models['activity_requests'].aggregate([
      { $match: { status: { $in: ['pending', 'awaiting_manager', 'awaiting_dean'] } } },
      { $group: { _id: '$organizer', count: { $sum: 1 } } }
    ]);
    pendingAgg.forEach(r => { if (result[r._id]) result[r._id].pending = r.count; });

    const actAgg = await models['student_activities'].aggregate([
      { $group: { _id: '$organizer', count: { $sum: 1 } } }
    ]);
    actAgg.forEach(r => { if (result[r._id]) result[r._id].activities = r.count; });

    const actExtAgg = await models['student_activities_external'].aggregate([
      { $group: { _id: '$organizer', count: { $sum: 1 } } }
    ]);
    actExtAgg.forEach(r => { if (result[r._id]) result[r._id].activities_external = r.count; });

    const INC_TABLES = ['student_activities', 'student_activities_external'];
    await Promise.all(INC_TABLES.map(async t => {
      const agg = await models[t].aggregate([
        { $match: {
          source: { $exists: true, $ne: null, $ne: '' },
          $or: [{ completed: { $exists: false } }, { completed: false }]
        } },
        { $group: { _id: '$organizer', count: { $sum: 1 } } }
      ]);
      agg.forEach(r => { if (result[r._id]) result[r._id].incomplete += r.count; });
    }));

    res.json(result);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ══ الطلبات غير المكتملة ══
app.get('/api/incomplete', auth(), async (req, res) => {
  try {
    const Q = ['student_activities','student_activities_external','community_svc'];
    const result = [];
    await Promise.all(Q.map(async t => {
      const docs = await models[t].find({ 
      source: { $exists: true, $ne: null, $ne: '' }, 
      $or: [{ completed: { $exists: false } }, { completed: false }] 
    }).lean();
      docs.forEach(d => result.push({ ...d, id: String(d._id), _id: String(d._id), _table: t }));
    }));
    result.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(result);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ══ تصدير CSV ══
app.get('/api/export/:table', auth(), async (req, res) => {
  try {
    const Model = models[req.params.table];
    if (!Model) return res.status(404).json({ error: 'جدول غير موجود' });
    const rows = await Model.find().lean();
    if (!rows.length) return res.status(400).json({ error: 'لا توجد بيانات' });
    const skip = ['_id','__v','password'];
    const headers = Object.keys(rows[0]).filter(k => !skip.includes(k));
    const csv = [
      headers.join(','),
      ...rows.map(r => headers.map(h => `"${String(r[h]||'').replace(/"/g,'""')}"`).join(','))
    ].join('\n');
    res.setHeader('Content-Type', 'text/csv;charset=utf-8');
    res.setHeader('Content-Disposition', `attachment;filename=${req.params.table}.csv`);
    res.send('\uFEFF' + csv);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ══ الأرشفة السنوية: تصدير نسخة كاملة من كل بيانات النظام (بدون حسابات المستخدمين) ══
// يبحث عن سجل استبانة تقييم الفعالية المرتبط بنفس طلب النشاط الأصلي (لعرض بطاقة الرابط الفورية في شاشة الأنشطة الطلابية)
app.get('/api/eval-by-request/:requestId', auth(), async (req, res) => {
  try {
    const doc = await models['activity_evaluations'].findOne({ request_id: req.params.requestId }).lean();
    if (!doc) return res.json(null);
    res.json({ id: doc._id, activity: doc.activity, date: doc.date, organizer: doc.organizer, responses: doc.responses || [] });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// يبحث عن سجل أسماء المشاركين المرتبط بنفس طلب النشاط الأصلي (لتوليد رابط/QR التسجيل من بوابة الطلبات غير المكتملة)
app.get('/api/participants-by-request/:requestId', auth(), async (req, res) => {
  try {
    const doc = await models['participants'].findOne({ request_id: req.params.requestId }).lean();
    if (!doc) return res.json(null);
    res.json({ id: doc._id, activity: doc.activity, date: doc.date, organizer: doc.organizer, count: (doc.students||[]).length, cap: doc.max_capacity || null });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/admin/export-archive', auth(['admin']), async (req, res) => {
  try {
    const dump = {};
    for (const t of TABLES) {
      dump[t] = await models[t].find({}).lean();
    }
    const payload = {
      system: 'نظام عمادة شؤون الطلبة — الجامعة الأردنية',
      exported_at: new Date().toISOString(),
      exported_by: req.user.fullName || req.user.username,
      tables: dump,
    };
    const filename = `ju-dsa-archive-${new Date().toISOString().slice(0,10)}.json`;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(JSON.stringify(payload, null, 2));
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ══ الأرشفة السنوية: مسح كل بيانات الأنشطة والبدء بعام دراسي جديد (حسابات المستخدمين لا تُمَس) ══
// حقل التاريخ المعتمَد لكل جدول عند الفلترة الزمنية أثناء المسح الانتقائي (null = لا يوجد حقل تاريخ مناسب)
const RESET_DATE_FIELD = {
  activity_requests: 'activity_date',
  announcements: 'date', hall_bookings: 'date', participants: 'date',
  committees: 'date', meeting_invites: 'date', meeting_minutes: 'date',
  governance: 'date', student_activities: 'date', student_activities_external: 'date',
  student_honors: 'date', staff_committees: 'date', staff_training: 'date',
  staff_innovation: 'date', staff_honors: 'date', uni_committees: 'date', community_svc: 'date',
  students: null, achievements: null,
  workshops: null, initiatives: null, external_acts: null, competitions: null,
  awareness: null, expert_acts: null, environment: null, dialogues: null, campaigns: null,
};

app.post('/api/admin/reset-data', auth(['admin']), async (req, res) => {
  try {
    if (req.body.confirm !== 'نعم متأكد من الحذف')
      return res.status(400).json({ error: 'نص التأكيد غير مطابق' });

    // الجداول المطلوب حذفها: إن أُرسلت قائمة محدَّدة نستخدمها (بعد التحقق أنها ضمن TABLES الفعلية)، وإلا كل الجداول (سلوك سابق)
    const requested = Array.isArray(req.body.tables) && req.body.tables.length
      ? req.body.tables.filter(t => TABLES.includes(t))
      : TABLES;

    const dateFrom = req.body.date_from || null; // 'YYYY-MM-DD'
    const dateTo   = req.body.date_to   || null;

    const counts = {};
    const skipped = [];
    let total = 0;

    for (const t of requested) {
      const dateField = RESET_DATE_FIELD[t] || null;
      let query = {};
      if (dateFrom || dateTo) {
        if (!dateField) { skipped.push(t); continue; } // لا يوجد حقل تاريخ لهذا الجدول، يُتجاوَز عند وجود فلترة زمنية
        query[dateField] = {};
        if (dateFrom) query[dateField].$gte = dateFrom;
        if (dateTo)   query[dateField].$lte = dateTo;
      }
      const r = await models[t].deleteMany(query);
      counts[t] = r.deletedCount || 0;
      total += r.deletedCount || 0;
    }

    let message = `تم حذف ${total} سجل من ${Object.keys(counts).length} جدول محدَّد. حسابات المستخدمين وصلاحياتهم لم تتأثر.`;
    if (skipped.length) message += ` (تم تجاوز ${skipped.length} جدول بلا حقل تاريخ مناسب بسبب تحديد فترة زمنية: ${skipped.join('، ')})`;

    res.json({ ok: true, message, counts, skipped });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('\n  ══════════════════════════════════════════');
  console.log('  الجامعة الأردنية — عمادة شؤون الطلبة');
  console.log('  النظام الموحد المتكامل');
  console.log('  ══════════════════════════════════════════');
  console.log(`  الرابط: http://localhost:${PORT}`);
  console.log('  ══════════════════════════════════════════\n');
});
