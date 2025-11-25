// app.js - Enhanced for Real MATLAB/Simulink Data
class ElectrolyzerApp {
    constructor() {
        this.mqttClient = null;
        this.currentData = null;
        this.simulationData = null;
        this.isConnected = false;
        this.chartManager = null;
        this.simulinkBridge = null;
        
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
        this.initChartManager();
        this.initSimulinkBridge();
        this.initEventListeners();
        this.updateSystemStatus();
        
        this.connectToSimulation().catch(error => {
            console.error('Simulation connection failed:', error);
            this.showNotification('Waiting for MATLAB/Simulink connection...', 'warning');
        });
    }

    initSimulinkBridge() {
        // Initialize Simulink bridge for real data
        if (typeof window.SimulinkBridge !== 'undefined') {
            try {
                this.simulinkBridge = new window.SimulinkBridge();
                this.setupSimulinkCallbacks();
                console.log('Simulink bridge initialized');
            } catch (error) {
                console.warn('Simulink bridge not available:', error);
            }
        } else {
            console.log('Simulink bridge not found - using MQTT fallback');
            this.connectMQTT();
        }
    }

    setupSimulinkCallbacks() {
        if (!this.simulinkBridge) return;

        // Real simulation data callback
        this.simulinkBridge.onSimulationData = (data) => {
            this.handleSimulationData(data);
        };

        // MPC comparison data callback
        this.simulinkBridge.onMPCComparison = (comparisonData) => {
            this.handleMPCComparisonData(comparisonData);
        };

        // Simulation status callback
        this.simulinkBridge.onSimulationStatus = (status) => {
            this.updateSimulationStatus(status);
        };
    }

    async connectToSimulation() {
        console.log('Connecting to MATLAB/Simulink simulation...');
        
        if (this.simulinkBridge && typeof this.simulinkBridge.connect === 'function') {
            try {
                await this.simulinkBridge.connect();
                this.isConnected = true;
                this.updateConnectionStatus('simulink', true);
                this.showNotification('Connected to MATLAB/Simulink simulation', 'success');
            } catch (error) {
                throw new Error(`Simulink connection failed: ${error.message}`);
            }
        } else {
            throw new Error('Simulink bridge not available');
        }
    }

    handleSimulationData(simulationData) {
        console.log('Received simulation data:', simulationData);
        
        this.simulationData = simulationData;
        this.currentData = this.processSimulationData(simulationData);
        
        // Update charts with real simulation data
        if (this.chartManager) {
            this.chartManager.updateAllChartsWithSimulationData(this.currentData);
        }
        
        // Update UI
        this.updateDashboard(this.currentData);
        this.updateLiveDataFeed(this.currentData);
        this.updateSystemMetrics(this.currentData);
        
        // Update data points counter
        this.updateDataPointsCount();
    }

    handleMPCComparisonData(comparisonData) {
        console.log('Received MPC comparison data:', comparisonData);
        
        // Update performance chart with real MPC comparison data
        if (this.chartManager && comparisonData.heNmpc && comparisonData.traditional) {
            this.chartManager.updatePerformanceChart(
                comparisonData.heNmpc,
                comparisonData.traditional
            );
        }
        
        // Update analytics metrics
        this.updateAnalyticsMetrics(comparisonData);
    }

    processSimulationData(simulationData) {
        // Process raw simulation data into our expected format
        return {
            // Production data
            o2Production: simulationData.O2_production || simulationData.o2_production || 0,
            h2Production: simulationData.H2_production || simulationData.h2_production || 0,
            efficiency: simulationData.efficiency || simulationData.overall_efficiency || 0,
            
            // System parameters
            voltage: simulationData.voltage || simulationData.stack_voltage || 0,
            current: simulationData.current || simulationData.stack_current || 0,
            stackTemperature: simulationData.temperature || simulationData.stack_temp || 0,
            pressure: simulationData.pressure || simulationData.system_pressure || 0,
            flowRate: simulationData.flow_rate || simulationData.h2_flow_rate || 0,
            purity: simulationData.purity || simulationData.h2_purity || 0,
            
            // Safety metrics
            safetyMargin: simulationData.safety_margin || simulationData.margin || 0,
            temperatureMargin: simulationData.temp_margin || 0,
            pressureMargin: simulationData.pressure_margin || 0,
            
            // Power data
            powerConsumption: simulationData.power || simulationData.power_consumption || 0,
            
            // Timestamp
            timestamp: simulationData.timestamp || new Date().toISOString(),
            source: 'simulink'
        };
    }

    updateAnalyticsMetrics(comparisonData) {
        // Update real MPC performance metrics in analytics tab
        const metricsContainer = document.querySelector('.metrics-comparison');
        if (metricsContainer && comparisonData.metrics) {
            const metrics = comparisonData.metrics;
            
            // Update settling time
            const settlingTimeElement = metricsContainer.querySelector('.metric-comparison-item:nth-child(1) .metric-value');
            if (settlingTimeElement && metrics.settlingTime) {
                settlingTimeElement.textContent = `${metrics.settlingTime.heNmpc}s / ${metrics.settlingTime.traditional}s`;
            }
            
            // Update overshoot
            const overshootElement = metricsContainer.querySelector('.metric-comparison-item:nth-child(2) .metric-value');
            if (overshootElement && metrics.overshoot) {
                overshootElement.textContent = `${metrics.overshoot.heNmpc}% / ${metrics.overshoot.traditional}%`;
            }
            
            // Update efficiency
            const efficiencyElement = metricsContainer.querySelector('.metric-comparison-item:nth-child(3) .metric-value');
            if (efficiencyElement && metrics.efficiency) {
                efficiencyElement.textContent = `${metrics.efficiency.heNmpc}% / ${metrics.efficiency.traditional}%`;
            }
            
            // Update constraint violations
            const violationsElement = metricsContainer.querySelector('.metric-comparison-item:nth-child(4) .metric-value');
            if (violationsElement && metrics.constraintViolations) {
                violationsElement.textContent = `${metrics.constraintViolations.heNmpc}% / ${metrics.constraintViolations.traditional}%`;
            }
        }
    }

    updateDataPointsCount() {
        const countElement = document.getElementById('dataPointsCount');
        if (countElement) {
            const currentCount = parseInt(countElement.textContent) || 0;
            countElement.textContent = currentCount + 1;
        }
    }

    updateSimulationStatus(status) {
        if (window.navigationManager) {
            window.navigationManager.updateSimulinkStatus(status);
        }
        
        // Update simulation time
        if (status.simulationTime !== undefined) {
            const simTimeElement = document.getElementById('simTime');
            if (simTimeElement) {
                simTimeElement.textContent = `${status.simulationTime.toFixed(1)} s`;
            }
        }
        
        // Update data rate
        if (status.dataRate !== undefined) {
            const dataRateElement = document.getElementById('dataRate');
            if (dataRateElement) {
                dataRateElement.textContent = `${status.dataRate.toFixed(1)} Hz`;
            }
        }
    }

    // ... (keep all other existing methods)
}
