// scripts/wishes.js
// 扩展状态以包含愿望
if (!state.wishes) {
    state.wishes = [];
}

function initializeWishes() {
    if (!state.wishes) {
        state.wishes = [];
    }

    const wishForm = document.getElementById('wishForm');
    const emojiPicker = document.getElementById('emojiPicker');
    const emojiDialog = document.getElementById('emojiDialog');

    if (wishForm) {
        wishForm.addEventListener('submit', handleWishSubmit);
    }

    if (emojiPicker && emojiDialog) {
        // 为emoji选择器添加点击事件
        emojiPicker.addEventListener('click', (e) => {
            e.preventDefault();
            emojiDialog.classList.remove('hidden');
        });

        // 为emoji-picker-element添加选择事件
        const picker = emojiDialog.querySelector('emoji-picker');
        if (picker) {
            picker.addEventListener('emoji-click', event => {
                emojiPicker.textContent = event.detail.unicode;
                emojiDialog.classList.add('hidden');
            });
        }

        // 关闭按钮事件
        const closeBtn = emojiDialog.querySelector('.close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                emojiDialog.classList.add('hidden');
            });
        }

        // 点击外部关闭
        document.addEventListener('click', (e) => {
            if (!emojiDialog.contains(e.target) && !emojiPicker.contains(e.target)) {
                emojiDialog.classList.add('hidden');
            }
        });

        // 阻止对话框内的点击事件冒泡
        emojiDialog.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }

    updateWishesList();
    startCountdownUpdates();
}

function handleWishSubmit(e) {
    e.preventDefault();

    const content = document.getElementById('wishContent').value.trim();
    const emoji = document.getElementById('emojiPicker').textContent;
    const date = document.getElementById('wishDate').value;
    const category = document.getElementById('wishCategory').value;

    if (!content || !date) {
        alert('Please fill in all required fields');
        return;
    }

    const wish = {
        id: Date.now(),
        content,
        emoji,
        targetDate: date,
        category,
        createdBy: state.activeUser,
        createdAt: new Date().toISOString(),
        status: 'active' // active, completed, cancelled
    };

    state.wishes.push(wish);
    saveState();
    updateWishesList();
    addMessage(`✨ Added new wish: ${content}`, true);

    // Reset form
    e.target.reset();
    document.getElementById('emojiPicker').textContent = '😊';
}

function updateWishesList() {
    const wishesList = document.getElementById('wishesList');
    if (!wishesList) return;

    const activeWishes = state.wishes.filter(wish => wish.status === 'active');
    const completedWishes = state.wishes.filter(wish => wish.status === 'completed');
    const cancelledWishes = state.wishes.filter(wish => wish.status === 'cancelled');

    wishesList.innerHTML = `
        <!-- Active Wishes -->
        <div class="space-y-4 p-4">
            <h3 class="text-lg font-semibold">Active Wishes 进行中的愿望</h3>
            ${activeWishes.map(wish => createWishCard(wish)).join('')}
        </div>

        <!-- Completed Wishes -->
        ${completedWishes.length > 0 ? `
            <div class="space-y-4 mt-8">
                <h3 class="text-lg font-semibold text-green-600">Completed Wishes 已完成的愿望</h3>
                ${completedWishes.map(wish => createWishCard(wish)).join('')}
            </div>
        ` : ''}

        <!-- Cancelled Wishes -->
        ${cancelledWishes.length > 0 ? `
            <div class="space-y-4 mt-8">
                <h3 class="text-lg font-semibold text-gray-500">Cancelled Wishes 已取消的愿望</h3>
                ${cancelledWishes.map(wish => createWishCard(wish)).join('')}
            </div>
        ` : ''}
    `;

    lucide.createIcons();
}

function createWishCard(wish) {
    const countdown = calculateCountdown(wish.targetDate);
    const countdownClass = getCountdownClass(countdown);
    const isActive = wish.status === 'active';

    return `
        <div class="wish-card ${wish.category} ${wish.status !== 'active' ? 'opacity-75' : ''}"
             data-id="${wish.id}">
            <div class="wish-content">
                <div class="wish-emoji">${wish.emoji}</div>
                <div class="wish-text">
                    <p class="text-lg font-medium">${wish.content}</p>
                    <div class="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <span>By ${USERS[wish.createdBy].name}</span>
                        <span>•</span>
                        <span>Target: ${formatDate(wish.targetDate)}</span>
                    </div>
                </div>
            </div>
            ${isActive ? `
                <div class="countdown ${countdownClass}">
                    ${countdown.text}
                </div>
                <div class="wish-actions">
                    <button class="wish-btn complete" onclick="completeWish(${wish.id})">
                        <i data-lucide="check-circle-2"></i>
                        Complete
                    </button>
                    <button class="wish-btn cancel" onclick="cancelWish(${wish.id})">
                        <i data-lucide="x-circle"></i>
                        Cancel
                    </button>
                </div>
            ` : `
                <div class="text-sm font-medium ${wish.status === 'completed' ? 'text-green-600' : 'text-gray-500'}">
                    ${wish.status === 'completed' ? '✨ Completed' : '❌ Cancelled'}
                    on ${formatDate(wish.statusChangedAt)}
                </div>
            `}
        </div>
    `;
}

function calculateCountdown(targetDate) {
    const now = new Date();
    const target = new Date(targetDate);
    const diff = target - now;

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const months = Math.floor(days / 30);
    const years = Math.floor(months / 12);

    if (diff < 0) {
        return { text: 'Time has passed', urgent: true };
    }

    if (years > 0) {
        return {
            text: `${years} year${years > 1 ? 's' : ''} left`,
            relaxed: true
        };
    }

    if (months > 0) {
        return {
            text: `${months} month${months > 1 ? 's' : ''} left`,
            upcoming: months > 3
        };
    }

    return {
        text: `${days} day${days > 1 ? 's' : ''} left`,
        urgent: days < 7
    };
}

function getCountdownClass({ urgent, upcoming, relaxed }) {
    if (urgent) return 'urgent';
    if (upcoming) return 'upcoming';
    if (relaxed) return 'relaxed';
    return 'upcoming';
}

function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

function completeWish(wishId) {
    const wish = state.wishes.find(w => w.id === wishId);
    if (!wish) return;

    const wishCard = document.querySelector(`.wish-card[data-id="${wishId}"]`);
    wishCard.classList.add('wish-completing');

    setTimeout(() => {
        wish.status = 'completed';
        wish.statusChangedAt = new Date().toISOString();
        saveState();
        updateWishesList();
        addMessage(`🎉 Completed wish: ${wish.content}`, true);
    }, 500);
}

function cancelWish(wishId) {
    const wish = state.wishes.find(w => w.id === wishId);
    if (!wish) return
    if (confirm('Are you sure you want to cancel this wish?')) {
        wish.status = 'cancelled';
        wish.statusChangedAt = new Date().toISOString();
        saveState();
        updateWishesList();
        addMessage(`❌ Cancelled wish: ${wish.content}`, true);
    }
    }

    function startCountdownUpdates() {
    // 每分钟更新一次倒计时
    setInterval(updateWishesList, 60000);
    }

    // 当DOM加载完成时初始化
    document.addEventListener('DOMContentLoaded', initializeWishes);

    // 导出函数供其他模块使用
    window.completeWish = completeWish;
    window.cancelWish = cancelWish;

    // 添加对页面离开时的保存
    window.addEventListener('beforeunload', () => {
    saveState();
    });

    // 添加错误处理
    window.addEventListener('error', (event) => {
    console.error('Error in wishes module:', event.error);
    addMessage('⚠️ An error occurred while processing your request', true);
    });

    // 在页面可见性改变时更新列表
    document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        updateWishesList();
    }
    });