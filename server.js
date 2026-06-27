const express  = require('express');
const bcrypt   = require('bcryptjs');
const mongoose = require('mongoose');
const path     = require('path');

const app  = express();
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
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

const TABLES = [
  'students','achievements',
  'governance','workshops','initiatives','external_acts','competitions',
  'student_honors','community_svc','staff_committees','awareness','expert_acts',
  'staff_training','staff_innovation','staff_honors','uni_committees',
  'environment','dialogues','campaigns',
  'activity_requests','announcements','hall_bookings',
  'participants','committees','meeting_invites','meeting_minutes'
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

app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user || !bcrypt.compareSync(password, user.password))
      return res.status(401).json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
    const token = Math.random().toString(36).substr(2) + Date.now().toString(36);
    sessions[token] = { id: user._id, username: user.username, fullName: user.fullName, role: user.role };
    res.json({ token, user: sessions[token] });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/logout', (req, res) => {
  delete sessions[(req.headers.authorization||'').replace('Bearer ','')];
  res.json({ ok: true });
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
    const { username, password, fullName, role } = req.body;
    if (!username||!password||!fullName||!role)
      return res.status(400).json({ error: 'يرجى ملء جميع الحقول' });
    const exists = await User.findOne({ username });
    if (exists) return res.status(400).json({ error: 'اسم المستخدم موجود بالفعل' });
    const user = await User.create({ username, password: bcrypt.hashSync(password,10), fullName, role });
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
      res.json(docs.map(d => ({ ...d, id: d._id })));
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  app.get(`/api/${table}/:id`, auth(), async (req, res) => {
    try {
      const doc = await Model.findById(req.params.id).lean();
      if (!doc) return res.status(404).json({ error: 'غير موجود' });
      res.json({ ...doc, id: doc._id });
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  app.post(`/api/${table}`, auth(['admin','editor']), async (req, res) => {
    try {
      const doc = await Model.create({ ...req.body, created_by: req.user.username });
      res.json({ id: doc._id, message: 'تم الحفظ بنجاح' });
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  app.put(`/api/${table}/:id`, auth(['admin','editor']), async (req, res) => {
    try {
      await Model.findByIdAndUpdate(req.params.id,
        { ...req.body, updated_by: req.user.username, updatedAt: new Date() },
        { new: true }
      );
      res.json({ message: 'تم التحديث' });
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  app.delete(`/api/${table}/:id`, auth(['admin']), async (req, res) => {
    try {
      await Model.findByIdAndDelete(req.params.id);
      res.json({ message: 'تم الحذف' });
    } catch(e) { res.status(500).json({ error: e.message }); }
  });
});

// ══ إحصائيات ══
app.get('/api/stats', auth(), async (req, res) => {
  try {
    const stats = {};
    await Promise.all(TABLES.map(async t => {
      stats[t] = await models[t].countDocuments();
    }));
    stats.pending_requests = await models['activity_requests'].countDocuments({ status: 'pending' });
    const Q = ['workshops','initiatives','external_acts','competitions','awareness',
                'environment','dialogues','campaigns','expert_acts','community_svc'];
    let incomplete = 0;
    await Promise.all(Q.map(async t => {
      incomplete += await models[t].countDocuments({ source: { $exists: true }, completed: { $ne: true } });
    }));
    stats.incomplete = incomplete;
    res.json(stats);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ══ الطلبات غير المكتملة ══
app.get('/api/incomplete', auth(), async (req, res) => {
  try {
    const Q = ['workshops','initiatives','external_acts','competitions','awareness',
                'environment','dialogues','campaigns','expert_acts','community_svc'];
    const result = [];
    await Promise.all(Q.map(async t => {
      const docs = await models[t].find({ source: { $exists: true }, completed: { $ne: true } }).lean();
      docs.forEach(d => result.push({ ...d, id: d._id, _table: t }));
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

app.listen(PORT, '0.0.0.0', () => {
  console.log('\n  ══════════════════════════════════════════');
  console.log('  الجامعة الأردنية — عمادة شؤون الطلبة');
  console.log('  النظام الموحد المتكامل');
  console.log('  ══════════════════════════════════════════');
  console.log(`  الرابط: http://localhost:${PORT}`);
  console.log('  ══════════════════════════════════════════\n');
});
