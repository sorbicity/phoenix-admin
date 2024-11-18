const socket = io();
  // آپدیت آمار
  function updateStats() {
      fetch('/admin/stats')
          .then(res => res.json())
          .then(stats => {
              document.getElementById('totalUsers').textContent = stats.totalUsers;
              document.getElementById('onlineUsers').textContent = stats.onlineUsers;
              document.getElementById('lastDayUsers').textContent = stats.lastDayUsers;
          });
  }



  // مدیریت تسک‌ها
  document.getElementById('newTaskForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
    
      const taskData = {
          name: formData.get('name'),
          reward: parseInt(formData.get('reward')),
          type: formData.get('type'),
          function: formData.get('function')
      };

    try {
        const response = await fetch('/admin/tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(taskData)
        });

        if (response.ok) {
            updateTasksList();
            e.target.reset();
            showNotification('تسک با موفقیت اضافه شد');
        }
    } catch (err) {
        console.error('Error adding task:', err);
        showNotification('خطا در افزودن تسک', 'error');
    }
});

async function updateTasksList() {
    const response = await fetch('/admin/tasks');
    const tasks = await response.json();
    
    const tbody = document.getElementById('tasksTableBody');
    tbody.innerHTML = tasks.map(task => `
        <tr class="border-t border-gray-700">
            <td class="p-3">${task.name}</td>
            <td class="p-3">${task.reward}</td>
            <td class="p-3">${task.type}</td>
            <td class="p-3">
                <pre class="bg-gray-900 p-2 rounded text-sm overflow-x-auto">${task.function}</pre>
            </td>
            <td class="p-3">
                <button onclick="editTask('${task._id}')" class="bg-blue-500 hover:bg-blue-600 px-3 py-1 rounded mr-2">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="deleteTask('${task._id}')" class="bg-red-500 hover:bg-red-600 px-3 py-1 rounded">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

async function editTask(taskId) {
    const task = await fetch(`/admin/tasks/${taskId}`).then(res => res.json());
    
    const form = document.getElementById('newTaskForm');
    form.name.value = task.name;
    form.reward.value = task.reward;
    form.type.value = task.type;
    form.function.value = task.function;
    
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.textContent = 'بروزرسانی تسک';
    
    form.onsubmit = async (e) => {
        e.preventDefault();
        
        const updatedTask = {
            name: form.name.value,
            reward: parseInt(form.reward.value),
            type: form.type.value,
            function: form.function.value
        };

        try {
            const response = await fetch(`/admin/tasks/${taskId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedTask)
            });

            if (response.ok) {
                updateTasksList();
                form.reset();
                submitBtn.textContent = 'افزودن تسک';
                form.onsubmit = null;
                showNotification('تسک با موفقیت بروزرسانی شد');
            }
        } catch (err) {
            console.error('Error updating task:', err);
            showNotification('خطا در بروزرسانی تسک', 'error');
        }
    };
}

async function deleteTask(taskId) {
    if(confirm('آیا از حذف این تسک مطمئن هستید؟')) {
        try {
            await fetch(`/admin/tasks/${taskId}`, { method: 'DELETE' });
            updateTasksList();
            showNotification('تسک با موفقیت حذف شد');
        } catch (err) {
            console.error('Error deleting task:', err);
            showNotification('خطا در حذف تسک', 'error');
        }
    }
}

// ارسال پیام گروهی
function sendBroadcast() {
    const message = document.getElementById('broadcastMessage').value;
    const type = document.getElementById('messageType').value;
    
    if (!message) {
        showNotification('لطفا متن پیام را وارد کنید', 'error');
        return;
    }

    socket.emit('broadcast', { message, type });
    document.getElementById('broadcastMessage').value = '';
    showNotification('پیام با موفقیت ارسال شد');
}

// رتبه‌بندی کاربران
function updateRankings(type) {
    const limit = document.getElementById('limitCount').value;
    
    fetch(`/admin/rankings?type=${type}&limit=${limit}`)
        .then(res => res.json())
        .then(users => {
            const rankingsList = document.getElementById('rankingsList');
            rankingsList.innerHTML = users.map((user, index) => `
                <div class="flex justify-between items-center bg-gray-700 p-3 rounded">
                    <div class="flex items-center">
                        <span class="text-xl font-bold mr-4">#${index + 1}</span>
                        <span>${user.username}</span>
                    </div>
                    <div>
                        ${type === 'coins' ? user.coins + ' سکه' : 
                          type === 'league' ? user.league :
                          user.walletBalance + ' TON'}
                    </div>
                </div>
            `).join('');
        });
}

// نمایش نوتیفیکیشن
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 p-4 rounded shadow-lg ${
        type === 'success' ? 'bg-green-500' : 'bg-red-500'
    }`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

// آپدیت خودکار آمار
setInterval(updateStats, 30000);

// اجرای اولیه
updateStats();
updateTasksList();
updateRankings('coins');

// مدیریت سوکت
socket.on('statsUpdate', stats => {
    document.getElementById('totalUsers').textContent = stats.totalUsers;
    document.getElementById('onlineUsers').textContent = stats.onlineUsers;
    document.getElementById('lastDayUsers').textContent = stats.lastDayUsers;
});
