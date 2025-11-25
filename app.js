// Main Application Controller for HE-NMPC Electrolyzer System
class ElectrolyzerApp {
    constructor() {
        this.mqttClient = null;
        this.currentData = null;
        this.history = [];
        this.charts = {};
        this.isConnected = false;
        
        this.init();
    }

    init() {
        this.initCharts();
        this.initEventListeners();
        this.connectMQTT();
        this.startTimers();
        
        console.log('🔬 HE-NMPC Electrolyzer Controller Initialized');
    }

    initEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Control buttons
        document.getElementById('startSystem').addEventListener('click', () => this.sendCommand('START'));
        document.getElementById('stopSystem').addEventListener('click', () => this.sendCommand('STOP'));
        document.getElementById('emergencyStop').addEventListener('click', () => this.emergencyStop());
        
        // Mode buttons
        document.getElementById('autoMode').addEventListener('click', () => this.setMode('AUTO'));
        document.getElementById('manualMode').addEventListener('click', () => this.setMode('MANUAL'));
        
        // Sliders
        document.getElementById('productionSlider').addEventListener('input', (e) => {
            document.getElementById('sliderValue').textContent = e.target.value + '%';
        });
        
        document.getElementById('applyManual').addEventListener('click', () => {
            const value = document.getElementById('productionSlider').value;
            this.sendManualSetpoint(value);
        });

        // Economic controls
        document.getElementById('economicSlider').addEventListener('input', (e) => {
            document.getElementById('economicValue').textContent = e.target.value + '%';
        });
        
        document.getElementById('applyEconomic').addEventListener('click', () => {
            const value = document.getElementById('economicSlider').value;
            this.sendEconomicSetpoint(value);
        });

        document.getElementById('runOptimization').addEventListener('click', () => {
            this.runEconomicOptimization();
        });

        // Simulink controls
        document.getElementById('enableSimulink').addEventListener('click', () => this.toggleSimulink(true));
        document.getElementById('disableSimulink').addEventListener('click', () => this.toggleSimulink(false));
        document.getElementById('sendToSimulink').addEventListener('click', () => this.sendToSimulink());
        document.getElementById('requestFromSimulink').addEventListener('click', () => this.requestFromSimulink());
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
            
        } catch (error) {
            console.error('Error processing MQTT message:', error);
        }
    }

    updateDashboard(data) {
        // Update connection status
        this.updateConnectionStatus(true);
        
        // Update basic parameters
        if (data.water !== undefined) {
            document.getElementById('paramWater').textContent = data.water.toFixed(1) + '%';
        }
        if (data.chamber !== undefined) {
            document.getElementById('paramTemp').textContent = data.chamber.toFixed(1) + '°C';
        }
        if (data.oxygen !== undefined) {
            document.getElementById('paramOxygen').textContent = data.oxygen.toFixed(1) + '%';
        }
        if (data.hydrogen !== undefined) {
            document.getElementById('paramHydrogen').textContent = data.hydrogen.toFixed(1) + '%';
        }
        if (data.purity !== undefined) {
            document.getElementById('paramPurity').textContent = data.purity.toFixed(1) + '%';
        }
        if (data.battery !== undefined) {
            document.getElementById('paramBattery').textContent = data.battery.toFixed(1) + 'V';
        }
        
        // Update system status
        if (data.systemRunning !== undefined) {
            document.getElementById('systemStatus').textContent = 
                data.systemRunning ? 'System Running' : 'System Stopped';
            document.getElementById('systemStatus').className = 
                data.systemRunning ? 'status-online' : 'status-offline';
        }
        
        // Update controller mode
        if (data.controllerType !== undefined) {
            document.getElementById('controllerMode').textContent = data.controllerType;
        }
        
        // Update operation mode
        if (data.systemMode !== undefined) {
            document.getElementById('operationMode').textContent = data.systemMode;
        }
        
        // Update safety metrics
        if (data.safetyViolations !== undefined) {
            document.getElementById('safetyViolations').textContent = data.safetyViolations;
        }
        
        // Update simulink status
        if (data.useSimulinkData !== undefined) {
            document.getElementById('simulinkStatus').textContent = 
                data.useSimulinkData ? 'Connected' : 'Disconnected';
            document.getElementById('simulinkStatus').className = 
                data.useSimulinkData ? 'status-online' : 'status-offline';
        }
    }

    updateCharts(data) {
        // Update all charts with new data
        Object.values(this.charts).forEach(chart => {
            if (chart.update) {
                chart.update(data);
            }
        });
    }

    updateConnectionStatus(connected) {
        this.isConnected = connected;
        const statusElement = document.getElementById('connectionStatus');
        
        if (connected) {
            statusElement.textContent = '🟢 ONLINE';
            statusElement.className = 'status-online';
        } else {
            statusElement.textContent = '🔴 OFFLINE';
            statusElement.className = 'status-offline';
        }
    }

    sendCommand(command) {
        const message = {
            command: command,
            timestamp: Date.now(),
            source: 'web_dashboard'
        };
        
        this.mqttClient.publish('electrolyzer/bill/commands', JSON.stringify(message));
        console.log('Sent command:', command);
    }

    sendEconomicSetpoint(value) {
        const message = {
            economicSetpoint: parseFloat(value),
            timestamp: Date.now(),
            source: 'web_dashboard'
        };
        
        this.mqttClient.publish('electrolyzer/bill/upper_commands', JSON.stringify(message));
        console.log('Sent economic setpoint:', value);
    }

    sendManualSetpoint(value) {
        const message = {
            slider: parseInt(value),
            mode: 'MANUAL',
            timestamp: Date.now(),
            source: 'web_dashboard'
        };
        
        this.mqttClient.publish('electrolyzer/bill/commands', JSON.stringify(message));
        console.log('Sent manual setpoint:', value);
    }

    setMode(mode) {
        const message = {
            mode: mode,
            timestamp: Date.now(),
            source: 'web_dashboard'
        };
        
        this.mqttClient.publish('electrolyzer/bill/commands', JSON.stringify(message));
        
        // Update UI
        document.getElementById('autoMode').classList.toggle('active', mode === 'AUTO');
        document.getElementById('manualMode').classList.toggle('active', mode === 'MANUAL');
        
        console.log('Set mode:', mode);
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
        
        this.mqttClient.publish('electrolyzer/bill/commands', JSON.stringify(emergencyMessage));
        this.mqttClient.publish('electrolyzer/bill/upper_commands', JSON.stringify(emergencyMessage));
        
        console.log('🛑 EMERGENCY STOP activated');
    }

    runEconomicOptimization() {
        const powerCost = parseFloat(document.getElementById('powerCost').value) || 0.15;
        const o2Price = parseFloat(document.getElementById('o2Price').value) || 2.50;
        
        const message = {
            command: 'RUN_OPTIMIZATION',
            powerCost: powerCost,
            o2Price: o2Price,
            timestamp: Date.now(),
            source: 'web_dashboard'
        };
        
        this.mqttClient.publish('electrolyzer/bill/upper_commands', JSON.stringify(message));
        console.log('Running economic optimization...');
    }

    toggleSimulink(enabled) {
        const message = {
            command: enabled ? 'ENABLE_SIMULINK' : 'DISABLE_SIMULINK',
            timestamp: Date.now(),
            source: 'web_dashboard'
        };
        
        this.mqttClient.publish('electrolyzer/bill/commands', JSON.stringify(message));
        console.log('Simulink', enabled ? 'enabled' : 'disabled');
    }

    sendToSimulink() {
        // Send current state to Simulink
        if (this.currentData) {
            const message = {
                ...this.currentData,
                command: 'SYNC_STATE',
                timestamp: Date.now(),
                source: 'web_dashboard'
            };
            
            this.mqttClient.publish('electrolyzer/simulink/in', JSON.stringify(message));
            console.log('Sent state to Simulink');
        }
    }

    requestFromSimulink() {
        const message = {
            command: 'REQUEST_DATA',
            timestamp: Date.now(),
            source: 'web_dashboard'
        };
        
        this.mqttClient.publish('electrolyzer/simulink/in', JSON.stringify(message));
        console.log('Requested data from Simulink');
    }

    switchTab(tabName) {
        // Hide all tabs
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Deactivate all tab buttons
        document.querySelectorAll('.nav-tab').forEach(button => {
            button.classList.remove('active');
        });
        
        // Activate selected tab
        document.getElementById(tabName).classList.add('active');
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        
        // Update charts for the active tab
        setTimeout(() => {
            Object.values(this.charts).forEach(chart => {
                if (chart.resize) chart.resize();
            });
        }, 100);
    }

    startTimers() {
        // Update clock every second
        setInterval(() => {
            const now = new Date();
            document.getElementById('currentTime').textContent = 
                now.toLocaleTimeString();
        }, 1000);

        // Check connection status periodically
        setInterval(() => {
            if (this.mqttClient && !this.mqttClient.isConnected()) {
                this.updateConnectionStatus(false);
                this.mqttClient.reconnect();
            }
        }, 5000);
    }

    initCharts() {
        // Initialize all chart components
        this.charts = {
            efficiencyGauge: new EfficiencyGauge('efficiencyGauge'),
            productionGauge: new ProductionGauge('productionGauge'),
            safetyGauge: new SafetyGauge('safetyGauge'),
            productionChart: new ProductionChart('productionChart'),
            parametersChart: new ParametersChart('parametersChart'),
            constraintsChart: new ConstraintsChart('constraintsChart'),
            economicChart: new EconomicChart('economicChart'),
            performanceChart: new PerformanceChart('performanceChart'),
            historicalChart: new HistoricalChart('historicalChart')
        };
    }
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.electrolyzerApp = new ElectrolyzerApp();
});