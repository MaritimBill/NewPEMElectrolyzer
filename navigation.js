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

        // Add refresh button listener for analytics
        const refreshAnalyticsBtn = document.getElementById('refreshAnalytics');
        if (refreshAnalyticsBtn) {
            refreshAnalyticsBtn.addEventListener('click', () => {
                this.refreshAnalyticsData();
            });
        }

        // Add Simulink control listeners
        this.setupSimulinkControls();
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
        
        // Trigger chart initialization for this tab
        if (window.chartManager) {
            window.chartManager.initializeTabCharts(tabName);
        }
        
        // Dispatch custom event for tab change
        const event = new CustomEvent('tabChanged', {
            detail: { tabName: tabName }
        });
        document.dispatchEvent(event);
        
        // Resize charts when switching tabs
        setTimeout(() => {
            if (window.chartManager) {
                window.chartManager.resizeCharts();
            }
        }, 100);
    }
}

    updateTabContent(tabName) {
        switch(tabName) {
            case 'analytics':
                this.updateAnalyticsTab();
                break;
            case 'simulink':
                this.updateSimulinkTab();
                break;
            case 'control':
                this.updateControlTab();
                break;
            case 'safety':
                this.updateSafetyTab();
                break;
            case 'economic':
                this.updateEconomicTab();
                break;
        }
    }

    updateAnalyticsTab() {
        console.log('Updating Analytics tab content');
        
        // Update performance metrics with current data
        if (window.electrolyzerApp && window.electrolyzerApp.currentData) {
            const data = window.electrolyzerApp.currentData;
            
            // Update real-time efficiency comparison
            if (window.chartManager && window.chartManager.charts.has('trendsChart')) {
                const trendsChart = window.chartManager.charts.get('trendsChart');
                if (trendsChart && data.efficiency !== undefined) {
                    // Add current efficiency data to trends
                    window.chartManager.shiftTrendsData(trendsChart, data.efficiency, data.efficiency * 0.85);
                }
            }
        }
    }

    updateSimulinkTab() {
        console.log('Updating Simulink tab content');
        
        // Update connection status
        this.updateSimulinkStatus();
        
        // Update last update time
        const lastUpdateElement = document.getElementById('simulinkLastUpdate');
        if (lastUpdateElement) {
            const now = new Date();
            lastUpdateElement.textContent = now.toLocaleTimeString('en-US', {
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
        }
    }

    updateControlTab() {
        console.log('Updating Control tab content');
        
        // Set current values in control inputs if data is available
        if (window.electrolyzerApp && window.electrolyzerApp.currentData) {
            const data = window.electrolyzerApp.currentData;
            
            const voltageInput = document.getElementById('voltageSetpoint');
            const currentInput = document.getElementById('currentSetpoint');
            const tempInput = document.getElementById('tempSetpoint');
            
            if (voltageInput && data.voltage !== undefined) {
                voltageInput.value = data.voltage.toFixed(1);
            }
            if (currentInput && data.current !== undefined) {
                currentInput.value = Math.round(data.current);
            }
            if (tempInput && data.stackTemperature !== undefined) {
                tempInput.value = Math.round(data.stackTemperature);
            }
        }
    }

    updateSafetyTab() {
        console.log('Updating Safety tab content');
        
        // Update safety constraints with current data
        if (window.electrolyzerApp && window.electrolyzerApp.currentData) {
            const data = window.electrolyzerApp.currentData;
            
            // Update safety chart with current data
            if (window.chartManager && window.chartManager.charts.has('safetyChart')) {
                const safetyChart = window.chartManager.charts.get('safetyChart');
                if (safetyChart && data.safetyMargin !== undefined) {
                    window.chartManager.shiftAnalyticsData(
                        safetyChart, 
                        data.temperatureMargin || data.safetyMargin, 
                        data.pressureMargin || data.safetyMargin * 0.8
                    );
                }
            }
        }
    }

    updateEconomicTab() {
        console.log('Updating Economic tab content');
        
        // Update economic metrics with current data
        if (window.electrolyzerApp && window.electrolyzerApp.currentData) {
            const data = window.electrolyzerApp.currentData;
            
            // Update economic chart
            if (window.chartManager && window.chartManager.charts.has('economicChart')) {
                const economicChart = window.chartManager.charts.get('economicChart');
                if (economicChart && data.powerConsumption !== undefined) {
                    // Calculate economic metrics based on power consumption
                    const energyCost = data.powerConsumption * 0.12; // $0.12/kWh
                    const h2Cost = (data.o2Production || 0) * 0.15; // $0.15/L O2 equivalent
                    const opCost = energyCost + h2Cost + 25; // Fixed costs
                    const revenue = (data.o2Production || 0) * 2.5; // $2.5/L O2
                    const profit = revenue - opCost;
                    
                    economicChart.data.datasets[0].data = [energyCost, h2Cost, opCost, revenue, profit];
                    economicChart.options.plugins.title.text = 'Economic Analysis (Live Data)';
                    economicChart.update('none');
                }
            }
        }
    }

    setupSimulinkControls() {
        // Start Simulation button
        const startSimulationBtn = document.getElementById('startSimulation');
        if (startSimulationBtn) {
            startSimulationBtn.addEventListener('click', () => {
                this.startSimulinkSimulation();
            });
        }

        // Stop Simulation button
        const stopSimulationBtn = document.getElementById('stopSimulation');
        if (stopSimulationBtn) {
            stopSimulationBtn.addEventListener('click', () => {
                this.stopSimulinkSimulation();
            });
        }

        // Update Model button
        const updateModelBtn = document.getElementById('updateModel');
        if (updateModelBtn) {
            updateModelBtn.addEventListener('click', () => {
                this.updateSimulinkModel();
            });
        }

        // Control panel buttons
        document.querySelectorAll('.control-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                this.handleControlAction(action);
            });
        });
    }

    startSimulinkSimulation() {
        console.log('Starting Simulink simulation...');
        
        if (window.electrolyzerApp) {
            window.electrolyzerApp.showNotification('Starting Simulink simulation...', 'info');
        }
        
        // Update UI state
        this.updateSimulinkStatus('running');
        
        // Send command to Simulink bridge
        if (window.simulinkBridge && typeof window.simulinkBridge.startSimulation === 'function') {
            window.simulinkBridge.startSimulation();
        } else {
            console.warn('Simulink bridge not available, simulating start...');
            // Simulate successful start
            setTimeout(() => {
                this.updateSimulinkStatus('connected');
                if (window.electrolyzerApp) {
                    window.electrolyzerApp.showNotification('Simulink simulation started successfully', 'success');
                }
            }, 1000);
        }
    }

    stopSimulinkSimulation() {
        console.log('Stopping Simulink simulation...');
        
        if (window.electrolyzerApp) {
            window.electrolyzerApp.showNotification('Stopping Simulink simulation...', 'warning');
        }
        
        // Update UI state
        this.updateSimulinkStatus('stopping');
        
        // Send command to Simulink bridge
        if (window.simulinkBridge && typeof window.simulinkBridge.stopSimulation === 'function') {
            window.simulinkBridge.stopSimulation();
        } else {
            console.warn('Simulink bridge not available, simulating stop...');
            // Simulate successful stop
            setTimeout(() => {
                this.updateSimulinkStatus('disconnected');
                if (window.electrolyzerApp) {
                    window.electrolyzerApp.showNotification('Simulink simulation stopped', 'info');
                }
            }, 1000);
        }
    }

    updateSimulinkModel() {
        console.log('Updating Simulink model parameters...');
        
        if (window.electrolyzerApp) {
            window.electrolyzerApp.showNotification('Updating model parameters...', 'info');
        }
        
        // Get current parameter values
        const voltageSetpoint = document.getElementById('voltageSetpoint')?.value;
        const currentSetpoint = document.getElementById('currentSetpoint')?.value;
        const tempSetpoint = document.getElementById('tempSetpoint')?.value;
        
        const parameters = {
            voltage: parseFloat(voltageSetpoint) || 2.1,
            current: parseFloat(currentSetpoint) || 150,
            temperature: parseFloat(tempSetpoint) || 65,
            timestamp: new Date().toISOString()
        };
        
        // Send parameters to Simulink
        if (window.simulinkBridge && typeof window.simulinkBridge.updateParameters === 'function') {
            window.simulinkBridge.updateParameters(parameters);
        } else {
            console.warn('Simulink bridge not available, parameters:', parameters);
        }
        
        if (window.electrolyzerApp) {
            window.electrolyzerApp.showNotification('Model parameters updated', 'success');
        }
    }

    updateSimulinkStatus(status = 'connected') {
        const matlabStatusElement = document.getElementById('matlabStatus');
        const simulinkStatusElement = document.getElementById('simulinkStatus');
        
        if (matlabStatusElement) {
            switch(status) {
                case 'connected':
                    matlabStatusElement.textContent = 'Connected';
                    matlabStatusElement.className = 'status-value connected';
                    break;
                case 'running':
                    matlabStatusElement.textContent = 'Running';
                    matlabStatusElement.className = 'status-value connected';
                    break;
                case 'stopping':
                    matlabStatusElement.textContent = 'Stopping';
                    matlabStatusElement.className = 'status-value warning';
                    break;
                case 'disconnected':
                    matlabStatusElement.textContent = 'Disconnected';
                    matlabStatusElement.className = 'status-value disconnected';
                    break;
            }
        }
        
        if (simulinkStatusElement) {
            simulinkStatusElement.textContent = status.charAt(0).toUpperCase() + status.slice(1);
            simulinkStatusElement.className = `status-badge ${
                status === 'connected' || status === 'running' ? 'success' : 
                status === 'stopping' ? 'warning' : 'danger'
            }`;
        }
    }

    handleControlAction(action) {
        console.log('Control action:', action);
        
        if (window.electrolyzerApp) {
            window.electrolyzerApp.handleControlAction(action);
        }
        
        // Additional control-specific logic
        switch(action) {
            case 'start':
                this.handleSystemStart();
                break;
            case 'stop':
                this.handleSystemStop();
                break;
            case 'emergency':
                this.handleEmergencyStop();
                break;
        }
    }

    handleSystemStart() {
        console.log('Starting electrolyzer system...');
        // Additional start logic can be added here
    }

    handleSystemStop() {
        console.log('Stopping electrolyzer system...');
        // Additional stop logic can be added here
    }

    handleEmergencyStop() {
        console.log('EMERGENCY STOP ACTIVATED!');
        
        // Immediate UI feedback for emergency stop
        document.body.style.animation = 'emergencyFlash 0.5s 3';
        
        // Reset animation
        setTimeout(() => {
            document.body.style.animation = '';
        }, 1500);
        
        // Additional emergency stop logic
        if (window.simulinkBridge && typeof window.simulinkBridge.emergencyStop === 'function') {
            window.simulinkBridge.emergencyStop();
        }
    }

    refreshAnalyticsData() {
        console.log('Refreshing analytics data...');
        
        if (window.electrolyzerApp) {
            window.electrolyzerApp.showNotification('Refreshing analytics data...', 'info');
            
            // Force update of analytics charts
            if (window.electrolyzerApp.currentData) {
                this.updateAnalyticsTab();
            }
            
            setTimeout(() => {
                window.electrolyzerApp.showNotification('Analytics data refreshed', 'success');
            }, 500);
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

    // Method to handle real-time data updates
    onDataUpdate(data) {
        // Update current tab content when new data arrives
        this.updateTabContent(this.currentTab);
    }
}

// Initialize navigation when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.navigationManager = new NavigationManager();
});

// Add emergency flash animation to CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes emergencyFlash {
        0%, 100% { background-color: normal; }
        50% { background-color: rgba(239, 68, 68, 0.1); }
    }
`;
document.head.appendChild(style);
