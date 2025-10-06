import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, parseISO, isWithinInterval, startOfDay, endOfDay } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(timestamp: number): string {
  return format(new Date(timestamp * 1000), 'HH:mm dd/MM/yyyy');
}

export function parseTimeString(timeStr: string): { hours: number; minutes: number } {
  // Handle both HHMM and HH:MM formats
  if (timeStr.includes(':')) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return { hours, minutes };
  } else {
    // Handle HHMM format (e.g., "0800", "1630")
    const hours = parseInt(timeStr.slice(0, 2), 10);
    const minutes = parseInt(timeStr.slice(2, 4), 10);
    return { hours, minutes };
  }
}

export function isStationActiveAtHour(schedules: any[], hour: number): { isActive: boolean; fillRatio: number } {
  const today = new Date();
  const hourStart = new Date(today);
  hourStart.setHours(hour, 0, 0, 0);
  const hourEnd = new Date(today);
  hourEnd.setHours(hour, 59, 59, 999);

  let totalMinutesInHour = 0;
  
  // Debug logging
  console.log(`Checking hour ${hour}, schedules:`, schedules);
  
  schedules.forEach(schedule => {
    const startTime = parseTimeString(schedule.start_hhmm);
    const endTime = parseTimeString(schedule.end_hhmm);
    
    console.log(`Schedule: ${schedule.start_hhmm} - ${schedule.end_hhmm}`, startTime, endTime);
    
    const scheduleStart = new Date(today);
    scheduleStart.setHours(startTime.hours, startTime.minutes, 0, 0);
    
    const scheduleEnd = new Date(today);
    scheduleEnd.setHours(endTime.hours, endTime.minutes, 0, 0);
    
    // Handle overnight shifts
    if (scheduleEnd <= scheduleStart) {
      scheduleEnd.setDate(scheduleEnd.getDate() + 1);
    }
    
    // Check overlap with current hour
    const overlapStart = new Date(Math.max(hourStart.getTime(), scheduleStart.getTime()));
    const overlapEnd = new Date(Math.min(hourEnd.getTime(), scheduleEnd.getTime()));
    
    if (overlapStart < overlapEnd) {
      const overlapMinutes = (overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60);
      totalMinutesInHour += overlapMinutes;
      console.log(`Found overlap: ${overlapMinutes} minutes`);
    }
  });  const fillRatio = Math.min(totalMinutesInHour / 60, 1);
  const result = {
    isActive: fillRatio > 0,
    fillRatio
  };
  
  console.log(`Hour ${hour} result:`, result, `Total minutes: ${totalMinutesInHour}`);
  return result;
}

export function getActiveStationCount(stations: any[], allSchedules: Record<number, any[]>): number {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTimeInMinutes = currentHour * 60 + currentMinute;
  
  console.log(`Current time: ${currentHour}:${currentMinute} (${currentTimeInMinutes} minutes)`);
  console.log('All schedules:', allSchedules);

  return stations.filter(station => {
    const schedules = allSchedules[station.id] || [];
    console.log(`Checking station ${station.name} (ID: ${station.id}), schedules:`, schedules);
    
    const isActive = schedules.some(schedule => {
      const startTime = parseTimeString(schedule.start_hhmm);
      const endTime = parseTimeString(schedule.end_hhmm);
      
      const startInMinutes = startTime.hours * 60 + startTime.minutes;
      let endInMinutes = endTime.hours * 60 + endTime.minutes;
      
      console.log(`  Schedule: ${schedule.start_hhmm}-${schedule.end_hhmm} (${startInMinutes}-${endInMinutes} minutes)`);
      
      // Handle overnight shifts
      if (endInMinutes <= startInMinutes) {
        endInMinutes += 24 * 60;
        if (currentTimeInMinutes < startInMinutes) {
          const result = currentTimeInMinutes + 24 * 60 >= startInMinutes && currentTimeInMinutes + 24 * 60 <= endInMinutes;
          console.log(`  Overnight shift check (early morning): ${result}`);
          return result;
        }
      }
      
      const result = currentTimeInMinutes >= startInMinutes && currentTimeInMinutes <= endInMinutes;
      console.log(`  Regular shift check: ${result}`);
      return result;
    });
    
    console.log(`Station ${station.name} is ${isActive ? 'ACTIVE' : 'INACTIVE'}`);
    return isActive;
  }).length;
}

export function hasPermission(userRole: string, requiredRoles: string[]): boolean {
  return requiredRoles.includes(userRole);
}

export function formatRole(role: string): string {
  switch (role) {
    case 'ADMIN':
      return 'Quản trị viên';
    case 'HQ':
      return 'Sở chỉ huy';
    case 'OPERATOR':
      return 'Vận hành viên';
    default:
      return role;
  }
}

export function calculateStationStats(stations: any[], allSchedules: Record<number, any[]>) {
  const totalStations = stations.length;
  
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTimeInMinutes = currentHour * 60 + currentMinute;
  
  console.log(`Calculating station stats at ${currentHour}:${currentMinute.toString().padStart(2, '0')} (${currentTimeInMinutes} minutes)`);
  console.log('Stations:', stations.map(s => ({ id: s.id, name: s.name })));
  console.log('All schedules:', allSchedules);
  
  let activeStations = 0;
  
  stations.forEach(station => {
    const schedules = allSchedules[station.id] || [];
    console.log(`Checking station ${station.name} (ID: ${station.id}), schedules:`, schedules);
    
    const isStationActive = schedules.some(schedule => {
      const startTime = parseTimeString(schedule.start_hhmm);
      const endTime = parseTimeString(schedule.end_hhmm);
      
      const startInMinutes = startTime.hours * 60 + startTime.minutes;
      let endInMinutes = endTime.hours * 60 + endTime.minutes;
      
      console.log(`  Schedule: ${schedule.start_hhmm}-${schedule.end_hhmm} (${startInMinutes}-${endInMinutes} minutes)`);
      
      // Handle overnight shifts
      if (endInMinutes <= startInMinutes) {
        endInMinutes += 24 * 60;
        console.log(`  Overnight shift detected, adjusted end: ${endInMinutes} minutes`);
        if (currentTimeInMinutes < startInMinutes) {
          const result = currentTimeInMinutes + 24 * 60 >= startInMinutes && 
                        currentTimeInMinutes + 24 * 60 <= endInMinutes;
          console.log(`  Overnight shift check (early morning): ${result}`);
          return result;
        }
      }
      
      const result = currentTimeInMinutes >= startInMinutes && currentTimeInMinutes <= endInMinutes;
      console.log(`  Regular shift check: ${result} (${currentTimeInMinutes} >= ${startInMinutes} && ${currentTimeInMinutes} <= ${endInMinutes})`);
      return result;
    });
    
    if (isStationActive) {
      activeStations++;
      console.log(`✅ Station ${station.name} is ACTIVE`);
    } else {
      console.log(`❌ Station ${station.name} is INACTIVE`);
    }
  });
  
  const result = {
    totalStations,
    activeStations,
    inactiveStations: totalStations - activeStations
  };
  
  console.log('📊 Final station stats:', result);
  return result;
}

export async function getAllStationsWithStatus() {
  try {
    // Import API functions dynamically to avoid circular dependencies
    const { stationsAPI, schedulesAPI } = await import('./api');
    
    // Get all stations
    const stationsResponse = await stationsAPI.getAll();
    const stations = stationsResponse.data;
    
    console.log('Loading all stations with real-time status...');
    
    // Get status for each station
    const stationStatusPromises = stations.map(async (station: any) => {
      try {
        const statusInfo = await getStationStatusById(station.id);
        return statusInfo.station;
      } catch (error) {
        console.warn(`Failed to get status for station ${station.id}:`, error);
        // Return station with original status if schedule check fails
        return {
          ...station,
          statusSource: 'database_fallback'
        };
      }
    });
    
    const stationsWithStatus = await Promise.all(stationStatusPromises);
    
    console.log('Stations with real-time status:', stationsWithStatus.map(s => ({
      name: s.name,
      status: s.status,
      source: s.statusSource
    })));
    
    return stationsWithStatus;
    
  } catch (error) {
    console.error('Error getting all stations with status:', error);
    throw error;
  }
}

export async function getStationStatusById(stationId: number) {
  try {
    // Import API functions dynamically to avoid circular dependencies
    const { stationsAPI, schedulesAPI } = await import('./api');
    
    // Get station details
    const stationResponse = await stationsAPI.getById(stationId);
    const station = stationResponse.data;
    
    // Get schedules for this station
    const scheduleResponse = await schedulesAPI.getByStation(stationId);
    const schedules = scheduleResponse.data;
    
    // Calculate current status based on schedules
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeInMinutes = currentHour * 60 + currentMinute;
    
    console.log(`Checking status for station ${station.name} at ${currentHour}:${currentMinute.toString().padStart(2, '0')}`);
    console.log('Station schedules:', schedules);
    
    let isActiveBySchedule = false;
    let activeSchedule = null;
    
    // Check if station is active according to any schedule
    for (const schedule of schedules) {
      const startTime = parseTimeString(schedule.start_hhmm);
      const endTime = parseTimeString(schedule.end_hhmm);
      
      const startInMinutes = startTime.hours * 60 + startTime.minutes;
      let endInMinutes = endTime.hours * 60 + endTime.minutes;
      
      // Handle overnight shifts
      if (endInMinutes <= startInMinutes) {
        endInMinutes += 24 * 60;
        // Check if current time is in the overnight period
        if (currentTimeInMinutes < startInMinutes) {
          const isActive = currentTimeInMinutes + 24 * 60 >= startInMinutes && 
                          currentTimeInMinutes + 24 * 60 <= endInMinutes;
          if (isActive) {
            isActiveBySchedule = true;
            activeSchedule = schedule;
            break;
          }
        }
      }
      
      const isActive = currentTimeInMinutes >= startInMinutes && currentTimeInMinutes <= endInMinutes;
      
      if (isActive) {
        isActiveBySchedule = true;
        activeSchedule = schedule;
        console.log(`Station ${station.name} is ACTIVE with schedule ${schedule.start_hhmm}-${schedule.end_hhmm}`);
        break;
      }
    }
    
    // Determine final status
    // Priority: schedule-based status > database status > default inactive
    let finalStatus = 'inactive';
    let statusSource = 'default';
    
    if (isActiveBySchedule) {
      finalStatus = 'active';
      statusSource = 'schedule';
    } else if (station.status && station.status !== 'inactive') {
      finalStatus = station.status;
      statusSource = 'database';
    }
    
    console.log(`Station ${station.name} final status: ${finalStatus} (source: ${statusSource})`);
    
    return {
      station: {
        ...station,
        status: finalStatus,
        statusSource
      },
      schedules,
      isActiveBySchedule,
      activeSchedule,
      currentTime: `${currentHour}:${currentMinute.toString().padStart(2, '0')}`
    };
    
  } catch (error) {
    console.error(`Error getting status for station ${stationId}:`, error);
    throw error;
  }
}

export async function getStationStats() {
  try {
    // Import API functions dynamically to avoid circular dependencies
    const { stationsAPI, schedulesAPI } = await import('./api');
    
    // Get all stations
    const stationsResponse = await stationsAPI.getAll();
    const stations = stationsResponse.data;
    const totalStations = stations.length;
    
    // Get schedules for all stations
    const schedulePromises = stations.map(async (station: any) => {
      try {
        const scheduleResponse = await schedulesAPI.getByStation(station.id);
        return {
          stationId: station.id,
          station: station,
          schedules: scheduleResponse.data
        };
      } catch (error) {
        console.warn(`Failed to load schedules for station ${station.id}:`, error);
        return {
          stationId: station.id,
          station: station,
          schedules: []
        };
      }
    });
    
    const allStationSchedules = await Promise.all(schedulePromises);
    
    // Calculate active stations
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeInMinutes = currentHour * 60 + currentMinute;
    
    let activeStations = 0;
    
    console.log(`Calculating station stats at ${currentHour}:${currentMinute.toString().padStart(2, '0')}`);
    
    allStationSchedules.forEach(({ station, schedules }) => {
      const isStationActive = schedules.some((schedule: any) => {
        const startTime = parseTimeString(schedule.start_hhmm);
        const endTime = parseTimeString(schedule.end_hhmm);
        
        const startInMinutes = startTime.hours * 60 + startTime.minutes;
        let endInMinutes = endTime.hours * 60 + endTime.minutes;
        
        // Handle overnight shifts
        if (endInMinutes <= startInMinutes) {
          endInMinutes += 24 * 60;
          // Check if current time is in the overnight period
          if (currentTimeInMinutes < startInMinutes) {
            return currentTimeInMinutes + 24 * 60 >= startInMinutes && 
                   currentTimeInMinutes + 24 * 60 <= endInMinutes;
          }
        }
        
        const isActive = currentTimeInMinutes >= startInMinutes && currentTimeInMinutes <= endInMinutes;
        
        if (isActive) {
          console.log(`Station ${station.name} is ACTIVE with schedule ${schedule.start_hhmm}-${schedule.end_hhmm}`);
        }
        
        return isActive;
      });
      
      if (isStationActive) {
        activeStations++;
      }
    });
    
    console.log(`Station Stats: ${activeStations}/${totalStations} stations active`);
    
    return {
      totalStations,
      activeStations,
      inactiveStations: totalStations - activeStations,
      stationDetails: allStationSchedules
    };
    
  } catch (error) {
    console.error('Error calculating station stats:', error);
    return {
      totalStations: 0,
      activeStations: 0,
      inactiveStations: 0,
      stationDetails: []
    };
  }
}


export async function getStationsStatus(): Promise<Map<number, boolean>> {
  try {
    const { stationsAPI, schedulesAPI } = await import('./api');
    
    const stationsResponse = await stationsAPI.getAll();
    const stations = stationsResponse.data;
    
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeInMinutes = currentHour * 60 + currentMinute;
    
    const statusMap = new Map<number, boolean>();
    
    for (const station of stations) {
      try {
        const scheduleResponse = await schedulesAPI.getByStation(station.id);
        const schedules = scheduleResponse.data;
        
        const isActive = schedules.some((schedule: any) => {
          const startTime = parseTimeString(schedule.start_hhmm);
          const endTime = parseTimeString(schedule.end_hhmm);
          
          const startInMinutes = startTime.hours * 60 + startTime.minutes;
          let endInMinutes = endTime.hours * 60 + endTime.minutes;
          
          // Handle overnight shifts
          if (endInMinutes <= startInMinutes) {
            endInMinutes += 24 * 60;
            if (currentTimeInMinutes < startInMinutes) {
              return currentTimeInMinutes + 24 * 60 >= startInMinutes && 
                     currentTimeInMinutes + 24 * 60 <= endInMinutes;
            }
          }
          
          return currentTimeInMinutes >= startInMinutes && currentTimeInMinutes <= endInMinutes;
        });
        
        statusMap.set(station.id, isActive);
      } catch (error) {
        console.warn(`Failed to get schedules for station ${station.id}:`, error);
        statusMap.set(station.id, false);
      }
    }
    
    return statusMap;
  } catch (error) {
    console.error('Error getting stations status:', error);
    return new Map<number, boolean>();
  }
}