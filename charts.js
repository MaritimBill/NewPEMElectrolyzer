// charts.js - Professional Chart Management for PEM Electrolyzer - REAL DATA ONLY
class ChartManager {
    constructor() {
        this.charts = new Map();
        this.dataHistory = [];
        this.maxHistory = 100;
        
        // Initialize with empty data
        this.initWithRetry();
    }

    initWithRetry(retryCount = 0) {
        try {
            this.initAllCharts();
            console.log('Charts initialized with empty data - waiting for system data');
        } catch (error) {
            console.warn('Chart initialization failed, retrying...', error);
            if (retryCount < 3) {
                setTimeout(() => this.initWithRetry(retryCount + 1), 500);
            } else {
                console.error('Failed to initialize charts after retries:', error);
            }
        }
    }

    initAllCharts() {
        this.destroyAllCharts();
        
        // Wait for DOM to be ready
        if (!this.areCanvasesReady()) {
            console.warn('Canvases not ready, delaying chart initialization');
            setTimeout(() => this.initAllCharts(), 100);
            return;
        }
        
        this.initMiniCharts();
        this.initMainCharts();
        this.initComparisonCharts();
        
        console.log('All charts initialized - awaiting real system data');
    }

    areCanvasesReady() {
        const requiredCanvases = [
            'productionMiniChart', 'efficiencyMiniChart', 
            'safetyMiniChart', 'temperatureMiniChart',
            'productionChart', 'parametersChart'
        ];
        
        const ready = requiredCanvases.every(id => {
            const canvas = document.getElementById(id);
            const isReady = canvas && canvas.offsetWidth > 0;
            if (!isReady) {
                console.warn(`Canvas not ready: ${id}`);
            }
            return isReady;
        });
        
        return ready;
    }

    destroyAllCharts() {
        this.charts.forEach((chart, chartId) => {
            if (chart && typeof chart.destroy === 'function') {
                chart.destroy();
            }
        });
        this.charts.clear();
    }

    initMiniCharts() {
        const miniChartConfigs = [
            { id: 'productionMiniChart', color: '#3b82f6', label: 'Production' },
            { id: 'efficiencyMiniChart', color: '#10b981', label: 'Efficiency' },
            { id: 'safetyMiniChart', color: '#f59e0b', label: 'Safety' },
            { id: 'temperatureMiniChart', color: '#ef4444', label: 'Temperature' }
        ];

        miniChartConfigs.forEach(config => {
            const chart = this.createMiniChart(config.id, config.color, config.label);
            if (chart) {
                this.charts.set(config.id, chart);
            }
        });
    }

    createMiniChart(canvasId, color, label) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.error(`Canvas not found: ${canvasId}`);
            return null;
        }

        const existingChart = Chart.getChart(canvas);
        if (existingChart) {
            existingChart.destroy();
        }

        const ctx = canvas.getContext('2d');
        
        // Initialize with empty data - NO FAKE DATA
        const emptyData = Array(10).fill(null);

        try {
            return new Chart(ctx, {
                type: 'line',
                data: {
                    labels: Array(10).fill(''),
                    datasets: [{
                        label: label,
                        data: emptyData,
                        borderColor: color,
                        backgroundColor: this.hexToRgba(color, 0.2),
                        borderWidth: 2,
                        tension: 0.4,
                        fill: true,
                        pointRadius: 0,
                        borderCapStyle: 'round'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: { enabled: false }
                    },
                    scales: {
                        x: { 
                            display: false,
                            grid: { display: false }
                        },
                        y: { 
                            display: false,
                            grid: { display: false },
                            beginAtZero: true
                        }
                    },
                    interaction: { intersect: false }
                }
            });
        } catch (error) {
            console.error(`Error creating chart ${canvasId}:`, error);
            return null;
        }
    }

    initMainCharts() {
        this.createProductionChart();
        this.createParametersChart();
    }

    createProductionChart() {
        const canvas = document.getElementById('productionChart');
        if (!canvas) {
            console.error('Production chart canvas not found');
            return;
        }

        const existingChart = Chart.getChart(canvas);
        if (existingChart) existingChart.destroy();

        const ctx = canvas.getContext('2d');
        try {
            const chart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: this.generateTimeLabels(12),
                    datasets: [
                        {
                            label: 'O₂ Production Rate',
                            data: [], // EMPTY - waiting for real data
                            borderColor: '#3b82f6',
                            backgroundColor: this.hexToRgba('#3b82f6', 0.1),
                            borderWidth: 3,
                            tension: 0.4,
                            fill: true
                        },
                        {
                            label: 'H₂ Production Rate',
                            data: [], // EMPTY - waiting for real data
                            borderColor: '#10b981',
                            backgroundColor: this.hexToRgba('#10b981', 0.1),
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
                        legend: {
                            position: 'top',
                            labels: {
                                color: '#e5e7eb',
                                font: { size: 12 }
                            }
                        },
                        title: {
                            display: true,
                            text: 'Production Trends - Awaiting Data',
                            color: '#f9fafb',
                            font: { size: 16, weight: 'bold' }
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
                                text: 'Production Rate (L/min)',
                                color: '#9ca3af'
                            },
                            beginAtZero: true
                        }
                    },
                    interaction: {
                        intersect: false,
                        mode: 'index'
                    }
                }
            });

            this.charts.set('productionChart', chart);
        } catch (error) {
            console.error('Error creating production chart:', error);
        }
    }

    createParametersChart() {
        const canvas = document.getElementById('parametersChart');
        if (!canvas) {
            console.error('Parameters chart canvas not found');
            return;
        }

        const existingChart = Chart.getChart(canvas);
        if (existingChart) existingChart.destroy();

        const ctx = canvas.getContext('2d');
        try {
            const chart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: ['Voltage', 'Current', 'Pressure', 'Flow Rate', 'Purity', 'Temp'],
                    datasets: [
                        {
                            label: 'Current Values',
                            data: [], // EMPTY - waiting for real data
                            backgroundColor: [
                                this.hexToRgba('#3b82f6', 0.8),
                                this.hexToRgba('#10b981', 0.8),
                                this.hexToRgba('#f59e0b', 0.8),
                                this.hexToRgba('#ef4444', 0.8),
                                this.hexToRgba('#8b5cf6', 0.8),
                                this.hexToRgba('#06b6d4', 0.8)
                            ],
                            borderColor: [
                                '#3b82f6', '#10b981', '#f59e0b', 
                                '#ef4444', '#8b5cf6', '#06b6d4'
                            ],
                            borderWidth: 2,
                            borderRadius: 6
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'top',
                            labels: {
                                color: '#e5e7eb',
                                font: { size: 12 }
                            }
                        },
                        title: {
                            display: true,
                            text: 'System Parameters - Awaiting Data',
                            color: '#f9fafb',
                            font: { size: 16, weight: 'bold' }
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

            this.charts.set('parametersChart', chart);
        } catch (error) {
            console.error('Error creating parameters chart:', error);
        }
    }

    initComparisonCharts() {
        // Initialize comparison charts with empty data
        console.log('Comparison charts initialized - awaiting real data');
    }

    updateCharts(data) {
        if (!data) {
            console.warn('No data provided to update charts');
            return;
        }
        
        this.updateMiniCharts(data);
        this.updateMainCharts(data);
    }

    updateMiniCharts(data) {
        const chartsToUpdate = [
            { id: 'productionMiniChart', value: data.o2Production },
            { id: 'efficiencyMiniChart', value: data.efficiency },
            { id: 'safetyMiniChart', value: data.safetyMargin },
            { id: 'temperatureMiniChart', value: data.stackTemperature }
        ];

        chartsToUpdate.forEach(config => {
            const chart = this.charts.get(config.id);
            if (chart && config.value !== undefined && config.value !== null) {
                this.updateChartData(chart, config.value);
            }
        });
    }

    updateChartData(chart, newValue) {
        if (chart && chart.data && chart.data.datasets[0]) {
            const dataset = chart.data.datasets[0];
            
            // Add new data point
            dataset.data.push(newValue);
            
            // Maintain fixed history length
            if (dataset.data.length > 10) {
                dataset.data.shift();
            }
            
            // Update chart
            chart.update('none');
        }
    }

    updateMainCharts(data) {
        // Update production chart with real data
        const productionChart = this.charts.get('productionChart');
        if (productionChart && data.o2Production !== undefined && data.h2Production !== undefined) {
            this.shiftChartData(productionChart, data.o2Production, data.h2Production);
            
            // Update chart title to show data is live
            productionChart.options.plugins.title.text = 'Production Trends (Live Data)';
            productionChart.update('none');
        }

        // Update parameters chart with real data
        const parametersChart = this.charts.get('parametersChart');
        if (parametersChart && data.voltage !== undefined) {
            this.updateParametersChart(parametersChart, data);
            
            // Update chart title to show data is live
            parametersChart.options.plugins.title.text = 'System Parameters (Live Data)';
            parametersChart.update('none');
        }
    }

    shiftChartData(chart, o2Value, h2Value) {
        if (chart.data.datasets[0] && chart.data.datasets[1]) {
            // Shift O2 data
            chart.data.datasets[0].data.push(o2Value);
            if (chart.data.datasets[0].data.length > 12) {
                chart.data.datasets[0].data.shift();
            }
            
            // Shift H2 data
            chart.data.datasets[1].data.push(h2Value);
            if (chart.data.datasets[1].data.length > 12) {
                chart.data.datasets[1].data.shift();
            }
            
            // Update labels
            chart.data.labels = this.generateTimeLabels(chart.data.datasets[0].data.length);
            
            chart.update('none');
        }
    }

    updateParametersChart(chart, data) {
        if (chart.data.datasets[0]) {
            // Update with real parameter data
            chart.data.datasets[0].data = [
                data.voltage || 0,
                data.current || 0,
                data.pressure || 0,
                data.flowRate || 0,
                data.purity || 0,
                data.stackTemperature || 0
            ];
            
            chart.update('none');
        }
    }

    generateTimeLabels(count) {
        const now = new Date();
        return Array.from({length: count}, (_, i) => {
            const time = new Date(now.getTime() - (count - i - 1) * 3600000);
            return time.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: false 
            });
        });
    }

    hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    resizeCharts() {
        this.charts.forEach(chart => {
            if (chart && typeof chart.resize === 'function') {
                chart.resize();
            }
        });
    }
}

// Initialize chart manager when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.chartManager = new ChartManager();
});
