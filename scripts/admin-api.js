// admin-api.js
const express = require('express');
const router = express.Router();
const { User, Task } = require('./models');

// مدیریت کاربران آنلاین
const onlineUsers = new Map();

// API های مدیریتی
router.get('/stats', async (req, res) => {
  const stats = {
      totalUsers: await User.countDocuments(),
      onlineUsers: await User.countDocuments({ isOnline: true }),
      lastDayUsers: await User.countDocuments({
          lastActive: { $gte: new Date(Date.now() - 24*60*60*1000) }
      })
  };
  res.json(stats);
});

// مدیریت تسک‌ها
router.post('/tasks', async (req, res) => {
    try {
        const newTask = new Task(req.body);
        await newTask.save();
        // ارسال به همه کلاینت‌ها
        io.emit('taskAdded', newTask);
        res.json(newTask);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});
// دریافت لیست تسک‌ها
router.get('/tasks', async (req, res) => {
  const tasks = await Task.find().sort('-createdAt');
  res.json(tasks);
});

// ارسال پیام به ربات
router.post('/broadcast', (req, res) => {
  telegram.sendMessage(req.body.message);
});

// دریافت کیف پول‌ها
router.get('/wallets', (req, res) => {
  const wallets = db.wallets.find().sort({balance: -1});
  res.json(wallets);
});

// رتبه‌بندی کاربران
router.get('/rankings', async (req, res) => {
  const { type, limit = 10 } = req.query;
  let sortQuery = {};
  
  switch(type) {
      case 'coins':
          sortQuery = { coins: -1 };
          break;
      case 'league':
          sortQuery = { league: -1 };
          break;
      case 'wallet':
          sortQuery = { walletBalance: -1 };
          break;
  }
  
  const users = await User.find()
      .sort(sortQuery)
      .limit(Number(limit))
      .select('username coins league walletBalance');
      
  res.json(users);
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  
  // بررسی اعتبار نام کاربری و رمز عبور
  if (username === process.env.ADMIN_USERNAME && 
      password === process.env.ADMIN_PASSWORD) {
      
      const token = jwt.sign(
          { username, role: 'admin' },
          process.env.JWT_SECRET,
          { expiresIn: '24h' }
      );
      
      res.json({ token });
  } else {
      res.status(401).json({ message: 'نام کاربری یا رمز عبور اشتباه است' });
  }
});

module.exports = router;