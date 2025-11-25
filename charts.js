// charts.js - Fixed Canvas Detection
class ChartManager {
    constructor() {
        this.charts = new Map();
        this.dataHistory = [];
        this.maxHistory = 100;
        this.initializationAttempts = 0;
        this.maxInitializationAttempts = 10;
        
        this.initWithRetry();
    }

    initWithRetry(retryCount = 0) {
        try {
            this.initAllCharts();
            console.log('Charts initialized successfully - waiting for real simulation data');
        } catch (error) {
            console.warn('Chart initialization failed, retrying...', error);
            if (retryCount < 3) {
                setTimeout(() => this.initWithRetry(retryCount + 1), 500);
            }
        }
    }

    initAllCharts() {
        this.destroyAllCharts();
        
        // Wait for DOM to be ready and canvases to be available
        if (!this.areEssentialCanvasesReady()) {
            this.initializationAttempts++;
            
            if (this.initializationAttempts < this.maxInitializationAttempts) {
                console.log(`Canvas initialization attempt ${this.initializationAttempts}/${this.maxInitializationAttempts}`);
                setTimeout(() => this.initAllCharts(), 200);
                return;
            } else {
                console.warn('Max initialization attempts reached, initializing available charts');
            }
        }
        
        this.initializationAttempts = 0;
        this.initAvailableCharts();
    }

    areEssentialCanvasesReady() {
        // Only check for essential canvases that should always be available
        const essentialCanvases = [
            'productionMiniChart', 'efficiencyMiniChart', 
            'safetyMiniChart', 'temperatureMiniChart',
            'productionChart', 'parametersChart'
        ];
        
        const ready = essentialCanvases.every(id => {
            const canvas = document.getElementById(id);
            return canvas !== null;
        });
        
        return ready;
    }

    initAvailableCharts() {
        console.log('Initializing available charts...');
        
        // Initialize mini charts (always in dashboard)
        this.initMiniCharts();
        
        // Initialize main charts (always in dashboard)
        this.initMainCharts();
        
        // Try to initialize comparison charts (might be in hidden tabs)
        this.initComparisonCharts();
        
        console.log('Available charts initialized:', this.charts.size);
    }

    initComparisonCharts() {
        // These charts might be in hidden tabs, so we try to create them
        // but don't fail if canvases aren't available yet
        
        const comparisonCharts = [
            { method: 'createSafetyChart', id: 'safetyChart' },
            { method: 'createEconomicChart', id: 'economicChart' },
            { method: 'createPerformanceChart', id: 'performanceChart' },
            { method: 'createTrendsChart', id: 'trendsChart' },
            { method: 'createSimulinkChart', id: 'simulinkChart' }
        ];

        comparisonCharts.forEach(chartConfig => {
            const canvas = document.getElementById(chartConfig.id);
            if (canvas) {
                this[chartConfig.method]();
            } else {
                console.log(`Canvas ${chartConfig.id} not found yet (might be in hidden tab)`);
            }
        });
    }

    // Override the safety chart creation to handle hidden tab case
    createSafetyChart() {
        const canvas = document.getElementById('safetyChart');
        if (!canvas) {
            console.log('Safety chart canvas not available yet');
            return;
        }

        // Check if canvas is actually visible and has dimensions
        if (canvas.offsetWidth === 0 || canvas.offsetHeight === 0) {
            console.log('Safety chart canvas has zero dimensions (likely hidden), delaying initialization');
            setTimeout(() => this.createSafetyChart(), 500);
            return;
        }

        const existingChart = Chart.getChart(canvas);
        if (existingChart) existingChart.destroy();

        const ctx = canvas.getContext('2d');
        const chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: this.generateTimeLabels(8),
                datasets: [
                    {
                        label: 'Temperature Margin',
                        data: [],
                        borderColor: '#ef4444',
                        backgroundColor: this.hexToRgba('#ef4444', 0.1),
                        borderWidth: 2,
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'Pressure Margin',
                        data: [],
                        borderColor: '#f59e0b',
                        backgroundColor: this.hexToRgba('#f59e0b', 0.1),
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
                        position: 'top',
                        labels: { color: '#e5e7eb' }
                    },
                    title: {
                        display: true,
                        text: 'Safety Margins - Awaiting Simulation Data',
                        color: '#f9fafb'
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
                            text: 'Safety Margin (%)',
                            color: '#9ca3af'
                        },
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });

        this.charts.set('safetyChart', chart);
        console.log('Safety chart initialized successfully');
    }

    // Add method to initialize charts when tab becomes visible
    initializeTabCharts(tabName) {
        console.log(`Initializing charts for tab: ${tabName}`);
        
        switch(tabName) {
            case 'safety':
                if (!this.charts.has('safetyChart')) {
                    this.createSafetyChart();
                }
                break;
            case 'economic':
                if (!this.charts.has('economicChart')) {
                    this.createEconomicChart();
                }
                break;
            case 'analytics':
                if (!this.charts.has('performanceChart')) {
                    this.createPerformanceChart();
                }
                if (!this.charts.has('trendsChart')) {
                    this.createTrendsChart();
                }
                break;
            case 'simulink':
                if (!this.charts.has('simulinkChart')) {
                    this.createSimulinkChart();
                }
                break;
        }
        
        // Resize charts after tab switch
        setTimeout(() => {
            this.resizeCharts();
        }, 100);
    }

    // ... keep all other existing methods the same
}

// Initialize chart manager when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.chartManager = new ChartManager();
    
    // Listen for tab changes to initialize hidden charts
    document.addEventListener('tabChanged', function(event) {
        if (window.chartManager && event.detail && event.detail.tabName) {
            window.chartManager.initializeTabCharts(event.detail.tabName);
        }
    });
});
