// simulink-bridge.js - Real MATLAB/Simulink Integration
class SimulinkBridge {
    constructor() {
        this.isConnected = false;
        this.simulationRunning = false;
        this.dataCallbacks = [];
        this.connectionUrl = 'ws://localhost:31415'; // MATLAB WebSocket server
        
        this.init();
    }

    init() {
        console.log('Simulink Bridge Initializing...');
        this.setupWebSocket();
    }

    setupWebSocket() {
        try {
            this.socket = new WebSocket(this.connectionUrl);
            
            this.socket.onopen = () => {
                console.log('Connected to MATLAB/Simulink WebSocket');
                this.isConnected = true;
                this.onConnectionStateChange(true);
            };
            
            this.socket.onmessage = (event) => {
                this.handleSimulinkMessage(event.data);
            };
            
            this.socket.onclose = () => {
                console.log('Disconnected from MATLAB/Simulink');
                this.isConnected = false;
                this.onConnectionStateChange(false);
                
                // Attempt reconnection
                setTimeout(() => this.setupWebSocket(), 5000);
            };
            
            this.socket.onerror = (error) => {
                console.error('WebSocket error:', error);
            };
            
        } catch (error) {
            console.error('WebSocket setup failed:', error);
        }
    }

    handleSimulinkMessage(message) {
        try {
            const data = JSON.parse(message);
            
            switch(data.type) {
                case 'simulation_data':
                    if (this.onSimulationData) {
                        this.onSimulationData(data.payload);
                    }
                    break;
                    
                case 'mpc_comparison':
                    if (this.onMPCComparison) {
                        this.onMPCComparison(data.payload);
                    }
                    break;
                    
                case 'simulation_status':
                    if (this.onSimulationStatus) {
                        this.onSimulationStatus(data.payload);
                    }
                    break;
                    
                default:
                    console.log('Unknown message type:', data.type);
            }
        } catch (error) {
            console.error('Error parsing Simulink message:', error);
        }
    }

    // Public methods for external use
    async connect() {
        return new Promise((resolve, reject) => {
            if (this.isConnected) {
                resolve();
                return;
            }
            
            const checkConnection = setInterval(() => {
                if (this.isConnected) {
                    clearInterval(checkConnection);
                    resolve();
                }
            }, 100);
            
            setTimeout(() => {
                clearInterval(checkConnection);
                reject(new Error('Connection timeout'));
            }, 5000);
        });
    }

    startSimulation() {
        if (!this.isConnected) {
            throw new Error('Not connected to MATLAB/Simulink');
        }
        
        this.sendCommand('start_simulation');
        this.simulationRunning = true;
    }

    stopSimulation() {
        if (!this.isConnected) {
            throw new Error('Not connected to MATLAB/Simulink');
        }
        
        this.sendCommand('stop_simulation');
        this.simulationRunning = false;
    }

    updateParameters(parameters) {
        if (!this.isConnected) {
            throw new Error('Not connected to MATLAB/Simulink');
        }
        
        this.sendCommand('update_parameters', parameters);
    }

    emergencyStop() {
        if (this.isConnected) {
            this.sendCommand('emergency_stop');
        }
        this.simulationRunning = false;
    }

    sendCommand(command, payload = {}) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            const message = {
                type: 'command',
                command: command,
                payload: payload,
                timestamp: new Date().toISOString()
            };
            
            this.socket.send(JSON.stringify(message));
        } else {
            throw new Error('WebSocket not connected');
        }
    }

    onConnectionStateChange(connected) {
        // Override this method to handle connection state changes
    }

    // Callbacks to be set by the main application
    onSimulationData = null;
    onMPCComparison = null;
    onSimulationStatus = null;
}

// Make available globally
window.SimulinkBridge = SimulinkBridge;
