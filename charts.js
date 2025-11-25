// app.js - Fixed Initialization for PEM Electrolyzer
class ElectrolyzerApp {
    constructor() {
        this.mqttClient = null;
        this.currentData = null;
        this.simulationData = null;
        this.isConnected = false;
        this.chartManager = null;
        this.simulinkBridge = null;
        this.dataPointsReceived = 0;
        
        this.init();
    }

    init() {
        console.log('HE-NMPC Electrolyzer Controller Initializing...');
        
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
        this.initSimulinkBridge();
        this.initEventListeners();
        this.updateSystemStatus();
        
        this.connectToSimulation().catch(error => {
            console.error('Simulation connection failed:', error);
            this.showNotification('Starting fallback simulation mode...', 'warning');
        });
    }

    initChartManager() {
        try {
            this.chartManager = new ChartManager();
            console.log('Chart Manager Initialized');
        } catch (error) {
            console.error('Error initializing chart manager:', error);
        }
    }

    initSimulinkBridge() {
        try {
            this.simulinkBridge = new window.SimulinkBridge();
            this.setupSimulinkCallbacks();
            console.log('Simulink bridge initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Simulink bridge:', error);
            this.showNotification('Using fallback simulation mode', 'info');
        }
    }

    // ... rest of your existing app.js methods
}
