// app.js - Main Application Controller for PEM Electrolyzer - REAL DATA ONLY
class ElectrolyzerApp {
    constructor() {
        this.mqttClient = null;
        this.currentData = null;
        this.history = [];
        this.isConnected = false;
        this.chartManager = null;
        this.dataUpdateInterval = null;
        this.simulationMode = false; // Start as false - only true if simulation is active
        this.connectionStatus = {
            mqtt: false,
            simulink: false,
            plc: false
        };
        
        // NO DEFAULT VALUES - only use data from system
        this.systemData = {
            // Will be populated by real data from MQTT/Simulink
        };
        
        this.init();
    }

    init() {
        console.log('HE-NMPC Electrolyzer Controller Initializing...');
        
        // Wait for DOM to be fully ready before initializing charts
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
        this.initEventListeners();
        this.updateSystemStatus();
        
        // Connect to real data sources
        this.connectMQTT().catch(error => {
            console.error('MQTT connection failed:', error);
            this.updateConnectionStatus('mqtt', false);
            this.showNotification('MQTT Connection Failed - Waiting for data source', 'warning');
        });
        
        // Initialize Simulink bridge if available
        this.initSimulinkBridge();
        
        console.log('HE-NMPC Electrolyzer Controller Initialized - Awaiting Real Data');
    }

    initChartManager() {
        try {
            // Wait a bit to ensure DOM is fully rendered
            setTimeout(() => {
                this.chartManager = new ChartManager();
                console.log('Chart Manager Initialized - Ready for Real Data');
            }, 100);
        } catch (error) {
            console.error('Error initializing chart manager:', error);
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

    connectMQTT() {
        return new Promise((resolve, reject) => {
            // MQTT connection configuration - CONNECT TO REAL SYSTEM
            const host = 'ws://localhost:9001'; // Your MQTT broker
            const clientId = 'electrolyzer_ui_' + Math.random().toString(16).substr(2, 8);
            
            try {
                this.mqttClient = new Paho.MQTT.Client(host, clientId);
                
                this.mqttClient.onConnectionLost = (response) => {
                    console.error('MQTT Connection lost:', response.errorMessage);
                    this.updateConnectionStatus('mqtt', false);
                    this.showNotification('MQTT Connection Lost', 'error');
                };
                
                this.mqttClient.onMessageArrived = (message) => {
                    this.handleRealTimeData(message.destinationName, message.payloadString);
                };
                
                const connectOptions = {
                    timeout: 3,
                    onSuccess: () => {
                        console.log('MQTT Connected successfully to real system');
                        this.isConnected = true;
                        this.updateConnectionStatus('mqtt', true);
                        
                        // Subscribe to real system topics
                        this.mqttClient.subscribe('electrolyzer/+/data');
                        this.mqttClient.subscribe('electrolyzer/status');
                        this.mqttClient.subscribe('electrolyzer/alerts');
                        this.mqttClient.subscribe('electrolyzer/parameters');
                        
                        this.showNotification('Connected to Real System Data', 'success');
                        resolve();
                    },
                    onFailure: (error) => {
                        console.error('MQTT Connection failed:', error);
                        this.updateConnectionStatus('mqtt', false);
                        this.showNotification('Cannot connect to MQTT broker', 'warning');
                        reject(error);
                    }
                };
                
                this.mqttClient.connect(connectOptions);
                
            } catch (error) {
                console.error('MQTT initialization error:', error);
                reject(error);
            }
        });
    }

    initSimulinkBridge() {
        // Initialize connection to Simulink for real data
        if (typeof window.SimulinkBridge !== 'undefined') {
            try {
                window.simulinkBridge = new window.SimulinkBridge();
                window.simulinkBridge.onDataReceived = (data) => {
                    this.handleRealTimeData('simulink/data', JSON.stringify(data));
                };
                this.updateConnectionStatus('simulink', true);
                console.log('Simulink bridge initialized');
            } catch (error) {
                console.warn('Simulink bridge not available:', error);
                this.updateConnectionStatus('simulink', false);
            }
        } else {
            console.log('Simulink bridge not found - relying on MQTT data');
        }
    }

    handleRealTimeData(topic, message) {
        try {
            const data = JSON.parse(message);
            
            // Validate data structure
            if (!this.isValidElectrolyzerData(data)) {
                console.warn('Invalid data structure received:', data);
                return;
            }
            
            this.currentData = data;
            
            // Add timestamp if not present
            if (!data.timestamp) {
                data.timestamp = new Date().toISOString();
            }
            
            // Store in history
            this.history.push({...data, timestamp: Date.now()});
            
            // Keep history manageable
            if (this.history.length > 1000) {
                this.history = this.history.slice(-1000);
            }
            
            // Update UI with real data
            this.updateDashboard(data);
            this.updateCharts(data);
            this.updateLiveDataFeed(data);
            this.updateSystemMetrics(data);
            
            console.log('Real data processed:', data);
            
        } catch (error) {
            console.error('Error processing real-time data:', error);
        }
    }

    isValidElectrolyzerData(data) {
        // Basic validation - ensure we have essential electrolyzer parameters
        const requiredFields = ['o2Production', 'efficiency', 'stackTemperature'];
        return requiredFields.every(field => data[field] !== undefined && data[field] !== null);
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
        this.updateStatusBadge('operationMode', this.isConnected ? 'LIVE' : 'STANDBY', 'info');
        this.updateStatusBadge('safetyViolations', data.safetyViolations || '0', 
                              (data.safetyViolations && data.safetyViolations > 0) ? 'danger' : 'success');
        this.updateStatusBadge('simulinkStatus', this.connectionStatus.simulink ? 'Connected' : 'Disconnected', 
                              this.connectionStatus.simulink ? 'success' : 'warning');
    }

    updateStatusBadge(elementId, text, type) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = text;
            element.className = `status-badge ${type}`;
        }
    }

    updateCharts(data) {
        if (this.chartManager) {
            try {
                this.chartManager.updateCharts(data);
            } catch (error) {
                console.error('Error updating charts with real data:', error);
            }
        }
    }

    updateConnectionStatus(component, connected) {
        this.connectionStatus[component] = connected;
        
        const statusElement = document.getElementById('connectionStatus');
        const textElement = document.getElementById('connectionText');
        
        if (statusElement && textElement) {
            if (connected) {
                statusElement.className = 'status-dot connected';
                textElement.textContent = 'Connected';
            } else {
                statusElement.className = 'status-dot disconnected';
                textElement.textContent = 'Disconnected';
            }
        }
    }

    updateSystemStatus() {
        const systemStatusElement = document.getElementById('systemStatus');
        if (systemStatusElement) {
            systemStatusElement.textContent = this.isConnected ? 
                'System Live - Receiving Real Data' : 'System Standby - Awaiting Data';
        }
    }

    handleControlAction(action) {
        console.log('Control action triggered:', action);
        
        // Send control commands to real system
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
        // Send command to real system via MQTT
        if (this.mqttClient && this.isConnected) {
            const message = new Paho.MQTT.Message(JSON.stringify({
                command: command,
                timestamp: new Date().toISOString()
            }));
            message.destinationName = 'electrolyzer/control';
            this.mqttClient.send(message);
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
        if (this.mqttClient && this.isConnected) {
            const message = new Paho.MQTT.Message(JSON.stringify({
                request: 'latest_data',
                timestamp: new Date().toISOString()
            }));
            message.destinationName = 'electrolyzer/request';
            this.mqttClient.send(message);
        }
    }

    toggleDataView() {
        // Toggle between different data views
        console.log('Data view toggled');
        this.showNotification('Data view changed', 'info');
    }

    // Public method to get current system state
    getSystemState() {
        return {
            connected: this.isConnected,
            simulationMode: this.simulationMode,
            currentData: this.currentData,
            connectionStatus: this.connectionStatus,
            historyLength: this.history.length,
            lastUpdate: this.currentData ? this.currentData.timestamp : null
        };
    }

    // Cleanup method
    destroy() {
        if (this.dataUpdateInterval) {
            clearInterval(this.dataUpdateInterval);
        }
        if (this.mqttClient && this.isConnected) {
            this.mqttClient.disconnect();
        }
        if (this.chartManager) {
            this.chartManager.destroyAllCharts();
        }
        console.log('Electrolyzer app cleaned up');
    }
}

// Initialize application when DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    window.electrolyzerApp = new ElectrolyzerApp();
});

// Handle page unload
window.addEventListener('beforeunload', function() {
    if (window.electrolyzerApp) {
        window.electrolyzerApp.destroy();
    }
});
