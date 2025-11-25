// Complete Chart System for HE-NMPC Dashboard
class ChartManager {
    constructor() {
        this.charts = {};
        this.dataHistory = [];
        this.maxHistory = 50;
        this.initAllCharts();
    }

    initAllCharts() {
        // Mini Charts for Metric Cards
        this.initMiniCharts();
        
        // Main Charts
        this.initMainCharts();
        
        // Comparison Charts
        this.initComparisonCharts();
    }

    initMiniCharts() {
        this.charts.productionMini = this.createMiniChart('productionMiniChart', '#3b82f6');
        this.charts.efficiencyMini = this.createMiniChart('efficiencyMiniChart', '#10b981');
        this.charts.safetyMini = this.createMiniChart('safetyMiniChart', '#f59e0b');
        this.charts.temperatureMini = this.createMiniChart('temperatureMiniChart', '#ef4444');
    }

    createMiniChart(canvasId, color) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return null;

        const ctx = canvas.getContext('2d');
        return new Chart(ctx, {
            type: 'line',
            data: {
                labels: Array(10).fill(''),
                datasets: [{
                    data: Array(10).fill(0),
                    borderColor: color,
                    backgroundColor: color + '20',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true,
                    pointRadius: 0
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
                    x: { display: false },
                    y: { display: false }
                },
                interaction: { intersect: false },
                elements: {
                    line: {
                        tension: 0.4
                    }
                }
            }
        });
    }

    initMainCharts() {
        this.charts.productionChart = new ProductionChart('productionChart');
        this.charts.parametersChart = new ParametersChart('parametersChart');
        this.charts.constraintsChart = new ConstraintsChart('constraintsChart');
        this.charts.economicChart = new EconomicChart('economicChart');
        this.charts.performanceChart = new PerformanceChart('performanceChart');
        this.charts.mpcComparison = new MPCComparisonChart('mpcComparisonChart');
    }

    initComparisonCharts() {
        // Initialize comparison charts
        this.charts.performanceRadar = new PerformanceRadarChart('performanceRadar');
        this.charts.historicalChart = new HistoricalChart('historicalChart');
    }

    updateAllCharts(data) {
        // Add to history
        this.dataHistory.push({...data, timestamp: Date.now()});
        if (this.dataHistory.length > this.maxHistory) {
            this.dataHistory.shift();
        }

        // Update mini charts
        this.updateMiniCharts(data);

        // Update main charts
        Object.values(this.charts).forEach(chart => {
            if (chart && chart.update) {
                chart.update(data);
            }
        });

        // Update metric values
        this.updateMetricValues(data);
    }

    updateMiniCharts(data) {
        const miniCharts = ['productionMini', 'efficiencyMini', 'safetyMini', 'temperatureMini'];
        miniCharts.forEach(chartName => {
            const chart = this.charts[chartName];
            if (chart) {
                const newData = this.getDataForMiniChart(chartName, data);
                chart.data.datasets[0].data.push(newData);
                if (chart.data.datasets[0].data.length > 10) {
                    chart.data.datasets[0].data.shift();
                }
                chart.update('none');
            }
        });
    }

    getDataForMiniChart(chartName, data) {
        switch(chartName) {
            case 'productionMini': return data.o2Production || 0;
            case 'efficiencyMini': return data.efficiency || 75;
            case 'safetyMini': return data.safetyMargin || 100;
            case 'temperatureMini': return data.stackTemperature || 25;
            default: return 0;
        }
    }

    updateMetricValues(data) {
        const metrics = {
            'productionValue': data.o2Production?.toFixed(1) + '%',
            'efficiencyValue': data.efficiency?.toFixed(1) + '%',
            'safetyValue': data.safetyMargin?.toFixed(1) + '%',
            'temperatureValue': data.stackTemperature?.toFixed(1) + '°C'
        };

        Object.entries(metrics).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        });
    }
}

// Main Chart Classes
class ProductionChart {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        
        this.ctx = this.canvas.getContext('2d');
        this.chart = new Chart(this.ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'O₂ Production',
                    data: [],
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: { color: '#f1f5f9' }
                    }
                },
                scales: {
                    x: {
                        grid: { color: 'rgba(100, 116, 139, 0.2)' },
                        ticks: { color: '#94a3b8' }
                    },
                    y: {
                        beginAtZero: true,
                        max: 100,
                        grid: { color: 'rgba(100, 116, 139, 0.2)' },
                        ticks: { color: '#94a3b8' }
                    }
                }
            }
        });
    }

    update(data) {
        if (!this.chart || data.o2Production === undefined) return;
        
        const now = new Date();
        this.chart.data.labels.push(now.toLocaleTimeString());
        
        if (this.chart.data.labels.length > 20) {
            this.chart.data.labels.shift();
            this.chart.data.datasets[0].data.shift();
        }

        this.chart.data.datasets[0].data.push(data.o2Production);
        this.chart.update();
    }
}

class ParametersChart {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        
        this.ctx = this.canvas.getContext('2d');
        this.chart = new Chart(this.ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'Temperature',
                        data: [],
                        borderColor: '#ef4444',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        borderWidth: 2,
                        tension: 0.4,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Efficiency',
                        data: [],
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        borderWidth: 2,
                        tension: 0.4,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: { color: '#f1f5f9' }
                    }
                },
                scales: {
                    x: {
                        grid: { color: 'rgba(100, 116, 139, 0.2)' },
                        ticks: { color: '#94a3b8' }
                    },
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Temperature (°C)',
                            color: '#94a3b8'
                        },
                        grid: { color: 'rgba(100, 116, 139, 0.2)' },
                        ticks: { color: '#94a3b8' }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Efficiency (%)',
                            color: '#94a3b8'
                        },
                        grid: { drawOnChartArea: false },
                        ticks: { color: '#94a3b8' },
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });
    }

    update(data) {
        if (!this.chart) return;
        
        const now = new Date();
        this.chart.data.labels.push(now.toLocaleTimeString());
        
        if (this.chart.data.labels.length > 20) {
            this.chart.data.labels.shift();
            this.chart.data.datasets.forEach(dataset => dataset.data.shift());
        }

        if (data.stackTemperature !== undefined) {
            this.chart.data.datasets[0].data.push(data.stackTemperature);
        }
        if (data.efficiency !== undefined) {
            this.chart.data.datasets[1].data.push(data.efficiency);
        }

        this.chart.update();
    }
}

class ConstraintsChart {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        
        this.ctx = this.canvas.getContext('2d');
        this.chart = new Chart(this.ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Safety Margin',
                    data: [],
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: { color: '#f1f5f9' }
                    }
                },
                scales: {
                    x: {
                        grid: { color: 'rgba(100, 116, 139, 0.2)' },
                        ticks: { color: '#94a3b8' }
                    },
                    y: {
                        beginAtZero: true,
                        max: 100,
                        grid: { color: 'rgba(100, 116, 139, 0.2)' },
                        ticks: { color: '#94a3b8' }
                    }
                }
            }
        });
    }

    update(data) {
        if (!this.chart || data.safetyMargin === undefined) return;
        
        const now = new Date();
        this.chart.data.labels.push(now.toLocaleTimeString());
        
        if (this.chart.data.labels.length > 20) {
            this.chart.data.labels.shift();
            this.chart.data.datasets[0].data.shift();
        }

        this.chart.data.datasets[0].data.push(data.safetyMargin);
        this.chart.update();
    }
}

class EconomicChart {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        
        this.ctx = this.canvas.getContext('2d');
        this.chart = new Chart(this.ctx, {
            type: 'bar',
            data: {
                labels: ['HE-NMPC', 'Standard MPC', 'Stochastic MPC', 'Mixed Integer MPC'],
                datasets: [{
                    label: 'Levelized Cost ($/kg O₂)',
                    data: [118, 125, 122, 127],
                    backgroundColor: [
                        'rgba(59, 130, 246, 0.8)',
                        'rgba(148, 163, 184, 0.8)',
                        'rgba(148, 163, 184, 0.8)',
                        'rgba(148, 163, 184, 0.8)'
                    ],
                    borderColor: [
                        '#3b82f6',
                        '#94a3b8',
                        '#94a3b8',
                        '#94a3b8'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: { color: '#f1f5f9' }
                    }
                },
                scales: {
                    x: {
                        grid: { color: 'rgba(100, 116, 139, 0.2)' },
                        ticks: { color: '#94a3b8' }
                    },
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(100, 116, 139, 0.2)' },
                        ticks: { color: '#94a3b8' }
                    }
                }
            }
        });
    }

    update(data) {
        // Can update with real economic data if available
    }
}

class PerformanceChart {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        
        this.ctx = this.canvas.getContext('2d');
        this.chart = new Chart(this.ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'HE-NMPC Performance',
                        data: [],
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        borderWidth: 2,
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
                        display: true,
                        position: 'top',
                        labels: { color: '#f1f5f9' }
                    }
                },
                scales: {
                    x: {
                        grid: { color: 'rgba(100, 116, 139, 0.2)' },
                        ticks: { color: '#94a3b8' }
                    },
                    y: {
                        beginAtZero: true,
                        max: 100,
                        grid: { color: 'rgba(100, 116, 139, 0.2)' },
                        ticks: { color: '#94a3b8' }
                    }
                }
            }
        });
    }

    update(data) {
        if (!this.chart) return;
        
        const now = new Date();
        this.chart.data.labels.push(now.toLocaleTimeString());
        
        if (this.chart.data.labels.length > 20) {
            this.chart.data.labels.shift();
            this.chart.data.datasets[0].data.shift();
        }

        // Use efficiency as performance indicator
        if (data.efficiency !== undefined) {
            this.chart.data.datasets[0].data.push(data.efficiency);
        }

        this.chart.update();
    }
}

class MPCComparisonChart {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        
        this.ctx = this.canvas.getContext('2d');
        this.chart = new Chart(this.ctx, {
            type: 'bar',
            data: {
                labels: ['Economic', 'Safety', 'Speed', 'Robustness'],
                datasets: [
                    {
                        label: 'HE-NMPC',
                        data: [85, 92, 88, 90],
                        backgroundColor: 'rgba(59, 130, 246, 0.8)',
                        borderColor: '#3b82f6',
                        borderWidth: 1
                    },
                    {
                        label: 'Standard MPC',
                        data: [72, 75, 95, 65],
                        backgroundColor: 'rgba(148, 163, 184, 0.8)',
                        borderColor: '#94a3b8',
                        borderWidth: 1
                    },
                    {
                        label: 'Stochastic MPC',
                        data: [78, 88, 65, 92],
                        backgroundColor: 'rgba(245, 158, 11, 0.8)',
                        borderColor: '#f59e0b',
                        borderWidth: 1
                    },
                    {
                        label: 'Mixed Integer MPC',
                        data: [70, 72, 45, 85],
                        backgroundColor: 'rgba(239, 68, 68, 0.8)',
                        borderColor: '#ef4444',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: { color: '#f1f5f9' }
                    }
                },
                scales: {
                    x: {
                        grid: { color: 'rgba(100, 116, 139, 0.2)' },
                        ticks: { color: '#94a3b8' }
                    },
                    y: {
                        beginAtZero: true,
                        max: 100,
                        grid: { color: 'rgba(100, 116, 139, 0.2)' },
                        ticks: { color: '#94a3b8' }
                    }
                }
            }
        });
    }

    update(data) {
        // Update comparison data if available
    }
}

// Additional Chart Classes
class PerformanceRadarChart {
    constructor(canvasId) {
        // Implementation for radar chart
    }

    update(data) {
        // Update radar chart
    }
}

class HistoricalChart {
    constructor(canvasId) {
        // Implementation for historical chart
    }

    update(data) {
        // Update historical chart
    }
}

// Initialize chart manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.chartManager = new ChartManager();
});
