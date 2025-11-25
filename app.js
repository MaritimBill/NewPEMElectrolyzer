/* components.css - Professional Component Styles for PEM Electrolyzer */

/* ===== NOTIFICATION SYSTEM ===== */
.notification-container {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 1000;
    max-width: 400px;
}

.notification {
    background: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 0.5rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    animation: slideIn 0.3s ease forwards;
    backdrop-filter: blur(10px);
}

.notification.info {
    border-left: 4px solid var(--accent-info);
}

.notification.success {
    border-left: 4px solid var(--accent-success);
}

.notification.warning {
    border-left: 4px solid var(--accent-warning);
}

.notification.error {
    border-left: 4px solid var(--accent-danger);
}

.notification-content {
    display: flex;
    justify-content: between;
    align-items: center;
    gap: 0.75rem;
}

.notification-message {
    flex: 1;
    color: var(--text-primary);
    font-size: 0.9rem;
    font-weight: 500;
}

.notification-close {
    background: none;
    border: none;
    color: var(--text-secondary);
    cursor: pointer;
    font-size: 1.2rem;
    padding: 0;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    transition: all 0.2s ease;
}

.notification-close:hover {
    background: var(--bg-tertiary);
    color: var(--text-primary);
}

@keyframes slideIn {
    from {
        transform: translateX(100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

@keyframes slideOut {
    from {
        transform: translateX(0);
        opacity: 1;
    }
    to {
        transform: translateX(100%);
        opacity: 0;
    }
}

/* ===== LIVE DATA FEED ===== */
.data-feed {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.data-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem;
    background: var(--bg-tertiary);
    border-radius: 8px;
    border: 1px solid var(--border-color);
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
}

.data-item::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
    background: linear-gradient(135deg, var(--accent-primary), var(--accent-info));
    opacity: 0;
    transition: opacity 0.3s ease;
}

.data-item:hover {
    background: var(--bg-secondary);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.data-item:hover::before {
    opacity: 1;
}

.data-label {
    font-size: 0.9rem;
    color: var(--text-secondary);
    font-weight: 500;
}

.data-value {
    font-size: 1rem;
    font-weight: 600;
    background: linear-gradient(135deg, var(--accent-primary), var(--accent-info));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    position: relative;
}

.data-value::after {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 0;
    width: 100%;
    height: 2px;
    background: linear-gradient(135deg, var(--accent-primary), var(--accent-info));
    transform: scaleX(0);
    transition: transform 0.3s ease;
}

.data-item:hover .data-value::after {
    transform: scaleX(1);
}

/* ===== TAB PLACEHOLDER ===== */
.tab-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 400px;
    text-align: center;
    color: var(--text-muted);
    padding: 2rem;
}

.tab-placeholder h3 {
    margin-bottom: 1rem;
    color: var(--text-primary);
    font-size: 1.5rem;
    font-weight: 600;
}

.tab-placeholder p {
    max-width: 400px;
    line-height: 1.6;
    font-size: 1rem;
    opacity: 0.8;
}

/* ===== SVG ICON STYLES ===== */
.nav-icon {
    transition: all 0.3s ease;
    flex-shrink: 0;
}

.nav-btn.active .nav-icon {
    fill: white;
    transform: scale(1.1);
}

.nav-btn:hover .nav-icon {
    transform: scale(1.05);
}

.btn-icon {
    background: var(--bg-tertiary);
    border: 1px solid var(--border-color);
    border-radius: 6px;
    padding: 0.5rem;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
}

.btn-icon:hover {
    background: var(--bg-secondary);
    border-color: var(--accent-primary);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.btn-icon svg {
    vertical-align: middle;
    width: 16px;
    height: 16px;
}

/* ===== STATUS INDICATORS ===== */
.status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    display: inline-block;
    margin-right: 0.5rem;
    position: relative;
}

.status-dot.connected {
    background-color: var(--accent-success);
    box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.3);
}

.status-dot.connected::after {
    content: '';
    position: absolute;
    top: -3px;
    left: -3px;
    right: -3px;
    bottom: -3px;
    border-radius: 50%;
    background: var(--accent-success);
    animation: pulse 2s infinite;
}

.status-dot.disconnected {
    background-color: var(--accent-danger);
}

.status-dot.connecting {
    background-color: var(--accent-warning);
    animation: blink 1.5s infinite;
}

@keyframes pulse {
    0% {
        transform: scale(1);
        opacity: 0.8;
    }
    70% {
        transform: scale(2);
        opacity: 0;
    }
    100% {
        transform: scale(1);
        opacity: 0;
    }
}

@keyframes blink {
    0%, 50% {
        opacity: 1;
    }
    51%, 100% {
        opacity: 0.3;
    }
}

/* ===== METRIC CARDS ENHANCEMENTS ===== */
.metric-card {
    position: relative;
    overflow: hidden;
}

.metric-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(135deg, var(--accent-primary), var(--accent-info));
    opacity: 0;
    transition: opacity 0.3s ease;
}

.metric-card:hover::before {
    opacity: 1;
}

.metric-value {
    transition: all 0.3s ease;
}

.metric-card:hover .metric-value {
    transform: scale(1.05);
}

/* ===== GRID LAYOUT ENHANCEMENTS ===== */
.grid-layout {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1.5rem;
    align-items: start;
}

@media (min-width: 1024px) {
    .grid-layout {
        grid-template-columns: repeat(2, 1fr);
    }
    
    .grid-layout .card.large {
        grid-column: span 2;
    }
}

/* ===== CARD ENHANCEMENTS ===== */
.card {
    backdrop-filter: blur(10px);
    transition: all 0.3s ease;
}

.card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 10px -2px rgba(0, 0, 0, 0.05);
}

.card-header {
    border-bottom: 1px solid var(--border-color);
    padding: 1.25rem 1.5rem;
    background: var(--bg-secondary);
    border-radius: 8px 8px 0 0;
}

.card-content {
    padding: 1.5rem;
}

/* ===== STATUS GRID ===== */
.status-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
}

.status-item {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.status-item label {
    font-size: 0.875rem;
    color: var(--text-secondary);
    font-weight: 500;
}

.status-badge {
    padding: 0.375rem 0.75rem;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 600;
    text-align: center;
    transition: all 0.3s ease;
}

.status-badge.success {
    background: rgba(16, 185, 129, 0.1);
    color: var(--accent-success);
    border: 1px solid rgba(16, 185, 129, 0.2);
}

.status-badge.info {
    background: rgba(59, 130, 246, 0.1);
    color: var(--accent-info);
    border: 1px solid rgba(59, 130, 246, 0.2);
}

.status-badge.warning {
    background: rgba(245, 158, 11, 0.1);
    color: var(--accent-warning);
    border: 1px solid rgba(245, 158, 11, 0.2);
}

.status-badge.danger {
    background: rgba(239, 68, 68, 0.1);
    color: var(--accent-danger);
    border: 1px
