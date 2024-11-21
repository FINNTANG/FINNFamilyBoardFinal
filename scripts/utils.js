// scripts/utils.js
const utils = {
    formatDate: function(date) {
        return new Date(date).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    generateId: function() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    debounce: function(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    handleError: function(error, context) {
        console.error(`Error in ${context}:`, error);
        if (typeof addMessage === 'function') {
            addMessage(`⚠️ An error occurred: ${error.message}`, true);
        }
    }
};

// Handle responsive design
const handleResponsive = utils.debounce(() => {
    const isMobile = window.innerWidth < 768;
    document.documentElement.classList.toggle('is-mobile', isMobile);
}, 250);

window.addEventListener('resize', handleResponsive);
document.addEventListener('DOMContentLoaded', handleResponsive);