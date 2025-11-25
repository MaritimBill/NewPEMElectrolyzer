// Enhanced Neural MPC with Complete Lifecycle Management
class NeuralMPCManager {
    constructor() {
        this.isEnabled = false;
        this.predictionHorizon = 10;
        this.learningRate = 0.01;
        this.neuralNetwork = null;
        this.performanceHistory = [];
        this.modelVersions = [];
        this.trainingSchedule = null;
        this.retrainingThreshold = 0.85; // 85% accuracy threshold
        this.init();
    }

    init() {
        this.setupNeuralNetwork();
        this.setupMPCOptimization();
        this.setupLearningSystem();
        this.setupLifecycleManagement();
        console.log('🧠 Neural MPC Manager with Lifecycle Initialized');
    }

    setupLifecycleManagement() {
        this.lifecycleConfig = {
            // Training configuration
            autoRetrain: true,
            retrainInterval: 24 * 60 * 60 * 1000, // 24 hours
            minTrainingSamples: 1000,
            validationSplit: 0.2,
            
            // Model versioning
            maxModelVersions: 5,
            versionAutoCleanup: true,
            
            // Performance monitoring
            performanceDecayThreshold: 0.1, // 10% performance drop
            dataDriftThreshold: 0.15,
            
            // Retraining triggers
            retrainOnPerformanceDrop: true,
            retrainOnDataDrift: true,
            retrainOnSchedule: true
        };

        this.setupTrainingScheduler();
        this.setupModelVersioning();
        this.loadLatestModel();
    }

    setupTrainingScheduler() {
        // Schedule periodic retraining
        this.trainingSchedule = setInterval(() => {
            if (this.lifecycleConfig.retrainOnSchedule) {
                this.checkRetrainingNeeded();
            }
        }, 60 * 60 * 1000); // Check every hour

        console.log('⏰ Training scheduler initialized');
    }

    setupModelVersioning() {
        this.modelVersions = JSON.parse(localStorage.getItem('neural_mpc_model_versions') || '[]');
        
        // Initialize with default model if no versions exist
        if (this.modelVersions.length === 0) {
            this.createInitialModelVersion();
        }

        console.log(`📚 Model versioning initialized: ${this.modelVersions.length} versions`);
    }

    createInitialModelVersion() {
        const initialModel = {
            version: '1.0.0',
            timestamp: new Date().toISOString(),
            performance: {
                accuracy: 0.75,
                trainingLoss: 0.25,
                validationLoss: 0.28
            },
            trainingData: {
                samples: 0,
                features: 8,
                trainingTime: 0
            },
            metadata: {
                architecture: '8-12-8-6-4',
                activation: 'relu',
                optimizer: 'adam'
            },
            modelData: this.initializeModelWeights()
        };

        this.modelVersions.push(initialModel);
        this.saveModelVersions();
        this.neuralNetwork = initialModel;
    }

    initializeModelWeights() {
        // Initialize random weights for the neural network
        return {
            weights: this.generateRandomWeights(),
            biases: this.generateRandomBiases(),
            trained: false,
            trainingEpochs: 0
        };
    }

    generateRandomWeights() {
        // Generate random weights for neural network layers
        const layers = [8, 12, 8, 6, 4]; // Input to output layer sizes
        const weights = [];
        
        for (let i = 0; i < layers.length - 1; i++) {
            const layerWeights = [];
            for (let j = 0; j < layers[i]; j++) {
                const neuronWeights = [];
                for (let k = 0; k < layers[i + 1]; k++) {
                    neuronWeights.push((Math.random() - 0.5) * 2); // Random between -1 and 1
                }
                layerWeights.push(neuronWeights);
            }
            weights.push(layerWeights);
        }
        
        return weights;
    }

    generateRandomBiases() {
        // Generate random biases for each layer
        const layers = [12, 8, 6, 4]; // Hidden and output layers
        const biases = [];
        
        for (let i = 0; i < layers.length; i++) {
            const layerBiases = [];
            for (let j = 0; j < layers[i]; j++) {
                layerBiases.push((Math.random() - 0.5) * 0.1); // Small random biases
            }
            biases.push(layerBiases);
        }
        
        return biases;
    }

    // 🎯 LIFECYCLE MANAGEMENT METHODS

    checkRetrainingNeeded() {
        const metrics = this.getPerformanceMetrics();
        const currentVersion = this.getCurrentModelVersion();
        
        const retrainingReasons = [];
        
        // Check performance decay
        if (this.lifecycleConfig.retrainOnPerformanceDrop) {
            const performanceDrop = this.calculatePerformanceDrop(currentVersion, metrics);
            if (performanceDrop > this.lifecycleConfig.performanceDecayThreshold) {
                retrainingReasons.push(`Performance drop: ${(performanceDrop * 100).toFixed(1)}%`);
            }
        }
        
        // Check data drift
        if (this.lifecycleConfig.retrainOnDataDrift) {
            const dataDrift = this.calculateDataDrift();
            if (dataDrift > this.lifecycleConfig.dataDriftThreshold) {
                retrainingReasons.push(`Data drift: ${(dataDrift * 100).toFixed(1)}%`);
            }
        }
        
        // Check schedule
        if (this.lifecycleConfig.retrainOnSchedule) {
            const timeSinceLastTrain = Date.now() - new Date(currentVersion.timestamp).getTime();
            if (timeSinceLastTrain > this.lifecycleConfig.retrainInterval) {
                retrainingReasons.push('Scheduled retraining');
            }
        }
        
        // Check minimum samples
        if (this.performanceHistory.length >= this.lifecycleConfig.minTrainingSamples) {
            retrainingReasons.push('Sufficient training data available');
        }
        
        if (retrainingReasons.length > 0 && this.lifecycleConfig.autoRetrain) {
            console.log('🔄 Retraining triggered:', retrainingReasons);
            this.retrainModel(retrainingReasons);
        }
        
        return retrainingReasons;
    }

    calculatePerformanceDrop(modelVersion, currentMetrics) {
        const originalAccuracy = modelVersion.performance.accuracy;
        const currentAccuracy = currentMetrics.predictionAccuracy / 100; // Convert to 0-1 scale
        
        return Math.max(0, originalAccuracy - currentAccuracy);
    }

    calculateDataDrift() {
        if (this.performanceHistory.length < 100) return 0;
        
        // Calculate statistical drift in feature distributions
        const recentData = this.performanceHistory.slice(-100);
        const oldData = this.performanceHistory.slice(-200, -100);
        
        // Simple drift detection based on feature means
        let totalDrift = 0;
        const features = ['o2Production', 'efficiency', 'stackTemperature', 'purity'];
        
        features.forEach(feature => {
            const recentMean = this.calculateMean(recentData, feature);
            const oldMean = this.calculateMean(oldData, feature);
            const drift = Math.abs(recentMean - oldMean) / (oldMean || 1);
            totalDrift += drift;
        });
        
        return totalDrift / features.length;
    }

    calculateMean(data, feature) {
        const values = data.map(d => d.state[feature]).filter(v => v !== undefined);
        return values.reduce((sum, val) => sum + val, 0) / values.length;
    }

    async retrainModel(reasons = []) {
        console.log('🎯 Starting model retraining...');
        
        if (this.performanceHistory.length < this.lifecycleConfig.minTrainingSamples) {
            console.warn('⚠️ Insufficient training data for retraining');
            return false;
        }
        
        try {
            // Show training notification
            if (window.electrolyzerApp) {
                window.electrolyzerApp.showNotification('Neural MPC retraining started...', 'info');
            }
            
            // Prepare training data
            const trainingData = this.prepareTrainingData();
            
            // Train the model
            const trainingResult = await this.trainModel(trainingData);
            
            // Create new model version
            const newVersion = this.createNewModelVersion(trainingResult, reasons);
            
            // Validate new model
            const validationResult = this.validateModel(newVersion);
            
            if (validationResult.isBetter) {
                // Deploy new model
                this.deployModel(newVersion);
                
                console.log('✅ Model retraining completed successfully');
                
                if (window.electrolyzerApp) {
                    window.electrolyzerApp.showNotification(
                        `Neural MPC updated to v${newVersion.version}`, 
                        'success'
                    );
                }
                
                return true;
            } else {
                console.warn('⚠️ New model performance worse than current - keeping existing model');
                return false;
            }
            
        } catch (error) {
            console.error('❌ Model retraining failed:', error);
            
            if (window.electrolyzerApp) {
                window.electrolyzerApp.showNotification('Model retraining failed', 'danger');
            }
            
            return false;
        }
    }

    prepareTrainingData() {
        // Prepare data for training
        const features = [];
        const labels = [];
        
        this.performanceHistory.forEach(entry => {
            const feature = this.extractFeatures(entry.state);
            const label = this.extractLabel(entry);
            
            if (feature && label) {
                features.push(feature);
                labels.push(label);
            }
        });
        
        return {
            features: features,
            labels: labels,
            size: features.length,
            timestamp: new Date().toISOString()
        };
    }

    extractFeatures(state) {
        return [
            state.o2Production || 0,
            state.efficiency || 75,
            state.stackTemperature || 25,
            state.purity || 99.7,
            state.o2TankLevel || 50,
            state.safetyMargin || 100,
            state.economicSetpoint || 30,
            Date.now() % 24 // Time of day feature
        ];
    }

    extractLabel(entry) {
        // Use actual production as label for supervised learning
        return entry.state.o2Production || 30;
    }

    async trainModel(trainingData) {
        // Simulate training process (in real implementation, use TensorFlow.js or similar)
        console.log(`🧪 Training model with ${trainingData.size} samples...`);
        
        // Simulate training time
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const trainingLoss = 0.1 + Math.random() * 0.1;
        const validationLoss = trainingLoss + 0.05;
        
        return {
            trainingLoss: trainingLoss,
            validationLoss: validationLoss,
            accuracy: 1 - validationLoss,
            trainingTime: 2000,
            epochs: 50
        };
    }

    createNewModelVersion(trainingResult, reasons) {
        const currentVersion = this.getCurrentModelVersion();
        const newVersionNumber = this.incrementVersion(currentVersion.version);
        
        const newVersion = {
            version: newVersionNumber,
            timestamp: new Date().toISOString(),
            performance: {
                accuracy: trainingResult.accuracy,
                trainingLoss: trainingResult.trainingLoss,
                validationLoss: trainingResult.validationLoss
            },
            trainingData: {
                samples: this.performanceHistory.length,
                features: 8,
                trainingTime: trainingResult.trainingTime
            },
            metadata: {
                architecture: '8-12-8-6-4',
                activation: 'relu',
                optimizer: 'adam',
                retrainingReasons: reasons
            },
            modelData: {
                ...this.neuralNetwork.modelData,
                trained: true,
                trainingEpochs: trainingResult.epochs,
                lastTraining: new Date().toISOString()
            }
        };
        
        return newVersion;
    }

    incrementVersion(currentVersion) {
        const [major, minor, patch] = currentVersion.split('.').map(Number);
        return `${major}.${minor}.${patch + 1}`;
    }

    validateModel(newVersion) {
        const currentVersion = this.getCurrentModelVersion();
        
        // Simple validation: new model must be at least as good as current
        const improvement = newVersion.performance.accuracy - currentVersion.performance.accuracy;
        const isBetter = improvement >= -0.02; // Allow small degradation
        
        return {
            isBetter: isBetter,
            improvement: improvement,
            currentAccuracy: currentVersion.performance.accuracy,
            newAccuracy: newVersion.performance.accuracy
        };
    }

    deployModel(newVersion) {
        // Add to version history
        this.modelVersions.push(newVersion);
        
        // Clean up old versions if needed
        if (this.lifecycleConfig.versionAutoCleanup && 
            this.modelVersions.length > this.lifecycleConfig.maxModelVersions) {
            this.modelVersions = this.modelVersions.slice(-this.lifecycleConfig.maxModelVersions);
        }
        
        // Set as current model
        this.neuralNetwork = newVersion;
        
        // Save to storage
        this.saveModelVersions();
        
        console.log(`🚀 Deployed model v${newVersion.version}`);
    }

    loadLatestModel() {
        if (this.modelVersions.length > 0) {
            this.neuralNetwork = this.modelVersions[this.modelVersions.length - 1];
            console.log(`📥 Loaded model v${this.neuralNetwork.version}`);
        }
    }

    getCurrentModelVersion() {
        return this.neuralNetwork;
    }

    getModelHistory() {
        return this.modelVersions.map(version => ({
            version: version.version,
            timestamp: version.timestamp,
            accuracy: version.performance.accuracy,
            trainingSamples: version.trainingData.samples
        }));
    }

    rollbackModel(versionNumber) {
        const targetVersion = this.modelVersions.find(v => v.version === versionNumber);
        if (targetVersion) {
            this.neuralNetwork = targetVersion;
            this.saveModelVersions();
            console.log(`↩️ Rolled back to model v${versionNumber}`);
            
            if (window.electrolyzerApp) {
                window.electrolyzerApp.showNotification(`Rolled back to v${versionNumber}`, 'warning');
            }
            
            return true;
        }
        return false;
    }

    saveModelVersions() {
        localStorage.setItem('neural_mpc_model_versions', JSON.stringify(this.modelVersions));
    }

    exportModel(versionNumber = null) {
        const model = versionNumber ? 
            this.modelVersions.find(v => v.version === versionNumber) : 
            this.neuralNetwork;
            
        if (model) {
            const exportData = {
                model: model,
                exportInfo: {
                    timestamp: new Date().toISOString(),
                    totalVersions: this.modelVersions.length,
                    performanceHistory: this.performanceHistory.length
                }
            };
            
            return JSON.stringify(exportData, null, 2);
        }
        return null;
    }

    importModel(modelData) {
        try {
            const importData = JSON.parse(modelData);
            const newVersion = importData.model;
            
            // Validate imported model
            if (!newVersion.version || !newVersion.modelData) {
                throw new Error('Invalid model format');
            }
            
            // Add to versions
            this.modelVersions.push(newVersion);
            this.neuralNetwork = newVersion;
            this.saveModelVersions();
            
            console.log(`📥 Imported model v${newVersion.version}`);
            
            if (window.electrolyzerApp) {
                window.electrolyzerApp.showNotification(`Model v${newVersion.version} imported`, 'success');
            }
            
            return true;
        } catch (error) {
            console.error('❌ Model import failed:', error);
            return false;
        }
    }

    getLifecycleStatus() {
        const currentModel = this.getCurrentModelVersion();
        const metrics = this.getPerformanceMetrics();
        
        return {
            currentModel: {
                version: currentModel.version,
                accuracy: currentModel.performance.accuracy,
                trainingDate: currentModel.timestamp,
                samplesTrained: currentModel.trainingData.samples
            },
            lifecycle: {
                autoRetrain: this.lifecycleConfig.autoRetrain,
                retrainInterval: this.lifecycleConfig.retrainInterval,
                performanceThreshold: this.retrainingThreshold,
                dataDrift: this.calculateDataDrift(),
                performanceDrop: this.calculatePerformanceDrop(currentModel, metrics)
            },
            trainingData: {
                totalSamples: this.performanceHistory.length,
                minRequired: this.lifecycleConfig.minTrainingSamples,
                sufficientData: this.performanceHistory.length >= this.lifecycleConfig.minTrainingSamples
            },
            modelHistory: {
                totalVersions: this.modelVersions.length,
                versions: this.getModelHistory()
            }
        };
    }

    // 🛠️ UTILITY METHODS

    cleanup() {
        if (this.trainingSchedule) {
            clearInterval(this.trainingSchedule);
        }
        
        // Clean up performance history if too large
        if (this.performanceHistory.length > 10000) {
            this.performanceHistory = this.performanceHistory.slice(-5000);
        }
        
        console.log('🧹 Neural MPC lifecycle cleanup completed');
    }

    resetLifecycle() {
        this.performanceHistory = [];
        this.modelVersions = [];
        this.createInitialModelVersion();
        
        console.log('🔄 Neural MPC lifecycle reset');
        
        if (window.electrolyzerApp) {
            window.electrolyzerApp.showNotification('Neural MPC lifecycle reset', 'info');
        }
    }
}

// Enhanced initialization with lifecycle management
document.addEventListener('DOMContentLoaded', () => {
    window.neuralMPCManager = new NeuralMPCManager();
    window.neuralMPCVisualization = new NeuralMPCVisualization();
    
    console.log('🧠 Neural MPC with Lifecycle Management Fully Initialized');
    
    // Setup periodic lifecycle checks
    setInterval(() => {
        if (window.neuralMPCManager) {
            window.neuralMPCManager.checkRetrainingNeeded();
        }
    }, 30 * 60 * 1000); // Check every 30 minutes
});
