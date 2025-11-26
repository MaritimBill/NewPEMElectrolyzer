// charts.js - Professional Chart Management for PEM Electrolyzer
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
            } else {
                console.error('Failed to initialize charts after retries:', error);
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

    destroyAllCharts() {
        this.charts.forEach((chart, chartId) => {
            if (chart && typeof chart.destroy === 'function') {
                try {
                    chart.destroy();
                } catch (error) {
                    console.warn(`Error destroying chart ${chartId}:`, error);
                }
            }
        });
        this.charts.clear();
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
                            text: 'Production Trends - Awaiting Simulation Data',
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
                            text: 'System Parameters - Awaiting Simulation Data',
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

    createSafetyChart() {
        const canvas = document.getElementById('safetyChart');
        if (!canvas) {
            console.log('Safety chart canvas not available yet');
            return;
        }

        // Don't initialize if canvas is hidden
        const style = window.getComputedStyle(canvas);
        if (style.display === 'none' || canvas.offsetWidth === 0 || canvas.offsetHeight === 0) {
            console.log('Safety chart canvas is hidden, will initialize when tab is activated');
            return;
        }

        const existingChart = Chart.getChart(canvas);
        if (existingChart) existingChart.destroy();

        const ctx = canvas.getContext('2d');
        try {
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
        } catch (error) {
            console.error('Error creating safety chart:', error);
        }
    }

    createEconomicChart() {
        const canvas = document.getElementById('economicChart');
        if (!canvas) return;

        const existingChart = Chart.getChart(canvas);
        if (existingChart) existingChart.destroy();

        const ctx = canvas.getContext('2d');
        const chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Energy Cost', 'H₂ Cost', 'Op Cost', 'Revenue', 'Profit'],
                datasets: [{
                    label: 'Economic Metrics',
                    data: [],
                    backgroundColor: [
                        this.hexToRgba('#ef4444', 0.8),
                        this.hexToRgba('#f59e0b', 0.8),
                        this.hexToRgba('#8b5cf6', 0.8),
                        this.hexToRgba('#10b981', 0.8),
                        this.hexToRgba('#3b82f6', 0.8)
                    ],
                    borderColor: [
                        '#ef4444', '#f59e0b', '#8b5cf6', '#10b981', '#3b82f6'
                    ],
                    borderWidth: 2,
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    title: {
                        display: true,
                        text: 'Economic Analysis - Awaiting Simulation Data',
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
                            text: 'Cost/Revenue ($/hr)',
                            color: '#9ca3af'
                        },
                        beginAtZero: true
                    }
                }
            }
        });

        this.charts.set('economicChart', chart);
    }

    createPerformanceChart() {
        const canvas = document.getElementById('performanceChart');
        if (!canvas) {
            console.error('Performance chart canvas not found');
            return;
        }

        const existingChart = Chart.getChart(canvas);
        if (existingChart) existingChart.destroy();

        const ctx = canvas.getContext('2d');
        try {
            const chart = new Chart(ctx, {
                type: 'radar',
                data: {
                    labels: [
                        'Tracking Accuracy', 
                        'Response Speed', 
                        'Energy Efficiency',
                        'Constraint Handling', 
                        'Robustness',
                        'Computational Speed'
                    ],
                    datasets: [
                        {
                            label: 'HE-NMPC (Hybrid Evolutionary)',
                            data: [], // EMPTY - waiting for real MPC comparison data
                            borderColor: '#3b82f6',
                            backgroundColor: this.hexToRgba('#3b82f6', 0.3),
                            borderWidth: 3,
                            pointBackgroundColor: '#3b82f6',
                            pointBorderColor: '#ffffff',
                            pointBorderWidth: 2,
                            pointRadius: 4
                        },
                        {
                            label: 'Traditional MPC',
                            data: [], // EMPTY - waiting for real MPC comparison data
                            borderColor: '#ef4444',
                            backgroundColor: this.hexToRgba('#ef4444', 0.3),
                            borderWidth: 3,
                            pointBackgroundColor: '#ef4444',
                            pointBorderColor: '#ffffff',
                            pointBorderWidth: 2,
                            pointRadius: 4
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
                            text: 'MPC Performance Comparison - Awaiting Simulation Data',
                            color: '#f9fafb',
                            font: { size: 16, weight: 'bold' }
                        }
                    },
                    scales: {
                        r: {
                            angleLines: { color: '#374151' },
                            grid: { color: '#374151' },
                            pointLabels: { 
                                color: '#9ca3af',
                                font: { size: 11 }
                            },
                            ticks: { 
                                color: '#9ca3af',
                                backdropColor: 'transparent',
                                stepSize: 20
                            },
                            beginAtZero: true,
                            suggestedMin: 0,
                            suggestedMax: 100
                        }
                    },
                    elements: {
                        line: {
                            borderWidth: 3
                        }
                    }
                }
            });

            this.charts.set('performanceChart', chart);
        } catch (error) {
            console.error('Error creating performance chart:', error);
        }
    }

    createTrendsChart() {
        const canvas = document.getElementById('trendsChart');
        if (!canvas) return;

        const existingChart = Chart.getChart(canvas);
        if (existingChart) existingChart.destroy();

        const ctx = canvas.getContext('2d');
        const chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: this.generateTimeLabels(10),
                datasets: [
                    {
                        label: 'HE-NMPC Efficiency',
                        data: [],
                        borderColor: '#3b82f6',
                        backgroundColor: this.hexToRgba('#3b82f6', 0.1),
                        borderWidth: 3,
                        tension: 0.4,
                        fill: false
                    },
                    {
                        label: 'Traditional MPC Efficiency',
                        data: [],
                        borderColor: '#ef4444',
                        backgroundColor: this.hexToRgba('#ef4444', 0.1),
                        borderWidth: 3,
                        tension: 0.4,
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
                        labels: { color: '#e5e7eb' }
                    },
                    title: {
                        display: true,
                        text: 'Efficiency Trends - Awaiting Simulation Data',
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
                            text: 'Efficiency (%)',
                            color: '#9ca3af'
                        },
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });

        this.charts.set('trendsChart', chart);
    }

    createSimulinkChart() {
        const canvas = document.getElementById('simulinkChart');
        if (!canvas) return;

        const existingChart = Chart.getChart(canvas);
        if (existingChart) existingChart.destroy();

        const ctx = canvas.getContext('2d');
        const chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: this.generateTimeLabels(10),
                datasets: [
                    {
                        label: 'Simulink O₂ Production',
                        data: [],
                        borderColor: '#3b82f6',
                        backgroundColor: this.hexToRgba('#3b82f6', 0.1),
                        borderWidth: 2,
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'Real System O₂ Production',
                        data: [],
                        borderColor: '#10b981',
                        backgroundColor: this.hexToRgba('#10b981', 0.1),
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
                        text: 'Simulink vs Real System - Awaiting Simulation Data',
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
                            text: 'Production Rate (L/min)',
                            color: '#9ca3af'
                        },
                        beginAtZero: true
                    }
                }
            }
        });

        this.charts.set('simulinkChart', chart);
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

    resizeCharts() {
        this.charts.forEach((chart, chartId) => {
            if (chart && typeof chart.resize === 'function') {
                try {
                    // Only resize if canvas is visible and has dimensions
                    const canvas = chart.canvas;
                    if (canvas && canvas.offsetWidth > 0 && canvas.offsetHeight > 0) {
                        chart.resize();
                    }
                } catch (error) {
                    console.warn(`Could not resize chart ${chartId}:`, error);
                }
            }
        });
    }

    updateCharts(data) {
        if (!data) {
            console.warn('No data provided to update charts');
            return;
        }
        
        this.updateMiniCharts(data);
        this.updateMainCharts(data);
        this.updateAnalyticsCharts(data);
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
            productionChart.options.plugins.title.text = 'Production Trends (Live Simulation)';
            productionChart.update('none');
        }

        // Update parameters chart with real data
        const parametersChart = this.charts.get('parametersChart');
        if (parametersChart && data.voltage !== undefined) {
            this.updateParametersChart(data);
            
            // Update chart title to show data is live
            parametersChart.options.plugins.title.text = 'System Parameters (Live Simulation)';
            parametersChart.update('none');
        }
    }

    updateAnalyticsCharts(data) {
        // Update safety chart
        const safetyChart = this.charts.get('safetyChart');
        if (safetyChart && data.safetyMargin !== undefined) {
            this.shiftAnalyticsData(safetyChart, data.temperatureMargin || data.safetyMargin, data.pressureMargin || data.safetyMargin * 0.8);
            safetyChart.options.plugins.title.text = 'Safety Margins (Live Simulation)';
            safetyChart.update('none');
        }

        // Update trends chart
        const trendsChart = this.charts.get('trendsChart');
        if (trendsChart && data.efficiency !== undefined) {
            this.shiftTrendsData(trendsChart, data.efficiency, data.efficiency * 0.85);
            trendsChart.options.plugins.title.text = 'Efficiency Trends (Live Simulation)';
            trendsChart.update('none');
        }

        // Update simulink chart
        const simulinkChart = this.charts.get('simulinkChart');
        if (simulinkChart && data.o2Production !== undefined) {
            this.shiftSimulinkData(simulinkChart, data.o2Production, data.o2Production * 1.1);
            simulinkChart.options.plugins.title.text = 'Simulink vs Real System (Live Simulation)';
            simulinkChart.update('none');
        }

        // Update economic chart
        const economicChart = this.charts.get('economicChart');
        if (economicChart && data.powerConsumption !== undefined) {
            this.updateEconomicChart(economicChart, data);
            economicChart.options.plugins.title.text = 'Economic Analysis (Live Simulation)';
            economicChart.update('none');
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

    shiftAnalyticsData(chart, tempMargin, pressureMargin) {
        if (chart.data.datasets[0] && chart.data.datasets[1]) {
            chart.data.datasets[0].data.push(tempMargin);
            chart.data.datasets[1].data.push(pressureMargin);
            
            if (chart.data.datasets[0].data.length > 8) {
                chart.data.datasets[0].data.shift();
                chart.data.datasets[1].data.shift();
            }
            
            chart.data.labels = this.generateTimeLabels(chart.data.datasets[0].data.length);
            chart.update('none');
        }
    }

    shiftTrendsData(chart, heNmpcEfficiency, traditionalEfficiency) {
        if (chart.data.datasets[0] && chart.data.datasets[1]) {
            chart.data.datasets[0].data.push(heNmpcEfficiency);
            chart.data.datasets[1].data.push(traditionalEfficiency);
            
            if (chart.data.datasets[0].data.length > 10) {
                chart.data.datasets[0].data.shift();
                chart.data.datasets[1].data.shift();
            }
            
            chart.data.labels = this.generateTimeLabels(chart.data.datasets[0].data.length);
            chart.update('none');
        }
    }

    shiftSimulinkData(chart, simulinkValue, realValue) {
        if (chart.data.datasets[0] && chart.data.datasets[1]) {
            chart.data.datasets[0].data.push(simulinkValue);
            chart.data.datasets[1].data.push(realValue);
            
            if (chart.data.datasets[0].data.length > 10) {
                chart.data.datasets[0].data.shift();
                chart.data.datasets[1].data.shift();
            }
            
            chart.data.labels = this.generateTimeLabels(chart.data.datasets[0].data.length);
            chart.update('none');
        }
    }

    updateParametersChart(data) {
        const chart = this.charts.get('parametersChart');
        if (chart && chart.data.datasets[0]) {
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

    updateEconomicChart(chart, data) {
        if (chart.data.datasets[0]) {
            // Calculate economic metrics based on real data
            const energyCost = (data.powerConsumption || 0) * 0.12; // $0.12/kWh
            const h2Cost = (data.o2Production || 0) * 0.15; // $0.15/L O2 equivalent
            const opCost = energyCost + h2Cost + 25; // Fixed costs
            const revenue = (data.o2Production || 0) * 2.5; // $2.5/L O2
            const profit = revenue - opCost;
            
            chart.data.datasets[0].data = [energyCost, h2Cost, opCost, revenue, profit];
            chart.update('none');
        }
    }

    updatePerformanceChart(heNmpcData, traditionalMpcData) {
        const performanceChart = this.charts.get('performanceChart');
        if (!performanceChart) return;

        // Only update if we have real MPC comparison data
        if (heNmpcData && traditionalMpcData && 
            Array.isArray(heNmpcData) && Array.isArray(traditionalMpcData) &&
            heNmpcData.length === 6 && traditionalMpcData.length === 6) {
            
            performanceChart.data.datasets[0].data = heNmpcData;
            performanceChart.data.datasets[1].data = traditionalMpcData;
            performanceChart.options.plugins.title.text = 'MPC Performance Comparison (Live Simulation)';
            performanceChart.update('none');
            
            console.log('MPC Performance chart updated with real comparison data');
        } else {
            console.warn('Invalid MPC comparison data format received');
        }
    }

    updateAllChartsWithSimulationData(simulationData) {
        if (!simulationData) {
            console.log('No simulation data received');
            return;
        }

        console.log('Updating all charts with simulation data:', simulationData);

        try {
            // Update main production charts
            if (simulationData.o2Production !== undefined) {
                this.updateProductionData(simulationData);
            }

            // Update parameters chart - FIXED METHOD NAME
            if (simulationData.voltage !== undefined) {
                this.updateParametersChart(simulationData);
            }

            // Update mini charts
            this.updateMiniCharts(simulationData);

            // Update MPC performance comparison if we have the data
            if (simulationData.mpcComparison) {
                this.updatePerformanceChart(
                    simulationData.mpcComparison.heNmpc,
                    simulationData.mpcComparison.traditional
                );
            }

            // Update safety margins
            if (simulationData.safetyMetrics) {
                this.updateSafetyData(simulationData.safetyMetrics);
            }

            // Update economic data
            if (simulationData.economicMetrics) {
                this.updateEconomicData(simulationData.economicMetrics);
            }
        } catch (error) {
            console.error('Error updating charts with simulation data:', error);
        }
    }

    updateProductionData(data) {
        const productionChart = this.charts.get('productionChart');
        if (productionChart) {
            this.shiftChartData(productionChart, data.o2Production, data.h2Production || data.o2Production * 2);
            productionChart.options.plugins.title.text = 'Production Trends (Live Simulation)';
            productionChart.update('none');
        }
    }

    updateSafetyData(safetyData) {
        const safetyChart = this.charts.get('safetyChart');
        if (safetyChart) {
            this.shiftAnalyticsData(
                safetyChart, 
                safetyData.temperatureMargin || 0,
                safetyData.pressureMargin || 0
            );
            safetyChart.options.plugins.title.text = 'Safety Margins (Live Simulation)';
            safetyChart.update('none');
        }

        const trendsChart = this.charts.get('trendsChart');
        if (trendsChart && safetyData.efficiency !== undefined) {
            this.shiftTrendsData(
                trendsChart,
                safetyData.efficiency,
                safetyData.traditionalEfficiency || safetyData.efficiency * 0.85
            );
            trendsChart.options.plugins.title.text = 'Efficiency Trends (Live Simulation)';
            trendsChart.update('none');
        }
    }

    updateEconomicData(economicData) {
        const economicChart = this.charts.get('economicChart');
        if (economicChart) {
            economicChart.data.datasets[0].data = [
                economicData.energyCost || 0,
                economicData.h2Cost || 0,
                economicData.operatingCost || 0,
                economicData.revenue || 0,
                economicData.profit || 0
            ];
            economicChart.options.plugins.title.text = 'Economic Analysis (Live Simulation)';
            economicChart.update('none');
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

    // Method to clear all chart data
    clearAllChartData() {
        this.charts.forEach((chart, chartId) => {
            if (chart && chart.data) {
                // Clear all datasets
                chart.data.datasets.forEach(dataset => {
                    dataset.data = [];
                });
                
                // Reset titles to "awaiting data"
                if (chart.options.plugins.title) {
                    chart.options.plugins.title.text = chart.options.plugins.title.text.replace('(Live Simulation)', '- Awaiting Simulation Data');
                }
                
                chart.update('none');
            }
        });
        
        console.log('All chart data cleared - waiting for new simulation data');
    }
    // In charts.js - Add MPC results handling
updateMPCResults(mpcResults) {
    // Update comparison charts with REAL data
    const performanceData = mpcResults.controller_performance;
    
    // Update bar charts
    this.updateMPCComparisonChart(performanceData);
    
    // Update trend charts
    this.updateMPCTrends(performanceData);
    
    // Update radar charts
    this.updateMPCRadar(performanceData);
}

updateMPCComparisonChart(performanceData) {
    const ctx = document.getElementById('mpcComparisonChart');
    if (!ctx) return;
    
    const controllers = Object.keys(performanceData);
    const efficiencies = controllers.map(name => performanceData[name].efficiency);
    const responseTimes = controllers.map(name => performanceData[name].response_time);
    const costs = controllers.map(name => performanceData[name].control_cost);
    
    // Update chart data with REAL values
    this.charts.mpcComparison.data.datasets[0].data = efficiencies;
    this.charts.mpcComparison.data.datasets[1].data = responseTimes;
    this.charts.mpcComparison.data.datasets[2].data = costs;
    this.charts.mpcComparison.update();
}
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
