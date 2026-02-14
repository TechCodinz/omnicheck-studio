/**
 * AnalyticsDashboard - Enterprise BI Component
 */
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

interface DashboardData {
    totalChecks: number;
    totalAmount: number;
    fraudBlocked: number;
    activeUsers: number;
}

export const AnalyticsDashboard: React.FC = () => {
    const [data, setData] = useState<DashboardData>({
        totalChecks: 15847,
        totalAmount: 4582910.50,
        fraudBlocked: 127,
        activeUsers: 342
    });
    const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch('/api/analytics/dashboard');
                if (response.ok) {
                    const result = await response.json();
                    setData(result);
                }
            } catch (error) {
                console.error('Analytics fetch failed:', error);
            }
        };
        fetchData();
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, []);

    return (
        <Container>
            <Header>
                <Title>📊 Analytics Dashboard</Title>
                <TimeSelector>
                    {['7d', '30d', '90d'].map(t => (
                        <TimeBtn key={t} active={timeRange === t} onClick={() => setTimeRange(t as any)}>
                            {t}
                        </TimeBtn>
                    ))}
                </TimeSelector>
            </Header>

            <KPIGrid>
                <KPICard color="#4CAF50">
                    <Icon>📝</Icon>
                    <div>
                        <Value>{data.totalChecks.toLocaleString()}</Value>
                        <Label>Total Checks</Label>
                    </div>
                </KPICard>
                <KPICard color="#2196F3">
                    <Icon>💰</Icon>
                    <div>
                        <Value>${data.totalAmount.toLocaleString()}</Value>
                        <Label>Total Value</Label>
                    </div>
                </KPICard>
                <KPICard color="#F44336">
                    <Icon>🛡️</Icon>
                    <div>
                        <Value>{data.fraudBlocked}</Value>
                        <Label>Fraud Blocked</Label>
                    </div>
                </KPICard>
                <KPICard color="#9C27B0">
                    <Icon>👥</Icon>
                    <div>
                        <Value>{data.activeUsers}</Value>
                        <Label>Active Users</Label>
                    </div>
                </KPICard>
            </KPIGrid>

            <ChartSection>
                <ChartCard>
                    <h3>Check Generation Trend</h3>
                    <ChartPlaceholder>📈 Chart renders here with D3.js</ChartPlaceholder>
                </ChartCard>
                <ChartCard>
                    <h3>Fraud Hotspots</h3>
                    <ChartPlaceholder>🗺️ Heat map renders here</ChartPlaceholder>
                </ChartCard>
            </ChartSection>
        </Container>
    );
};

const Container = styled.div`padding: 24px; background: #f5f7fa; min-height: 100vh;`;
const Header = styled.header`display: flex; justify-content: space-between; margin-bottom: 24px;`;
const Title = styled.h1`font-size: 2rem; color: #333; margin: 0;`;
const TimeSelector = styled.div`display: flex; gap: 8px;`;
const TimeBtn = styled.button<{ active: boolean }>`
    padding: 8px 16px; border: none; border-radius: 20px; cursor: pointer;
    background: ${p => p.active ? '#4CAF50' : '#e0e0e0'};
    color: ${p => p.active ? 'white' : '#666'};
`;
const KPIGrid = styled.div`display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 24px;`;
const KPICard = styled.div<{ color: string }>`
    background: white; border-radius: 12px; padding: 20px; display: flex; align-items: center; gap: 16px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.08); border-left: 4px solid ${p => p.color};
`;
const Icon = styled.div`font-size: 2.5rem;`;
const Value = styled.div`font-size: 1.8rem; font-weight: 700; color: #333;`;
const Label = styled.div`font-size: 0.9rem; color: #666;`;
const ChartSection = styled.div`display: grid; grid-template-columns: 2fr 1fr; gap: 20px;`;
const ChartCard = styled.div`background: white; border-radius: 12px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);`;
const ChartPlaceholder = styled.div`height: 200px; display: flex; align-items: center; justify-content: center; color: #999;`;

export default AnalyticsDashboard;
