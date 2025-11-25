// charts.js - Professional Chart Management for PEM Electrolyzer
class ChartManager {
    constructor() {
        this.charts = new Map();
        this.dataHistory = [];
        this.maxHistory = 100;
        this.initAllCharts();
    }

    initAllCharts() {
        this.destroyAllCharts();
        this.initMiniCharts();
        this.initMainCharts();
        this.initComparisonCharts();
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
            console.warn(`Canvas not found: ${canvasId}`);
            return null;
        }

        const existingChart = Chart.getChart(canvas);
        if (existingChart) {
            existingChart.destroy();
        }

        const ctx = canvas.getContext('2d');
        
        // Generate initial data with some variation
        const initialData = Array.from({length: 10}, (_, i) => 
            Math.sin(i * 0.5) * 10 + 50 + Math.random() * 10
        );

        return new Chart(ctx, {
            type: 'line',
            data: {
                labels: Array(10).fill(''),
                datasets: [{
                    label: label,
                    data: initialData,
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
                        min: 0,
                        max: 100
                    }
                },
                interaction: { intersect: false },
                animation: {
                    duration: 750,
                    easing: 'easeOutQuart'
                }
            }
        });
    }

    initMainCharts() {
        this.createProductionChart();
        this.createParametersChart();
    }

    createProductionChart() {
        const canvas = document.getElementById('productionChart');
        if (!canvas) return;

        const existingChart = Chart.getChart(canvas);
        if (existingChart) existingChart.destroy();

        const ctx = canvas.getContext('2d');
        const chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: this.generateTimeLabels(12),
                datasets: [
                    {
                        label: 'O₂ Production Rate',
                        data: [45, 52, 48, 55, 58, 62, 65, 63, 67, 70, 68, 72],
                        borderColor: '#3b82f6',
                        backgroundColor: this.hexToRgba('#3b82f6', 0.1),
                        borderWidth: 3,
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'H₂ Production Rate',
                        data: [85, 88, 92, 95, 98, 102, 105, 108, 112, 115, 118, 120],
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
                        text: 'Production Trends (Last 12 Hours)',
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
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });

        this.charts.set('productionChart', chart);
    }

    createParametersChart() {
        const canvas = document.getElementById('parametersChart');
        if (!canvas) return;

        const existingChart = Chart.getChart(canvas);
        if (existingChart) existingChart.destroy();

        const ctx = canvas.getContext('2d');
        const chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Voltage', 'Current', 'Pressure', 'Flow Rate', 'Purity', 'Temp'],
                datasets: [
                    {
                        label: 'Current Values',
                        data: [2.1, 150, 35, 12, 99.8, 65],
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
                    },
                    {
                        label: 'Target Values',
                        data: [2.0, 145, 30, 10, 99.9, 60],
                        type: 'line',
                        borderColor: '#ffffff',
                        borderWidth: 2,
                        pointRadius: 6,
                        pointBackgroundColor: '#ffffff',
                        tension: 0.3,
                        fill: false
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
                        text: 'System Parameters vs Targets',
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
    }

    initComparisonCharts() {
        // Initialize any comparison charts needed for analytics
        console.log('Comparison charts initialized');
    }

    updateCharts(data) {
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
            if (chart) {
                this.updateChartData(chart, config.value);
            }
        });
    }

    updateChartData(chart, newValue) {
        if (chart && chart.data && chart.data.datasets[0]) {
            const dataset = chart.data.datasets[0];
            dataset.data.push(newValue);
            
            if (dataset.data.length > 10) {
                dataset.data.shift();
            }
            
            chart.update('none');
        }
    }

    updateMainCharts(data) {
        // Update main charts with new data
        const productionChart = this.charts.get('productionChart');
        if (productionChart) {
            this.shiftChartData(productionChart, data.o2Production, data.h2Production);
        }
    }

    shiftChartData(chart, o2Value, h2Value) {
        if (chart.data.datasets[0] && chart.data.datasets[1]) {
            // Shift O2 data
            chart.data.datasets[0].data.push(o2Value);
            chart.data.datasets[0].data.shift();
            
            // Shift H2 data (assuming H2 production is roughly double O2)
            chart.data.datasets[1].data.push(h2Value || o2Value * 2);
            chart.data.datasets[1].data.shift();
            
            // Update labels
            chart.data.labels = this.generateTimeLabels(chart.data.labels.length);
            
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
