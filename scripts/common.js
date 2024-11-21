// 全局状态管理
let state = {
    activeUser: 'me',
    messages: [],
    reminders: [],
    mediaItems: [],
    books: [],
    wishes: []
};

// 用户信息配置
const USERS = {
    'mom': {
        name: 'Mom',
        avatar: './images/mom-avatar.png',
        style: 'mom',
        bgImg: './images/dragon-statue.png'
    },
    'me': {
        name: 'Me',
        avatar: './images/me-avatar.jpg',
        style: 'me',
        bgImg: './images/DragonFinn.png'
    }
};

// 保存状态到 localStorage
function saveState() {
    try {
        localStorage.setItem('familyBoardState', JSON.stringify(state));
        // 保存后立即更新显示
        updateAllMessageContainers();
    } catch (e) {
        console.error('Error saving state:', e);
    }
}

// 从 localStorage 加载状态
function loadState() {
    try {
        const savedState = localStorage.getItem('familyBoardState');
        if (savedState) {
            const loadedState = JSON.parse(savedState);
            // 确保所有必要的属性都存在
            state = {
                activeUser: loadedState.activeUser || 'me',
                messages: loadedState.messages || [],
                reminders: loadedState.reminders || [],
                mediaItems: loadedState.mediaItems || [],
                books: loadedState.books || [],
                wishes: loadedState.wishes || []
            };

            // 去重消息
            const uniqueMessages = [];
            const seen = new Set();

            state.messages.forEach(msg => {
                const messageId = `${msg.text}-${msg.timestamp}`;
                if (!seen.has(messageId)) {
                    seen.add(messageId);
                    uniqueMessages.push({
                        ...msg,
                        user: msg.user || state.activeUser
                    });
                }
            });

            state.messages = uniqueMessages;
        }
    } catch (e) {
        console.error('Error loading state:', e);
        state = {
            activeUser: 'me',
            messages: [],
            reminders: [],
            mediaItems: [],
            books: [],
            wishes: []
        };
    }
}

// 更新消息显示
function updateMessages() {
    const messageContainer = document.getElementById('messageContainer');
    if (!messageContainer || !state.messages) return;

    // 如果消息容器已经有内容，不重复添加
    if (messageContainer.children.length > 0) return;

    messageContainer.innerHTML = '';
    const displayedMessages = new Set();

    state.messages.forEach(msg => {
        const messageId = `${msg.text}-${msg.timestamp}`;
        if (displayedMessages.has(messageId)) return;
        displayedMessages.add(messageId);

        const message = document.createElement('div');

        if (msg.isSystem) {
            message.className = 'message system';
            message.innerHTML = `
                <div class="flex items-center gap-2 justify-center">
                    <span class="text-gray-500">${msg.text}</span>
                    <span class="text-xs text-gray-400">${new Date(msg.timestamp).toLocaleString()}</span>
                </div>
            `;
        } else {
            const userId = msg.user || state.activeUser;
            const user = USERS[userId];

            if (!user) {
                console.error('User not found:', userId);
                return;
            }

            message.className = `message ${userId}`;
            message.innerHTML = `
                <div class="flex items-center gap-3 ${userId === 'me' ? 'justify-end' : 'justify-start'}">
                    ${userId === 'me' ? '' : `
                        <img src="${user.avatar}" class="w-8 h-8 rounded-full" alt="${user.name}">
                    `}
                    <div class="flex flex-col ${userId === 'me' ? 'items-end' : 'items-start'}">
                        <span class="text-sm text-gray-500">${user.name}</span>
                        <div class="message-content">
                            <span>${msg.text}</span>
                            <span class="text-xs text-gray-400 ml-2">${new Date(msg.timestamp).toLocaleString()}</span>
                        </div>
                    </div>
                    ${userId === 'me' ? `
                        <img src="${user.avatar}" class="w-8 h-8 rounded-full" alt="${user.name}">
                    ` : ''}
                </div>
            `;
        }

        messageContainer.appendChild(message);
    });

    // 滚动到底部
    messageContainer.scrollTop = messageContainer.scrollHeight;
}

// 添加消息
function addMessage(text, isSystem = false) {
    if (!text) return;

    // 添加更严格的防重复提交检查
    const now = Date.now();
    const messageKey = `${text}-${state.activeUser}`;
    
    if (window.lastMessageMap === undefined) {
        window.lastMessageMap = new Map();
    }

    const lastTime = window.lastMessageMap.get(messageKey);
    if (lastTime && (now - lastTime < 2000)) {
        console.log('Duplicate message prevented');
        return;
    }
    
    window.lastMessageMap.set(messageKey, now);

    const newMessage = {
        text,
        timestamp: new Date().toISOString(),
        user: state.activeUser,
        isSystem: isSystem
    };

    state.messages = state.messages || [];
    state.messages.push(newMessage);
    saveState();

    const messageContainer = document.getElementById('messageContainer');
    if (messageContainer) {
        updateAllMessageContainers();
        messageContainer.scrollTop = messageContainer.scrollHeight;
    }
}

// 切换用户
function switchUser(userId) {
    if (USERS[userId]) {
        state.activeUser = userId;
        document.body.setAttribute('data-theme', userId);
        
        // 确保背景图片存在后再设置
        const bgImage = new Image();
        bgImage.onload = function() {
            document.getElementById('pageBgImg').style.backgroundImage = `url(${USERS[userId].bgImg})`;
        };
        bgImage.src = USERS[userId].bgImg;
        
        // 更新用户按钮状态
        document.querySelectorAll('.user-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.user === userId);
        });

        saveState();
    }
}

// 初始化通用功能
function initializeCommon() {
    // 加载保存的状态（如果还没有加载过）
    if (!window.stateInitialized) {
        loadState();
        window.stateInitialized = true;
    }

    // 设置当前主题
    document.body.setAttribute('data-theme', state.activeUser);
    
    // 添加：确保设置正确的背景图片
    const currentUser = state.activeUser;
    if (USERS[currentUser]) {
        const bgImage = new Image();
        bgImage.onload = function() {
            document.getElementById('pageBgImg').style.backgroundImage = `url(${USERS[currentUser].bgImg})`;
        };
        bgImage.src = USERS[currentUser].bgImg;
    }

    // 初始化用户切换按钮
    document.querySelectorAll('.user-btn').forEach(btn => {
        // 移除旧的事件监听器
        btn.removeEventListener('click', () => switchUser(btn.dataset.user));
        // 添加新的事件监听器
        btn.addEventListener('click', () => switchUser(btn.dataset.user));
        if (btn.dataset.user === state.activeUser) {
            btn.classList.add('active');
        }
    });

    // 初始化消息输入
    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendButton');

    if (messageInput && sendButton) {
        // 移除所有已存在的事件监听器
        const newMessageInput = messageInput.cloneNode(true);
        const newSendButton = sendButton.cloneNode(true);
        
        messageInput.parentNode.replaceChild(newMessageInput, messageInput);
        sendButton.parentNode.replaceChild(newSendButton, sendButton);

        // 添加新的事件监听器
        newMessageInput.addEventListener('keypress', handleKeyPress);
        newSendButton.addEventListener('click', handleSendClick);
    }

    // 立即显示所有消息（但不自动滚动）
    updateAllMessageContainers();

    // 移除定期更新
    if (window.updateInterval) {
        clearInterval(window.updateInterval);
        window.updateInterval = null;
    }
}

// 辅助函数
function handleKeyPress(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const text = e.target.value.trim();
        
        // 防止重复提交
        if (window.isSubmitting) {
            return;
        }
        
        if (text) {
            window.isSubmitting = true;
            addMessage(text);
            e.target.value = '';
            
            // 1秒后重置提交状态
            setTimeout(() => {
                window.isSubmitting = false;
            }, 1000);
        }
    }
}

function handleSendClick() {
    const messageInput = document.getElementById('messageInput');
    const text = messageInput.value.trim();
    
    // 防止重复提交
    if (window.isSubmitting) {
        return;
    }
    
    if (text) {
        window.isSubmitting = true;
        addMessage(text);
        messageInput.value = '';
        
        // 1秒后重置提交状态
        setTimeout(() => {
            window.isSubmitting = false;
        }, 1000);
    }
}

// 添加新函数：更新所有消息容器
function updateAllMessageContainers() {
    const messageContainer = document.getElementById('messageContainer');
    if (!messageContainer) return;

    // 记住当前的滚动位置
    const scrollPos = messageContainer.scrollTop;
    const wasScrolledToBottom = messageContainer.scrollHeight - messageContainer.clientHeight <= messageContainer.scrollTop + 1;

    // 清空当前容器
    messageContainer.innerHTML = '';

    // 显示所有消息
    state.messages.forEach(msg => {
        const message = document.createElement('div');

        if (msg.isSystem) {
            message.className = 'message system';
            message.innerHTML = `
                <div class="flex items-center gap-2 justify-center">
                    <span class="text-gray-500">${msg.text}</span>
                    <span class="text-xs text-gray-400">${new Date(msg.timestamp).toLocaleString()}</span>
                </div>
            `;
        } else {
            const userId = msg.user || state.activeUser;
            const user = USERS[userId];

            if (!user) {
                console.error('User not found:', userId);
                return;
            }

            message.className = `message ${userId}`;
            message.innerHTML = `
                <div class="flex items-center gap-3 ${userId === 'me' ? 'justify-end' : 'justify-start'}">
                    ${userId === 'me' ? '' : `
                        <img src="${user.avatar}" class="w-8 h-8 rounded-full" alt="${user.name}">
                    `}
                    <div class="flex flex-col ${userId === 'me' ? 'items-end' : 'items-start'}">
                        <span class="text-sm text-gray-500">${user.name}</span>
                        <div class="message-content">
                            <span>${msg.text}</span>
                            <span class="text-xs text-gray-400 ml-2">${new Date(msg.timestamp).toLocaleString()}</span>
                        </div>
                    </div>
                    ${userId === 'me' ? `
                        <img src="${user.avatar}" class="w-8 h-8 rounded-full" alt="${user.name}">
                    ` : ''}
                </div>
            `;
        }

        messageContainer.appendChild(message);
    });

    // 只有在之前滚动到底部时，或者是新消息时，才自动滚动到底部
    if (wasScrolledToBottom) {
        messageContainer.scrollTop = messageContainer.scrollHeight;
    } else {
        messageContainer.scrollTop = scrollPos;
    }
}

// 修改清空消息函数
function clearMessages() {
    if (confirm('确定要清空所有消息吗？')) {
        state.messages = [];
        saveState();
        updateAllMessageContainers();
        addMessage('🗑️ 消息已清空', true);
    }
}

// 导出全局变量和函数
window.state = state;
window.USERS = USERS;
window.saveState = saveState;
window.loadState = loadState;
window.addMessage = addMessage;
window.initializeCommon = initializeCommon;
window.updateAllMessageContainers = updateAllMessageContainers;
