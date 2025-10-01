// Header functionality and interactions
class HeaderManager {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadNotifications();
        this.setupSearch();
    }

    setupEventListeners() {
        // Notifications dropdown
        const notificationBtn = document.getElementById('notification-btn');
        const notificationDropdown = document.getElementById('notification-dropdown');
        
        if (notificationBtn && notificationDropdown) {
            notificationBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                notificationDropdown.classList.toggle('show');
                this.closeOtherDropdowns('notification');
            });
        }

        // User menu dropdown
        const userMenuBtn = document.getElementById('user-menu-btn');
        const userDropdown = document.getElementById('user-dropdown');
        
        if (userMenuBtn && userDropdown) {
            userMenuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                userDropdown.classList.toggle('show');
                this.closeOtherDropdowns('user');
            });
        }

        // Close dropdowns when clicking outside
        document.addEventListener('click', () => {
            this.closeAllDropdowns();
        });

        // Quick actions
        const refreshBtn = document.getElementById('refresh-data-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.refreshData();
            });
        }

        const addDeviceBtn = document.getElementById('add-device-btn');
        if (addDeviceBtn) {
            addDeviceBtn.addEventListener('click', () => {
                this.showAddDeviceModal();
            });
        }

        // System status banner
        const statusClose = document.getElementById('status-close');
        if (statusClose) {
            statusClose.addEventListener('click', () => {
                this.hideStatusBanner();
            });
        }
    }

    closeOtherDropdowns(current) {
        const dropdowns = {
            notification: document.getElementById('notification-dropdown'),
            user: document.getElementById('user-dropdown')
        };

        Object.entries(dropdowns).forEach(([key, dropdown]) => {
            if (key !== current && dropdown) {
                dropdown.classList.remove('show');
            }
        });
    }

    closeAllDropdowns() {
        document.getElementById('notification-dropdown')?.classList.remove('show');
        document.getElementById('user-dropdown')?.classList.remove('show');
    }

    async loadNotifications() {
        try {
            const response = await fetch('/api/notifications');
            const notifications = await response.json();
            this.renderNotifications(notifications);
        } catch (error) {
            console.error('Failed to load notifications:', error);
        }
    }

    renderNotifications(notifications) {
        const container = document.getElementById('notification-list');
        const countElement = document.getElementById('notification-count');
        
        if (!container) return;

        if (notifications.length === 0) {
            container.innerHTML = '<div class="notification-item"><div class="notification-content">No notifications</div></div>';
            countElement.style.display = 'none';
            return;
        }

        const unreadCount = notifications.filter(n => !n.read).length;
        countElement.textContent = unreadCount;
        countElement.style.display = unreadCount > 0 ? 'flex' : 'none';

        container.innerHTML = notifications.map(notification => `
            <div class="notification-item ${notification.read ? '' : 'unread'}">
                <div class="notification-content">${notification.message}</div>
                <div class="notification-time">${this.formatTime(notification.timestamp)}</div>
            </div>
        `).join('');
    }

    formatTime(timestamp) {
        const now = new Date();
        const time = new Date(timestamp);
        const diff = now - time;
        
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (days > 0) return `${days}d ago`;
        if (hours > 0) return `${hours}h ago`;
        if (minutes > 0) return `${minutes}m ago`;
        return 'Just now';
    }

    setupSearch() {
        const searchInput = document.getElementById('global-search');
        const searchClear = document.querySelector('.search-clear');

        if (searchInput && searchClear) {
            searchInput.addEventListener('input', (e) => {
                searchClear.style.display = e.target.value ? 'block' : 'none';
                this.performSearch(e.target.value);
            });

            searchClear.addEventListener('click', () => {
                searchInput.value = '';
                searchClear.style.display = 'none';
                this.clearSearch();
            });
        }
    }

    performSearch(query) {
        if (query.length < 2) return;
        
        // Implement search functionality
        console.log('Searching for:', query);
        // This would typically make an API call to search endpoints
    }

    clearSearch() {
        // Clear search results
        console.log('Clearing search');
    }

    refreshData() {
        const refreshBtn = document.getElementById('refresh-data-btn');
        if (refreshBtn) {
            refreshBtn.classList.add('fa-spin');
            
            // Dispatch custom event for components to refresh
            window.dispatchEvent(new CustomEvent('refreshData'));
            
            setTimeout(() => {
                refreshBtn.classList.remove('fa-spin');
            }, 1000);
        }
    }

    showAddDeviceModal() {
        // This would show a modal for adding devices
        console.log('Show add device modal');
    }

    hideStatusBanner() {
        const banner = document.getElementById('system-status-banner');
        if (banner) {
            banner.style.display = 'none';
        }
    }

    showStatusBanner(message, type = 'error') {
        const banner = document.getElementById('system-status-banner');
        const messageElement = document.getElementById('status-message');
        
        if (banner && messageElement) {
            messageElement.textContent = message;
            banner.className = `status-banner ${type}`;
            banner.style.display = 'block';
        }
    }

    showLoading() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.style.display = 'flex';
        }
    }

    hideLoading() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }
}

// Initialize header manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.headerManager = new HeaderManager();
});

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HeaderManager;
}