// Example usage of the station statistics functions

import { calculateStationStats, getStationStats } from './utils';
import { stationsAPI, schedulesAPI,type Station } from './api';

// Method 1: Use the comprehensive async function
export async function fetchAndCalculateStats() {
  try {
    const stats = await getStationStats();
    console.log('📊 Station Statistics:');
    console.log(`   Tổng số trạm: ${stats.totalStations}`);
    console.log(`   Trạm đang hoạt động: ${stats.activeStations}`);
    console.log(`   Trạm không hoạt động: ${stats.inactiveStations}`);
    return stats;
  } catch (error) {
    console.error('Error fetching station stats:', error);
    return null;
  }
}

// Method 2: Use with existing data (for components that already have the data)
export function calculateStatsFromExistingData(stations: any[], allSchedules: Record<number, any[]>) {
  const stats = calculateStationStats(stations, allSchedules);
  console.log('📊 Station Statistics (from existing data):');
  console.log(`   Tổng số trạm: ${stats.totalStations}`);
  console.log(`   Trạm đang hoạt động: ${stats.activeStations}`);
  console.log(`   Trạm không hoạt động: ${stats.inactiveStations}`);
  return stats;
}

// Method 3: Manual calculation with detailed loading
export async function manualStationStatsCalculation() {
  try {
    console.log('🔄 Loading stations...');
    const stationsResponse = await stationsAPI.getAll();
    const stations = stationsResponse.data;
    
    console.log('🔄 Loading schedules for all stations...');
    const allSchedules: Record<number, any[]> = {};
    
    for (const station of stations) {
      try {
        const scheduleResponse = await schedulesAPI.getByStation(station.id);
        allSchedules[station.id] = scheduleResponse.data;
        console.log(`✅ Loaded ${scheduleResponse.data.length} schedules for station ${station.name}`);
      } catch (error) {
        console.warn(`⚠️ Failed to load schedules for station ${station.name}:`, error);
        allSchedules[station.id] = [];
      }
    }
    
    // Calculate stats
    const stats = calculateStationStats(stations, allSchedules);
    
    return {
      ...stats,
      stationDetails: stations.map((station: Station) => ({
        ...station,
        schedules: allSchedules[station.id] || [],
        isActive: allSchedules[station.id]?.some(schedule => {
          // Add your active check logic here
          return true; // Simplified for example
        }) || false
      }))
    };
    
  } catch (error) {
    console.error('Error in manual calculation:', error);
    throw error;
  }
}

// Example of how to use in a React component:
/*
import { useState, useEffect } from 'react';
import { fetchAndCalculateStats } from './stationStatsExample';

export function StationStatsComponent() {
  const [stats, setStats] = useState({ totalStations: 0, activeStations: 0, inactiveStations: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      try {
        const result = await fetchAndCalculateStats();
        if (result) {
          setStats(result);
        }
      } catch (error) {
        console.error('Failed to load station stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
    
    // Refresh every 30 seconds
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div>Đang tải thống kê trạm...</div>;
  }

  return (
    <div className="station-stats">
      <h3>Thống Kê Trạm Radar</h3>
      <div className="stats-grid">
        <div className="stat-item">
          <span className="label">Tổng số trạm:</span>
          <span className="value">{stats.totalStations}</span>
        </div>
        <div className="stat-item">
          <span className="label">Đang hoạt động:</span>
          <span className="value active">{stats.activeStations}</span>
        </div>
        <div className="stat-item">
          <span className="label">Không hoạt động:</span>
          <span className="value inactive">{stats.inactiveStations}</span>
        </div>
      </div>
    </div>
  );
}
*/