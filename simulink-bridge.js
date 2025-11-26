// simulink-bridge.js - COMPLETE FIXED VERSION
class SimulinkBridge {
    constructor() {
        this.mqttClient = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectInterval = 3000;
        
        // Callbacks
        this.onConnect = null;
        this.onDisconnect = null;
        this.onError = null;
        this.onSimulationData = null;
        this.onMPCResults = null;
        
        this.init();
    }

    init() {
        console.log('🔌 Simulink Bridge Initializing...');
        this.connectToMQTT();
    }

    connectToMQTT() {
        try {
            console.log('📡 Connecting to MQTT broker...');
            
            // Use HiveMQ public broker
            this.mqttClient = new Paho.MQTT.Client(
                'broker.hivemq.com',
                8000,
                'web_client_' + Math.random().toString(16).substr(2, 8)
            );

            // Set callback handlers
            this.mqttClient.onConnectionLost = (response) => {
                console.log('❌ MQTT Connection lost:', response.errorMessage);
                this.isConnected = false;
                this.handleDisconnection();
            };

            this.mqttClient.onMessageArrived = (message) => {
                this.handleMessage(message);
            };

            // Connect the client
            const connectOptions = {
                onSuccess: () => {
                    console.log('✅ MQTT Connection established');
                    this.isConnected = true;
                    this.reconnectAttempts = 0;
                    this.subscribeToTopics();
                    
                    if (this.onConnect) {
                        this.onConnect();
                    }
                },
                onFailure: (error) => {
                    console.error('❌ MQTT Connection failed:', error.errorMessage);
                    this.isConnected = false;
                    this.handleConnectionFailure();
                },
                useSSL: true,
                timeout: 3,
                keepAliveInterval: 60,
                cleanSession: true
            };

            this.mqttClient.connect(connectOptions);

        } catch (error) {
            console.error('❌ MQTT Initialization error:', error);
            this.handleConnectionFailure();
        }
    }

    subscribeToTopics() {
        if (!this.mqttClient || !this.isConnected) {
            console.warn('⚠️ Cannot subscribe: MQTT not connected');
            return;
        }

        try {
            // Subscribe to MATLAB system data
            this.mqttClient.subscribe('pem/electrolyzer/data');
            console.log('✅ Subscribed to PEM system data');
            
            // Subscribe to MATLAB responses
            this.mqttClient.subscribe('electrolyzer/command/response');
            console.log('✅ Subscribed to command responses');
            
            // Subscribe to MPC results
            this.mqttClient.subscribe('electrolyzer/mpc_results');
            console.log('✅ Subscribed to MPC results');

        } catch (error) {
            console.error('❌ Subscription error:', error);
        }
    }

    handleMessage(message) {
        try {
            const topic = message.destinationName;
            const payload = message.payloadString;
            
            console.log(`📨 MQTT Message [${topic}]:`, payload.substring(0, 200) + '...');

            // Parse JSON payload
            let data;
            try {
                data = JSON.parse(payload);
            } catch (parseError) {
                console.error('❌ JSON Parse error:', parseError);
                return;
            }

            // Route message based on topic
            switch (topic) {
                case 'pem/electrolyzer/data':
                    this.processElectrolyzerData(data);
                    break;
                    
                case 'electrolyzer/mpc_results':
                    this.processMPCResults(data);
                    break;
                    
                case 'electrolyzer/command/response':
                    this.processCommandResponse(data);
                    break;
                    
                default:
                    console.log('📨 Unknown topic:', topic, data);
            }

        } catch (error) {
            console.error('❌ Message handling error:', error);
        }
    }

    processElectrolyzerData(rawData) {
        console.log('🔧 Processing PEM system data from MATLAB...');
        
        // Check if this is MPC results
        if (rawData.mpc_results && rawData.controller_performance) {
            console.log('🎯 Received REAL MPC results from PEM');
            
            if (this.onMPCResults) {
                this.onMPCResults(rawData);
            }
            
            return;
        }

        // Process as regular system data
        const processedData = {
            o2Production: rawData.o2_production,
            efficiency: rawData.efficiency,
            stackTemperature: rawData.current_temp,
            safetyMargin: rawData.safety_margin,
            voltage: rawData.voltage,
            current: rawData.current,
            pressure: rawData.pressure,
            flowRate: rawData.flow_rate,
            purity: rawData.purity,
            powerConsumption: rawData.power_consumption,
            simulationTime: rawData.simulation_time,
            timestamp: rawData.timestamp,
            source: rawData.source
        };

        console.log('📊 Processed system data:', {
            o2: processedData.o2Production?.toFixed(1),
            eff: processedData.efficiency?.toFixed(1),
            temp: processedData.stackTemperature?.toFixed(1)
        });

        if (this.onSimulationData) {
            this.onSimulationData(processedData);
        }
    }

    processMPCResults(mpcData) {
        console.log('🎯 Processing MPC results from MATLAB:', mpcData);
        
        if (this.onMPCResults) {
            this.onMPCResults(mpcData);
        }
        
        // Also update charts directly if available
        if (window.chartManager && mpcData.controller_performance) {
            window.chartManager.updateMPCComparisonCharts(mpcData.controller_performance);
        }
    }

    processCommandResponse(response) {
        console.log('📨 Command response from MATLAB:', response);
        // Handle command responses if needed
    }

    // Send commands to MATLAB
    sendCommand(command, data) {
        if (!this.isConnected || !this.mqttClient) {
            console.error('❌ Cannot send command: MQTT not connected');
            return false;
        }

        try {
            const message = {
                command: command,
                ...data,
                timestamp: new Date().toISOString(),
                source: 'web_frontend'
            };

            const jsonMessage = JSON.stringify(message);
            const mqttMessage = new Paho.MQTT.Message(jsonMessage);
            mqttMessage.destinationName = 'electrolyzer/control';
            
            this.mqttClient.send(mqttMessage);
            console.log('📤 Command sent to MATLAB:', command, data);
            return true;

        } catch (error) {
            console.error('❌ Command send error:', error);
            return false;
        }
    }

    // Send MPC commands to MATLAB
    sendMPCCommand(command, mpcData) {
        console.log('🚀 Sending MPC command to MATLAB:', command);
        
        const message = {
            mpc_command: command,
            ...mpcData,
            source: 'web_mpc_frontend',
            timestamp: new Date().toISOString()
        };
        
        return this.sendCommand('apply_controls', message);
    }

    // Connection management
    handleDisconnection() {
        if (this.onDisconnect) {
            this.onDisconnect();
        }
        this.attemptReconnection();
    }

    handleConnectionFailure() {
        this.reconnectAttempts++;
        
        if (this.reconnectAttempts <= this.maxReconnectAttempts) {
            console.log(`🔄 Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${this.reconnectInterval/1000}s...`);
            setTimeout(() => this.connectToMQTT(), this.reconnectInterval);
        } else {
            console.error('❌ Max reconnection attempts reached');
            if (this.onError) {
                this.onError('Max reconnection attempts reached');
            }
        }
    }

    attemptReconnection() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`🔄 Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
            setTimeout(() => this.connectToMQTT(), this.reconnectInterval);
        } else {
            console.error('❌ Maximum reconnection attempts reached');
            if (this.onError) {
                this.onError('Connection lost - maximum reconnection attempts reached');
            }
        }
    }

    disconnect() {
        if (this.mqttClient && this.isConnected) {
            this.mqttClient.disconnect();
            this.isConnected = false;
            console.log('🔌 MQTT Disconnected');
        }
    }

    // Utility methods
    getConnectionStatus() {
        return this.isConnected;
    }

    getReconnectAttempts() {
        return this.reconnectAttempts;
    }
}

// Make available globally
window.SimulinkBridge = SimulinkBridge;
