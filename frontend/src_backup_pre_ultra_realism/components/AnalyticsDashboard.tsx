/**
 * AnalyticsDashboard - Real-time Analytics UI Component
 * 
 * Features:
 * - Real-time metrics display
 * - Interactive charts
 * - Predictive insights
 * - Customizable widgets
 * - Export functionality
 */

import React, { useState, useEffect, useCallback } from 'react';

// ============== TYPES ==============

interface MetricCard {
    id: string;
    title: string;
    value: number | string;
    change: number;
    trend: 'up' | 'down' | 'stable';
    format: 'number' | 'currency' | 'percent';
    icon: string;
}

interface ChartData {
    labels: string[];
    datasets: {
        label: string;
        data: number[];
        color: string;
    }[];
}

interface Prediction {
    metric: string;
    predicted: number;
    lowerBound: number;
    upperBound: number;
    confidence: number;
    trend: 'up' | 'down' | 'stable';
}

interface Alert {
    id: string;
    type: 'info' | 'warning' | 'error' | 'success';
    title: string;
    message: string;
    timestamp: string;
    acknowledged: boolean;
}

interface DashboardProps {
    userId: string;
    refreshInterval?: number;
    theme?: 'light' | 'dark';
}

// ============== COMPONENT ==============

export const AnalyticsDashboard: React.FC<DashboardProps> = ({
    userId,
    refreshInterval = 30000,
    theme = 'light'
}) => {
    const [metrics, setMetrics] = useState<MetricCard[]>([]);
    const [chartData, setChartData] = useState<ChartData | null>(null);
    const [predictions, setPredictions] = useState<Prediction[]>([]);
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [timeRange, setTimeRange] = useState<'1d' | '7d' | '30d' | '90d'>('7d');
    const [loading, setLoading] = useState(true);
    const [selectedWidget, setSelectedWidget] = useState<string | null>(null);

    // Load dashboard data
    const loadDashboardData = useCallback(async () => {
        try {
            setLoading(true);

            // Simulate API calls
            const [metricsData, chartsData, predictionsData, alertsData] = await Promise.all([
                fetchMetrics(timeRange),
                fetchChartData(timeRange),
                fetchPredictions(),
                fetchAlerts()
            ]);

            setMetrics(metricsData);
            setChartData(chartsData);
            setPredictions(predictionsData);
            setAlerts(alertsData);

        } catch (error) {
            console.error('Failed to load dashboard data:', error);
        } finally {
            setLoading(false);
        }
    }, [timeRange]);

    useEffect(() => {
        loadDashboardData();

        const interval = setInterval(loadDashboardData, refreshInterval);
        return () => clearInterval(interval);
    }, [loadDashboardData, refreshInterval]);

    // Render metric card
    const renderMetricCard = (metric: MetricCard) => {
        const formatValue = (value: number | string, format: string) => {
            if (typeof value === 'string') return value;
            switch (format) {
                case 'currency':
                    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
                case 'percent':
                    return `${value.toFixed(1)}%`;
                default:
                    return new Intl.NumberFormat('en-US').format(value);
            }
        };

        const trendColors = {
            up: '#10B981',
            down: '#EF4444',
            stable: '#6B7280'
        };

        const trendIcons = {
            up: '↑',
            down: '↓',
            stable: '→'
        };

        return (
            <div
                key={metric.id}
                className="metric-card"
                style={{
                    background: theme === 'dark' ? '#1F2937' : '#FFFFFF',
                    borderRadius: '12px',
                    padding: '20px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    transition: 'transform 0.2s',
                    cursor: 'pointer'
                }}
                onClick={() => setSelectedWidget(metric.id)}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <p style={{
                            color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
                            fontSize: '14px',
                            marginBottom: '8px'
                        }}>
                            {metric.title}
                        </p>
                        <h3 style={{
                            color: theme === 'dark' ? '#FFFFFF' : '#111827',
                            fontSize: '28px',
                            fontWeight: 'bold',
                            margin: 0
                        }}>
                            {formatValue(metric.value, metric.format)}
                        </h3>
                    </div>
                    <span style={{ fontSize: '24px' }}>{metric.icon}</span>
                </div>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginTop: '12px',
                    color: trendColors[metric.trend]
                }}>
                    <span style={{ marginRight: '4px' }}>{trendIcons[metric.trend]}</span>
                    <span style={{ fontSize: '14px' }}>
                        {metric.change >= 0 ? '+' : ''}{metric.change.toFixed(1)}%
                    </span>
                    <span style={{
                        color: theme === 'dark' ? '#6B7280' : '#9CA3AF',
                        marginLeft: '8px',
                        fontSize: '12px'
                    }}>
                        vs last period
                    </span>
                </div>
            </div>
        );
    };

    // Render chart
    const renderChart = () => {
        if (!chartData) return null;

        return (
            <div
                className="chart-container"
                style={{
                    background: theme === 'dark' ? '#1F2937' : '#FFFFFF',
                    borderRadius: '12px',
                    padding: '24px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{
                        margin: 0,
                        color: theme === 'dark' ? '#FFFFFF' : '#111827',
                        fontSize: '18px',
                        fontWeight: '600'
                    }}>
                        Check Volume Trend
                    </h3>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        {(['1d', '7d', '30d', '90d'] as const).map(range => (
                            <button
                                key={range}
                                onClick={() => setTimeRange(range)}
                                style={{
                                    padding: '6px 12px',
                                    borderRadius: '6px',
                                    border: 'none',
                                    background: timeRange === range
                                        ? '#3B82F6'
                                        : (theme === 'dark' ? '#374151' : '#F3F4F6'),
                                    color: timeRange === range
                                        ? '#FFFFFF'
                                        : (theme === 'dark' ? '#D1D5DB' : '#374151'),
                                    cursor: 'pointer',
                                    fontSize: '13px'
                                }}
                            >
                                {range}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Chart visualization placeholder */}
                <div style={{
                    height: '300px',
                    background: theme === 'dark' ? '#111827' : '#F9FAFB',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'space-around',
                    padding: '20px'
                }}>
                    {chartData.datasets[0].data.map((value, index) => (
                        <div
                            key={index}
                            style={{
                                width: `${80 / chartData.labels.length}%`,
                                height: `${(value / Math.max(...chartData.datasets[0].data)) * 100}%`,
                                background: 'linear-gradient(180deg, #3B82F6 0%, #1D4ED8 100%)',
                                borderRadius: '4px 4px 0 0',
                                transition: 'height 0.3s ease'
                            }}
                            title={`${chartData.labels[index]}: ${value}`}
                        />
                    ))}
                </div>

                {/* Legend */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    marginTop: '16px',
                    gap: '24px'
                }}>
                    {chartData.datasets.map(dataset => (
                        <div key={dataset.label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{
                                width: '12px',
                                height: '12px',
                                borderRadius: '2px',
                                background: dataset.color
                            }} />
                            <span style={{
                                fontSize: '13px',
                                color: theme === 'dark' ? '#9CA3AF' : '#6B7280'
                            }}>
                                {dataset.label}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    // Render predictions
    const renderPredictions = () => {
        return (
            <div
                className="predictions-container"
                style={{
                    background: theme === 'dark' ? '#1F2937' : '#FFFFFF',
                    borderRadius: '12px',
                    padding: '24px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}
            >
                <h3 style={{
                    margin: '0 0 20px 0',
                    color: theme === 'dark' ? '#FFFFFF' : '#111827',
                    fontSize: '18px',
                    fontWeight: '600'
                }}>
                    🔮 AI Predictions (Next 7 Days)
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {predictions.map(prediction => (
                        <div
                            key={prediction.metric}
                            style={{
                                background: theme === 'dark' ? '#111827' : '#F9FAFB',
                                borderRadius: '8px',
                                padding: '16px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}
                        >
                            <div>
                                <p style={{
                                    margin: '0 0 4px 0',
                                    color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
                                    fontSize: '13px'
                                }}>
                                    {prediction.metric}
                                </p>
                                <p style={{
                                    margin: 0,
                                    color: theme === 'dark' ? '#FFFFFF' : '#111827',
                                    fontSize: '20px',
                                    fontWeight: '600'
                                }}>
                                    {new Intl.NumberFormat('en-US').format(prediction.predicted)}
                                </p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    color: prediction.trend === 'up' ? '#10B981' : prediction.trend === 'down' ? '#EF4444' : '#6B7280'
                                }}>
                                    <span>{prediction.trend === 'up' ? '↑' : prediction.trend === 'down' ? '↓' : '→'}</span>
                                    <span style={{ fontSize: '14px' }}>{prediction.trend}</span>
                                </div>
                                <p style={{
                                    margin: '4px 0 0 0',
                                    fontSize: '12px',
                                    color: theme === 'dark' ? '#6B7280' : '#9CA3AF'
                                }}>
                                    {(prediction.confidence * 100).toFixed(0)}% confidence
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    // Render alerts
    const renderAlerts = () => {
        const alertStyles = {
            info: { bg: '#DBEAFE', border: '#3B82F6', icon: 'ℹ️' },
            warning: { bg: '#FEF3C7', border: '#F59E0B', icon: '⚠️' },
            error: { bg: '#FEE2E2', border: '#EF4444', icon: '❌' },
            success: { bg: '#D1FAE5', border: '#10B981', icon: '✅' }
        };

        return (
            <div
                className="alerts-container"
                style={{
                    background: theme === 'dark' ? '#1F2937' : '#FFFFFF',
                    borderRadius: '12px',
                    padding: '24px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}
            >
                <h3 style={{
                    margin: '0 0 20px 0',
                    color: theme === 'dark' ? '#FFFFFF' : '#111827',
                    fontSize: '18px',
                    fontWeight: '600'
                }}>
                    🔔 Recent Alerts
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '300px', overflowY: 'auto' }}>
                    {alerts.map(alert => {
                        const style = alertStyles[alert.type];
                        return (
                            <div
                                key={alert.id}
                                style={{
                                    background: theme === 'dark' ? '#111827' : style.bg,
                                    borderLeft: `4px solid ${style.border}`,
                                    borderRadius: '4px',
                                    padding: '12px 16px',
                                    opacity: alert.acknowledged ? 0.6 : 1
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <span>{style.icon}</span>
                                        <div>
                                            <p style={{
                                                margin: '0 0 4px 0',
                                                fontWeight: '500',
                                                color: theme === 'dark' ? '#FFFFFF' : '#111827',
                                                fontSize: '14px'
                                            }}>
                                                {alert.title}
                                            </p>
                                            <p style={{
                                                margin: 0,
                                                color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
                                                fontSize: '13px'
                                            }}>
                                                {alert.message}
                                            </p>
                                        </div>
                                    </div>
                                    <span style={{
                                        fontSize: '11px',
                                        color: theme === 'dark' ? '#6B7280' : '#9CA3AF'
                                    }}>
                                        {new Date(alert.timestamp).toLocaleTimeString()}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    if (loading && metrics.length === 0) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '400px',
                color: theme === 'dark' ? '#9CA3AF' : '#6B7280'
            }}>
                Loading dashboard...
            </div>
        );
    }

    return (
        <div
            className="analytics-dashboard"
            style={{
                padding: '24px',
                background: theme === 'dark' ? '#111827' : '#F3F4F6',
                minHeight: '100vh'
            }}
        >
            {/* Header */}
            <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{
                        margin: '0 0 4px 0',
                        color: theme === 'dark' ? '#FFFFFF' : '#111827',
                        fontSize: '24px',
                        fontWeight: '700'
                    }}>
                        Analytics Dashboard
                    </h1>
                    <p style={{
                        margin: 0,
                        color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
                        fontSize: '14px'
                    }}>
                        Real-time insights and predictions
                    </p>
                </div>
                <button
                    onClick={loadDashboardData}
                    style={{
                        padding: '10px 20px',
                        background: '#3B82F6',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500'
                    }}
                >
                    🔄 Refresh
                </button>
            </div>

            {/* Metric Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '20px',
                marginBottom: '24px'
            }}>
                {metrics.map(renderMetricCard)}
            </div>

            {/* Charts and Predictions */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr',
                gap: '24px',
                marginBottom: '24px'
            }}>
                {renderChart()}
                {renderPredictions()}
            </div>

            {/* Alerts */}
            {renderAlerts()}
        </div>
    );
};

// ============== DATA FETCHING (Simulated) ==============

async function fetchMetrics(timeRange: string): Promise<MetricCard[]> {
    await new Promise(resolve => setTimeout(resolve, 300));

    return [
        {
            id: 'total_checks',
            title: 'Total Checks',
            value: 1234 + Math.floor(Math.random() * 100),
            change: 12.5,
            trend: 'up',
            format: 'number',
            icon: '📝'
        },
        {
            id: 'total_amount',
            title: 'Total Amount',
            value: 875000 + Math.floor(Math.random() * 50000),
            change: 8.3,
            trend: 'up',
            format: 'currency',
            icon: '💰'
        },
        {
            id: 'approval_rate',
            title: 'Approval Rate',
            value: 94.5 + Math.random() * 2,
            change: 2.1,
            trend: 'up',
            format: 'percent',
            icon: '✅'
        },
        {
            id: 'fraud_blocked',
            title: 'Fraud Blocked',
            value: 23 + Math.floor(Math.random() * 5),
            change: -15.2,
            trend: 'down',
            format: 'number',
            icon: '🛡️'
        }
    ];
}

async function fetchChartData(timeRange: string): Promise<ChartData> {
    await new Promise(resolve => setTimeout(resolve, 200));

    const labels = timeRange === '1d'
        ? ['12AM', '4AM', '8AM', '12PM', '4PM', '8PM']
        : timeRange === '7d'
            ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
            : ['Week 1', 'Week 2', 'Week 3', 'Week 4'];

    return {
        labels,
        datasets: [
            {
                label: 'Checks Created',
                data: labels.map(() => 100 + Math.floor(Math.random() * 200)),
                color: '#3B82F6'
            },
            {
                label: 'Checks Approved',
                data: labels.map(() => 80 + Math.floor(Math.random() * 180)),
                color: '#10B981'
            }
        ]
    };
}

async function fetchPredictions(): Promise<Prediction[]> {
    await new Promise(resolve => setTimeout(resolve, 200));

    return [
        {
            metric: 'Expected Check Volume',
            predicted: 1450,
            lowerBound: 1300,
            upperBound: 1600,
            confidence: 0.89,
            trend: 'up'
        },
        {
            metric: 'Projected Revenue',
            predicted: 95000,
            lowerBound: 85000,
            upperBound: 105000,
            confidence: 0.85,
            trend: 'up'
        },
        {
            metric: 'Fraud Attempts',
            predicted: 18,
            lowerBound: 12,
            upperBound: 25,
            confidence: 0.78,
            trend: 'stable'
        }
    ];
}

async function fetchAlerts(): Promise<Alert[]> {
    await new Promise(resolve => setTimeout(resolve, 150));

    return [
        {
            id: '1',
            type: 'warning',
            title: 'High Volume Detected',
            message: 'Check volume is 45% higher than usual',
            timestamp: new Date().toISOString(),
            acknowledged: false
        },
        {
            id: '2',
            type: 'success',
            title: 'Fraud Attempt Blocked',
            message: 'Suspicious check from IP 192.168.1.100 blocked',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            acknowledged: true
        },
        {
            id: '3',
            type: 'info',
            title: 'New Template Available',
            message: 'Chase Bank template updated with new security features',
            timestamp: new Date(Date.now() - 7200000).toISOString(),
            acknowledged: false
        }
    ];
}

export default AnalyticsDashboard;
