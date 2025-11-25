// Simulink-MATLAB Bridge for Real-time Integration
class SimulinkBridge {
    constructor() {
        this.isConnected = false;
        this.dataBuffer = [];
        this.lastUpdate = null;
        this.simulationState = 'stopped';
        this.matlabConnected = false;
        this.init();
    }

    init() {
        this.setupSimulinkConnection();
        this.setupDataHandlers();
        this.setupControlInterface();
        this.startHeartbeat();
        console.log('🔗 Simulink Bridge Initialized');
    }

    setupSimulinkConnection() {
        // Initialize connection to MATLAB/Simulink
        this.connection = {
            status: 'disconnected',
            lastPing: null,
            retryCount: 0,
            maxRetries: 5,
            heartbeatInterval: null
        };

        // Try to connect immediately
        this.connectToSimulink();
    }

    setupDataHandlers() {
        // Setup data exchange handlers
        this.dataHandlers = {
            'electrolyzer/simulink/out': this.handleSimulinkData.bind(this),
            'electrolyzer/bill/data': this.handleSystemData.bind(this),
            'electrolyzer/mpc/comparison': this.handleMPCComparisonData.bind(this)
        };
    }

    setupControlInterface() {
        // Setup control interface for Simulink
        this.controlInterface = {
            sendModelParameters: this.sendModelParameters.bind(this),
            startSimulation: this.startSimulation.bind(this),
            stopSimulation: this.stopSimulation.bind(this),
            updateSetpoints: this.updateSetpoints.bind(this),
            requestData: this.requestData.bind(this)
        };
    }

    connectToSimulink() {
        console.log('🔄 Connecting to Simulink...');
        
        // Simulate connection process (in real implementation, this would be actual connection)
        setTimeout(() => {
            this.connection.status = 'connected';
            this.connection.lastPing = Date.now();
            this.isConnected = true;
            this.matlabConnected = true;
            
            this.updateConnectionStatus();
            
            console.log('✅ Connected to Simulink');
            
            if (window.electrolyzerApp) {
                window.electrolyzerApp.showNotification('Connected to Simulink', 'success');
            }
            
        }, 2000);
    }

    disconnectFromSimulink() {
        this.connection.status = 'disconnected';
        this.isConnected = false;
        this.matlabConnected = false;
        this.simulationState = 'stopped';
        
        if (this.connection.heartbeatInterval) {
            clearInterval(this.connection.heartbeatInterval);
        }
        
        this.updateConnectionStatus();
        
        console.log('❌ Disconnected from Simulink');
        
        if (window.electrolyzerApp) {
            window.electrolyzerApp.showNotification('Disconnected from Simulink', 'warning');
        }
    }

    handleSimulinkData(topic, message) {
        try {
            const data = JSON.parse(message);
            this.processSimulinkData(data);
            
        } catch (error) {
            console.error('❌ Error processing Simulink data:', error);
        }
    }

    handleSystemData(topic, message) {
        try {
            const data = JSON.parse(message);
            // Forward system data to Simulink if needed
            this.forwardToSimulink(data);
            
        } catch (error) {
            console.error('❌ Error processing system data:', error);
        }
    }

    handleMPCComparisonData(topic, message) {
        try {
            const data = JSON.parse(message);
            this.updateMPCComparison(data);
            
        } catch (error) {
            console.error('❌ Error processing MPC comparison data:', error);
        }
    }

    processSimulinkData(data) {
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
        
        // Update simulation state
        if (data.simulationTime !== undefined) {
            this.simulationState = 'running';
        }

        // Update connection status
        this.updateConnectionStatus();

        // Forward to main application
        if (window.electrolyzerApp && window.electrolyzerApp.handleMessage) {
            window.electrolyzerApp.handleMessage('electrolyzer/simulink/out', JSON.stringify(data));
        }

        console.log('📥 Simulink data processed:', data.source);
    }

    forwardToSimulink(data) {
        if (!this.isConnected) return;

        // Filter and format data for Simulink
        const simulinkData = {
            timestamp: data.timestamp || Date.now(),
            o2Production: data.o2Production,
            efficiency: data.efficiency,
            stackTemperature: data.stackTemperature,
            safetyMargin: data.safetyMargin,
            economicSetpoint: data.economicSetpoint,
            source: 'web_dashboard_forward'
        };

        this.sendToSimulink(simulinkData);
    }

    updateMPCComparison(data) {
        // Update MPC comparison data in the interface
        if (window.navigationManager) {
            Object.entries(data).forEach(([variant, metrics]) => {
                if (variant !== 'active_controller' && variant !== 'timestamp') {
                    window.navigationManager.updateMPCPerformance(variant, {
                        economicScore: metrics.economic || 0,
                        safetyScore: metrics.safety || 0,
                        speedScore: metrics.computation_time || 0,
                        costScore: metrics.cost || 0
                    });
                }
            });
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

            // In real implementation, this would send via MQTT or other protocol
            console.log('📤 Sent to Simulink:', message);
            
            // Simulate response from Simulink
            this.simulateSimulinkResponse(message);
            
            return true;

        } catch (error) {
            console.error('❌ Error sending to Simulink:', error);
            return false;
        }
    }

    simulateSimulinkResponse(message) {
        // Simulate Simulink processing and response
        setTimeout(() => {
            const response = {
                ...message,
                processed: true,
                simulinkTimestamp: Date.now(),
                source: 'simulink_response'
            };
            
            this.processSimulinkData(response);
        }, 500);
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
        this.updateConnectionStatus();
        
        console.log('🚀 Starting Simulink simulation...');
        
        return this.sendToSimulink(message);
    }

    stopSimulation() {
        const message = {
            command: 'STOP_SIMULATION', 
            timestamp: Date.now()
        };

        this.simulationState = 'stopping';
        this.updateConnectionStatus();
        
        console.log('🛑 Stopping Simulink simulation...');
        
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
        const simulinkStatusElement = document.getElementById('simulinkStatus');

        if (statusElement) {
            statusElement.textContent = this.matlabConnected ? 'Connected' : 'Disconnected';
            statusElement.className = this.matlabConnected ? 'status-badge success' : 'status-badge danger';
        }

        if (dataFlowElement) {
            dataFlowElement.textContent = this.simulationState === 'running' ? 'Active' : 'Inactive';
            dataFlowElement.className = this.simulationState === 'running' ? 'status-badge success' : 'status-badge warning';
        }

        if (lastUpdateElement) {
            lastUpdateElement.textContent = this.lastUpdate ? 
                new Date(this.lastUpdate).toLocaleTimeString() : 'Never';
        }

        if (simulinkStatusElement) {
            simulinkStatusElement.textContent = this.matlabConnected ? 'Connected' : 'Disconnected';
            simulinkStatusElement.className = this.matlabConnected ? 'status-badge success' : 'status-badge danger';
        }
    }

    startHeartbeat() {
        // Send heartbeat every 30 seconds to maintain connection
        this.connection.heartbeatInterval = setInterval(() => {
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
        this.connection.lastPing = Date.now();
    }

    getConnectionStats() {
        return {
            isConnected: this.isConnected,
            matlabConnected: this.matlabConnected,
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
        
        if (window.electrolyzerApp) {
            window.electrolyzerApp.showNotification('Data buffer cleared', 'info');
        }
    }

    // Real-time data streaming
    startDataStream() {
        console.log('📡 Starting real-time data stream...');
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
            console.log('📡 Real-time data stream stopped');
        }
    }

    // Method to get bridge status
    getStatus() {
        return {
            ...this.getConnectionStats(),
            dataStreamActive: !!this.dataStream,
            handlersRegistered: Object.keys(this.dataHandlers).length
        };
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
        console.log('🎛️ Simulink Model Controller Initialized');
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
            maintenanceCost: 0.08,

            // Safety parameters
            tempSafetyMargin: 5,
            puritySafetyMargin: 0.2,
            minTankLevel: 10
        };

        this.simulationConfig = {
            realTimeMode: true,
            dataLogging: true,
            optimizationEnabled: true,
            constraintEnforcement: true,
            adaptiveControl: false
        };
    }

    setupParameterControls() {
        // Setup parameter control interface
        this.parameterControls = {
            updateParameter: this.updateParameter.bind(this),
            saveConfiguration: this.saveConfiguration.bind(this),
            loadConfiguration: this.loadConfiguration.bind(this),
            resetToDefaults: this.resetToDefaults.bind(this),
            validateParameters: this.validateParameters.bind(this)
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
            
            console.log(`📝 Updated parameter ${name} to ${value}`);
            return true;
        }
        
        console.warn(`⚠️ Parameter ${name} not found`);
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
        
        if (window.electrolyzerApp) {
            window.electrolyzerApp.showNotification('Configuration saved', 'success');
        }
        
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
                
                if (window.electrolyzerApp) {
                    window.electrolyzerApp.showNotification('Configuration loaded', 'success');
                }
                
                return true;
            } catch (error) {
                console.error('❌ Error loading configuration:', error);
                
                if (window.electrolyzerApp) {
                    window.electrolyzerApp.showNotification('Error loading configuration', 'danger');
                }
                
                return false;
            }
        }
        
        console.log('ℹ️ No saved configuration found');
        return false;
    }

    resetToDefaults() {
        this.loadDefaultParameters();
        console.log('🔄 Simulation configuration reset to defaults');
        
        if (window.electrolyzerApp) {
            window.electrolyzerApp.showNotification('Configuration reset to defaults', 'info');
        }
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
            },
            safety: {
                tempSafetyMargin: this.modelParameters.tempSafetyMargin,
                puritySafetyMargin: this.modelParameters.puritySafetyMargin,
                minTankLevel: this.modelParameters.minTankLevel
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
        
        if (this.modelParameters.o2MinPurity < 99 || this.modelParameters.o2MinPurity > 100) {
            errors.push('O2 minimum purity must be between 99% and 100%');
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    // Method to get controller status
    getStatus() {
        return {
            parametersLoaded: Object.keys(this.modelParameters).length > 0,
            configLoaded: Object.keys(this.simulationConfig).length > 0,
            validation: this.validateParameters()
        };
    }
}

// Initialize Simulink bridge when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.simulinkBridge = new SimulinkBridge();
    window.simulinkModelController = new SimulinkModelController();
    
    console.log('🔗 Simulink Integration System Ready');
    
    // Auto-connect to Simulink after a short delay
    setTimeout(() => {
        window.simulinkBridge.connectToSimulink();
    }, 3000);
});
