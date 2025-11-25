// Main Application Controller for HE-NMPC Electrolyzer System
class ElectrolyzerApp {
    constructor() {
        this.mqttClient = null;
        this.currentData = null;
        this.history = [];
        this.isConnected = false;
        this.chartManager = null;
        this.navigationManager = null;
        
        this.init();
    }

    init() {
        console.log('🔬 HE-NMPC Electrolyzer Controller Initializing...');
        this.initChartManager();
        this.initEventListeners();
        this.connectMQTT();
        this.startTimers();
        
        console.log('✅ HE-NMPC Electrolyzer Controller Initialized');
    }

    initChartManager() {
        this.chartManager = new ChartManager();
        console.log('📊 Chart Manager Initialized');
    }

    initEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.currentTarget.dataset.tab);
            });
        });

        // Control buttons
        document.getElementById('startSystem')?.addEventListener('click', () => this.sendCommand('START'));
        document.getElementById('stopSystem')?.addEventListener('click', () => this.sendCommand('STOP'));
        document.getElementById('emergencyStop')?.addEventListener('click', () => this.emergencyStop());
        
        // Mode buttons
        document.getElementById('autoMode')?.addEventListener('click', () => this.setMode('AUTO'));
        document.getElementById('manualMode')?.addEventListener('click', () => this.setMode('MANUAL'));
        
        // Sliders
        const productionSlider = document.getElementById('productionSlider');
        if (productionSlider) {
            productionSlider.addEventListener('input', (e) => {
                document.getElementById('sliderValue').textContent = e.target.value + '%';
            });
        }
        
        document.getElementById('applyManual')?.addEventListener('click', () => {
            const value = document.getElementById('productionSlider').value;
            this.sendManualSetpoint(value);
        });

        // Economic controls
        const economicSlider = document.getElementById('economicSlider');
        if (economicSlider) {
            economicSlider.addEventListener('input', (e) => {
                document.getElementById('economicValue').textContent = e.target.value + '%';
            });
        }
        
        document.getElementById('applyEconomic')?.addEventListener('click', () => {
            const value = document.getElementById('economicSlider').value;
            this.sendEconomicSetpoint(value);
        });

        document.getElementById('runOptimization')?.addEventListener('click', () => {
            this.runEconomicOptimization();
        });

        // Simulink controls
        document.getElementById('enableSimulink')?.addEventListener('click', () => this.toggleSimulink(true));
        document.getElementById('disableSimulink')?.addEventListener('click', () => this.toggleSimulink(false));
        document.getElementById('sendToSimulink')?.addEventListener('click', () => this.sendToSimulink());
        document.getElementById('requestFromSimulink')?.addEventListener('click', () => this.requestFromSimulink());

        console.log('🎛️ Event Listeners Initialized');
    }

    connectMQTT() {
        this.mqttClient = new MQTTClient(
            'wss://broker.hivemq.com:8884/mqtt',
            this.handleMessage.bind(this)
        );
        
        this.mqttClient.connect();
    }

    handleMessage(topic, message) {
        try {
            const data = JSON.parse(message);
            this.currentData = data;
            this.history.push({...data, timestamp: Date.now()});
            
            // Keep only last 1000 points for performance
            if (this.history.length > 1000) {
                this.history = this.history.slice(-1000);
            }
            
            this.updateDashboard(data);
            this.updateCharts(data);
            
            console.log('📨 MQTT Message Processed:', data.source);
            
        } catch (error) {
            console.error('❌ Error processing MQTT message:', error);
        }
    }

    updateDashboard(data) {
        // Update connection status
        this.updateConnectionStatus(true);
        
        // Update basic parameters
        this.updateParameter('paramWater', data.waterLevel, '%');
        this.updateParameter('paramTemp', data.stackTemperature, '°C');
        this.updateParameter('paramOxygen', data.o2Production, '%');
        this.updateParameter('paramPurity', data.purity, '%');
        this.updateParameter('paramBattery', data.batteryVoltage, 'V');

        // Update system status
        if (data.systemRunning !== undefined) {
            const statusElement = document.getElementById('systemStatus');
            if (statusElement) {
                statusElement.textContent = data.systemRunning ? 'System Running' : 'System Stopped';
            }
        }
        
        // Update controller mode
        this.updateTextElement('controllerMode', data.controllerType || 'HE-NMPC');
        
        // Update operation mode
        this.updateTextElement('operationMode', data.systemMode || 'AUTO');
        
        // Update safety metrics
        this.updateTextElement('safetyViolations', data.safetyViolations || '0');
        
        // Update simulink status
        if (data.useSimulinkData !== undefined) {
            this.updateTextElement('simulinkStatus', data.useSimulinkData ? 'Connected' : 'Disconnected');
        }

        // Update safety constraints
        this.updateSafetyConstraints(data);
    }

    updateParameter(elementId, value, suffix = '') {
        const element = document.getElementById(elementId);
        if (element && value !== undefined) {
            element.textContent = value.toFixed(1) + suffix;
        }
    }

    updateTextElement(elementId, text) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = text;
        }
    }

    updateSafetyConstraints(data) {
        // Update safety constraint status
        if (data.stackTemperature !== undefined) {
            const tempConstraint = document.getElementById('tempConstraint');
            if (tempConstraint) {
                tempConstraint.textContent = data.stackTemperature > 70 ? 'WARNING' : 'OK';
                tempConstraint.className = data.stackTemperature > 70 ? 'status-badge warning' : 'status-badge success';
            }
        }

        if (data.purity !== undefined) {
            const purityConstraint = document.getElementById('purityConstraint');
            if (purityConstraint) {
                purityConstraint.textContent = data.purity < 99.5 ? 'WARNING' : 'OK';
                purityConstraint.className = data.purity < 99.5 ? 'status-badge warning' : 'status-badge success';
            }
        }

        // Update safety performance
        if (data.safetyMargin !== undefined) {
            this.updateTextElement('safetyPerformance', data.safetyMargin.toFixed(1) + '%');
            this.updateTextElement('constraintSatisfaction', '100%'); // Default value
        }
    }

    updateCharts(data) {
        if (this.chartManager) {
            this.chartManager.updateAllCharts(data);
        }
    }

    updateConnectionStatus(connected) {
        this.isConnected = connected;
        const statusDot = document.getElementById('connectionStatus');
        const statusText = document.getElementById('connectionText');
        
        if (statusDot && statusText) {
            if (connected) {
                statusDot.className = 'status-dot connected';
                statusText.textContent = 'CONNECTED';
                statusText.style.color = '#10b981';
            } else {
                statusDot.className = 'status-dot';
                statusText.textContent = 'DISCONNECTED';
                statusText.style.color = '#ef4444';
            }
        }
    }

    sendCommand(command) {
        const message = {
            command: command,
            timestamp: Date.now(),
            source: 'web_dashboard'
        };
        
        if (this.mqttClient) {
            this.mqttClient.publish('electrolyzer/bill/commands', JSON.stringify(message));
        }
        
        this.showNotification(`Command sent: ${command}`, 'success');
        console.log('📤 Sent command:', command);
    }

    sendEconomicSetpoint(value) {
        const message = {
            economicSetpoint: parseFloat(value),
            timestamp: Date.now(),
            source: 'web_dashboard'
        };
        
        if (this.mqttClient) {
            this.mqttClient.publish('electrolyzer/bill/upper_commands', JSON.stringify(message));
        }
        
        this.showNotification(`Economic setpoint updated: ${value}%`, 'info');
        console.log('💰 Sent economic setpoint:', value);
    }

    sendManualSetpoint(value) {
        const message = {
            slider: parseInt(value),
            mode: 'MANUAL',
            timestamp: Date.now(),
            source: 'web_dashboard'
        };
        
        if (this.mqttClient) {
            this.mqttClient.publish('electrolyzer/bill/commands', JSON.stringify(message));
        }
        
        this.showNotification(`Manual setpoint applied: ${value}%`, 'info');
        console.log('🎛️ Sent manual setpoint:', value);
    }

    setMode(mode) {
        const message = {
            mode: mode,
            timestamp: Date.now(),
            source: 'web_dashboard'
        };
        
        if (this.mqttClient) {
            this.mqttClient.publish('electrolyzer/bill/commands', JSON.stringify(message));
        }
        
        // Update UI
        const autoBtn = document.getElementById('autoMode');
        const manualBtn = document.getElementById('manualMode');
        
        if (autoBtn && manualBtn) {
            autoBtn.classList.toggle('active', mode === 'AUTO');
            manualBtn.classList.toggle('active', mode === 'MANUAL');
            
            autoBtn.classList.toggle('btn-success', mode === 'AUTO');
            autoBtn.classList.toggle('btn-outline', mode !== 'AUTO');
            manualBtn.classList.toggle('btn-success', mode === 'MANUAL');
            manualBtn.classList.toggle('btn-outline', mode !== 'MANUAL');
        }
        
        this.showNotification(`Mode changed to: ${mode}`, 'info');
        console.log('🔄 Set mode:', mode);
    }

    emergencyStop() {
        this.sendCommand('STOP');
        
        // Immediate safety override
        const emergencyMessage = {
            command: 'EMERGENCY_STOP',
            productionRate: 0,
            timestamp: Date.now(),
            source: 'web_dashboard'
        };
        
        if (this.mqttClient) {
            this.mqttClient.publish('electrolyzer/bill/commands', JSON.stringify(emergencyMessage));
            this.mqttClient.publish('electrolyzer/bill/upper_commands', JSON.stringify(emergencyMessage));
        }
        
        this.showNotification('🛑 EMERGENCY STOP ACTIVATED', 'danger');
        console.log('🛑 EMERGENCY STOP activated');
    }

    runEconomicOptimization() {
        const powerCost = parseFloat(document.getElementById('powerCost')?.value) || 0.15;
        const o2Price = parseFloat(document.getElementById('o2Price')?.value) || 2.50;
        
        const message = {
            command: 'RUN_OPTIMIZATION',
            powerCost: powerCost,
            o2Price: o2Price,
            timestamp: Date.now(),
            source: 'web_dashboard'
        };
        
        if (this.mqttClient) {
            this.mqttClient.publish('electrolyzer/bill/upper_commands', JSON.stringify(message));
        }
        
        this.showNotification('💰 Running economic optimization...', 'info');
        console.log('🎯 Running economic optimization...');
    }

    toggleSimulink(enabled) {
        const message = {
            command: enabled ? 'ENABLE_SIMULINK' : 'DISABLE_SIMULINK',
            timestamp: Date.now(),
            source: 'web_dashboard'
        };
        
        if (this.mqttClient) {
            this.mqttClient.publish('electrolyzer/bill/commands', JSON.stringify(message));
        }
        
        this.showNotification(`Simulink ${enabled ? 'enabled' : 'disabled'}`, 'info');
        console.log('🔀 Simulink', enabled ? 'enabled' : 'disabled');
    }

    sendToSimulink() {
        if (this.currentData && this.mqttClient) {
            const message = {
                ...this.currentData,
                command: 'SYNC_STATE',
                timestamp: Date.now(),
                source: 'web_dashboard'
            };
            
            this.mqttClient.publish('electrolyzer/simulink/in', JSON.stringify(message));
            this.showNotification('State sent to Simulink', 'success');
            console.log('📤 Sent state to Simulink');
        } else {
            this.showNotification('No data available to send', 'warning');
        }
    }

    requestFromSimulink() {
        const message = {
            command: 'REQUEST_DATA',
            timestamp: Date.now(),
            source: 'web_dashboard'
        };
        
        if (this.mqttClient) {
            this.mqttClient.publish('electrolyzer/simulink/in', JSON.stringify(message));
        }
        
        this.showNotification('Requested data from Simulink', 'info');
        console.log('📥 Requested data from Simulink');
    }

    switchTab(tabName) {
        // Hide all tabs
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Deactivate all tab buttons
        document.querySelectorAll('.nav-btn').forEach(button => {
            button.classList.remove('active');
        });
        
        // Activate selected tab
        const targetTab = document.getElementById(tabName);
        const targetButton = document.querySelector(`[data-tab="${tabName}"]`);
        
        if (targetTab && targetButton) {
            targetTab.classList.add('active');
            targetButton.classList.add('active');
            
            // Update charts for the active tab
            setTimeout(() => {
                if (this.chartManager && this.chartManager.charts) {
                    Object.values(this.chartManager.charts).forEach(chart => {
                        if (chart && chart.chart && chart.chart.resize) {
                            chart.chart.resize();
                        }
                    });
                }
            }, 100);
        }
        
        console.log('📑 Switched to tab:', tabName);
    }

    startTimers() {
        // Update clock every second
        setInterval(() => {
            const now = new Date();
            const timeElement = document.getElementById('currentTime');
            if (timeElement) {
                timeElement.textContent = now.toLocaleTimeString();
            }
        }, 1000);

        // Check connection status periodically
        setInterval(() => {
            if (this.mqttClient && !this.mqttClient.isConnected()) {
                this.updateConnectionStatus(false);
                this.mqttClient.reconnect();
            }
        }, 5000);

        console.log('⏰ Timers started');
    }

    showNotification(message, type = 'info') {
        const container = document.getElementById('notificationContainer') || this.createNotificationContainer();
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <span class="notification-message">${message}</span>
            <button class="notification-close">&times;</button>
        `;

        container.appendChild(notification);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);

        // Close button handler
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.parentNode.removeChild(notification);
        });
    }

    createNotificationContainer() {
        const container = document.createElement('div');
        container.className = 'notification-container';
        container.id = 'notificationContainer';
        document.body.appendChild(container);
        return container;
    }

    // Utility method to get system status
    getSystemStatus() {
        return {
            connected: this.isConnected,
            currentData: this.currentData,
            historyLength: this.history.length,
            chartsInitialized: !!this.chartManager
        };
    }
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.electrolyzerApp = new ElectrolyzerApp();
    console.log('🎉 HE-NMPC Application Fully Loaded');
});
