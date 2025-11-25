// navigation.js - Navigation Manager for PEM Electrolyzer
class NavigationManager {
    constructor() {
        this.currentTab = 'dashboard';
        this.init();
    }

    init() {
        this.setupTabNavigation();
        // Force show dashboard on init
        this.switchToTab('dashboard');
        console.log('Navigation Manager Initialized - Dashboard Active');
    }

    setupTabNavigation() {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabName = e.currentTarget.dataset.tab;
                if (tabName === 'dashboard') {
                    this.switchToTab(tabName);
                } else {
                    this.showTabDisabledMessage(tabName);
                }
            });
        });
    }

    switchToTab(tabName) {
        console.log('Switching to tab:', tabName);
        
        // Hide all tabs
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.style.display = 'none';
        });

        // Remove active class from all buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Show selected tab and activate button
        const targetTab = document.getElementById(tabName);
        const targetButton = document.querySelector(`[data-tab="${tabName}"]`);
        
        if (targetTab && targetButton) {
            targetTab.style.display = 'block';
            targetButton.classList.add('active');
            this.currentTab = tabName;
            
            // If switching to dashboard, ensure charts are visible
            if (tabName === 'dashboard') {
                setTimeout(() => {
                    if (window.chartManager) {
                        window.chartManager.resizeCharts();
                    }
                }, 100);
            }
        }
    }

    showTabDisabledMessage(tabName) {
        const tabNames = {
            'control': 'Control Panel',
            'safety': 'Safety MPC',
            'economic': 'Economic MPC', 
            'analytics': 'Analytics',
            'simulink': 'Simulink Integration'
        };
        
        const message = `${tabNames[tabName] || tabName} is currently disabled. Only the Dashboard is active in this demonstration version.`;
        
        if (window.electrolyzerApp && window.electrolyzerApp.showNotification) {
            window.electrolyzerApp.showNotification(message, 'warning');
        } else {
            alert(message); // Fallback
        }
    }

    // Method to enable specific tab (for future use)
    enableTab(tabName) {
        const button = document.querySelector(`[data-tab="${tabName}"]`);
        if (button) {
            button.style.opacity = '1';
            button.style.cursor = 'pointer';
            button.title = '';
        }
    }

    // Method to disable specific tab
    disableTab(tabName) {
        const button = document.querySelector(`[data-tab="${tabName}"]`);
        if (button) {
            button.style.opacity = '0.6';
            button.style.cursor = 'not-allowed';
            button.title = 'This tab is currently disabled';
        }
    }

    // Get current active tab
    getCurrentTab() {
        return this.currentTab;
    }

    // Check if tab is available
    isTabAvailable(tabName) {
        return tabName === 'dashboard'; // Only dashboard is available
    }
}

// Initialize navigation when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.navigationManager = new NavigationManager();
});
