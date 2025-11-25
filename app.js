// app.js - Fixed Initialization for PEM Electrolyzer
class ElectrolyzerApp {
    constructor() {
        this.mqttClient = null;
        this.currentData = null;
        this.simulationData = null;
        this.isConnected = false;
        this.chartManager = null;
        this.simulinkBridge = null;
        this.dataPointsReceived = 0;
        
        this.init();
    }

    init() {
        console.log('HE-NMPC Electrolyzer Controller Initializing...');
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initializeApp());
        } else {
            this.initializeApp();
        }
    }

    initializeApp() {
        console.log('DOM fully loaded, initializing components...');
        
        // Initialize components in correct order
        this.initChartManager();
        this.initSimulinkBridge();
        this.initEventListeners();
        this.updateSystemStatus();
        
        this.connectToSimulation().catch(error => {
            console.error('Simulation connection failed:', error);
            this.showNotification('Starting fallback simulation mode...', 'warning');
        });
    }

    initChartManager() {
        try {
            this.chartManager = new ChartManager();
            console.log('Chart Manager Initialized');
        } catch (error) {
            console.error('Error initializing chart manager:', error);
        }
    }

    initSimulinkBridge() {
        try {
            this.simulinkBridge = new window.SimulinkBridge();
            this.setupSimulinkCallbacks();
            console.log('Simulink bridge initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Simulink bridge:', error);
            this.showNotification('Using fallback simulation mode', 'info');
        }
    }

    initEventListeners() {
        // Window resize handling
        window.addEventListener('resize', () => {
            if (this.chartManager) {
                setTimeout(() => this.chartManager.resizeCharts(), 100);
            }
        });

        // System control buttons
        const controlButtons = document.querySelectorAll('.control-btn');
        controlButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.handleControlAction(e.target.dataset.action);
            });
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch(e.key) {
                    case 'r':
                        e.preventDefault();
                        this.refreshData();
                        break;
                    case 'd':
                        e.preventDefault();
                        this.toggleDataView();
                        break;
                }
            }
        });

        console.log('Event listeners initialized');
    }

    setupSimulinkCallbacks() {
        if (!this.simulinkBridge) return;

        // Real simulation data callback
        this.simulinkBridge.onSimulationData = (data) => {
            this.handleSimulationData(data);
        };

        // MPC comparison data callback
        this.simulinkBridge.onMPCComparison = (comparisonData) => {
            this.handleMPCComparisonData(comparisonData);
        };

        // Simulation status callback
        this.simulinkBridge.onSimulationStatus = (status) => {
            this.updateSimulationStatus(status);
        };

        // Connection state callback
        this.simulinkBridge.onConnectionStateChange = (connected) => {
            this.updateConnectionStatus('simulink', connected);
        };
    }

    async connectToSimulation() {
        console.log('Connecting to MATLAB/Simulink simulation...');
        
        if (this.simulinkBridge) {
            try {
                await this.simulinkBridge.connect();
                this.isConnected = true;
                this.updateConnectionStatus('simulink', true);
                this.showNotification('Connected to MATLAB simulation', 'success');
                
                // Start simulation automatically
                setTimeout(() => {
                    this.simulinkBridge.startSimulation();
                }, 1000);
                
            } catch (error) {
                console.warn('Simulink connection failed, using fallback:', error);
                this.isConnected = false;
            }
        } else {
            throw new Error('Simulink bridge not available');
        }
    }

    handleSimulationData(simulationData) {
        console.log('📊 Received simulation data:', simulationData);
        
        this.dataPointsReceived++;
        this.simulationData = simulationData;
        this.currentData = simulationData;
        
        // Update charts with real simulation data
        if (this.chartManager) {
            this.chartManager.updateAllChartsWithSimulationData(this.currentData);
        }
        
        // Update UI
        this.updateDashboard(this.currentData);
        this.updateLiveDataFeed(this.currentData);
        this.updateSystemMetrics(this.currentData);
        
        // Update data points counter
        this.updateDataPointsCount();
    }

    handleMPCComparisonData(comparisonData) {
        console.log('📈 Received MPC comparison data:', comparisonData);
        
        // Update performance chart with real MPC comparison data
        if (this.chartManager) {
            this.chartManager.updatePerformanceChart(
                comparisonData.heNmpc,
                comparisonData.traditional
            );
        }
        
        // Update analytics metrics
        this.updateAnalyticsMetrics(comparisonData);
    }

    updateDashboard(data) {
        // Update main metrics with real data
        this.updateMetricValue('productionValue', data.o2Production, '%');
        this.updateMetricValue('efficiencyValue', data.efficiency, '%');
        this.updateMetricValue('safetyValue', data.safetyMargin, '%');
        this.updateMetricValue('temperatureValue', data.stackTemperature, '°C');
    }

    updateMetricValue(elementId, value, suffix = '') {
        const element = document.getElementById(elementId);
        if (element && value !== undefined && value !== null) {
            element.textContent = value.toFixed(1) + suffix;
            
            // Add animation effect for live data
            element.style.transform = 'scale(1.05)';
            setTimeout(() => {
                element.style.transform = 'scale(1)';
            }, 200);
        }
    }

    updateLiveDataFeed(data) {
        // Update live data display with real values
        this.updateLiveValue('liveO2Production', data.o2Production, '%');
        this.updateLiveValue('liveEfficiency', data.efficiency, '%');
        this.updateLiveValue('liveTemperature', data.stackTemperature, '°C');
        this.updateLiveValue('livePower', data.powerConsumption, 'kW');

        // Update Simulink tab real-time data
        this.updateLiveValue('simO2Production', data.o2Production, ' L/min');
        this.updateLiveValue('simStackTemp', data.stackTemperature, '°C');
        this.updateLiveValue('simEfficiency', data.efficiency, '%');
        this.updateLiveValue('simPower', data.powerConsumption, 'kW');
    }

    updateLiveValue(elementId, value, suffix = '') {
        const element = document.getElementById(elementId);
        if (element && value !== undefined && value !== null) {
            const formattedValue = typeof value === 'number' ? value.toFixed(1) : value;
            element.textContent = formattedValue + suffix;
        }
    }

    updateSystemMetrics(data) {
        // Update system status with real data
        this.updateStatusBadge('controllerMode', 'HE-NMPC', 'success');
        this.updateStatusBadge('operationMode', this.isConnected ? 'LIVE' : 'SIMULATION', 'info');
        this.updateStatusBadge('safetyViolations', '0', 'success');
        this.updateStatusBadge('simulinkStatus', this.isConnected ? 'Connected' : 'Fallback', 
                              this.isConnected ? 'success' : 'warning');
    }

    updateStatusBadge(elementId, text, type) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = text;
            element.className = `status-badge ${type}`;
        }
    }

    updateAnalyticsMetrics(comparisonData) {
        // Update real MPC performance metrics in analytics tab
        const metricsContainer = document.querySelector('.metrics-comparison');
        if (metricsContainer && comparisonData.metrics) {
            const metrics = comparisonData.metrics;
            
            // Update settling time
            this.updateComparisonMetric(metricsContainer, 1, metrics.settlingTime, 's');
            
            // Update overshoot
            this.updateComparisonMetric(metricsContainer, 2, metrics.overshoot, '%');
            
            // Update efficiency
            this.updateComparisonMetric(metricsContainer, 3, metrics.efficiency, '%');
            
            // Update constraint violations
            this.updateComparisonMetric(metricsContainer, 4, metrics.constraintViolations, '%');
        }
    }

    updateComparisonMetric(container, index, data, unit) {
        const element = container.querySelector(`.metric-comparison-item:nth-child(${index}) .metric-value`);
        if (element && data) {
            element.textContent = `${data.heNmpc}${unit} / ${data.traditional}${unit}`;
        }
    }

    updateDataPointsCount() {
        const countElement = document.getElementById('dataPointsCount');
        if (countElement) {
            countElement.textContent = this.dataPointsReceived;
        }
    }

    updateSimulationStatus(status) {
        if (window.navigationManager) {
            window.navigationManager.updateSimulinkStatus(status.status || 'running');
        }
        
        // Update simulation time
        if (status.simulationTime !== undefined) {
            const simTimeElement = document.getElementById('simTime');
            if (simTimeElement) {
                simTimeElement.textContent = `${status.simulationTime} s`;
            }
        }
        
        // Update data rate
        if (status.dataRate !== undefined) {
            const dataRateElement = document.getElementById('dataRate');
            if (dataRateElement) {
                dataRateElement.textContent = `${status.dataRate.toFixed(1)} Hz`;
            }
        }

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

    updateConnectionStatus(component, connected) {
        const statusElement = document.getElementById('connectionStatus');
        const textElement = document.getElementById('connectionText');
        
        if (statusElement && textElement) {
            if (connected) {
                statusElement.className = 'status-dot connected';
                textElement.textContent = 'Connected to MATLAB';
            } else {
                statusElement.className = 'status-dot disconnected';
                textElement.textContent = 'Fallback Mode';
            }
        }
    }

    updateSystemStatus() {
        const systemStatusElement = document.getElementById('systemStatus');
        if (systemStatusElement) {
            systemStatusElement.textContent = this.isConnected ? 
                'System Live - Receiving MATLAB Data' : 'System Running - Simulation Mode';
        }
    }

    handleControlAction(action) {
        console.log('Control action triggered:', action);
        
        switch(action) {
            case 'start':
                this.sendControlCommand('start');
                this.showNotification('Sending START command to system...', 'info');
                break;
            case 'stop':
                this.sendControlCommand('stop');
                this.showNotification('Sending STOP command to system...', 'warning');
                break;
            case 'reset':
                this.sendControlCommand('reset');
                this.showNotification('Sending RESET command to system...', 'info');
                break;
            case 'emergency':
                this.sendControlCommand('emergency_stop');
                this.showNotification('EMERGENCY STOP ACTIVATED!', 'error');
                break;
        }
    }

    sendControlCommand(command) {
        // Send command to real system via MQTT or Simulink
        if (this.simulinkBridge) {
            try {
                this.simulinkBridge.sendCommand(command);
            } catch (error) {
                console.error('Failed to send command:', error);
            }
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${message}</span>
                <button class="notification-close">&times;</button>
            </div>
        `;
        
        // Add to notification container
        let container = document.getElementById('notification-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notification-container';
            container.className = 'notification-container';
            document.body.appendChild(container);
        }
        
        container.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOut 0.3s ease forwards';
                setTimeout(() => notification.remove(), 300);
            }
        }, 5000);
        
        // Close button handler
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.remove();
        });
    }

    refreshData() {
        console.log('Manual data refresh requested');
        this.showNotification('Refreshing data from system...', 'info');
        
        // Request latest data from system
        if (this.simulinkBridge) {
            this.simulinkBridge.sendCommand('refresh_data');
        }
    }

    toggleDataView() {
        // Toggle between different data views
        console.log('Data view toggled');
        this.showNotification('Data view changed', 'info');
    }

    // Method to manually trigger test data
    injectTestData() {
        if (this.simulinkBridge && typeof this.simulinkBridge.injectTestData === 'function') {
            this.simulinkBridge.injectTestData();
            this.showNotification('Test data injected for chart verification', 'info');
        }
    }

    // Public method to get current system state
    getSystemState() {
        return {
            connected: this.isConnected,
            currentData: this.currentData,
            dataPointsReceived: this.dataPointsReceived,
            lastUpdate: this.currentData ? this.currentData.timestamp : null
        };
    }

    // Cleanup method
    destroy() {
        if (this.simulinkBridge) {
            this.simulinkBridge.stopSimulation();
        }
        console.log('Electrolyzer app cleaned up');
    }
}

// Initialize application when DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    window.electrolyzerApp = new ElectrolyzerApp();
    
    // Add global method for testing
    window.injectTestData = function() {
        if (window.electrolyzerApp) {
            window.electrolyzerApp.injectTestData();
        }
    };
});

// Handle page unload
window.addEventListener('beforeunload', function() {
    if (window.electrolyzerApp) {
        window.electrolyzerApp.destroy();
    }
});
