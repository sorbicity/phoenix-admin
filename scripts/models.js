const mongoose = require('mongoose');

// مدل کاربر
const userSchema = new mongoose.Schema({
    telegramId: String,
    username: String,
    coins: { type: Number, default: 0 },
    league: { type: String, default: 'Bronze' },
    lastActive: { type: Date, default: Date.now },
    isOnline: { type: Boolean, default: false },
    walletBalance: { type: Number, default: 0 },
    referralCode: String,
    referredBy: String,
    tasks: [{
        taskId: String,
        completed: Boolean,
        completedAt: Date
    }]
});

// مدل تسک
const taskSchema = new mongoose.Schema({
    name: String,
    reward: Number,
    icon: String,
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    completionCount: { type: Number, default: 0 }
});

const User = mongoose.model('User', userSchema);
const Task = mongoose.model('Task', taskSchema);

module.exports = { User, Task };
