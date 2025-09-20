/**
 * Tab Content Templates
 * Contains HTML templates for each tab section
 */

export const tabTemplates = {
    dashboard: `
        <div class="dashboard-grid">
            <div class="dashboard-card">
                <div class="card-header">
                    <div class="card-title">
                        <span>🚀</span>
                        Transformation Progress
                    </div>
                    <div style="color: #FFD700; font-weight: bold;">Phase 2</div>
                </div>
                <div class="progress-bar" style="margin-bottom: 15px;">
                    <div class="progress-fill" style="width: 35%;"></div>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    <div style="text-align: center;">
                        <div style="font-size: 1.5em; font-weight: bold; color: #4CAF50;">4/8</div>
                        <div style="font-size: 0.8em; color: #666;">Phases Complete</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 1.5em; font-weight: bold; color: #FFD700;">35%</div>
                        <div style="font-size: 0.8em; color: #666;">Overall Progress</div>
                    </div>
                </div>
            </div>

            <div class="dashboard-card">
                <div class="card-header">
                    <div class="card-title">
                        <span>🤖</span>
                        AI Agents Status
                    </div>
                    <div style="color: #4CAF50; font-weight: bold;">All Active</div>
                </div>
                <div class="ai-agents-grid" style="grid-template-columns: 1fr 1fr;">
                    <div class="ai-agent active" style="padding: 15px;">
                        <div class="agent-icon">📋</div>
                        <div class="agent-name">Requirements</div>
                        <div class="agent-status">Processing</div>
                    </div>
                    <div class="ai-agent" style="padding: 15px;">
                        <div class="agent-icon">🎨</div>
                        <div class="agent-name">Design</div>
                        <div class="agent-status">Ready</div>
                    </div>
                    <div class="ai-agent" style="padding: 15px;">
                        <div class="agent-icon">🔧</div>
                        <div class="agent-name">Build</div>
                        <div class="agent-status">Standby</div>
                    </div>
                    <div class="ai-agent active" style="padding: 15px;">
                        <div class="agent-icon">🛡️</div>
                        <div class="agent-name">RCM</div>
                        <div class="agent-status">Monitoring</div>
                    </div>
                </div>
            </div>

            <div class="dashboard-card">
                <div class="card-header">
                    <div class="card-title">
                        <span>🔄</span>
                        Pipeline Activity
                    </div>
                    <div style="color: #4CAF50; font-weight: bold;">Running</div>
                </div>
                <div style="display: flex; flex-direction: column; gap: 10px;">
                    <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px; background: #f8f9fa; border-radius: 8px;">
                        <span style="font-size: 0.9em;">macquarie/post-trade-core</span>
                        <span style="color: #4CAF50; font-size: 0.8em; font-weight: bold;">✓ Passed</span>
                    </div>
                    <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px; background: #fff3e0; border-radius: 8px;">
                        <span style="font-size: 0.9em;">macquarie/regulatory-engine</span>
                        <span style="color: #FF9800; font-size: 0.8em; font-weight: bold;">⚠ Testing</span>
                    </div>
                    <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px; background: #f8f9fa; border-radius: 8px;">
                        <span style="font-size: 0.9em;">macquarie/ai-agents</span>
                        <span style="color: #2196F3; font-size: 0.8em; font-weight: bold;">🔄 Building</span>
                    </div>
                </div>
            </div>

            <div class="dashboard-card">
                <div class="card-header">
                    <div class="card-title">
                        <span>📊</span>
                        Quality Metrics
                    </div>
                    <div style="color: #4CAF50; font-weight: bold;">Excellent</div>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    <div style="text-align: center; padding: 10px; background: #e8f5e8; border-radius: 8px;">
                        <div style="font-size: 1.3em; font-weight: bold; color: #4CAF50;">87%</div>
                        <div style="font-size: 0.8em; color: #666;">Code Coverage</div>
                    </div>
                    <div style="text-align: center; padding: 10px; background: #e8f5e8; border-radius: 8px;">
                        <div style="font-size: 1.3em; font-weight: bold; color: #4CAF50;">A+</div>
                        <div style="font-size: 0.8em; color: #666;">Security Score</div>
                    </div>
                    <div style="text-align: center; padding: 10px; background: #e8f5e8; border-radius: 8px;">
                        <div style="font-size: 1.3em; font-weight: bold; color: #4CAF50;">0</div>
                        <div style="font-size: 0.8em; color: #666;">Critical Issues</div>
                    </div>
                    <div style="text-align: center; padding: 10px; background: #fff3e0; border-radius: 8px;">
                        <div style="font-size: 1.3em; font-weight: bold; color: #FF9800;">2</div>
                        <div style="font-size: 0.8em; color: #666;">Performance</div>
                    </div>
                </div>
            </div>

            <!-- DORA Metrics -->
            <div class="dashboard-card" id="dora-metrics-card">
                <div class="card-header">
                    <div class="card-title">
                        <span>📈</span>
                        DORA Metrics
                    </div>
                    <div style="color: #4CAF50; font-weight: bold;">Live</div>
                </div>

                <div style="padding-top: 6px;">
                    <div class="dora-metrics">
                        <div class="dora-card" id="dora-deploy-frequency">
                            <div class="dora-title">Deployment Frequency</div>
                            <div class="dora-value" id="df-value">Daily</div>
                            <div class="dora-subtext">Multiple deploys per day</div>
                            <div class="dora-trend" id="df-trend">↑ 2x week-over-week</div>
                        </div>

                        <div class="dora-card" id="dora-lead-time">
                            <div class="dora-title">Lead Time for Changes</div>
                            <div class="dora-value" id="lt-value">2h</div>
                            <div class="dora-subtext">From commit to production</div>
                            <div class="dora-trend" id="lt-trend">↓ 15% vs last month</div>
                        </div>

                        <div class="dora-card" id="dora-change-failure">
                            <div class="dora-title">Change Failure Rate</div>
                            <div class="dora-value" id="cfr-value">3%</div>
                            <div class="dora-subtext">Failed deployments</div>
                            <div class="dora-trend" id="cfr-trend">Stable</div>
                        </div>

                        <div class="dora-card" id="dora-mttr">
                            <div class="dora-title">MTTR (Mean Time to Restore)</div>
                            <div class="dora-value" id="mttr-value">25m</div>
                            <div class="dora-subtext">From incident to recovery</div>
                            <div class="dora-trend" id="mttr-trend">↓ 10% last 7 days</div>
                        </div>
                    </div>

                    <div style="margin-top:12px; font-size:0.85em; color:#666; text-align:center;">
                        <em>Tip: Connect CI/CD, monitoring, and ticketing data sources to make these metrics live.</em>
                    </div>
                </div>
            </div>

            <!-- SPACE Framework Section -->
            <div class="dashboard-card space-section" id="space-framework-card">
                <div class="card-header">
                    <div class="card-title">
                        <span>🧭</span>
                        SPACE Framework for AI Agent Productivity
                    </div>
                    <div style="color: #667eea; font-weight: bold;">Adapted · AI Agents</div>
                </div>

                <div style="padding-top:8px;">
                    <div class="space-header" style="margin-bottom:10px;">
                        <div style="display:flex; flex-direction:column;">
                            <div style="font-weight:800; color:#333;">Refined SPACE adaptation for AI agents</div>
                            <div style="font-size:0.88em; color:#666;">Holistic measurement across Satisfaction, Performance, Activity, Communication, Efficiency</div>
                        </div>
                        <div>
                            <span class="space-pill">Balanced · Outcome-focused</span>
                        </div>
                    </div>

                    <div class="space-grid">
                        <div class="space-card">
                            <div class="space-title">S — Satisfaction & Well‑being</div>
                            <div class="space-body">
                                Measures developer trust, satisfaction, and system sustainability when working with AI agents.
                                <ul class="space-list">
                                    <li>Developer satisfaction surveys and tool ratings</li>
                                    <li>System reliability & uptime</li>
                                    <li>Trust/confidence scores for recommendations</li>
                                    <li>Impact on developer stress and on-call burden</li>
                                </ul>
                            </div>
                            <div class="space-small">Practical: weekly short NPS + automated trust signals (accepted suggestions %).</div>
                        </div>

                        <div class="space-card">
                            <div class="space-title">P — Performance</div>
                            <div class="space-body">
                                Outcome-focused metrics that measure the quality and business value of agent contributions.
                                <ul class="space-list">
                                    <li>Bug detection & vulnerability identification accuracy</li>
                                    <li>Success rate of generated code & refactorings</li>
                                    <li>Deployment success & reduced change-failure rate</li>
                                    <li>Business impact: reduced time-to-market, customer metrics</li>
                                </ul>
                            </div>
                            <div class="space-small">Practical: tie agent actions to CI results and post-release defect counts.</div>
                        </div>

                        <div class="space-card">
                            <div class="space-title">A — Activity</div>
                            <div class="space-body">
                                Quantifies volume and scope of agent activity while cautioning against optimizing volume alone.
                                <ul class="space-list">
                                    <li>Code reviews completed, comments left</li>
                                    <li>Automated tests created & executed</li>
                                    <li>Docs or PR descriptions generated</li>
                                    <li>PRs triaged or labeled</li>
                                </ul>
                            </div>
                            <div class="space-small">Practical: correlate activity with downstream quality metrics.</div>
                        </div>

                        <div class="space-card">
                            <div class="space-title">C — Communication & Collaboration</div>
                            <div class="space-body">
                                Measures how well agents integrate into team workflows and improve coordination.
                                <ul class="space-list">
                                    <li>Quality of review comments and suggested fixes</li>
                                    <li>Meeting summary usefulness & action item completion</li>
                                    <li>Integration with chat/issue trackers and knowledge transfer</li>
                                    <li>Cross-team coordination improvements</li>
                                </ul>
                            </div>
                            <div class="space-small">Practical: sample reviews rated by humans for helpfulness.</div>
                        </div>

                        <div class="space-card">
                            <div class="space-title">E — Efficiency & Flow</div>
                            <div class="space-body">
                                Measures impact on developer flow and throughput.
                                <ul class="space-list">
                                    <li>Context switches reduced</li>
                                    <li>Time saved on repetitive tasks</li>
                                    <li>Improved cycle times & deployment frequency</li>
                                    <li>Bottlenecks identified and resolved</li>
                                </ul>
                            </div>
                            <div class="space-small">Practical: instrument IDE and CI to measure time savings and flow improvements.</div>
                        </div>
                    </div>

                    <div style="margin-top:12px; color:#444; font-size:0.92em;">
                        <strong>Key Principles</strong>
                        <ul class="space-list">
                            <li><strong>Balanced metrics:</strong> don't optimise activity without quality or satisfaction.</li>
                            <li><strong>Automated + self-reported:</strong> combine system signals with occasional developer surveys.</li>
                            <li><strong>Actionable insights:</strong> surface concrete playbooks for agent retraining, throttling, or UX change.</li>
                            <li><strong>Continuous review:</strong> incorporate SPACE reviews into retros and platform KPIs.</li>
                        </ul>
                    </div>

                    <div style="margin-top:10px; text-align:center;">
                        <button class="action-button" id="space-guide-btn">Show implementation guidance</button>
                    </div>

                    <div id="space-details" class="hidden" style="margin-top:12px; background:#f8f9fa; padding:12px; border-radius:8px;">
                        <div style="font-weight:700; margin-bottom:8px;">Implementation roadmap (practical)</div>
                        <ol style="padding-left:18px; color:#444;">
                            <li>Instrument data sources: CI, GitHub Actions, monitoring, IDE plugins, chat logs, Jira.</li>
                            <li>Start with 6–8 pilot metrics (one per SPACE sub-area) and collect 8–12 weeks of baseline.</li>
                            <li>Run weekly dashboards for teams + monthly cross-team KPI reviews.</li>
                            <li>Use agents to detect regressions and propose corrective playbooks (retrain, UX fix, throttle).</li>
                            <li>Measure business outcomes: time-to-market, customer feedback, incident reduction.</li>
                        </ol>
                        <div style="margin-top:8px; font-size:0.9em; color:#666;">Tip: connect to existing tools (GitHub, JIRA, Datadog, New Relic) to avoid manual instrumentation.</div>
                    </div>
                </div>
            </div>
        </div>

        <div class="progress-section">
            <div class="progress-header">
                <div class="progress-title">🎯 Development Workflow</div>
                <div class="progress-metrics">
                    <div class="metric">
                        <div class="metric-value">35%</div>
                        <div class="metric-label">Complete</div>
                    </div>
                    <div class="metric">
                        <div class="metric-value">8.5min</div>
                        <div class="metric-label">Build Time</div>
                    </div>
                    <div class="metric">
                        <div class="metric-value">98.7%</div>
                        <div class="metric-label">Success Rate</div>
                    </div>
                </div>
            </div>
            
            <div class="progress-bar">
                <div class="progress-fill" style="width: 35%;"></div>
            </div>
            
            <div class="workflow-stages">
                <div class="stage completed">
                    <span class="stage-icon">📋</span>
                    <div class="stage-title">Requirements</div>
                    <div class="stage-status">Complete</div>
                    <div class="gate-indicator"></div>
                </div>
                <div class="stage completed">
                    <span class="stage-icon">👥</span>
                    <div class="stage-title">Stakeholders</div>
                    <div class="stage-status">Complete</div>
                    <div class="gate-indicator"></div>
                </div>
                <div class="stage active">
                    <span class="stage-icon">🎨</span>
                    <div class="stage-title">Design</div>
                    <div class="stage-status">In Progress</div>
                    <div class="gate-indicator pending"></div>
                </div>
                <div class="stage">
                    <span class="stage-icon">💻</span>
                    <div class="stage-title">Development</div>
                    <div class="stage-status">Waiting</div>
                    <div class="gate-indicator pending"></div>
                </div>
                <div class="stage">
                    <span class="stage-icon">🧪</span>
                    <div class="stage-title">Testing</div>
                    <div class="stage-status">Ready</div>
                    <div class="gate-indicator"></div>
                </div>
                <div class="stage">
                    <span class="stage-icon">🔍</span>
                    <div class="stage-title">Review</div>
                    <div class="stage-status">Pending</div>
                    <div class="gate-indicator pending"></div>
                </div>
                <div class="stage">
                    <span class="stage-icon">🚀</span>
                    <div class="stage-title">Deploy</div>
                    <div class="stage-status">Waiting</div>
                    <div class="gate-indicator pending"></div>
                </div>
                <div class="stage">
                    <span class="stage-icon">📊</span>
                    <div class="stage-title">Monitor</div>
                    <div class="stage-status">Ready</div>
                    <div class="gate-indicator"></div>
                </div>
            </div>
        </div>
    `,
    
    // Additional tabs would be defined here...
    agents: `
        <div class="progress-section">
            <h2 style="color: #333; margin-bottom: 20px;">🤖 AI Agent Orchestration</h2>
            <p style="color: #666; margin-bottom: 25px;">Manage and monitor your AI-powered development agents</p>
            
            <div class="ai-agents-grid" style="grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px;">
                <div class="ai-agent active">
                    <span class="agent-icon">📋</span>
                    <div class="agent-name">Requirements Agent</div>
                    <div class="agent-status">Processing regulatory changes</div>
                    <div style="margin-top: 10px; font-size: 0.8em;">
                        <div>• Automated requirement analysis</div>
                        <div>• Regulatory impact assessment</div>
                        <div>• Gap identification</div>
                    </div>
                </div>
                
                <div class="ai-agent">
                    <span class="agent-icon">🎨</span>
                    <div class="agent-name">Design Agent</div>
                    <div class="agent-status">Ready for activation</div>
                    <div style="margin-top: 10px; font-size: 0.8em;">
                        <div>• Architecture validation</div>
                        <div>• Design pattern recommendations</div>
                        <div>• Compliance verification</div>
                    </div>
                </div>
                
                <div class="ai-agent">
                    <span class="agent-icon">🔧</span>
                    <div class="agent-name">Build Agent</div>
                    <div class="agent-status">Standby mode</div>
                    <div style="margin-top: 10px; font-size: 0.8em;">
                        <div>• Code generation</div>
                        <div>• Automated testing</div>
                        <div>• Quality validation</div>
                    </div>
                </div>
                
                <div class="ai-agent">
                    <span class="agent-icon">🧪</span>
                    <div class="agent-name">Test Agent</div>
                    <div class="agent-status">Ready for testing</div>
                    <div style="margin-top: 10px; font-size: 0.8em;">
                        <div>• Automated test generation</div>
                        <div>• Performance testing</div>
                        <div>• Security validation</div>
                    </div>
                </div>
                
                <div class="ai-agent">
                    <span class="agent-icon">🚀</span>
                    <div class="agent-name">Deploy Agent</div>
                    <div class="agent-status">Deployment ready</div>
                    <div style="margin-top: 10px; font-size: 0.8em;">
                        <div>• Environment provisioning</div>
                        <div>• Rollback strategies</div>
                        <div>• Health monitoring</div>
                    </div>
                </div>
                
                <div class="ai-agent active">
                    <span class="agent-icon">🛡️</span>
                    <div class="agent-name">RCM Agent</div>
                    <div class="agent-status">Actively monitoring</div>
                    <div style="margin-top: 10px; font-size: 0.8em;">
                        <div>• Real-time compliance monitoring</div>
                        <div>• Regulatory change alerts</div>
                        <div>• Automated reporting</div>
                    </div>
                </div>
            </div>
        </div>
    `,

    pipeline: `
        <div class="progress-section">
            <h2 style="color: #333; margin-bottom: 20px;">🔄 CI/CD Pipeline Management</h2>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 25px; margin-bottom: 30px;">
                <div style="background: white; padding: 20px; border-radius: 15px; box-shadow: 0 5px 15px rgba(0,0,0,0.1);">
                    <h3 style="color: #333; margin-bottom: 15px;">🏗️ Active Builds</h3>
                    <div style="display: flex; flex-direction: column; gap: 10px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: #e8f5e8; border-radius: 8px;">
                            <div>
                                <div style="font-weight: bold; font-size: 0.9em;">post-trade-core</div>
                                <div style="font-size: 0.8em; color: #666;">Feature/regulatory-updates</div>
                            </div>
                            <div style="color: #4CAF50; font-weight: bold;">✓ Passed</div>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: #fff3e0; border-radius: 8px;">
                            <div>
                                <div style="font-weight: bold; font-size: 0.9em;">ai-agents-service</div>
                                <div style="font-size: 0.8em; color: #666;">Main branch</div>
                            </div>
                            <div style="color: #FF9800; font-weight: bold;">🔄 Running</div>
                        </div>
                    </div>
                </div>
                
                <div style="background: white; padding: 20px; border-radius: 15px; box-shadow: 0 5px 15px rgba(0,0,0,0.1);">
                    <h3 style="color: #333; margin-bottom: 15px;">📊 Pipeline Stats</h3>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                        <div style="text-align: center; padding: 15px; background: #e8f5e8; border-radius: 10px;">
                            <div style="font-size: 1.5em; font-weight: bold; color: #4CAF50;">47</div>
                            <div style="font-size: 0.8em; color: #666;">Successful Builds</div>
                        </div>
                        <div style="text-align: center; padding: 15px; background: #ffebee; border-radius: 10px;">
                            <div style="font-size: 1.5em; font-weight: bold; color: #f44336;">3</div>
                            <div style="font-size: 0.8em; color: #666;">Failed Builds</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,

    quality: `
        <div class="progress-section">
            <h2 style="color: #333; margin-bottom: 20px;">🛡️ Quality Gates Status</h2>
            <p style="color: #666; margin-bottom: 25px;">Automated quality checks and compliance validation</p>
            
            <div class="quality-gates">
                <div class="gate-category">
                    <div class="category-header">
                        <span>🔒</span>
                        Security Gates
                    </div>
                    <div class="gate-item passed">
                        <div class="gate-info">
                            <div class="gate-name">SAST Security Scan</div>
                            <div class="gate-criteria">No critical vulnerabilities</div>
                        </div>
                        <div class="gate-result result-passed">Clean</div>
                    </div>
                    <div class="gate-item passed">
                        <div class="gate-info">
                            <div class="gate-name">Dependency Check</div>
                            <div class="gate-criteria">No vulnerable dependencies</div>
                        </div>
                        <div class="gate-result result-passed">Safe</div>
                    </div>
                </div>
                
                <div class="gate-category">
                    <div class="category-header">
                        <span>🧪</span>
                        Testing Gates
                    </div>
                    <div class="gate-item passed">
                        <div class="gate-info">
                            <div class="gate-name">Unit Tests</div>
                            <div class="gate-criteria">100% test pass rate</div>
                        </div>
                        <div class="gate-result result-passed">687/687</div>
                    </div>
                    <div class="gate-item passed">
                        <div class="gate-info">
                            <div class="gate-name">Code Coverage</div>
                            <div class="gate-criteria">Minimum 80% coverage</div>
                        </div>
                        <div class="gate-result result-passed">87%</div>
                    </div>
                </div>
            </div>
        </div>
    `,

    projects: `
        <div class="requirements-form">
            <h2 style="color: #333; margin-bottom: 20px;">📋 Project Configuration</h2>
            
            <div class="form-grid">
                <div>
                    <div class="form-group">
                        <label class="form-label">🎯 Project Requirements</label>
                        <textarea 
                            class="form-textarea"
                            id="projectRequirements"
                            placeholder="Describe your Macquarie Post Trade transformation requirements..."></textarea>
                    </div>
                    
                    <button class="action-button" onclick="initializeProject()">
                        🚀 Initialize Project
                    </button>
                </div>
                
                <div class="suggestion-panel">
                    <h3 style="color: #333; margin-bottom: 15px;">💡 AI Recommendations</h3>
                    <div class="suggestion-item">
                        <div style="font-weight: 600; color: #333; margin-bottom: 5px;">🛡️ Enhanced Compliance</div>
                        <div style="font-size: 0.9em; color: #666;">Comprehensive regulatory monitoring</div>
                    </div>
                </div>
            </div>
        </div>
    `,

    compliance: `
        <div class="progress-section">
            <h2 style="color: #333; margin-bottom: 20px;">⚖️ Regulatory Compliance Dashboard</h2>
            <p style="color: #666; margin-bottom: 25px;">Real-time compliance monitoring across all jurisdictions</p>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 25px;">
                <div style="background: white; padding: 25px; border-radius: 15px; box-shadow: 0 5px 15px rgba(0,0,0,0.1); border-left: 4px solid #4CAF50;">
                    <h3 style="color: #333; margin-bottom: 15px;">🇦🇺 Australia (ASIC)</h3>
                    <div style="display: flex; flex-direction: column; gap: 10px;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span>MiFID II Compliance</span>
                            <span style="color: #4CAF50; font-weight: bold;">✓ Compliant</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span>Trade Reporting</span>
                            <span style="color: #4CAF50; font-weight: bold;">✓ Current</span>
                        </div>
                    </div>
                </div>
                
                <div style="background: white; padding: 25px; border-radius: 15px; box-shadow: 0 5px 15px rgba(0,0,0,0.1); border-left: 4px solid #4CAF50;">
                    <h3 style="color: #333; margin-bottom: 15px;">🇬🇧 United Kingdom (FCA)</h3>
                    <div style="display: flex; flex-direction: column; gap: 10px;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span>EMIR Compliance</span>
                            <span style="color: #4CAF50; font-weight: bold;">✓ Compliant</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span>CASS Rules</span>
                            <span style="color: #4CAF50; font-weight: bold;">✓ Current</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
};

export default tabTemplates;