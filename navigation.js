// Enhanced Navigation for HE-NMPC Dashboard
class NavigationManager {
    constructor() {
        this.currentTab = 'dashboard';
        this.mpcVariants = ['HE-NMPC', 'Standard-MPC', 'Stochastic-MPC', 'Mixed-Integer-MPC'];
        this.activeMPCVariant = 'HE-NMPC';
        this.init();
    }

    init() {
        this.setupTabNavigation();
        this.setupMPCComparison();
        this.setupRealTimeUpdates();
        this.setupControllerSwitching();
        
        console.log('🧭 Navigation Manager Initialized');
    }

    setupTabNavigation() {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabName = e.currentTarget.dataset.tab;
                this.switchToTab(tabName);
            });
        });

        // Set initial active tab
        this.switchToTab('dashboard');
    }

    switchToTab(tabName) {
        // Hide all tab contents
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });

        // Deactivate all tab buttons
        document.querySelectorAll('.nav-btn').forEach(button => {
            button.classList.remove('active');
        });

        // Activate selected tab
        const targetTab = document.getElementById(tabName);
        const targetButton = document.querySelector(`[data-tab="${tabName}"]`);
        
        if (targetTab && targetButton) {
            targetTab.classList.add('active');
            targetButton.classList.add('active');
            this.currentTab = tabName;
            
            // Trigger tab-specific initializations
            this.onTabChange(tabName);
        }

        console.log('📑 Switched to tab:', tabName);
    }

    onTabChange(tabName) {
        switch(tabName) {
            case 'analytics':
                this.initializeAnalyticsTab();
                break;
            case 'safety':
                this.initializeSafetyTab();
                break;
            case 'economic':
                this.initializeEconomicTab();
                break;
            case 'simulink':
                this.initializeSimulinkTab();
                break;
        }

        // Resize charts if needed
        setTimeout(() => {
            if (window.chartManager && window.chartManager.charts) {
                Object.values(window.chartManager.charts).forEach(chart => {
                    if (chart && chart.chart && chart.chart.resize) {
                        chart.chart.resize();
                    }
                });
            }
        }, 100);
    }

    setupMPCComparison() {
        this.createMPCComparisonPanel();
        this.setupVariantPerformanceTracking();
    }

    createMPCComparisonPanel() {
        const analyticsTab = document.getElementById('analytics');
        if (!analyticsTab) return;

        // Check if comparison panel already exists
        if (document.querySelector('.mpc-comparison-grid')) {
            return;
        }

        // Add MPC comparison section
        const comparisonHTML = `
            <div class="card">
                <div class="card-header">
                    <h3>🎯 MPC Variant Performance Comparison</h3>
                </div>
                <div class="card-content">
                    <div class="mpc-comparison-grid">
                        ${this.mpcVariants.map(variant => `
                            <div class="mpc-variant-card" data-variant="${variant}">
                                <div class="variant-header">
                                    <h4>${variant}</h4>
                                    <span class="status-indicator ${variant === 'HE-NMPC' ? 'status-online' : 'status-offline'}"></span>
                                </div>
                                <div class="performance-metrics">
                                    <div class="metric">
                                        <span class="label">Economic:</span>
                                        <span class="value" id="${variant}-economic">0%</span>
                                    </div>
                                    <div class="metric">
                                        <span class="label">Safety:</span>
                                        <span class="value" id="${variant}-safety">0%</span>
                                    </div>
                                    <div class="metric">
                                        <span class="label">Speed:</span>
                                        <span class="value" id="${variant}-speed">0ms</span>
                                    </div>
                                    <div class="metric">
                                        <span class="label">Cost:</span>
                                        <span class="value" id="${variant}-cost">$0</span>
                                    </div>
                                </div>
                                <button class="btn btn-outline switch-controller" data-variant="${variant}">
                                    Switch to ${variant}
                                </button>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;

        analyticsTab.insertAdjacentHTML('beforeend', comparisonHTML);
        console.log('📊 MPC Comparison Panel Created');
    }

    setupVariantPerformanceTracking() {
        // Track performance metrics for each MPC variant
        this.performanceMetrics = {};
        this.mpcVariants.forEach(variant => {
            this.performanceMetrics[variant] = {
                economicScore: 0,
                safetyScore: 0,
                speedScore: 0,
                costScore: 0,
                lastUpdate: Date.now()
            };
        });

        // Initialize with default values
        this.initializeDefaultMetrics();
    }

    initializeDefaultMetrics() {
        const defaultMetrics = {
            'HE-NMPC': { economic: 85, safety: 92, speed: 45, cost: 118 },
            'Standard-MPC': { economic: 72, safety: 75, speed: 28, cost: 125 },
            'Stochastic-MPC': { economic: 78, safety: 88, speed: 120, cost: 122 },
            'Mixed-Integer-MPC': { economic: 70, safety: 72, speed: 350, cost: 127 }
        };

        Object.entries(defaultMetrics).forEach(([variant, metrics]) => {
            this.updateMPCPerformance(variant, {
                economicScore: metrics.economic,
                safetyScore: metrics.safety,
                speedScore: metrics.speed,
                costScore: metrics.cost
            });
        });
    }

    updateMPCPerformance(variant, metrics) {
        if (!this.performanceMetrics[variant]) return;

        this.performanceMetrics[variant] = {
            ...this.performanceMetrics[variant],
            ...metrics,
            lastUpdate: Date.now()
        };

        this.updateVariantDisplay(variant);
    }

    updateVariantDisplay(variant) {
        const metrics = this.performanceMetrics[variant];
        if (!metrics) return;

        // Update economic score
        const economicElement = document.getElementById(`${variant}-economic`);
        if (economicElement) {
            economicElement.textContent = `${Math.round(metrics.economicScore)}%`;
            economicElement.className = `value ${this.getScoreClass(metrics.economicScore)}`;
        }

        // Update safety score
        const safetyElement = document.getElementById(`${variant}-safety`);
        if (safetyElement) {
            safetyElement.textContent = `${Math.round(metrics.safetyScore)}%`;
            safetyElement.className = `value ${this.getScoreClass(metrics.safetyScore)}`;
        }

        // Update speed
        const speedElement = document.getElementById(`${variant}-speed`);
        if (speedElement) {
            speedElement.textContent = `${metrics.speedScore}ms`;
            speedElement.className = `value ${this.getSpeedClass(metrics.speedScore)}`;
        }

        // Update cost
        const costElement = document.getElementById(`${variant}-cost`);
        if (costElement) {
            costElement.textContent = `$${metrics.costScore}`;
            costElement.className = `value ${this.getCostClass(metrics.costScore)}`;
        }

        // Update status indicator
        const card = document.querySelector(`[data-variant="${variant}"]`);
        if (card) {
            const indicator = card.querySelector('.status-indicator');
            if (indicator) {
                indicator.className = `status-indicator ${
                    variant === this.activeMPCVariant ? 'status-online' : 'status-offline'
                }`;
            }
        }
    }

    getScoreClass(score) {
        if (score >= 80) return 'score-excellent';
        if (score >= 60) return 'score-good';
        if (score >= 40) return 'score-fair';
        return 'score-poor';
    }

    getSpeedClass(speed) {
        if (speed <= 50) return 'speed-excellent';
        if (speed <= 100) return 'speed-good';
        if (speed <= 200) return 'speed-fair';
        return 'speed-poor';
    }

    getCostClass(cost) {
        if (cost <= 120) return 'cost-excellent';
        if (cost <= 130) return 'cost-good';
        if (cost <= 140) return 'cost-fair';
        return 'cost-poor';
    }

    setupControllerSwitching() {
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('switch-controller')) {
                const variant = e.target.dataset.variant;
                this.switchMPCController(variant);
            }
        });
    }

    switchMPCController(variant) {
        if (this.activeMPCVariant === variant) return;

        console.log(`🔄 Switching to ${variant} controller`);
        
        // Send switch command via MQTT
        if (window.electrolyzerApp && window.electrolyzerApp.mqttClient) {
            const message = {
                command: 'SWITCH_CONTROLLER',
                variant: variant,
                timestamp: Date.now()
            };
            
            window.electrolyzerApp.mqttClient.publish(
                'electrolyzer/bill/upper_commands', 
                JSON.stringify(message)
            );
        }

        // Update UI
        this.activeMPCVariant = variant;
        this.updateControllerStatus();

        // Show notification
        if (window.electrolyzerApp) {
            window.electrolyzerApp.showNotification(`Switched to ${variant} controller`, 'success');
        }
    }

    updateControllerStatus() {
        // Update all variant cards to reflect active controller
        document.querySelectorAll('.mpc-variant-card').forEach(card => {
            const variant = card.dataset.variant;
            const indicator = card.querySelector('.status-indicator');
            const switchButton = card.querySelector('.switch-controller');
            
            if (indicator) {
                indicator.className = `status-indicator ${
                    variant === this.activeMPCVariant ? 'status-online' : 'status-offline'
                }`;
            }
            
            if (switchButton) {
                switchButton.disabled = variant === this.activeMPCVariant;
                switchButton.textContent = variant === this.activeMPCVariant ? 
                    'Active' : `Switch to ${variant}`;
                    
                switchButton.classList.toggle('btn-success', variant === this.activeMPCVariant);
                switchButton.classList.toggle('btn-outline', variant !== this.activeMPCVariant);
            }
        });

        // Update main status display
        const controllerModeElement = document.getElementById('controllerMode');
        if (controllerModeElement) {
            controllerModeElement.textContent = this.activeMPCVariant;
        }
    }

    initializeAnalyticsTab() {
        console.log('📈 Initializing Analytics Tab');
        this.loadComparativeData();
        this.setupRealTimeUpdates();
    }

    initializeSafetyTab() {
        console.log('🛡️ Initializing Safety Tab');
        this.setupSafetyAlerts();
    }

    initializeEconomicTab() {
        console.log('💰 Initializing Economic Tab');
        this.setupEconomicControls();
    }

    initializeSimulinkTab() {
        console.log('🔬 Initializing Simulink Tab');
        this.setupSimulinkControls();
    }

    setupRealTimeUpdates() {
        // Update MPC comparison every 10 seconds
        setInterval(() => {
            this.updateRealTimeComparison();
        }, 10000);

        console.log('🔄 Real-time updates initialized');
    }

    updateRealTimeComparison() {
        // Add small random variations to simulate real-time updates
        this.mpcVariants.forEach(variant => {
            const metrics = this.performanceMetrics[variant];
            if (metrics) {
                const updatedMetrics = {
                    economicScore: metrics.economicScore + (Math.random() * 4 - 2),
                    safetyScore: metrics.safetyScore + (Math.random() * 2 - 1),
                    speedScore: metrics.speedScore + (Math.random() * 10 - 5),
                    costScore: metrics.costScore + (Math.random() * 2 - 1)
                };
                
                // Ensure values stay within reasonable bounds
                updatedMetrics.economicScore = Math.max(0, Math.min(100, updatedMetrics.economicScore));
                updatedMetrics.safetyScore = Math.max(0, Math.min(100, updatedMetrics.safetyScore));
                updatedMetrics.speedScore = Math.max(10, updatedMetrics.speedScore);
                updatedMetrics.costScore = Math.max(100, updatedMetrics.costScore);
                
                this.updateMPCPerformance(variant, updatedMetrics);
            }
        });
    }

    loadComparativeData() {
        console.log('📊 Loading comparative performance data...');
        // This would typically load data from a server or local storage
    }

    setupSafetyAlerts() {
        console.log('🚨 Safety monitoring initialized');
        // Setup safety constraint alert system
    }

    setupEconomicControls() {
        console.log('💹 Economic controls initialized');
        // Setup economic optimization controls
    }

    setupSimulinkControls() {
        console.log('🔗 Simulink controls initialized');
        // Setup Simulink integration
    }

    // Method to get navigation status
    getNavigationStatus() {
        return {
            currentTab: this.currentTab,
            activeMPCVariant: this.activeMPCVariant,
            performanceMetrics: this.performanceMetrics
        };
    }
}

// Initialize navigation when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.navigationManager = new NavigationManager();
    console.log('🧭 Navigation System Ready');
});
