// MQTT Client for HE-NMPC Electrolyzer System
class MQTTClient {
    constructor(brokerUrl, messageCallback) {
        this.brokerUrl = brokerUrl;
        this.messageCallback = messageCallback;
        this.client = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
    }

    connect() {
        try {
            this.client = new Paho.MQTT.Client(
                'broker.hivemq.com',
                8884,
                '/mqtt',
                `web-client-${Math.random().toString(36).substr(2, 9)}`
            );

            this.client.onConnectionLost = this.onConnectionLost.bind(this);
            this.client.onMessageArrived = this.onMessageArrived.bind(this);

            const options = {
                useSSL: true,
                timeout: 3,
                onSuccess: this.onConnect.bind(this),
                onFailure: this.onConnectFailure.bind(this),
                reconnect: true
            };

            this.client.connect(options);
            
        } catch (error) {
            console.error('MQTT Connection Error:', error);
            this.scheduleReconnect();
        }
    }

    onConnect() {
        console.log('✅ MQTT Connected to broker.hivemq.com');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        
        // Subscribe to relevant topics
        this.subscribe('electrolyzer/bill/data');
        this.subscribe('electrolyzer/simulink/out');
        this.subscribe('electrolyzer/bill/upper_commands');
        this.subscribe('electrolyzer/bill/commands');
    }

    onConnectFailure(error) {
        console.error('❌ MQTT Connection Failed:', error);
        this.isConnected = false;
        this.scheduleReconnect();
    }

    onConnectionLost(response) {
        console.warn('⚠️ MQTT Connection Lost:', response.errorMessage);
        this.isConnected = false;
        this.scheduleReconnect();
    }

    onMessageArrived(message) {
        try {
            const topic = message.destinationName;
            const payload = message.payloadString;
            
            this.messageCallback(topic, payload);
            
        } catch (error) {
            console.error('Error processing MQTT message:', error);
        }
    }

    subscribe(topic) {
        if (this.client && this.isConnected) {
            this.client.subscribe(topic, {
                onSuccess: () => console.log(`✅ Subscribed to ${topic}`),
                onFailure: (error) => console.error(`❌ Subscribe failed for ${topic}:`, error)
            });
        }
    }

    publish(topic, message) {
        if (this.client && this.isConnected) {
            const mqttMessage = new Paho.MQTT.Message(message);
            mqttMessage.destinationName = topic;
            mqttMessage.qos = 0;
            mqttMessage.retained = false;
            
            this.client.send(mqttMessage);
        } else {
            console.warn('⚠️ MQTT not connected, message not sent:', topic, message);
        }
    }

    scheduleReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
            
            console.log(`🔄 Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
            
            setTimeout(() => {
                this.connect();
            }, delay);
        } else {
            console.error('❌ Max reconnection attempts reached');
        }
    }

    reconnect() {
        if (!this.isConnected) {
            this.connect();
        }
    }

    isConnected() {
        return this.isConnected;
    }

    disconnect() {
        if (this.client && this.isConnected) {
            this.client.disconnect();
            this.isConnected = false;
        }
    }
}