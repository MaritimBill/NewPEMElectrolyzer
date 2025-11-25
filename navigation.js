// navigation.js - Navigation Manager for PEM Electrolyzer - ALL TABS ENABLED
class NavigationManager {
    constructor() {
        this.currentTab = 'dashboard';
        this.availableTabs = ['dashboard', 'control', 'safety', 'economic', 'analytics', 'simulink'];
        this.init();
    }

    init() {
        this.setupTabNavigation();
        this.enableAllTabs();
        // Force show dashboard on init
        this.switchToTab('dashboard');
        console.log('Navigation Manager Initialized - All Tabs Enabled');
    }

    setupTabNavigation() {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabName = e.currentTarget.dataset.tab;
                this.switchToTab(tabName);
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
            
            // Resize charts when switching tabs
            setTimeout(() => {
                if (window.chartManager) {
                    window.chartManager.resizeCharts();
                }
            }, 100);
        } else {
            console.error(`Tab or button not found: ${tabName}`);
        }
    }

    enableAllTabs() {
        this.availableTabs.forEach(tabName => {
            this.enableTab(tabName);
        });
    }

    enableTab(tabName) {
        const button = document.querySelector(`[data-tab="${tabName}"]`);
        if (button) {
            button.style.opacity = '1';
            button.style.cursor = 'pointer';
            button.disabled = false;
            button.title = `Switch to ${this.getTabDisplayName(tabName)}`;
        }
    }

    disableTab(tabName) {
        const button = document.querySelector(`[data-tab="${tabName}"]`);
        if (button) {
            button.style.opacity = '0.6';
            button.style.cursor = 'not-allowed';
            button.disabled = true;
            button.title = 'This tab is currently disabled';
        }
    }

    getTabDisplayName(tabName) {
        const names = {
            'dashboard': 'Dashboard',
            'control': 'Control Panel',
            'safety': 'Safety MPC',
            'economic': 'Economic MPC', 
            'analytics': 'Analytics',
            'simulink': 'Simulink Integration'
        };
        return names[tabName] || tabName;
    }

    // Get current active tab
    getCurrentTab() {
        return this.currentTab;
    }

    // Check if tab is available
    isTabAvailable(tabName) {
        return this.availableTabs.includes(tabName);
    }
}

// Initialize navigation when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.navigationManager = new NavigationManager();
});
