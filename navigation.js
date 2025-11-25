// Enhanced Navigation with MPC Comparison Features
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
    }

    setupTabNavigation() {
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
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
        document.querySelectorAll('.nav-tab').forEach(button => {
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
            if (window.chartManager) {
                Object.values(window.chartManager.charts).forEach(chart => {
                    if (chart.chart && chart.chart.resize) {
                        chart.chart.resize();
                    }
                });
            }
        }, 100);
    }

    setupMPCComparison() {
        // Create MPC variant comparison UI
        this.createMPCComparisonPanel();
        this.setupVariantPerformanceTracking();
    }

    createMPCComparisonPanel() {
        const analyticsTab = document.getElementById('analytics');
        if (!analyticsTab) return;

        // Add MPC comparison section
        const comparisonHTML = `
            <div class="card">
                <h3>🎯 MPC Variant Performance Comparison</h3>
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
        `;

        analyticsTab.insertAdjacentHTML('beforeend', comparisonHTML);
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
        this.showNotification(`Switched to ${variant} controller`, 'success');
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
            }
        });

        // Update main status display
        const controllerModeElement = document.getElementById('controllerMode');
        if (controllerModeElement) {
            controllerModeElement.textContent = this.activeMPCVariant;
        }
    }

    initializeAnalyticsTab() {
        // Load comparative performance data
        this.loadComparativeData();
        
        // Start real-time updates for analytics
        this.startAnalyticsUpdates();
    }

    initializeSafetyTab() {
        // Setup safety constraint monitoring
        this.setupSafetyAlerts();
    }

    initializeEconomicTab() {
        // Setup economic optimization controls
        this.setupEconomicControls();
    }

    initializeSimulinkTab() {
        // Setup Simulink integration controls
        this.setupSimulinkControls();
    }

    setupRealTimeUpdates() {
        // Update MPC comparison every 5 seconds
        setInterval(() => {
            this.updateRealTimeComparison();
        }, 5000);
    }

    updateRealTimeComparison() {
        // Simulate real-time performance updates
        this.mpcVariants.forEach(variant => {
            const metrics = this.generatePerformanceMetrics(variant);
            this.updateMPCPerformance(variant, metrics);
        });
    }

    generatePerformanceMetrics(variant) {
        // Generate realistic performance metrics based on variant
        const baseScores = {
            'HE-NMPC': { economic: 85, safety: 92, speed: 45, cost: 118 },
            'Standard-MPC': { economic: 72, safety: 75, speed: 28, cost: 125 },
            'Stochastic-MPC': { economic: 78, safety: 88, speed: 120, cost: 122 },
            'Mixed-Integer-MPC': { economic: 70, safety: 72, speed: 350, cost: 127 }
        };

        const base = baseScores[variant] || baseScores['HE-NMPC'];
        
        // Add some random variation
        return {
            economicScore: base.economic + (Math.random() * 10 - 5),
            safetyScore: base.safety + (Math.random() * 5 - 2.5),
            speedScore: base.speed + (Math.random() * 20 - 10),
            costScore: base.cost + (Math.random() * 6 - 3)
        };
    }

    loadComparativeData() {
        // Load historical comparison data
        console.log('Loading MPC comparative performance data...');
    }

    setupSafetyAlerts() {
        // Setup safety constraint alert system
        console.log('Initializing safety monitoring...');
    }

    setupEconomicControls() {
        // Setup economic optimization controls
        console.log('Initializing economic controls...');
    }

    setupSimulinkControls() {
        // Setup Simulink integration
        console.log('Initializing Simulink controls...');
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <span class="notification-message">${message}</span>
            <button class="notification-close">&times;</button>
        `;

        // Add to notification container
        const container = document.querySelector('.notification-container') || this.createNotificationContainer();
        container.appendChild(notification);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);

        // Close button handler
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.parentNode.removeChild(notification);
        });
    }

    createNotificationContainer() {
        const container = document.createElement('div');
        container.className = 'notification-container';
        document.body.appendChild(container);
        return container;
    }
}

// Initialize navigation when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.navigationManager = new NavigationManager();
});