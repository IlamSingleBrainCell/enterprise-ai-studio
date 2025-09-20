/**
 * DORA Metrics Module
 * Handles live simulation and updates of DORA metrics
 */

class DoraMetrics {
    constructor() {
        this.state = {
            df: ['Daily','2x/day','Multiple/day','Weekly'],
            dfIdx: 0,
            lt: [120, 90, 60, 30], // minutes
            ltIdx: 0,
            cfr: [3,4,2,5],
            cfrIdx: 0,
            mttr: [25, 30, 18, 22],
            mttrIdx: 0
        };
        this.updateInterval = null;
        this.init();
    }

    init() {
        this.update();
        this.startAutoUpdate();
    }

    startAutoUpdate() {
        // Update every 7 seconds to simulate live changes
        this.updateInterval = setInterval(() => {
            this.update();
        }, 7000);
    }

    stopAutoUpdate() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    update() {
        // Rotate indexes
        this.state.dfIdx = (this.state.dfIdx + 1) % this.state.df.length;
        this.state.ltIdx = (this.state.ltIdx + 1) % this.state.lt.length;
        this.state.cfrIdx = (this.state.cfrIdx + 1) % this.state.cfr.length;
        this.state.mttrIdx = (this.state.mttrIdx + 1) % this.state.mttr.length;

        this.updateDeploymentFrequency();
        this.updateLeadTime();
        this.updateChangeFailureRate();
        this.updateMeanTimeToRestore();
    }

    updateDeploymentFrequency() {
        const dfVal = this.state.df[this.state.dfIdx];
        const element = document.getElementById('df-value');
        const trendElement = document.getElementById('df-trend');
        
        if (element) {
            element.textContent = dfVal;
        }
        if (trendElement) {
            const trend = this.state.dfIdx % 2 ? '↑' : '↓';
            trendElement.textContent = `${trend} vs prior period`;
        }
    }

    updateLeadTime() {
        const ltMin = this.state.lt[this.state.ltIdx];
        const element = document.getElementById('lt-value');
        const trendElement = document.getElementById('lt-trend');
        
        if (element) {
            const displayValue = ltMin >= 60 ? Math.round(ltMin/60) + 'h' : ltMin + 'm';
            element.textContent = displayValue;
        }
        if (trendElement) {
            const trend = ltMin < 60 ? 'Improved' : 'Needs improvement';
            trendElement.textContent = trend;
        }
    }

    updateChangeFailureRate() {
        const cfr = this.state.cfr[this.state.cfrIdx];
        const element = document.getElementById('cfr-value');
        
        if (element) {
            element.textContent = cfr + '%';
        }
    }

    updateMeanTimeToRestore() {
        const mttr = this.state.mttr[this.state.mttrIdx];
        const element = document.getElementById('mttr-value');
        const trendElement = document.getElementById('mttr-trend');
        
        if (element) {
            element.textContent = this.formatMinutes(mttr);
        }
        if (trendElement) {
            const trend = mttr < 25 ? 'Faster' : 'Slower';
            trendElement.textContent = trend;
        }
    }

    formatMinutes(minutes) {
        return minutes + 'm';
    }

    destroy() {
        this.stopAutoUpdate();
    }
}

export default DoraMetrics;