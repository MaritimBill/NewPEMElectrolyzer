// Simulink-MATLAB Bridge for Real-time Integration
class SimulinkBridge {
    constructor() {
        this.isConnected = false;
        this.dataBuffer = [];
        this.lastUpdate = null;
        this.simulationState = 'stopped';
        this.init();
    }

    init() {
        this.setupSimulinkConnection();
        this.setupDataHandlers();
        this.setupControlInterface();
        this.startHeartbeat();
    }

    setupSimulinkConnection() {
        // Initialize connection to MATLAB/Simulink
        this.connection = {
            status: 'disconnected',
            lastPing: null,
            retryCount: 0,
            maxRetries: 5
        };

        console.log('🔗 Simulink Bridge Initialized');
    }

    setupDataHandlers() {
        // Setup data exchange handlers
        this.dataHandlers = {
            'electrolyzer/simulink/out': this.handleSimulinkData.bind(this),
            'electrolyzer/simulink/status': this.handleSimulinkStatus.bind(this),
            'electrolyzer/simulink/error': this.handleSimulinkError.bind(this)
        };
    }

    setupControlInterface() {
        // Setup control interface for Simulink
        this.controlInterface = {
            sendModelParameters: this.sendModelParameters.bind(this),
            startSimulation: this.startSimulation.bind(this),
            stopSimulation: this.stopSimulation.bind(this),
            updateSetpoints: this.updateSetpoints.bind(this)
        };
    }

    connectToSimulink() {
        console.log('🔄 Connecting to Simulink...');
        
        // Simulate connection process
        setTimeout(() => {
            this.connection.status = 'connected';
            this.connection.lastPing = Date.now();
            this.isConnected = true;
            
            console.log('✅ Connected to Simulink');
            
            if (window.electrolyzerApp) {
                window.electrolyzerApp.showNotification('Connected to Simulink', 'success');
            }
            
            this.updateConnectionStatus();
            
        }, 2000);
    }

    disconnectFromSimulink() {
        this.connection.status = 'disconnected';
        this.isConnected = false;
        this.simulationState = 'stopped';
        
        console.log('❌ Disconnected from Simulink');
        
        if (window.electrolyzerApp) {
            window.electrolyzerApp.showNotification('Disconnected from Simulink', 'warning');
        }
        
        this.updateConnectionStatus();
    }

    handleSimulinkData(topic, message) {
        try {
            const data = JSON.parse(message);
            this.dataBuffer.push({
                ...data,
                receivedAt: Date.now(),
                source: 'simulink'
            });

            // Keep buffer manageable
            if (this.dataBuffer.length > 1000) {
                this.dataBuffer = this.dataBuffer.slice(-500);
            }

            this.lastUpdate = Date.now();
            
            // Process the data
            this.processSimulinkData(data);
            
            // Forward to main application
            if (window.electrolyzerApp && window.electrolyzerApp.handleMessage) {
                window.electrolyzerApp.handleMessage(topic, message);
            }

        } catch (error) {
            console.error('Error processing Simulink data:', error);
        }
    }

    processSimulinkData(data) {
        // Extract and process Simulink-specific data
        const processedData = {
            timestamp: data.timestamp || Date.now(),
            o2Production: data.o2Production,
            efficiency: data.efficiency,
            o2TankLevel: data.o2TankLevel,
            safetyMargin: data.safetyMargin,
            stackTemperature: data.stackTemperature,
            waterLevel: data.waterLevel,
            h2Production: data.h2Production,
            purity: data.purity,
            source: 'simulink'
        };

        // Update simulation state
        if (data.simulationTime !== undefined) {
            this.simulationState = 'running';
        }

        // Send to data processors
        this.sendToDataProcessors(processedData);
    }

    sendToDataProcessors(data) {
        // Send to neural MPC if enabled
        if (window.neuralMPCManager && window.neuralMPCManager.isEnabled) {
            window.neuralMPCManager.performanceHistory.push(data);
        }

        // Send to chart system
        if (window.chartManager) {
            window.chartManager.updateAllCharts(data);
        }
    }

    handleSimulinkStatus(topic, message) {
        try {
            const status = JSON.parse(message);
            console.log('📊 Simulink Status:', status);
            
            this.simulationState = status.state || this.simulationState;
            this.updateSimulationStatus();
            
        } catch (error) {
            console.error('Error processing Simulink status:', error);
        }
    }

    handleSimulinkError(topic, message) {
        try {
            const error = JSON.parse(message);
            console.error('❌ Simulink Error:', error);
            
            if (window.electrolyzerApp) {
                window.electrolyzerApp.showNotification(
                    `Simulink Error: ${error.message}`, 
                    'error'
                );
            }
            
        } catch (error) {
            console.error('Error processing Simulink error:', error);
        }
    }

    sendToSimulink(data) {
        if (!this.isConnected) {
            console.warn('⚠️ Cannot send to Simulink - not connected');
            return false;
        }

        try {
            const message = {
                ...data,
                timestamp: Date.now(),
                source: 'web_dashboard'
            };

            // Send via MQTT
            if (window.electrolyzerApp && window.electrolyzerApp.mqttClient) {
                window.electrolyzerApp.mqttClient.publish(
                    'electrolyzer/simulink/in',
                    JSON.stringify(message)
                );
            }

            console.log('📤 Sent to Simulink:', message);
            return true;

        } catch (error) {
            console.error('Error sending to Simulink:', error);
            return false;
        }
    }

    sendModelParameters(parameters) {
        const message = {
            command: 'UPDATE_PARAMETERS',
            parameters: parameters,
            timestamp: Date.now()
        };

        return this.sendToSimulink(message);
    }

    startSimulation() {
        const message = {
            command: 'START_SIMULATION',
            timestamp: Date.now()
        };

        this.simulationState = 'starting';
        this.updateSimulationStatus();
        
        return this.sendToSimulink(message);
    }

    stopSimulation() {
        const message = {
            command: 'STOP_SIMULATION', 
            timestamp: Date.now()
        };

        this.simulationState = 'stopping';
        this.updateSimulationStatus();
        
        return this.sendToSimulink(message);
    }

    updateSetpoints(setpoints) {
        const message = {
            command: 'UPDATE_SETPOINTS',
            setpoints: setpoints,
            timestamp: Date.now()
        };

        return this.sendToSimulink(message);
    }

    requestData(dataType) {
        const message = {
            command: 'REQUEST_DATA',
            dataType: dataType,
            timestamp: Date.now()
        };

        return this.sendToSimulink(message);
    }

    updateConnectionStatus() {
        const statusElement = document.getElementById('matlabStatus');
        const dataFlowElement = document.getElementById('dataFlowStatus');
        const lastUpdateElement = document.getElementById('lastSimulinkUpdate');

        if (statusElement) {
            statusElement.textContent = this.isConnected ? 'Connected' : 'Disconnected';
            statusElement.className = this.isConnected ? 'status-online' : 'status-offline';
        }

        if (dataFlowElement) {
            dataFlowElement.textContent = this.simulationState === 'running' ? 'Active' : 'Inactive';
            dataFlowElement.className = this.simulationState === 'running' ? 'status-online' : 'status-offline';
        }

        if (lastUpdateElement) {
            lastUpdateElement.textContent = this.lastUpdate ? 
                new Date(this.lastUpdate).toLocaleTimeString() : 'Never';
        }
    }

    updateSimulationStatus() {
        const statusElement = document.getElementById('simulinkStatus');
        if (statusElement) {
            statusElement.textContent = this.simulationState;
            statusElement.className = 
                this.simulationState === 'running' ? 'status-online' :
                this.simulationState === 'stopped' ? 'status-offline' : 'status-warning';
        }
    }

    startHeartbeat() {
        // Send heartbeat every 30 seconds
        setInterval(() => {
            if (this.isConnected) {
                this.sendHeartbeat();
            }
        }, 30000);
    }

    sendHeartbeat() {
        const heartbeat = {
            command: 'HEARTBEAT',
            timestamp: Date.now(),
            source: 'web_bridge'
        };

        this.sendToSimulink(heartbeat);
    }

    getConnectionStats() {
        return {
            isConnected: this.isConnected,
            simulationState: this.simulationState,
            lastUpdate: this.lastUpdate,
            dataBufferSize: this.dataBuffer.length,
            connectionStatus: this.connection.status,
            uptime: this.connection.lastPing ? Date.now() - this.connection.lastPing : 0
        };
    }

    exportSimulationData() {
        const exportData = {
            dataBuffer: this.dataBuffer,
            connectionStats: this.getConnectionStats(),
            exportTime: new Date().toISOString()
        };

        return JSON.stringify(exportData, null, 2);
    }

    clearDataBuffer() {
        this.dataBuffer = [];
        console.log('🧹 Simulink data buffer cleared');
    }

    // Real-time data streaming
    startDataStream() {
        this.dataStream = setInterval(() => {
            if (this.isConnected && this.simulationState === 'running') {
                this.requestData('realtime');
            }
        }, 1000); // Request data every second
    }

    stopDataStream() {
        if (this.dataStream) {
            clearInterval(this.dataStream);
            this.dataStream = null;
        }
    }
}

// Simulink Model Controller
class SimulinkModelController {
    constructor() {
        this.modelParameters = {};
        this.simulationConfig = {};
        this.init();
    }

    init() {
        this.loadDefaultParameters();
        this.setupParameterControls();
    }

    loadDefaultParameters() {
        this.modelParameters = {
            // Electrolyzer parameters
            stackEfficiency: 0.75,
            maxCurrent: 500,
            nominalVoltage: 46.5,
            stackTempMax: 80,
            o2MinPurity: 99.5,
            
            // Simulation parameters
            sampleTime: 0.1,
            simulationTime: 300,
            solverType: 'ode4',
            
            // Economic parameters
            powerCost: 0.15,
            o2Price: 2.50,
            maintenanceCost: 0.08
        };

        this.simulationConfig = {
            realTimeMode: true,
            dataLogging: true,
            optimizationEnabled: true,
            constraintEnforcement: true
        };
    }

    setupParameterControls() {
        // Setup parameter control interface
        this.parameterControls = {
            updateParameter: this.updateParameter.bind(this),
            saveConfiguration: this.saveConfiguration.bind(this),
            loadConfiguration: this.loadConfiguration.bind(this),
            resetToDefaults: this.resetToDefaults.bind(this)
        };
    }

    updateParameter(name, value) {
        if (this.modelParameters.hasOwnProperty(name)) {
            this.modelParameters[name] = value;
            
            // Send update to Simulink
            if (window.simulinkBridge) {
                window.simulinkBridge.sendModelParameters({
                    [name]: value
                });
            }
            
            console.log(`Updated parameter ${name} to ${value}`);
            return true;
        }
        
        return false;
    }

    saveConfiguration() {
        const config = {
            modelParameters: this.modelParameters,
            simulationConfig: this.simulationConfig,
            saveTime: new Date().toISOString()
        };
        
        localStorage.setItem('simulinkConfig', JSON.stringify(config));
        console.log('💾 Simulation configuration saved');
        
        return config;
    }

    loadConfiguration() {
        const saved = localStorage.getItem('simulinkConfig');
        if (saved) {
            try {
                const config = JSON.parse(saved);
                this.modelParameters = config.modelParameters || this.modelParameters;
                this.simulationConfig = config.simulationConfig || this.simulationConfig;
                
                console.log('📥 Simulation configuration loaded');
                return true;
            } catch (error) {
                console.error('Error loading configuration:', error);
                return false;
            }
        }
        return false;
    }

    resetToDefaults() {
        this.loadDefaultParameters();
        console.log('🔄 Simulation configuration reset to defaults');
    }

    getParameterSummary() {
        return {
            economic: {
                powerCost: this.modelParameters.powerCost,
                o2Price: this.modelParameters.o2Price,
                efficiency: this.modelParameters.stackEfficiency
            },
            technical: {
                maxCurrent: this.modelParameters.maxCurrent,
                nominalVoltage: this.modelParameters.nominalVoltage,
                maxTemperature: this.modelParameters.stackTempMax
            },
            simulation: {
                sampleTime: this.modelParameters.sampleTime,
                realTimeMode: this.simulationConfig.realTimeMode,
                dataLogging: this.simulationConfig.dataLogging
            }
        };
    }

    validateParameters() {
        const errors = [];
        
        if (this.modelParameters.stackEfficiency <= 0 || this.modelParameters.stackEfficiency > 1) {
            errors.push('Stack efficiency must be between 0 and 1');
        }
        
        if (this.modelParameters.maxCurrent <= 0) {
            errors.push('Max current must be positive');
        }
        
        if (this.modelParameters.stackTempMax < 50 || this.modelParameters.stackTempMax > 100) {
            errors.push('Max stack temperature must be between 50 and 100°C');
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }
}

// Initialize Simulink bridge when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.simulinkBridge = new SimulinkBridge();
    window.simulinkModelController = new SimulinkModelController();
    
    // Auto-connect to Simulink after a short delay
    setTimeout(() => {
        window.simulinkBridge.connectToSimulink();
    }, 3000);
});