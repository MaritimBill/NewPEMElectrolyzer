// Enhanced App with Live Data Updates
class ElectrolyzerApp {
    constructor() {
        this.mqttClient = null;
        this.currentData = null;
        this.history = [];
        this.isConnected = false;
        this.chartManager = null;
        this.dataUpdateInterval = null;
        
        this.init();
    }

    init() {
        console.log('HE-NMPC Electrolyzer Controller Initializing...');
        this.initChartManager();
        this.initEventListeners();
        this.connectMQTT();
        this.startDataUpdates();
        
        console.log('HE-NMPC Electrolyzer Controller Initialized');
    }

    startDataUpdates() {
        // Simulate live data updates if no MQTT connection
        this.dataUpdateInterval = setInterval(() => {
            if (!this.isConnected) {
                this.simulateLiveData();
            }
        }, 2000); // Update every 2 seconds
    }

    simulateLiveData() {
        // Generate realistic simulation data
        const simulatedData = {
            o2Production: 30 + Math.random() * 20,
            efficiency: 75 + Math.random() * 10,
            stackTemperature: 25 + Math.random() * 15,
            safetyMargin: 80 + Math.random() * 20,
            o2TankLevel: 40 + Math.random() * 30,
            purity: 99.5 + Math.random() * 0.3,
            economicSetpoint: 35,
            timestamp: Date.now(),
            source: 'simulation'
        };

        this.handleMessage('electrolyzer/bill/data', JSON.stringify(simulatedData));
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
            this.updateLiveDataFeed(data);
            
        } catch (error) {
            console.error('Error processing MQTT message:', error);
        }
    }

    updateLiveDataFeed(data) {
        // Update live data display
        this.updateLiveValue('liveO2Production', data.o2Production, '%');
        this.updateLiveValue('liveEfficiency', data.efficiency, '%');
        this.updateLiveValue('liveTemperature', data.stackTemperature, '°C');
        this.updateLiveValue('livePower', data.powerConsumption || (data.o2Production * 2.3), 'kW');
    }

    updateLiveValue(elementId, value, suffix = '') {
        const element = document.getElementById(elementId);
        if (element && value !== undefined) {
            element.textContent = value.toFixed(1) + suffix;
        }
    }

    // ... rest of methods remain similar but with professional logging
}
