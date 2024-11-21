// scripts/daily.js

// 首先定义用户信息对象（确保这个定义在文件的顶部）
const USER_INFO = {
    'mom': {
        name: 'Mom',
        avatar: './images/mom-avatar.png',
        style: 'mom'
    },
    'me': {
        name: 'Me',
        avatar: './images/me-avatar.jpg',
        style: 'me'
    }
};

function updateTimes() {
    document.getElementById('usTime').textContent =
        `🇺🇸 US: ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })}`;
    document.getElementById('cnTime').textContent =
        `🇨🇳 China: ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Shanghai' })}`;
}

function updateWeather() {
    const weatherContainer = document.getElementById('weatherContainer');
    if (!weatherContainer) return;

    const locations = {
        Providence: { country: 'USA', timezone: 'America/New_York' },
        Ningbo: { country: 'China', timezone: 'Asia/Shanghai' }
    };

    weatherContainer.innerHTML = Object.entries(locations).map(([city, info]) => {
        const temp = Math.round(20 + Math.random() * 10);
        const humidity = Math.round(60 + Math.random() * 20);
        return `
            <div class="p-4 bg-gray-50 rounded-lg">
                <div class="flex items-center justify-between mb-2">
                    <h4 class="font-medium">${city}, ${info.country}</h4>
                    <i data-lucide="sun"></i>
                </div>
                <div class="space-y-2">
                    <div class="flex items-center gap-2">
                        <i data-lucide="thermometer"></i>
                        <span>${temp}°C</span>
                    </div>
                    <div>Clear Sky</div>
                    <div class="text-sm text-gray-500">
                        Humidity: ${humidity}%
                    </div>
                </div>
            </div>
        `;
    }).join('');

    lucide.createIcons();
}

function updateReminders() {
    const remindersList = document.getElementById('remindersList');
    if (!remindersList) return;

    remindersList.innerHTML = '';

    if (state.reminders) {
        state.reminders
            .filter(reminder => !reminder.completed)
            .forEach(reminder => {
                const reminderElement = document.createElement('div');
                reminderElement.className = 'reminder-message';
                reminderElement.innerHTML = `
                    <span>${reminder.type}</span>
                    <div class="flex gap-2">
                        <span class="text-sm text-gray-500">${reminder.time}</span>
                        <button class="complete-reminder" onclick="completeReminder(${reminder.id})">
                            <i data-lucide="check-circle-2"></i>
                        </button>
                    </div>
                `;
                remindersList.appendChild(reminderElement);
            });
    }

    // 重新初始化图标
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

function handleReminderClick(type) {
    let message = '';
    switch (type) {
        case 'water':
            message = '请记得喝水 💧';
            break;
        case 'medicine':
            message = '该吃药了 💊';
            break;
        case 'exercise':
            message = '运动时间到了 🏃‍♀️';
            break;
        case 'custom':
            message = prompt('输入提醒内容：') || '自定义提醒';
            break;
    }

    if (message) {
        addReminder(message);
        showReminderDialog(message);
    }
}

function addReminder(message) {
    const reminder = {
        id: Date.now(),
        type: message,
        time: new Date().toLocaleString(),
        createdBy: state.activeUser,
        completed: false,
        targetUser: state.activeUser === 'mom' ? 'me' : 'mom'
    };

    state.reminders = state.reminders || [];
    state.reminders.push(reminder);
    updateReminders();
    addMessage(`📝 Added new reminder: ${message}`, true);
    saveState();
}

function completeReminder(id) {
    const reminder = state.reminders.find(r => r.id === id);
    if (reminder) {
        reminder.completed = true;
        updateReminders();
        saveState();
        addMessage(`✅ Completed reminder: ${reminder.type}`, true);
        showCompletionAlert(reminder.type);
    }
}

function showReminderDialog(message) {
    const dialog = document.getElementById('reminderDialog');
    const details = document.getElementById('reminderDetails');
    const sendBtn = document.getElementById('sendReminder');

    if (!dialog || !details || !sendBtn) return;

    details.innerHTML = `
        <div class="flex flex-col items-center gap-4">
            <div class="text-4xl">${message.includes('水') ? '💧' : 
                               message.includes('药') ? '💊' : 
                               message.includes('运动') ? '🏃‍♀️' : '📝'}</div>
            <p class="text-lg font-medium text-center">${message}</p>
            <p class="text-sm text-gray-500">发送给: ${state.activeUser === 'mom' ? 'Me' : 'Mom'}</p>
        </div>
    `;

    dialog.classList.remove('hidden');

    // 绑定关闭按钮事件
    dialog.querySelector('.close-btn').onclick = () => {
        dialog.classList.add('hidden');
    };

    // 绑定发送按钮事件
    sendBtn.onclick = () => {
        dialog.classList.add('hidden');
    };
}

function showCompletionAlert(message) {
    const alert = document.getElementById('completionAlert');
    const details = document.getElementById('completionDetails');

    if (!alert || !details) return;

    details.innerHTML = `
        <div class="flex flex-col items-center gap-4">
            <div class="text-5xl mb-2">✅</div>
            <h3 class="text-xl font-semibold">提醒已完成</h3>
            <div class="text-center">
                <p class="text-lg mb-2">${message}</p>
                <p class="text-sm text-gray-500">完成时间：${new Date().toLocaleString()}</p>
            </div>
            <button class="completion-btn w-full">
                <span class="text-lg">OK</span>
            </button>
        </div>
    `;

    alert.classList.remove('hidden');

    // 只保留一个关闭按钮事件
    alert.querySelector('.completion-btn').onclick = () => {
        alert.classList.add('hidden');
    };

    // 移除其他的关闭按钮事件
    const oldCloseBtn = alert.querySelector('.close-btn');
    if (oldCloseBtn) {
        oldCloseBtn.remove();
    }
}

function initializeDialogs() {
    // 点击对话框背景时关闭
    document.querySelectorAll('.dialog').forEach(dialog => {
        dialog.addEventListener('click', (e) => {
            if (e.target === dialog) {
                dialog.classList.add('hidden');
            }
        });
    });
}

// 添加清空消息的函数
function clearMessages() {
    if (confirm('确定要清空所有消息吗？')) {
        const messageContainer = document.getElementById('messageContainer');
        if (messageContainer) {
            messageContainer.innerHTML = '';
            // 清空状态中的消息记录
            state.messages = [];
            saveState();
            // 添加一条系统消息
            addMessage('🗑️ 消息已清空', true);
        }
    }
}

// 添加自动滚动到底部的函数
function scrollToBottom() {
    const messageContainer = document.getElementById('messageContainer');
    if (messageContainer) {
        messageContainer.scrollTop = messageContainer.scrollHeight;
    }
}

// 修改 addMessage 函数
function addMessage(text, isSystem = false) {
    const messageContainer = document.getElementById('messageContainer');
    if (!messageContainer) return;

    const message = document.createElement('div');

    if (isSystem) {
        message.className = 'message system';
        message.innerHTML = `
            <div class="flex items-center gap-2 justify-center">
                <span class="text-gray-500">${text}</span>
                <span class="text-xs text-gray-400">${new Date().toLocaleString()}</span>
            </div>
        `;
    } else {
        const user = USER_INFO[state.activeUser];
        if (!user) {
            console.error('User info not found for:', state.activeUser);
            return;
        }

        message.className = `message ${state.activeUser}`;
        message.innerHTML = `
            <div class="flex items-center gap-3 ${state.activeUser === 'me' ? 'justify-end' : 'justify-start'}">
                ${state.activeUser === 'me' ? '' : `
                    <img src="${user.avatar}" class="w-8 h-8 rounded-full" alt="${user.name}">
                `}
                <div class="flex flex-col ${state.activeUser === 'me' ? 'items-end' : 'items-start'}">
                    <span class="text-sm text-gray-500">${user.name}</span>
                    <div class="message-content">
                        <span>${text}</span>
                        <span class="text-xs text-gray-400 ml-2">${new Date().toLocaleString()}</span>
                    </div>
                </div>
                ${state.activeUser === 'me' ? `
                    <img src="${user.avatar}" class="w-8 h-8 rounded-full" alt="${user.name}">
                ` : ''}
            </div>
        `;
    }

    messageContainer.appendChild(message);
    scrollToBottom();

    if (!isSystem) {
        // 保存消息到 localStorage
        state.messages = state.messages || [];
        state.messages.push({
            text,
            timestamp: new Date().toISOString(),
            user: state.activeUser,
            isSystem: false
        });
        saveState();
    }
}

// 修改加载消息的函数
function loadMessages() {
    const messageContainer = document.getElementById('messageContainer');
    if (!messageContainer || !state.messages) return;

    messageContainer.innerHTML = '';
    state.messages.forEach(msg => {
        if (msg.isSystem) {
            addMessage(msg.text, true);
        } else {
            const prevActiveUser = state.activeUser;
            state.activeUser = msg.user || prevActiveUser; // 添加默认值
            addMessage(msg.text);
            state.activeUser = prevActiveUser;
        }
    });
}

// 修改初始化函数
function initializeDaily() {
    if (!document.getElementById('remindersList')) return;

    // 确保状态中包含所需的数组
    state.reminders = state.reminders || [];
    state.messages = state.messages || [];
    state.mediaItems = state.mediaItems || [];

    // 更新提醒列表
    updateReminders();

    // 添加清空按钮到消息容器
    const messageContainer = document.getElementById('messageContainer');
    if (messageContainer) {
        // 添加一个包装器来控制布局
        const headerWrapper = document.createElement('div');
        headerWrapper.className = 'flex justify-between items-center mb-4 px-6 pt-6';

        // 检查是否已经存在headerWrapper，如果存在则移除
        const existingHeader = messageContainer.parentNode.querySelector('.flex.justify-between');
        if (existingHeader) {
            existingHeader.remove();
        }

        messageContainer.parentNode.insertBefore(headerWrapper, messageContainer);

        // 添加标题
        const title = document.createElement('h3');
        title.className = 'text-xl font-semibold';
        title.textContent = '消息记录';
        headerWrapper.appendChild(title);

        // 添加清空按钮
        const clearButton = document.createElement('button');
        clearButton.className = 'clear-messages-btn hover:scale-110 transition-transform duration-200';
        clearButton.innerHTML = `
            <i data-lucide="trash-2" class="w-5 h-5"></i>
        `;
        clearButton.onclick = clearMessages;
        headerWrapper.appendChild(clearButton);

        // 重新初始化 Lucide 图标
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    // 初始化时间显示
    updateTimes();
    setInterval(updateTimes, 1000);

    // 初始化天气显示
    updateWeather();
    setInterval(updateWeather, 300000); // 每5分钟更新一次天气

    // 初始化提醒列表
    updateReminders();

    // 绑定提醒按钮事件
    document.querySelectorAll('.reminder-btn').forEach(btn => {
        btn.addEventListener('click', () => handleReminderClick(btn.dataset.type));
    });

    // 初始化对话框
    initializeDialogs();

    // 添加动态提醒更新
    setInterval(updateReminders, 60000); // 每分钟更新一次提醒列表

    // 初始化完成后滚动到底部
    scrollToBottom();
}

// 当DOM加载完成时初始化
document.addEventListener('DOMContentLoaded', initializeDaily);

// 导出函数供其他模块使用
window.handleReminderClick = handleReminderClick;
window.completeReminder = completeReminder;
window.showCompletionAlert = showCompletionAlert;

// 修改保存状态的函数
function saveState() {
    try {
        localStorage.setItem('familyBoardState', JSON.stringify(state));
    } catch (e) {
        console.error('Error saving state:', e);
    }
}

// 修改加载状态的函数
function loadState() {
    try {
        const savedState = localStorage.getItem('familyBoardState');
        if (savedState) {
            state = JSON.parse(savedState);
        }
    } catch (e) {
        console.error('Error loading state:', e);
        state = {
            activeUser: 'me',
            messages: [],
            reminders: [],
            mediaItems: []
        };
    }
}