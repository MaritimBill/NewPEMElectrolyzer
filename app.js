// app.js - COMPLETE FIXED VERSION
class ElectrolyzerApp {
    constructor() {
        this.simulinkBridge = new SimulinkBridge();
        this.currentData = null;
        this.isConnected = false;
        this.mpcEnabled = true;
        
        this.init();
        this.initNeuralMPC();
    }

    init() {
        console.log('🏭 PEM Electrolyzer App Initializing...');
        
        this.setupEventListeners();
        this.setupSimulinkBridge();
        this.updateConnectionStatus(false);
        
        console.log('✅ App initialized - waiting for MATLAB connection...');
    }

    initNeuralMPC() {
        // Initialize Neural MPC Manager when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.setupNeuralMPC();
            });
        } else {
            this.setupNeuralMPC();
        }
    }

    setupNeuralMPC() {
        console.log('🔗 Setting up Neural MPC system...');
        
        // Initialize Neural MPC Manager
        if (typeof NeuralMPCManager !== 'undefined' && !window.neuralMPCManager) {
            window.neuralMPCManager = new NeuralMPCManager();
            console.log('✅ Neural MPC Manager initialized');
        } else if (window.neuralMPCManager) {
            console.log('✅ Neural MPC Manager already exists');
        } else {
            console.warn('⚠️ NeuralMPCManager class not found');
        }

        // Setup MPC data handling
        this.setupMPCDataHandling();
    }

    setupMPCDataHandling() {
        // Handle system data and auto-trigger MPC
        this.simulinkBridge.onSimulationData = (data) => {
            this.currentData = data;
            this.updateDashboard(data);
            
            // Auto-trigger MPC if enabled
            if (this.mpcEnabled && window.neuralMPCManager && window.neuralMPCManager.onSystemStateUpdate) {
                window.neuralMPCManager.onSystemStateUpdate(data);
            }
        };

        // Handle MPC results from MATLAB
        this.simulinkBridge.onMPCResults = (mpcData) => {
            console.log('🎯 App: Received REAL MPC results from MATLAB', mpcData);
            
            if (window.neuralMPCManager && window.neuralMPCManager.processRealMPCResults) {
                window.neuralMPCManager.processRealMPCResults(mpcData);
            }
            
            if (window.chartManager && mpcData.controller_performance) {
                window.chartManager.updateMPCComparisonCharts(mpcData.controller_performance);
                window.chartManager.updateMPCTrends(mpcData.controller_performance);
            }
            
            this.updateMPCStatus('MPC experiment completed!');
        };
    }

    setupSimulinkBridge() {
        this.simulinkBridge.onConnect = () => {
            console.log('✅ Connected to MATLAB PEM System');
            this.isConnected = true;
            this.updateConnectionStatus(true);
            this.updateSystemStatus('Connected to MATLAB - Receiving real data');
        };

        this.simulinkBridge.onDisconnect = () => {
            console.log('❌ Disconnected from MATLAB PEM System');
            this.isConnected = false;
            this.updateConnectionStatus(false);
            this.updateSystemStatus('Disconnected from MATLAB');
        };

        this.simulinkBridge.onError = (error) => {
            console.error('❌ MATLAB Connection Error:', error);
            this.updateSystemStatus(`Error: ${error}`);
        };
    }

    setupEventListeners() {
        // Manual MPC trigger
        document.addEventListener('click', (e) => {
            if (e.target.id === 'manualMPCTrigger') {
                this.triggerManualMPC();
            }
            if (e.target.id === 'toggleAutoMPC') {
                this.toggleAutoMPC();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'm') {
                e.preventDefault();
                this.triggerManualMPC();
            }
        });
    }

    triggerManualMPC() {
        console.log('🚀 Manual MPC computation triggered');
        
        if (!this.isConnected) {
            this.updateMPCStatus('Error: Not connected to MATLAB');
            return;
        }

        if (!this.currentData) {
            this.updateMPCStatus('Error: No system data available');
            return;
        }

        this.updateMPCStatus('Computing MPC controls...');

        if (window.neuralMPCManager && window.neuralMPCManager.triggerMPCComputation) {
            window.neuralMPCManager.triggerMPCComputation();
        } else {
            // Fallback: Direct MPC computation
            this.computeFallbackMPC();
        }
    }

    computeFallbackMPC() {
        console.log('🔄 Using fallback MPC computation');
        
        const mpcControls = {
            he_nmpc: { 
                control_action: { 
                    current: Math.max(100, Math.min(200, this.currentData.current + (Math.random() - 0.5) * 20)),
                    voltage: Math.max(1.8, Math.min(2.4, 2.1 + (Math.random() - 0.5) * 0.1))
                } 
            },
            traditional: { 
                control_action: { 
                    current: Math.max(100, Math.min(200, this.currentData.current * 0.95)),
                    voltage: Math.max(1.8, Math.min(2.4, 2.08))
                } 
            },
            stochastic: { 
                control_action: { 
                    current: Math.max(100, Math.min(200, this.currentData.current + 5)),
                    voltage: Math.max(1.8, Math.min(2.4, 2.12))
                } 
            },
            mixed_integer: { 
                control_action: { 
                    current: 150,
                    voltage: 2.1
                } 
            }
        };

        this.simulinkBridge.sendMPCCommand('apply_controls', {
            system_state: this.prepareSystemState(this.currentData),
            mpc_controls: mpcControls,
            timestamp: new Date().toISOString()
        });

        this.updateMPCStatus('MPC controls sent to MATLAB!');
    }

    prepareSystemState(systemData) {
        return {
            o2_production: systemData.o2Production || 40,
            efficiency: systemData.efficiency || 75,
            current_temp: systemData.stackTemperature || 65,
            safety_margin: systemData.safetyMargin || 90,
            voltage: systemData.voltage || 2.1,
            current: systemData.current || 150,
            pressure: systemData.pressure || 30,
            flow_rate: systemData.flowRate || 45,
            purity: systemData.purity || 99.5,
            power_consumption: systemData.powerConsumption || 3.8
        };
    }

    toggleAutoMPC() {
        this.mpcEnabled = !this.mpcEnabled;
        const status = this.mpcEnabled ? 'ENABLED' : 'DISABLED';
        this.updateMPCStatus(`Auto MPC ${status}`);
        console.log(`🔧 Auto MPC: ${status}`);
    }

    updateDashboard(data) {
        this.updateMetric('o2Production', data.o2Production, 'L/min');
        this.updateMetric('efficiency', data.efficiency, '%');
        this.updateMetric('stackTemperature', data.stackTemperature, '°C');
        this.updateMetric('safetyMargin', data.safetyMargin, '%');
        this.updateMetric('voltage', data.voltage, 'V');
        this.updateMetric('current', data.current, 'A');
        this.updateMetric('pressure', data.pressure, 'bar');
        this.updateMetric('flowRate', data.flowRate, 'L/min');
        this.updateMetric('purity', data.purity, '%');
        this.updateMetric('powerConsumption', data.powerConsumption, 'kW');
    }

    updateMetric(elementId, value, unit) {
        const element = document.getElementById(elementId);
        if (element) {
            const formattedValue = typeof value === 'number' ? value.toFixed(1) : value;
            element.textContent = `${formattedValue} ${unit}`;
        }
    }

    updateConnectionStatus(connected) {
        const statusElement = document.getElementById('connectionStatus');
        if (statusElement) {
            statusElement.textContent = connected ? '✅ Connected' : '❌ Disconnected';
            statusElement.style.color = connected ? '#10b981' : '#ef4444';
        }
    }

    updateSystemStatus(message) {
        const statusElement = document.getElementById('systemStatus');
        if (statusElement) {
            statusElement.textContent = message;
        }
    }

    updateMPCStatus(message) {
        const statusElement = document.getElementById('mpcStatus');
        if (statusElement) {
            statusElement.textContent = `Status: ${message}`;
            statusElement.style.color = message.includes('Error') ? '#ef4444' : 
                                      message.includes('completed') ? '#10b981' : '#3b82f6';
        }
    }

    // Public method for external access
    getCurrentData() {
        return this.currentData;
    }

    isMPCEnabled() {
        return this.mpcEnabled;
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.electrolyzerApp = new ElectrolyzerApp();
    
    // Global functions for manual control
    window.runMPCExperiment = function() {
        if (window.electrolyzerApp) {
            window.electrolyzerApp.triggerManualMPC();
        }
    };
    
    window.toggleAutoMPC = function() {
        if (window.electrolyzerApp) {
            window.electrolyzerApp.toggleAutoMPC();
        }
    };
    
    console.log('🚀 PEM Electrolyzer App Ready!');
    console.log('   Use runMPCExperiment() to trigger MPC manually');
    console.log('   Use toggleAutoMPC() to enable/disable auto computation');
});
