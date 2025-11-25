// Advanced Charting System for HE-NMPC with MPC Comparison
class ChartManager {
    constructor() {
        this.charts = {};
        this.performanceHistory = {
            'HE-NMPC': [],
            'Standard-MPC': [], 
            'Stochastic-MPC': [],
            'Mixed-Integer-MPC': []
        };
        this.initAllCharts();
    }

    initAllCharts() {
        this.initGauges();
        this.initComparisonCharts();
        this.initPerformanceCharts();
        this.initEconomicCharts();
    }

    initGauges() {
        // Efficiency Gauge
        this.charts.efficiencyGauge = new EfficiencyGauge('efficiencyGauge');
        
        // Production Gauge  
        this.charts.productionGauge = new ProductionGauge('productionGauge');
        
        // Safety Gauge
        this.charts.safetyGauge = new SafetyGauge('safetyGauge');
    }

    initComparisonCharts() {
        // MPC Variant Performance Comparison
        this.charts.mpcComparison = new MPCComparisonChart('mpcComparisonChart');
        
        // Real-time Performance Radar
        this.charts.performanceRadar = new PerformanceRadarChart('performanceRadar');
    }

    initPerformanceCharts() {
        this.charts.performanceTrends = new PerformanceTrendChart('performanceChart');
        this.charts.constraintsMonitor = new ConstraintsChart('constraintsChart');
        this.charts.economicAnalysis = new EconomicChart('economicChart');
        this.charts.historicalAnalysis = new HistoricalChart('historicalChart');
    }

    initEconomicCharts() {
        this.charts.costComparison = new CostComparisonChart('costComparisonChart');
    }

    updateAllCharts(data) {
        Object.values(this.charts).forEach(chart => {
            if (chart.update) chart.update(data);
        });
    }

    addMPCPerformance(variant, performance) {
        if (!this.performanceHistory[variant]) {
            this.performanceHistory[variant] = [];
        }
        
        this.performanceHistory[variant].push({
            ...performance,
            timestamp: Date.now()
        });

        // Keep only last 100 records per variant
        if (this.performanceHistory[variant].length > 100) {
            this.performanceHistory[variant] = this.performanceHistory[variant].slice(-100);
        }

        // Update comparison charts
        if (this.charts.mpcComparison) {
            this.charts.mpcComparison.updateComparison(this.performanceHistory);
        }
    }
}

// Base Gauge Class
class BaseGauge {
    constructor(canvasId, config) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.config = config;
        this.currentValue = 0;
        this.init();
    }

    init() {
        this.drawGauge();
    }

    drawGauge() {
        const { width, height } = this.canvas;
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) * 0.4;

        // Clear canvas
        this.ctx.clearRect(0, 0, width, height);

        // Draw gauge background
        this.drawGaugeArc(centerX, centerY, radius, 0, 2 * Math.PI, '#f0f0f0');

        // Draw value arc
        const valueAngle = (this.currentValue / 100) * (2 * Math.PI * 0.75);
        this.drawGaugeArc(centerX, centerY, radius, -Math.PI/4, valueAngle - Math.PI/4, this.getValueColor());

        // Draw center value
        this.drawCenterText(centerX, centerY, `${Math.round(this.currentValue)}%`);
    }

    drawGaugeArc(x, y, radius, startAngle, endAngle, color) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, startAngle, endAngle);
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 15;
        this.ctx.lineCap = 'round';
        this.ctx.stroke();
    }

    drawCenterText(x, y, text) {
        this.ctx.fillStyle = '#1e293b';
        this.ctx.font = 'bold 24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(text, x, y);
    }

    getValueColor() {
        if (this.currentValue < 30) return '#ef4444';
        if (this.currentValue < 70) return '#f59e0b';
        return '#10b981';
    }

    update(value) {
        this.currentValue = value;
        this.drawGauge();
    }
}

// Specific Gauge Implementations
class EfficiencyGauge extends BaseGauge {
    constructor(canvasId) {
        super(canvasId, { maxValue: 100 });
    }
}

class ProductionGauge extends BaseGauge {
    constructor(canvasId) {
        super(canvasId, { maxValue: 100 });
    }
}

class SafetyGauge extends BaseGauge {
    constructor(canvasId) {
        super(canvasId, { maxValue: 100 });
    }
    
    getValueColor() {
        if (this.currentValue < 20) return '#ef4444';
        if (this.currentValue < 50) return '#f59e0b';
        return '#10b981';
    }
}

// MPC Comparison Chart
class MPCComparisonChart {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.chart = null;
        this.init();
    }

    init() {
        this.chart = new Chart(this.ctx, {
            type: 'bar',
            data: {
                labels: ['HE-NMPC', 'Standard MPC', 'Stochastic MPC', 'Mixed Integer MPC'],
                datasets: [
                    {
                        label: 'Economic Score',
                        data: [85, 72, 78, 70],
                        backgroundColor: '#10b981'
                    },
                    {
                        label: 'Safety Score', 
                        data: [92, 75, 88, 72],
                        backgroundColor: '#3b82f6'
                    },
                    {
                        label: 'Speed Score',
                        data: [88, 95, 65, 45],
                        backgroundColor: '#f59e0b'
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'MPC Variant Performance Comparison'
                    },
                    legend: {
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });
    }

    updateComparison(performanceHistory) {
        if (!this.chart) return;

        // Calculate average scores for each variant
        const variants = Object.keys(performanceHistory);
        const economicScores = [];
        const safetyScores = [];
        const speedScores = [];

        variants.forEach(variant => {
            const data = performanceHistory[variant];
            if (data.length > 0) {
                const recent = data.slice(-10); // Last 10 readings
                economicScores.push(this.calculateAverage(recent, 'economicScore'));
                safetyScores.push(this.calculateAverage(recent, 'safetyScore'));
                speedScores.push(this.calculateAverage(recent, 'speedScore'));
            } else {
                economicScores.push(0);
                safetyScores.push(0);
                speedScores.push(0);
            }
        });

        this.chart.data.datasets[0].data = economicScores;
        this.chart.data.datasets[1].data = safetyScores;
        this.chart.data.datasets[2].data = speedScores;
        
        this.chart.update();
    }

    calculateAverage(data, field) {
        const sum = data.reduce((acc, entry) => acc + (entry[field] || 0), 0);
        return data.length > 0 ? sum / data.length : 0;
    }
}

// Performance Radar Chart
class PerformanceRadarChart {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.chart = null;
        this.init();
    }

    init() {
        this.chart = new Chart(this.ctx, {
            type: 'radar',
            data: {
                labels: ['Economic', 'Safety', 'Speed', 'Robustness', 'Efficiency', 'Stability'],
                datasets: [
                    {
                        label: 'HE-NMPC',
                        data: [85, 92, 88, 90, 87, 89],
                        backgroundColor: 'rgba(16, 185, 129, 0.2)',
                        borderColor: '#10b981',
                        borderWidth: 2
                    },
                    {
                        label: 'Standard MPC',
                        data: [72, 75, 95, 65, 70, 80],
                        backgroundColor: 'rgba(59, 130, 246, 0.2)',
                        borderColor: '#3b82f6',
                        borderWidth: 2
                    },
                    {
                        label: 'Stochastic MPC',
                        data: [78, 88, 65, 92, 82, 75],
                        backgroundColor: 'rgba(245, 158, 11, 0.2)',
                        borderColor: '#f59e0b',
                        borderWidth: 2
                    },
                    {
                        label: 'Mixed Integer MPC',
                        data: [70, 72, 45, 85, 68, 70],
                        backgroundColor: 'rgba(239, 68, 68, 0.2)',
                        borderColor: '#ef4444',
                        borderWidth: 2
                    }
                ]
            },
            options: {
                responsive: true,
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });
    }

    update(data) {
        // Update with real performance data
        if (data.mpcComparison) {
            this.chart.data.datasets.forEach((dataset, index) => {
                const variant = dataset.label;
                if (data.mpcComparison[variant]) {
                    dataset.data = [
                        data.mpcComparison[variant].economic,
                        data.mpcComparison[variant].safety,
                        data.mpcComparison[variant].speed,
                        data.mpcComparison[variant].robustness,
                        data.mpcComparison[variant].efficiency,
                        data.mpcComparison[variant].stability
                    ];
                }
            });
            this.chart.update();
        }
    }
}

// Performance Trend Chart
class PerformanceTrendChart {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.chart = null;
        this.init();
    }

    init() {
        this.chart = new Chart(this.ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'HE-NMPC Efficiency',
                        data: [],
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        tension: 0.4
                    },
                    {
                        label: 'Standard MPC Efficiency',
                        data: [],
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        tension: 0.4
                    },
                    {
                        label: 'Production Rate',
                        data: [],
                        borderColor: '#f59e0b',
                        backgroundColor: 'rgba(245, 158, 11, 0.1)',
                        tension: 0.4,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            unit: 'minute'
                        }
                    },
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        max: 100
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        max: 100,
                        grid: {
                            drawOnChartArea: false
                        }
                    }
                }
            }
        });
    }

    update(data) {
        const now = new Date();
        
        // Add new data point
        this.chart.data.labels.push(now);
        
        if (this.chart.data.labels.length > 50) {
            this.chart.data.labels.shift();
            this.chart.data.datasets.forEach(dataset => {
                dataset.data.shift();
            });
        }

        // Update datasets
        if (data.efficiency !== undefined) {
            this.chart.data.datasets[0].data.push(data.efficiency);
        }
        if (data.production !== undefined) {
            this.chart.data.datasets[2].data.push(data.production);
        }

        this.chart.update();
    }
}

// Economic Analysis Chart
class EconomicChart {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.chart = null;
        this.init();
    }

    init() {
        this.chart = new Chart(this.ctx, {
            type: 'bar',
            data: {
                labels: ['HE-NMPC', 'Standard', 'Stochastic', 'Mixed Integer'],
                datasets: [
                    {
                        label: 'Levelized Cost ($/kg O₂)',
                        data: [118, 125, 122, 127],
                        backgroundColor: '#ef4444'
                    },
                    {
                        label: 'Oxygen Production (kg/h)',
                        data: [45, 42, 43, 41],
                        backgroundColor: '#10b981',
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Cost ($/kg)'
                        }
                    },
                    y1: {
                        beginAtZero: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Production (kg/h)'
                        },
                        grid: {
                            drawOnChartArea: false
                        }
                    }
                }
            }
        });
    }

    update(data) {
        if (data.levelizedCostOxygen !== undefined) {
            this.chart.data.datasets[0].data[0] = data.levelizedCostOxygen;
        }
        if (data.oxygenAvailability !== undefined) {
            this.chart.data.datasets[1].data[0] = data.oxygenAvailability;
        }
        this.chart.update();
    }
}

// Constraints Monitoring Chart
class ConstraintsChart {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.chart = null;
        this.init();
    }

    init() {
        this.chart = new Chart(this.ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'Temperature Margin',
                        data: [],
                        borderColor: '#ef4444',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)'
                    },
                    {
                        label: 'Purity Margin',
                        data: [],
                        borderColor: '#10b981', 
                        backgroundColor: 'rgba(16, 185, 129, 0.1)'
                    },
                    {
                        label: 'Reserve Margin',
                        data: [],
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)'
                    }
                ]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        title: {
                            display: true,
                            text: 'Safety Margin (%)'
                        }
                    }
                }
            }
        });
    }

    update(data) {
        const now = new Date();
        
        this.chart.data.labels.push(now.toLocaleTimeString());
        
        if (this.chart.data.labels.length > 20) {
            this.chart.data.labels.shift();
            this.chart.data.datasets.forEach(dataset => {
                dataset.data.shift();
            });
        }

        // Update with actual constraint margins
        if (data.safetyMargin !== undefined) {
            this.chart.data.datasets[0].data.push(data.safetyMargin);
        }
        if (data.purity !== undefined) {
            const purityMargin = ((data.purity - 99.5) / 0.5) * 100;
            this.chart.data.datasets[1].data.push(Math.min(100, purityMargin));
        }

        this.chart.update();
    }
}

// Historical Analysis Chart
class HistoricalChart {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.chart = null;
        this.init();
    }

    init() {
        this.chart = new Chart(this.ctx, {
            type: 'line',
            data: {
                labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'],
                datasets: [
                    {
                        label: 'HE-NMPC Performance',
                        data: [82, 85, 88, 87, 86, 84],
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)'
                    },
                    {
                        label: 'Standard MPC Performance', 
                        data: [75, 78, 80, 79, 77, 76],
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)'
                    },
                    {
                        label: 'Power Cost',
                        data: [0.12, 0.10, 0.15, 0.18, 0.16, 0.14],
                        borderColor: '#f59e0b',
                        backgroundColor: 'rgba(245, 158, 11, 0.1)',
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        title: {
                            display: true,
                            text: 'Performance Score'
                        }
                    },
                    y1: {
                        beginAtZero: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Power Cost ($/kWh)'
                        },
                        grid: {
                            drawOnChartArea: false
                        }
                    }
                }
            }
        });
    }

    update(data) {
        // Update with historical performance data
        if (data.historicalPerformance) {
            this.chart.data.datasets[0].data = data.historicalPerformance.heNmpc;
            this.chart.data.datasets[1].data = data.historicalPerformance.standardMpc;
            this.chart.update();
        }
    }
}

// Cost Comparison Chart
class CostComparisonChart {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.chart = null;
        this.init();
    }

    init() {
        this.chart = new Chart(this.ctx, {
            type: 'bar',
            data: {
                labels: ['HE-NMPC', 'Standard MPC', 'Stochastic MPC', 'Mixed Integer MPC'],
                datasets: [
                    {
                        label: 'Capital Cost',
                        data: [85000, 82000, 87000, 89000],
                        backgroundColor: '#3b82f6'
                    },
                    {
                        label: 'Operating Cost',
                        data: [35000, 42000, 38000, 45000],
                        backgroundColor: '#ef4444'
                    },
                    {
                        label: 'Maintenance Cost',
                        data: [12000, 15000, 13000, 16000],
                        backgroundColor: '#f59e0b'
                    },
                    {
                        label: 'Total Cost',
                        data: [132000, 139000, 138000, 150000],
                        backgroundColor: '#10b981',
                        type: 'line',
                        fill: false
                    }
                ]
            },
            options: {
                responsive: true,
                scales: {
                    x: {
                        stacked: true
                    },
                    y: {
                        stacked: true,
                        title: {
                            display: true,
                            text: 'Cost ($)'
                        }
                    }
                }
            }
        });
    }
}