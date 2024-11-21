// scripts/animations.js
function addPageTransitions() {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const currentPage = document.querySelector('#app');
            currentPage.style.animation = 'fadeOut 0.3s ease-out';

            setTimeout(() => {
                window.location.href = link.href;
            }, 300);
        });
    });

    document.querySelector('#app').style.animation = 'fadeIn 0.3s ease-out';
}

function addCommonAnimations() {
    document.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', function() {
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = 'scale(1)';
            }, 100);
        });
    });

    document.querySelectorAll('.card').forEach(card => {
        card.addEventListener('mouseover', function() {
            this.style.transform = 'translateY(-2px)';
        });
        card.addEventListener('mouseout', function() {
            this.style.transform = 'translateY(0)';
        });
    });
}

function addDynamicAnimations() {
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach(node => {
                if (node.classList) {
                    if (node.classList.contains('reminder-message')) {
                        node.style.animation = 'slideIn 0.3s ease-out';
                    }
                    if (node.classList.contains('media-item') || node.classList.contains('book-card')) {
                        node.style.animation = 'zoomIn 0.3s ease-out';
                    }
                }
            });
        });
    });

    const containers = [
        document.getElementById('remindersList'),
        document.getElementById('mediaGrid'),
        document.getElementById('readingList')
    ];

    containers.forEach(container => {
        if (container) {
            observer.observe(container, { childList: true });
        }
    });
}

// Initialize animations
document.addEventListener('DOMContentLoaded', () => {
    addPageTransitions();
    addCommonAnimations();
    addDynamicAnimations();
});