// mqtt.js - ENHANCED WITH NEURAL TOPICS
const mqtt = require('mqtt');

class MQTTClient {
    constructor() {
        this.client = null;
        this.neuralCallbacks = [];
        this.pemCallbacks = [];
    }

    connect() {
        this.client = mqtt.connect('tcp://broker.hivemq.com:1883');
        
        this.client.on('connect', () => {
            console.log('✅ MQTT Connected to MATLAB & Arduino Bridge');
            
            // Subscribe to ALL required topics
            this.client.subscribe('neural/controls');
            this.client.subscribe('pem/electrolyzer/data');
            this.client.subscribe('arduino/telemetry');
            this.client.subscribe('system/alerts');
            
            console.log('📡 Subscribed to: neural/controls, pem/electrolyzer/data, arduino/telemetry');
        });

        this.client.on('message', (topic, message) => {
            const data = JSON.parse(message.toString());
            
            switch(topic) {
                case 'pem/electrolyzer/data':
                    // From MATLAB - PEM telemetry
                    this.pemCallbacks.forEach(callback => callback(data));
                    break;
                    
                case 'arduino/telemetry':
                    // From Arduino - real-time sensors
                    console.log('🔌 Arduino:', data);
                    break;
                    
                case 'system/alerts':
                    // System alerts from any component
                    this.handleSystemAlert(data);
                    break;
            }
        });
    }

    // Send neural controls to MATLAB
    sendToMATLAB(controlData) {
        if (this.client && this.client.connected) {
            this.client.publish('neural/controls', JSON.stringify(controlData));
            console.log('📤 Neural→MATLAB:', controlData.optimal_current + 'A');
            return true;
        }
        return false;
    }

    // Send commands to Arduino
    sendToArduino(commandData) {
        if (this.client && this.client.connected) {
            this.client.publish('arduino/commands', JSON.stringify(commandData));
            console.log('📤 MATLAB→Arduino:', commandData.command);
            return true;
        }
        return false;
    }

    // Register callbacks for PEM data
    onPEMData(callback) {
        this.pemCallbacks.push(callback);
    }

    // Register callbacks for neural commands
    onNeuralControl(callback) {
        this.neuralCallbacks.push(callback);
    }

    handleSystemAlert(alert) {
        console.log('🚨 SYSTEM ALERT:', alert);
        // Send to frontend, log, trigger notifications
    }
}

// Export singleton instance
const mqttClient = new MQTTClient();
module.exports = mqttClient;
