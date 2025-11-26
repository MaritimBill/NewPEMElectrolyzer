// charts.js - REAL Data from MATLAB Only
class ChartManager {
    constructor() {
        this.charts = new Map();
        this.realDataHistory = [];
        this.maxHistory = 50;
        this.init();
    }

    init() {
        console.log('📊 Chart Manager - Ready for REAL Data');
        this.setupRealDataListener();
        this.initAllCharts();
    }

    setupRealDataListener() {
        // Listen for REAL data from MATLAB
        if (window.electrolyzerApp && window.electrolyzerApp.simulinkBridge) {
            const bridge = window.electrolyzerApp.simulinkBridge;
            
            // Listen for MPC results
            bridge.onMPCResults = (realData) => {
                console.log('📈 Chart Manager: Received REAL MPC Data', realData);
                this.processRealMPCData(realData);
            };
            
            // Also listen for regular system data
            const originalHandler = bridge.onSimulationData;
            bridge.onSimulationData = (data) => {
                if (originalHandler) originalHandler(data);
                this.processRealSystemData(data);
            };
        }
    }

    processRealMPCData(mpcData) {
        if (!mpcData.controller_performance) {
            console.warn('Invalid MPC data structure');
            return;
        }

        console.log('🎯 Processing REAL MPC performance data:', mpcData.controller_performance);
        
        // Update comparison charts with REAL data
        this.updateMPCComparisonCharts(mpcData.controller_performance);
        
        // Update trend charts
        this.updateMPCTrends(mpcData.controller_performance);
        
        // Store for history
        this.realDataHistory.push({
            timestamp: new Date(),
            type: 'mpc_performance',
            data: mpcData.controller_performance
        });
        
        if (this.realDataHistory.length > this.maxHistory) {
            this.realDataHistory.shift();
        }
    }

    processRealSystemData(systemData) {
        console.log('🏭 Processing REAL system data:', systemData);
        
        // Update system monitoring charts
        this.updateSystemCharts(systemData);
        
        // Store system data
        this.realDataHistory.push({
            timestamp: new Date(),
            type: 'system_data',
            data: systemData
        });
    }

    initAllCharts() {
        console.log('Initializing charts for REAL data...');
        
        // MPC Comparison Chart
        this.createMPCComparisonChart();
        
        // MPC Trends Chart
        this.createMPCTrendsChart();
        
        // System Monitoring Charts
        this.createSystemCharts();
        
        console.log('✅ All charts ready for REAL data');
    }

    createMPCComparisonChart() {
        const canvas = document.getElementById('mpcComparisonChart');
        if (!canvas) {
            console.log('MPC Comparison chart canvas not found yet');
            return;
        }

        const ctx = canvas.getContext('2d');
        const chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['HE-NMPC', 'Traditional', 'Stochastic', 'Mixed Integer'],
                datasets: [
                    {
                        label: 'Efficiency %',
                        data: [0, 0, 0, 0], // Will be updated with REAL data
                        backgroundColor: '#3b82f6',
                        borderColor: '#2563eb',
                        borderWidth: 2
                    },
                    {
                        label: 'Response Time (s)',
                        data: [0, 0, 0, 0], // Will be updated with REAL data
                        backgroundColor: '#ef4444',
                        borderColor: '#dc2626',
                        borderWidth: 2
                    },
                    {
                        label: 'Stability Index',
                        data: [0, 0, 0, 0], // Will be updated with REAL data
                        backgroundColor: '#10b981',
                        borderColor: '#059669',
                        borderWidth: 2
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'MPC Performance - Waiting for REAL Data',
                        color: '#f9fafb',
                        font: { size: 16, weight: 'bold' }
                    },
                    legend: {
                        position: 'top',
                        labels: { color: '#e5e7eb' }
                    }
                },
                scales: {
                    x: {
                        grid: { color: '#374151' },
                        ticks: { color: '#9ca3af' }
                    },
                    y: {
                        grid: { color: '#374151' },
                        ticks: { color: '#9ca3af' },
                        beginAtZero: true
                    }
                }
            }
        });

        this.charts.set('mpcComparisonChart', chart);
    }

    createMPCTrendsChart() {
        const canvas = document.getElementById('mpcTrendsChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'HE-NMPC Score',
                        data: [],
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        borderWidth: 3,
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'Traditional Score',
                        data: [],
                        borderColor: '#ef4444',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        borderWidth: 3,
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'Stochastic Score',
                        data: [],
                        borderColor: '#f59e0b',
                        backgroundColor: 'rgba(245, 158, 11, 0.1)',
                        borderWidth: 3,
                        tension: 0.4,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'MPC Performance Trends - Waiting for REAL Data',
                        color: '#f9fafb'
                    },
                    legend: {
                        position: 'top',
                        labels: { color: '#e5e7eb' }
                    }
                },
                scales: {
                    x: {
                        grid: { color: '#374151' },
                        ticks: { color: '#9ca3af' }
                    },
                    y: {
                        grid: { color: '#374151' },
                        ticks: { color: '#9ca3af' },
                        title: {
                            display: true,
                            text: 'Performance Score',
                            color: '#9ca3af'
                        },
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });

        this.charts.set('mpcTrendsChart', chart);
    }

    createSystemCharts() {
        // Production Chart
        this.createChart('productionChart', {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'O₂ Production (L/min)',
                        data: [],
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        borderWidth: 3,
                        tension: 0.4,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'O₂ Production - Waiting for REAL Data',
                        color: '#f9fafb'
                    }
                },
                scales: {
                    x: { grid: { color: '#374151' }, ticks: { color: '#9ca3af' } },
                    y: { grid: { color: '#374151' }, ticks: { color: '#9ca3af' } }
                }
            }
        });

        // Efficiency Chart
        this.createChart('efficiencyChart', {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'Efficiency %',
                        data: [],
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        borderWidth: 3,
                        tension: 0.4,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'System Efficiency - Waiting for REAL Data',
                        color: '#f9fafb'
                    }
                },
                scales: {
                    x: { grid: { color: '#374151' }, ticks: { color: '#9ca3af' } },
                    y: { 
                        grid: { color: '#374151' }, 
                        ticks: { color: '#9ca3af' },
                        min: 50,
                        max: 100
                    }
                }
            }
        });
    }

    createChart(canvasId, config) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.log(`Canvas ${canvasId} not found`);
            return;
        }

        const ctx = canvas.getContext('2d');
        this.charts.set(canvasId, new Chart(ctx, config));
    }

    updateMPCComparisonCharts(performanceData) {
        console.log('📈 Updating MPC charts with REAL data:', performanceData);
        
        const comparisonChart = this.charts.get('mpcComparisonChart');
        if (comparisonChart) {
            // Update with REAL performance data
            comparisonChart.data.datasets[0].data = [
                performanceData.he_nmpc?.efficiency || 0,
                performanceData.traditional?.efficiency || 0,
                performanceData.stochastic?.efficiency || 0,
                performanceData.mixed_integer?.efficiency || 0
            ];
            
            comparisonChart.data.datasets[1].data = [
                performanceData.he_nmpc?.response_time || 0,
                performanceData.traditional?.response_time || 0,
                performanceData.stochastic?.response_time || 0,
                performanceData.mixed_integer?.response_time || 0
            ];
            
            comparisonChart.data.datasets[2].data = [
                performanceData.he_nmpc?.stability_index || 0,
                performanceData.traditional?.stability_index || 0,
                performanceData.stochastic?.stability_index || 0,
                performanceData.mixed_integer?.stability_index || 0
            ];
            
            comparisonChart.options.plugins.title.text = 'MPC Performance - REAL PEM Results';
            comparisonChart.update();
            
            console.log('✅ MPC Comparison chart updated with REAL data');
        }
    }

    updateMPCTrends(performanceData) {
        const trendsChart = this.charts.get('mpcTrendsChart');
        if (!trendsChart) return;

        // Add new data point to trends
        const time = new Date().toLocaleTimeString();
        
        if (trendsChart.data.labels.length > 15) {
            trendsChart.data.labels.shift();
            trendsChart.data.datasets.forEach(dataset => dataset.data.shift());
        }
        
        trendsChart.data.labels.push(time);
        trendsChart.data.datasets[0].data.push(performanceData.he_nmpc?.performance_score || 0);
        trendsChart.data.datasets[1].data.push(performanceData.traditional?.performance_score || 0);
        trendsChart.data.datasets[2].data.push(performanceData.stochastic?.performance_score || 0);
        
        trendsChart.options.plugins.title.text = 'MPC Performance Trends - REAL Data';
        trendsChart.update();
    }

    updateSystemCharts(systemData) {
        // Update production chart
        const productionChart = this.charts.get('productionChart');
        if (productionChart && systemData.o2_production) {
            this.addDataPoint(productionChart, 0, systemData.o2_production);
            productionChart.options.plugins.title.text = `O₂ Production - ${systemData.o2_production.toFixed(1)} L/min`;
        }

        // Update efficiency chart
        const efficiencyChart = this.charts.get('efficiencyChart');
        if (efficiencyChart && systemData.efficiency) {
            this.addDataPoint(efficiencyChart, 0, systemData.efficiency);
            efficiencyChart.options.plugins.title.text = `System Efficiency - ${systemData.efficiency.toFixed(1)}%`;
        }
    }

    addDataPoint(chart, datasetIndex, value) {
        if (!chart || !chart.data.datasets[datasetIndex]) return;
        
        if (chart.data.labels.length > 20) {
            chart.data.labels.shift();
            chart.data.datasets.forEach(dataset => dataset.data.shift());
        }
        
        const time = new Date().toLocaleTimeString();
        chart.data.labels.push(time);
        chart.data.datasets[datasetIndex].data.push(value);
        chart.update('none');
    }

    // Method to trigger MPC computation from UI
    triggerMPCComputation() {
        if (window.neuralMPCManager) {
            console.log('🚀 Triggering MPC computation...');
            window.neuralMPCManager.triggerComputation();
        } else {
            console.warn('Neural MPC Manager not available');
        }
    }
}

// Initialize when ready
document.addEventListener('DOMContentLoaded', function() {
    window.chartManager = new ChartManager();
});
