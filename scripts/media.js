// 初始化媒体功能
function initializeMedia() {
    if (!state.mediaItems) {
        state.mediaItems = [];
    }

    const photoUpload = document.getElementById('photoUpload');
    if (photoUpload) {
        photoUpload.addEventListener('change', handlePhotoUpload);
        updateMedia();
    }

    // 初始化对话框关闭按钮
    document.querySelectorAll('.dialog .close-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.closest('.dialog').classList.add('hidden');
        });
    });

    // 初始化emoji选择器
    const picker = document.querySelector('emoji-picker');
    if (picker) {
        picker.addEventListener('emoji-click', event => {
            const mediaId = parseInt(picker.dataset.forMedia);
            if (mediaId) {
                addReaction(mediaId, event.detail.unicode);
                document.getElementById('emojiDialog').classList.add('hidden');
            }
        });
    }

    // 初始化评论提交按钮
    document.getElementById('submitComment')?.addEventListener('click', () => {
        const dialog = document.getElementById('commentDialog');
        const mediaId = parseInt(dialog.dataset.forMedia);
        const text = document.getElementById('commentText').value.trim();
        if (mediaId && text) {
            addComment(mediaId, text);
            dialog.classList.add('hidden');
        }
    });
}

function handlePhotoUpload(e) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // 显示上传进度条
    const progressBar = document.getElementById('uploadProgress');
    if (progressBar) progressBar.classList.remove('hidden');

    Array.from(files).forEach(file => {
        if (!file.type.startsWith('image/')) {
            showError('Only image files are supported');
            return;
        }

        // 添加文件大小限制
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            showError('Image size must be less than 5MB');
            return;
        }

        // 使用 createImageBitmap 和 Canvas 压缩图片
        createImageBitmap(file).then(bitmap => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            // 计算压缩后的尺寸（最大宽度1200px）
            let width = bitmap.width;
            let height = bitmap.height;
            const maxWidth = 1200;

            if (width > maxWidth) {
                height = (height * maxWidth) / width;
                width = maxWidth;
            }

            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(bitmap, 0, 0, width, height);

            // 转换为较低质量的JPEG
            canvas.toBlob(blob => {
                const reader = new FileReader();
                reader.onload = (event) => {
                    try {
                        const newMedia = {
                            id: Date.now() + Math.random(),
                            type: 'image',
                            url: event.target.result,
                            uploadedBy: state.activeUser,
                            timestamp: new Date().toISOString(),
                            description: prompt('Add a description for this image:') || 'No description',
                            reactions: [],
                            comments: []
                        };

                        state.mediaItems.unshift(newMedia);
                        saveState();
                        updateMedia();
                        addMessage(`📸 Uploaded: ${newMedia.description}`, true);

                        // 隐藏进度条
                        if (progressBar) progressBar.classList.add('hidden');
                    } catch (error) {
                        showError('Failed to process image: ' + error.message);
                    }
                };

                reader.onerror = () => {
                    showError('Failed to read image file');
                    if (progressBar) progressBar.classList.add('hidden');
                };

                reader.readAsDataURL(blob);
            }, 'image/jpeg', 0.6); // 降低JPEG质量到60%
        }).catch(error => {
            showError('Failed to process image: ' + error.message);
            if (progressBar) progressBar.classList.add('hidden');
        });
    });

    e.target.value = '';
}

function updateMedia() {
    const mediaGrid = document.getElementById('mediaGrid');
    const emptyState = document.getElementById('emptyState');

    if (!mediaGrid) return;

    if (!state.mediaItems || state.mediaItems.length === 0) {
        mediaGrid.innerHTML = '';
        if (emptyState) emptyState.classList.remove('hidden');
        return;
    }

    if (emptyState) emptyState.classList.add('hidden');

    mediaGrid.innerHTML = state.mediaItems.map(item => `
        <div class="media-item" data-id="${item.id}">
            <div class="relative group">
                <img src="${item.url}" alt="${item.description}" 
                     class="w-full h-48 object-cover rounded-lg cursor-pointer"
                     onclick="showMediaDetails(${item.id})">
                ${item.uploadedBy === state.activeUser ? `
                    <button onclick="deleteMediaItem(${item.id}); event.stopPropagation();" 
                            class="delete-btn">
                        <i data-lucide="trash-2" class="w-5 h-5"></i>
                    </button>
                ` : ''}
            </div>
            <div class="p-4">
                <p class="text-sm font-medium">${item.description}</p>
                <div class="flex items-center justify-between mt-2">
                    <span class="text-xs text-gray-500">
                        By ${USERS[item.uploadedBy].name}
                    </span>
                    <div class="flex gap-2">
                        <button onclick="showEmojiPicker(${item.id})" class="text-gray-500 hover:text-blue-500">
                            <i data-lucide="smile"></i>
                        </button>
                        <button onclick="showCommentDialog(${item.id})" class="text-gray-500 hover:text-blue-500">
                            <i data-lucide="message-circle"></i>
                        </button>
                    </div>
                </div>
                ${renderReactionsAndComments(item)}
            </div>
        </div>
    `).join('');

    // 初始化图标
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

function renderReactionsAndComments(item) {
    const reactions = item.reactions || [];
    const comments = item.comments || [];

    return `
        <div class="mt-2 space-y-2">
            ${reactions.length > 0 ? `
                <div class="flex flex-wrap gap-1">
                    ${reactions.map(r => `
                        <span class="text-lg" title="${USERS[r.by].name}">${r.emoji}</span>
                    `).join('')}
                </div>
            ` : ''}
            ${comments.length > 0 ? `
                <div class="space-y-1">
                    ${comments.slice(0, 2).map(c => `
                        <div class="text-xs">
                            <span class="font-medium">${USERS[c.by].name}</span>:
                            <span>${c.text}</span>
                        </div>
                    `).join('')}
                    ${comments.length > 2 ? `
                        <button onclick="showMediaDetails(${item.id})" 
                                class="text-xs text-blue-500 hover:underline">
                            View all ${comments.length} comments
                        </button>
                    ` : ''}
                </div>
            ` : ''}
        </div>
    `;
}

function showMediaDetails(mediaId) {
    const item = state.mediaItems.find(m => m.id === mediaId);
    if (!item) return;

    const dialog = document.getElementById('mediaDialog');
    dialog.innerHTML = `
        <div class="dialog-content max-w-4xl">
            <div class="grid grid-cols-2 gap-4">
                <div class="aspect-square overflow-hidden rounded-lg">
                    <img src="${item.url}" alt="${item.description}" class="w-full h-full object-cover">
                </div>
                <div class="flex flex-col">
                    <div class="flex justify-between items-start">
                        <div>
                            <h3 class="text-lg font-semibold">${item.description}</h3>
                            <p class="text-sm text-gray-500">
                                Shared by ${USERS[item.uploadedBy].name} on ${formatDate(item.timestamp)}
                            </p>
                        </div>
                        ${item.uploadedBy === state.activeUser ? `
                            <button onclick="deleteMediaItem(${item.id})" 
                                    class="text-red-500 hover:text-red-600">
                                <i data-lucide="trash-2"></i>
                            </button>
                        ` : ''}
                    </div>

                    <div class="flex gap-2 mt-4">
                        <button onclick="showEmojiPicker(${item.id})" class="text-sm hover:text-blue-500">
                            <i data-lucide="smile"></i> Add Reaction
                        </button>
                        <button onclick="showCommentDialog(${item.id})" class="text-sm hover:text-blue-500">
                            <i data-lucide="message-circle"></i> Add Comment
                        </button>
                    </div>

                    <div class="flex flex-wrap gap-2 mt-4">
                        ${(item.reactions || []).map(r => `
                            <span class="text-2xl" title="${USERS[r.by].name}">${r.emoji}</span>
                        `).join('')}
                    </div>

                    <div class="flex-1 overflow-y-auto mt-4">
                        <h4 class="font-medium mb-2">Comments</h4>
                        <div class="space-y-2">
                            ${(item.comments || []).map(c => `
                                <div class="bg-gray-50 rounded p-2">
                                    <div class="flex items-center gap-2">
                                        <img src="${USERS[c.by].avatar}" class="w-5 h-5 rounded-full">
                                        <span class="font-medium">${USERS[c.by].name}</span>
                                    </div>
                                    <p class="text-sm mt-1">${c.text}</p>
                                    <p class="text-xs text-gray-500 mt-1">${formatDate(c.timestamp)}</p>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
            <button class="close-btn mt-4">Close</button>
        </div>
    `;

    dialog.classList.remove('hidden');
    dialog.querySelector('.close-btn').onclick = () => dialog.classList.add('hidden');
    lucide.createIcons();
}

function deleteMediaItem(mediaId) {
    if (confirm('Are you sure you want to delete this item?')) {
        const index = state.mediaItems.findIndex(item => item.id === mediaId);
        if (index !== -1) {
            const item = state.mediaItems[index];
            if (item.uploadedBy !== state.activeUser) {
                showError('You can only delete your own uploads');
                return;
            }
            state.mediaItems.splice(index, 1);
            saveState();
            updateMedia();

            const dialog = document.getElementById('mediaDialog');
            if (dialog && !dialog.classList.contains('hidden')) {
                dialog.classList.add('hidden');
            }

            addMessage('🗑️ Media item deleted successfully', true);
        }
    }
}

function showEmojiPicker(mediaId) {
    const picker = document.querySelector('emoji-picker');
    picker.dataset.forMedia = mediaId;
    document.getElementById('emojiDialog').classList.remove('hidden');
}

function addReaction(mediaId, emoji) {
    const item = state.mediaItems.find(m => m.id === mediaId);
    if (!item) return;

    if (!item.reactions) {
        item.reactions = [];
    }

    const existingReaction = item.reactions.find(
        r => r.by === state.activeUser && r.emoji === emoji
    );

    if (!existingReaction) {
        item.reactions.push({
            emoji,
            by: state.activeUser,
            timestamp: new Date().toISOString()
        });
        saveState();
        updateMedia();
        showMediaDetails(mediaId);
    }
}

function showCommentDialog(mediaId) {
    const dialog = document.getElementById('commentDialog');
    dialog.dataset.forMedia = mediaId;
    dialog.classList.remove('hidden');
    const textarea = dialog.querySelector('#commentText');
    textarea.value = '';
    textarea.focus();
}

function addComment(mediaId, text) {
    const item = state.mediaItems.find(m => m.id === mediaId);
    if (!item) return;

    if (!item.comments) {
        item.comments = [];
    }

    item.comments.push({
        text,
        by: state.activeUser,
        timestamp: new Date().toISOString()
    });

    saveState();
    updateMedia();
    showMediaDetails(mediaId);
}

function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.classList.remove('hidden');
        setTimeout(() => {
            errorDiv.classList.add('hidden');
        }, 3000);
    }
    addMessage(`⚠️ ${message}`, true);
}

// 初始化
document.addEventListener('DOMContentLoaded', initializeMedia);

// 导出函数供其他模块使用
window.showMediaDetails = showMediaDetails;
window.showEmojiPicker = showEmojiPicker;
window.addReaction = addReaction;
window.showCommentDialog = showCommentDialog;
window.addComment = addComment;
window.deleteMediaItem = deleteMediaItem;