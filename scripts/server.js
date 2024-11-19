const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');
require('dotenv').config();

const app = express();
app.listen(process.env.PORT || 3000, '0.0.0.0', () => {
    console.log('Server is running');
  });
const server = http.createServer(app);
const io = socketIO(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 3000;
// میدلور‌ها
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));
app.use(express.static(path.join(__dirname, '../views')));
app.use('/styles', express.static(path.join(__dirname, '../styles')));
app.use('/scripts', express.static(path.join(__dirname, '../scripts')));

// مدل‌ها
const { User, Task } = require('./models');

// API ها
app.get('/admin/stats', async (req, res) => {
    const stats = {
        totalUsers: await User.countDocuments(),
        onlineUsers: await User.countDocuments({ isOnline: true }),
        lastDayUsers: await User.countDocuments({
            lastActive: { $gte: new Date(Date.now() - 24*60*60*1000) }
        })
    };
    res.json(stats);
});

app.post('/admin/tasks', async (req, res) => {
    try {
        const newTask = new Task(req.body);
        await newTask.save();
        io.emit('taskAdded', newTask);
        res.json(newTask);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/admin/tasks', async (req, res) => {
    const tasks = await Task.find().sort('-createdAt');
    res.json(tasks);
});

// مسیرها
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/admin-panel.html'));
});

// سوکت
io.on('connection', socket => {
    console.log('Client connected');

    socket.on('userConnected', async (userId) => {
        if (userId) {
            await User.findOneAndUpdate(
                { telegramId: userId },
                { isOnline: true, lastActive: new Date() }
            );
            io.emit('statsUpdate', await getSystemStats());
        }
    });

    socket.on('broadcast', (message) => {
        io.emit('adminMessage', message);
        console.log('Broadcast message:', message);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

async function getSystemStats() {
    return {
        totalUsers: await User.countDocuments(),
        onlineUsers: await User.countDocuments({ isOnline: true }),
        lastDayUsers: await User.countDocuments({
            lastActive: { $gte: new Date(Date.now() - 24*60*60*1000) }
        })
    };
}

// اتصال به دیتابیس و راه‌اندازی سرور
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('MongoDB Connected');
        server.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch(err => console.error('MongoDB connection error:', err));

// Export for socket access in other files
module.exports = { io };