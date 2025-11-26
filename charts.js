// In charts.js - Add REAL MPC data handling
class ChartManager {
    // ... existing code ...
    
    updateMPCComparison(realMPCData) {
        const canvas = document.getElementById('mpcComparisonChart');
        if (!canvas || !realMPCData) return;
        
        const performance = realMPCData.controller_performance || realMPCData;
        
        // Get REAL data from PEM results
        const controllers = Object.keys(performance);
        const efficiencies = controllers.map(name => performance[name].efficiency || 0);
        const responseTimes = controllers.map(name => performance[name].response_time || 0);
        const stabilityScores = controllers.map(name => performance[name].stability_index || 0);
        
        console.log('📊 Updating charts with REAL data:', {
            controllers,
            efficiencies,
            responseTimes,
            stabilityScores
        });
        
        // Update chart data with REAL values
        if (this.charts.has('mpcComparisonChart')) {
            const chart = this.charts.get('mpcComparisonChart');
            
            chart.data.labels = controllers;
            chart.data.datasets[0].data = efficiencies;
            chart.data.datasets[1].data = responseTimes;
            chart.data.datasets[2].data = stabilityScores;
            
            chart.update();
            
            // Update chart title to show it's REAL data
            chart.options.plugins.title.text = 'MPC Performance - REAL PEM Results';
            chart.update();
        }
    }
    
    updateMPCTrends(realMPCData) {
        // Update trend charts with REAL historical data
        if (window.neuralMPCManager && window.neuralMPCManager.realResults) {
            const history = window.neuralMPCManager.realResults;
            
            // Update trend charts with actual historical performance
            this.updatePerformanceTrends(history);
        }
    }
}
