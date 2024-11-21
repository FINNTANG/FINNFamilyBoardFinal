// 初始化阅读功能
function initializeReading() {
    console.log('Initializing reading module...');

    if (!state.books) {
        state.books = [];
    }

    const bookUpload = document.getElementById('bookUpload');
    if (bookUpload) {
        bookUpload.addEventListener('change', handleBookUpload);
        updateBookGrid();
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
            const bookId = parseInt(picker.dataset.forBook);
            if (bookId) {
                addReaction(bookId, event.detail.unicode);
                document.getElementById('emojiDialog').classList.add('hidden');
            }
        });
    }

    // 初始化评论提交按钮
    document.getElementById('submitComment')?.addEventListener('click', () => {
        const dialog = document.getElementById('commentDialog');
        const bookId = parseInt(dialog.dataset.forBook);
        const text = document.getElementById('commentText').value.trim();
        if (bookId && text) {
            addComment(bookId, text);
            dialog.classList.add('hidden');
        }
    });
}

function handleBookUpload(e) {
    const files = Array.from(e.target.files).filter(file => file.type.startsWith('image/'));
    if (files.length === 0) {
        showError('Please select image files');
        return;
    }

    const progressBar = document.getElementById('uploadProgress');
    if (progressBar) progressBar.classList.remove('hidden');

    files.forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const book = {
                id: Date.now() + index,
                imageUrl: event.target.result,
                uploadedBy: state.activeUser,
                timestamp: new Date().toISOString(),
                description: prompt('Enter book title:') || 'Untitled Book',
                reactions: [],
                comments: [],
                progress: 0
            };

            state.books.unshift(book);
            saveState();
            updateBookGrid();
            addMessage(`📚 Added new book: ${book.description}`, true);
        };

        reader.onerror = () => {
            showError('Failed to read file');
        };

        reader.readAsDataURL(file);
    });

    if (progressBar) progressBar.classList.add('hidden');
    e.target.value = '';
}

function updateBookGrid() {
    console.log('Updating book grid...', state.books);

    const bookGrid = document.getElementById('bookGrid');
    const emptyState = document.getElementById('emptyState');

    if (!bookGrid) {
        console.error('Book grid element not found');
        return;
    }

    try {
        if (!Array.isArray(state.books) || state.books.length === 0) {
            bookGrid.innerHTML = '';
            if (emptyState) emptyState.classList.remove('hidden');
            return;
        }

        if (emptyState) {
            emptyState.classList.add('hidden');
        }

        bookGrid.innerHTML = state.books.map(book => `
            <div class="book-card" data-id="${book.id}">
                <div class="relative group">
                    <img src="${book.imageUrl}" alt="${book.description}" 
                         class="w-full h-64 object-cover rounded-lg cursor-pointer"
                         onclick="showBookDetails(${book.id})">
                    ${book.uploadedBy === state.activeUser ? `
                        <button onclick="deleteBook(${book.id}); event.stopPropagation();" 
                                class="delete-btn">
                            <i data-lucide="trash-2" class="w-5 h-5"></i>
                        </button>
                    ` : ''}
                </div>
                <div class="p-4">
                    <div class="mb-4">
                        <h3 class="text-lg font-medium mb-2">${book.description}</h3>
                        <!-- Progress Bar -->
                        <div class="bg-gray-200 rounded-full h-2 mb-1">
                            <div class="bg-blue-500 rounded-full h-2 transition-all duration-300"
                                 style="width: ${book.progress}%"></div>
                        </div>
                        <div class="flex justify-between text-sm text-gray-500">
                            <span>Progress: ${book.progress}%</span>
                            <button onclick="incrementProgress(${book.id})" 
                                    class="text-blue-500 hover:text-blue-600">
                                + Add Progress
                            </button>
                        </div>
                    </div>

                    <div class="flex items-center justify-between">
                        <span class="text-sm text-gray-500">
                            By ${USERS[book.uploadedBy].name}
                        </span>
                        <div class="flex gap-2">
                            <button onclick="showEmojiPicker(${book.id})" 
                                    class="text-gray-500 hover:text-blue-500">
                                <i data-lucide="smile"></i>
                            </button>
                            <button onclick="showCommentDialog(${book.id})" 
                                    class="text-gray-500 hover:text-blue-500">
                                <i data-lucide="message-circle"></i>
                            </button>
                        </div>
                    </div>

                    <!-- Reactions -->
                    ${book.reactions && book.reactions.length > 0 ? `
                        <div class="flex flex-wrap gap-1 mt-2">
                            ${book.reactions.map(r => `
                                <span class="text-lg" title="${USERS[r.by].name}">${r.emoji}</span>
                            `).join('')}
                        </div>
                    ` : ''}

                    <!-- Comments -->
                    ${book.comments && book.comments.length > 0 ? `
                        <div class="mt-2 space-y-1">
                            ${book.comments.slice(0, 2).map(c => `
                                <div class="text-sm">
                                    <span class="font-medium">${USERS[c.by].name}</span>:
                                    <span class="text-gray-600">${c.text}</span>
                                </div>
                            `).join('')}
                            ${book.comments.length > 2 ? `
                                <button onclick="showBookDetails(${book.id})" 
                                        class="text-sm text-blue-500 hover:underline">
                                    View all ${book.comments.length} comments
                                </button>
                            ` : ''}
                        </div>
                    ` : ''}
                </div>
            </div>
        `).join('');

        // 确保 icons 初始化
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        } else {
            console.warn('Lucide icons not loaded, retrying...');
            setTimeout(() => lucide.createIcons(), 500);
        }
    } catch (error) {
        console.error('Error updating book grid:', error);
        bookGrid.innerHTML = '<div class="text-red-500">Error loading books. Please refresh the page.</div>';
    }
}

function showBookDetails(bookId) {
    const book = state.books.find(b => b.id === bookId);
    if (!book) return;

    const dialog = document.getElementById('bookDialog');
    dialog.innerHTML = `
        <div class="dialog-content max-w-4xl">
            <div class="grid grid-cols-2 gap-4">
                <div class="aspect-square overflow-hidden rounded-lg">
                    <img src="${book.imageUrl}" alt="${book.description}" class="w-full h-full object-cover">
                </div>
                <div class="flex flex-col">
                    <div class="flex justify-between items-start">
                        <div>
                            <h3 class="text-lg font-semibold">${book.description}</h3>
                            <p class="text-sm text-gray-500">
                                Added by ${USERS[book.uploadedBy].name} on ${formatDate(book.timestamp)}
                            </p>
                        </div>
                        ${book.uploadedBy === state.activeUser ? `
                            <button onclick="deleteBook(${book.id})" 
                                    class="text-red-500 hover:text-red-600">
                                <i data-lucide="trash-2"></i>
                            </button>
                        ` : ''}
                    </div>

                    <!-- Progress Section -->
                    <div class="mt-6">
                        <div class="bg-gray-200 rounded-full h-2 mb-1">
                            <div class="bg-blue-500 rounded-full h-2 transition-all duration-300"
                                 style="width: ${book.progress}%"></div>
                        </div>
                        <div class="flex justify-between text-sm mb-4">
                            <span>Progress: ${book.progress}%</span>
                            <button onclick="incrementProgress(${book.id})" 
                                    class="text-blue-500 hover:text-blue-600">
                                + Add Progress
                            </button>
                        </div>
                    </div>

                    <div class="flex gap-2">
                        <button onclick="showEmojiPicker(${book.id})" 
                                class="action-button">
                            <i data-lucide="smile"></i>
                            Add Reaction
                        </button>
                        <button onclick="showCommentDialog(${book.id})" 
                                class="action-button">
                            <i data-lucide="message-circle"></i>
                            Add Comment
                        </button>
                    </div>

                    <!-- Reactions -->
                    ${book.reactions && book.reactions.length > 0 ? `
                        <div class="flex flex-wrap gap-2 mt-4">
                            ${book.reactions.map(r => `
                                <span class="text-2xl" title="${USERS[r.by].name}">${r.emoji}</span>
                            `).join('')}
                        </div>
                    ` : ''}

                    <!-- Comments -->
                    <div class="flex-1 overflow-y-auto mt-4">
                        <h4 class="font-medium mb-2">Comments</h4>
                        <div class="space-y-2">
                            ${book.comments && book.comments.length > 0 ? 
                                book.comments.map(c => `
                                    <div class="bg-gray-50 rounded p-2">
                                        <div class="flex items-center gap-2">
                                            <img src="${USERS[c.by].avatar}" 
                                                 alt="${USERS[c.by].name}" 
                                                 class="w-5 h-5 rounded-full">
                                            <span class="font-medium">${USERS[c.by].name}</span>
                                        </div>
                                        <p class="text-gray-700 mt-1">${c.text}</p>
                                        <p class="text-xs text-gray-500 mt-1">${formatDate(c.timestamp)}</p>
                                    </div>
                                `).join('') : 
                                '<p class="text-gray-500 text-sm">No comments yet</p>'
                            }
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

function deleteBook(bookId) {
    if (confirm('Are you sure you want to delete this book?')) {
        const index = state.books.findIndex(b => b.id === bookId);
        if (index !== -1) {
            const book = state.books[index];
            if (book.uploadedBy !== state.activeUser) {
                showError('You can only delete your own uploads');
                return;
            }
            state.books.splice(index, 1);
            saveState();
            updateBookGrid();

            const dialog = document.getElementById('bookDialog');
            if (dialog && !dialog.classList.contains('hidden')) {
                dialog.classList.add('hidden');
            }

            addMessage(`📚 Deleted book: ${book.description}`, true);
        }
    }
}

function incrementProgress(bookId) {
    const book = state.books.find(b => b.id === bookId);
    if (book) {
        book.progress = Math.min(100, book.progress + 10);
        saveState();
        updateBookGrid();
        addMessage(`📖 Updated progress for "${book.description}" to ${book.progress}%`, true);
    }
}

function showEmojiPicker(bookId) {
    const picker = document.querySelector('emoji-picker');
    if (!picker) return;

    picker.dataset.forBook = bookId;
    document.getElementById('emojiDialog').classList.remove('hidden');
}

function addReaction(bookId, emoji) {
    const book = state.books.find(b => b.id === bookId);
    if (!book) return;

    if (!book.reactions) {
        book.reactions = [];
    }

    const existingReaction = book.reactions.find(
        r => r.by === state.activeUser && r.emoji === emoji
    );

    if (!existingReaction) {
        book.reactions.push({
            emoji,
            by: state.activeUser,
            timestamp: new Date().toISOString()
        });
        saveState();
        updateBookGrid();
        document.getElementById('emojiDialog').classList.add('hidden');
    }
}

function showCommentDialog(bookId) {
    const dialog = document.getElementById('commentDialog');
    if (!dialog) return;

    dialog.dataset.forBook = bookId;
    dialog.classList.remove('hidden');

    const textarea = dialog.querySelector('#commentText');
    if (textarea) {
        textarea.value = '';
        textarea.focus();
    }
}

function addComment(bookId, text) {
    const book = state.books.find(b => b.id === bookId);
    if (!book) return;

    if (!book.comments) {
        book.comments = [];
    }

    book.comments.push({
        text,
        by: state.activeUser,
        timestamp: new Date().toISOString()
    });

    saveState();
    updateBookGrid();
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
document.addEventListener('DOMContentLoaded', initializeReading);

// 导出函数供其他模块使用
window.showBookDetails = showBookDetails;
window.deleteBook = deleteBook;
window.incrementProgress = incrementProgress;
window.showEmojiPicker = showEmojiPicker;
window.addReaction = addReaction;
window.showCommentDialog = showCommentDialog;
window.addComment = addComment;