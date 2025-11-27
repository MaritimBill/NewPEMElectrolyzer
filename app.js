// app.js - ENHANCED WITH NEURAL API ROUTES
const express = require('express');
const mqttClient = require('./mqtt');
const RealKenyaNeuralMPC = require('./neural-mpc');

const app = express();
app.use(express.json());

// Initialize Neural MPC
const neuralMPC = new RealKenyaNeuralMPC();

// NEURAL MPC API ROUTES
app.get('/api/neural/optimize', async (req, res) => {
    try {
        console.log('🧠 Neural MPC Optimization Request');
        const results = await neuralMPC.runCompleteSystem();
        
        // Send to MATLAB via MQTT
        mqttClient.sendToMATLAB({
            command: 'apply_neural_control',
            optimal_current: results.training.targets.optimal_current,
            timestamp: new Date().toISOString(),
            source: 'web_neural_mpc'
        });
        
        res.json({
            status: 'optimization_complete',
            optimal_control: results.training.targets,
            real_data: {
                weather: results.weather.current,
                electricity: results.electricity,
                hospital: results.hospital
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/neural/control', async (req, res) => {
    try {
        const { current, efficiency, mode } = req.body;
        
        // Send direct control to MATLAB
        mqttClient.sendToMATLAB({
            command: 'manual_control',
            control_action: { current, efficiency, mode },
            timestamp: new Date().toISOString()
        });
        
        res.json({ status: 'control_sent', current, mode });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// SYSTEM STATUS ROUTES
app.get('/api/system/status', async (req, res) => {
    const status = {
        neural_mpc: 'active',
        matlab_bridge: 'connected',
        arduino: 'ready',
        timestamp: new Date().toISOString(),
        location: 'KNH Nairobi'
    };
    res.json(status);
});

app.get('/api/data/current', async (req, res) => {
    try {
        const currentData = await neuralMPC.generateRealTrainingData();
        res.json(currentData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// MQTT WebSocket bridge for frontend
app.get('/api/mqtt/connect', (req, res) => {
    // WebSocket bridge for frontend MQTT connection
    res.json({ status: 'mqtt_connected', broker: 'broker.hivemq.com' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🏥 KNH System Server running on port ${PORT}`);
    console.log(`🌐 Neural MPC: http://localhost:${PORT}/api/neural/optimize`);
    
    // Connect MQTT
    mqttClient.connect();
});

module.exports = app;
