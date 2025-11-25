// Add to ChartManager class in charts.js
initComparisonCharts() {
    this.createSafetyChart();
    this.createEconomicChart();
    this.createPerformanceChart();
    this.createSimulinkChart();
}

createSafetyChart() {
    const canvas = document.getElementById('safetyChart');
    if (!canvas) return;

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
                    text: 'Safety Margins - Awaiting Data',
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
                    text: 'Economic Analysis - Awaiting Data',
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

// Similar methods for performanceChart and simulinkChart...
createPerformanceChart() {
    const canvas = document.getElementById('performanceChart');
    if (!canvas) return;

    const existingChart = Chart.getChart(canvas);
    if (existingChart) existingChart.destroy();

    const ctx = canvas.getContext('2d');
    const chart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['Efficiency', 'Safety', 'Cost', 'Reliability', 'Response'],
            datasets: [
                {
                    label: 'HE-NMPC',
                    data: [],
                    borderColor: '#3b82f6',
                    backgroundColor: this.hexToRgba('#3b82f6', 0.2),
                    borderWidth: 2
                },
                {
                    label: 'Traditional MPC',
                    data: [],
                    borderColor: '#ef4444',
                    backgroundColor: this.hexToRgba('#ef4444', 0.2),
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
                    text: 'MPC Performance Comparison - Awaiting Data',
                    color: '#f9fafb'
                }
            },
            scales: {
                r: {
                    angleLines: { color: '#374151' },
                    grid: { color: '#374151' },
                    pointLabels: { color: '#9ca3af' },
                    ticks: { 
                        color: '#9ca3af',
                        backdropColor: 'transparent'
                    },
                    beginAtZero: true,
                    max: 100
                }
            }
        }
    });

    this.charts.set('performanceChart', chart);
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
                    text: 'Simulink vs Real System - Awaiting Data',
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
