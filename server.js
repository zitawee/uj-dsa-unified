const express  = require('express');
const bcrypt   = require('bcryptjs');
const mongoose = require('mongoose');
const path     = require('path');

const app  = express();
app.set('trust proxy', true);
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI ||
  'mongodb+srv://mohammedzitawee_db_user:RsRDI3zU3Oy56vKP@cluster0.bbkuj12.mongodb.net/dsa_unified?appName=Cluster0';

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

// ══ رابط عام لتسجيل الطلبة المشاركين في نشاط (بدون تسجيل دخول) ══
// يعرض فقط بيانات النشاط الأساسية (بدون قائمة الطلبة) للتحقق من صحة الرابط
app.get('/api/public/participants-info/:id', async (req, res) => {
  try {
    const doc = await models['participants'].findById(req.params.id).lean();
    if (!doc) return res.status(404).json({ error: 'رابط غير صالح أو تمت إزالة النشاط' });
    res.json({
      activity: doc.activity || '', date: doc.date || '', organizer: doc.organizer || '',
      max_capacity: doc.max_capacity || null,
      registered_count: Array.isArray(doc.students) ? doc.students.length : 0,
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
      year: req.body.year || '', phone: req.body.phone || '',
    });
    doc.students = students;
    doc.markModified('students');
    await doc.save();

    res.json({ ok: true, message: 'تم تسجيل حضورك بنجاح ضمن قائمة المشاركين', count: students.length });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// أسئلة استبانة تقييم الفعالية الاثني عشر (يجب أن تطابق حرفياً قائمة EVAL_QUESTIONS في public/eval.html)
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

  const AR_QUALITY = ['student_activities','student_activities_external'];
  const putRoles = AR_QUALITY.includes(table) ? ['admin','editor','coordinator','manager'] : ['admin','editor'];
  app.put(`/api/${table}/:id`, auth(putRoles), async (req, res) => {
    try {
      if (AR_QUALITY.includes(table) && ['coordinator','manager'].includes(req.user.role) && req.user.department) {
        const existing = await Model.findById(req.params.id);
        if (existing && existing.organizer && existing.organizer !== req.user.department)
          return res.status(403).json({ error: 'هذا السجل لا يتبع الجهة المرتبطة بحسابك' });
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
      const deleted = await Model.findByIdAndDelete(req.params.id);
      // ══ حذف تسلسلي (Cascade Delete): عند حذف طلب نشاط أو سجل جودة نشاط،
      // تُحذف تلقائياً سجلات «أسماء المشاركين» و«استبانة تقييم الفعالية» المرتبطة
      // بنفس النشاط (عبر request_id المشترك) — فيتوقف رابط التسجيل ورابط الاستبانة فوراً.
      if (deleted && ['activity_requests','student_activities','student_activities_external'].includes(table)) {
        // معرّف الطلب الأصلي: للسجل في activity_requests هو _id نفسه، ولبقية الجداول هو حقل request_id
        const reqId = table === 'activity_requests' ? String(deleted._id) : (deleted.request_id || null);
        if (reqId) {
          await models['participants'].deleteMany({ request_id: reqId });
          await models['activity_evaluations'].deleteMany({ request_id: reqId });
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
      await models[doc.submitted_via==='public_link'?'student_activities_external':'student_activities'].create({ ...buildActivityRecordFromRequest(doc, categories), created_by: req.user.username });
      await models['participants'].create({ ...buildParticipantsRecordFromRequest(doc), created_by: req.user.username });
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
      if (action === 'approve') {
        if (!Array.isArray(categories) || !categories.length) return res.status(400).json({ error: 'يرجى اختيار تصنيف واحد على الأقل' });
        await Model.findByIdAndUpdate(doc._id, { status: 'approved', approved_by: req.user.fullName, approved_at: now, approval_note: note || '', categories });
        await models[doc.submitted_via==='public_link'?'student_activities_external':'student_activities'].create({ ...buildActivityRecordFromRequest(doc, categories), created_by: req.user.username });
        await models['participants'].create({ ...buildParticipantsRecordFromRequest(doc), created_by: req.user.username });
        await models['activity_evaluations'].create({ ...buildEvalRecordFromRequest(doc), created_by: req.user.username });
        return res.json({ message: 'تم الاعتماد النهائي بنجاح' });
      }
      if (action === 'reject') {
        await Model.findByIdAndUpdate(doc._id, { status: 'awaiting_manager', dean_return_by: req.user.fullName, dean_return_at: now, dean_return_note: note || '' });
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
  'activity_date','time_from','time_to','location','services',
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
    await Promise.all(Q.map(async t => {
      incomplete += await models[t].countDocuments({ 
      source: { $exists: true, $ne: null, $ne: '' },
      $or: [{ completed: { $exists: false } }, { completed: false }]
    });
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
