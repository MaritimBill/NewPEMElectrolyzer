// app.js - Main Application Controller for PEM Electrolyzer
class ElectrolyzerApp {
    constructor() {
        this.mqttClient = null;
        this.currentData = null;
        this.history = [];
        this.isConnected = false;
        this.chartManager = null;
        this.dataUpdateInterval = null;
        this.simulationMode = true;
        this.connectionStatus = {
            mqtt: false,
            simulink: false,
            plc: false
        };
        
        this.defaultValues = {
            o2Production: 45,
            efficiency: 78,
            stackTemperature: 65,
            safetyMargin: 95,
            powerConsumption: 150,
            voltage: 2.1,
            current: 150,
            pressure: 35,
            purity: 99.8
        };
        
        this.init();
    }

    init() {
        console.log('HE-NMPC Electrolyzer Controller Initializing...');
        
        // Initialize components in sequence
        this.initChartManager();
        this.initEventListeners();
        this.updateSystemStatus();
        this.startDataUpdates();
        
        // Try to connect to MQTT, fallback to simulation
        this.connectMQTT().catch(error => {
            console.warn('MQTT connection failed, running in simulation mode:', error);
            this.simulationMode = true;
            this.updateConnectionStatus('mqtt', false);
        });
        
        console.log('HE-NMPC Electrolyzer Controller Initialized - Simulation Mode:', this.simulationMode);
    }

    initChartManager() {
        this.chartManager = new ChartManager();
        console.log('Chart Manager Initialized');
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
                        this.toggleDashboard();
                        break;
                }
            }
        });

        console.log('Event listeners initialized');
    }

    connectMQTT() {
        return new Promise((resolve, reject) => {
            // MQTT connection configuration
            const host = 'ws://localhost:9001';
            const clientId = 'electrolyzer_ui_' + Math.random().toString(16).substr(2, 8);
            
            try {
                this.mqttClient = new Paho.MQTT.Client(host, clientId);
                
                this.mqttClient.onConnectionLost = (response) => {
                    console.error('MQTT Connection lost:', response.errorMessage);
                    this.updateConnectionStatus('mqtt', false);
                    this.simulationMode = true;
                };
                
                this.mqttClient.onMessageArrived = (message) => {
                    this.handleMessage(message.destinationName, message.payloadString);
                };
                
                const connectOptions = {
                    timeout: 3,
                    onSuccess: () => {
                        console.log('MQTT Connected successfully');
                        this.isConnected = true;
                        this.simulationMode = false;
                        this.updateConnectionStatus('mqtt', true);
                        
                        // Subscribe to topics
                        this.mqttClient.subscribe('electrolyzer/+/data');
                        this.mqttClient.subscribe('electrolyzer/status');
                        this.mqttClient.subscribe('electrolyzer/alerts');
                        
                        resolve();
                    },
                    onFailure: (error) => {
                        console.error('MQTT Connection failed:', error);
                        this.updateConnectionStatus('mqtt', false);
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

    startDataUpdates() {
        // Clear any existing interval
        if (this.dataUpdateInterval) {
            clearInterval(this.dataUpdateInterval);
        }

        // Start data simulation/update interval
        this.dataUpdateInterval = setInterval(() => {
            if (this.simulationMode && !this.isConnected) {
                this.simulateLiveData();
            }
        }, 2000); // Update every 2 seconds

        // Update time display every second
        setInterval(() => {
            this.updateTimeDisplay();
        }, 1000);
    }

    simulateLiveData() {
        const baseValues = { ...this.defaultValues };
        
        // Add realistic variations
        const simulatedData = {
            o2Production: Math.max(0, baseValues.o2Production + (Math.random() - 0.5) * 4),
            efficiency: Math.max(0, Math.min(100, baseValues.efficiency + (Math.random() - 0.5) * 2)),
            stackTemperature: Math.max(20, baseValues.stackTemperature + (Math.random() - 0.5) * 3),
            safetyMargin: Math.max(0, Math.min(100, baseValues.safetyMargin + (Math.random() - 0.5) * 1)),
            powerConsumption: Math.max(0, baseValues.powerConsumption + (Math.random() - 0.5) * 10),
            voltage: Math.max(0, baseValues.voltage + (Math.random() - 0.5) * 0.1),
            current: Math.max(0, baseValues.current + (Math.random() - 0.5) * 5),
            pressure: Math.max(0, baseValues.pressure + (Math.random() - 0.5) * 2),
            purity: Math.max(98, Math.min(100, baseValues.purity + (Math.random() - 0.5) * 0.1)),
            h2Production: (baseValues.o2Production * 2) + (Math.random() - 0.5) * 8,
            timestamp: new Date().toISOString(),
            source: 'simulation'
        };

        this.handleMessage('electrolyzer/simulation/data', JSON.stringify(simulatedData));
    }

    handleMessage(topic, message) {
        try {
            const data = JSON.parse(message);
            this.currentData = data;
            
            // Add timestamp if not present
            if (!data.timestamp) {
                data.timestamp = new Date().toISOString();
            }
            
            this.history.push({...data, timestamp: Date.now()});
            
            // Keep history manageable for performance
            if (this.history.length > 1000) {
                this.history = this.history.slice(-1000);
            }
            
            this.updateDashboard(data);
            this.updateCharts(data);
            this.updateLiveDataFeed(data);
            this.updateSystemMetrics(data);
            
        } catch (error) {
            console.error('Error processing message:', error);
        }
    }

    updateDashboard(data) {
        this.updateMetricValue('productionValue', data.o2Production, '%');
        this.updateMetricValue('efficiencyValue', data.efficiency, '%');
        this.updateMetricValue('safetyValue', data.safetyMargin, '%');
        this.updateMetricValue('temperatureValue', data.stackTemperature, '°C');
    }

    updateMetricValue(elementId, value, suffix = '') {
        const element = document.getElementById(elementId);
        if (element && value !== undefined && value !== null) {
            element.textContent = value.toFixed(1) + suffix;
            
            // Add animation effect
            element.style.transform = 'scale(1.05)';
            setTimeout(() => {
                element.style.transform = 'scale(1)';
            }, 200);
        }
    }

    updateLiveDataFeed(data) {
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
        // Update system status badges
        this.updateStatusBadge('controllerMode', 'HE-NMPC', 'success');
        this.updateStatusBadge('operationMode', this.simulationMode ? 'SIMULATION' : 'AUTO', 'info');
        this.updateStatusBadge('safetyViolations', '0', 'success');
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
            this.chartManager.updateCharts(data);
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
                textElement.textContent = this.simulationMode ? 'Simulation Mode' : 'Disconnected';
            }
        }
    }

    updateSystemStatus() {
        const systemStatusElement = document.getElementById('systemStatus');
        if (systemStatusElement) {
            systemStatusElement.textContent = this.simulationMode ? 
                'System Ready (Simulation)' : 'System Ready (Live)';
        }
    }

    updateTimeDisplay() {
        const timeElement = document.getElementById('currentTime');
        if (timeElement) {
            const now = new Date();
            timeElement.textContent = now.toLocaleTimeString('en-US', {
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
        }
    }

    handleControlAction(action) {
        console.log('Control action triggered:', action);
        
        switch(action) {
            case 'start':
                this.showNotification('Starting electrolyzer system...', 'info');
                break;
            case 'stop':
                this.showNotification('Stopping electrolyzer system...', 'warning');
                break;
            case 'reset':
                this.showNotification('Resetting system parameters...', 'info');
                break;
            case 'emergency':
                this.showNotification('EMERGENCY STOP ACTIVATED!', 'error');
                break;
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
        
        // Add to notification container or create one
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
        console.log('Manual data refresh triggered');
        if (this.simulationMode) {
            this.simulateLiveData();
        }
        this.showNotification('Data refreshed', 'info');
    }

    toggleDashboard() {
        // Toggle between different dashboard views
        console.log('Dashboard view toggled');
    }

    // Public method to get current system state
    getSystemState() {
        return {
            connected: this.isConnected,
            simulationMode: this.simulationMode,
            currentData: this.currentData,
            connectionStatus: this.connectionStatus,
            historyLength: this.history.length
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
