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
  const [hours, minutes] = timeStr.split(':').map(Number);
  return { hours, minutes };
}

export function isStationActiveAtHour(schedules: any[], hour: number): { isActive: boolean; fillRatio: number } {
  const today = new Date();
  const hourStart = new Date(today);
  hourStart.setHours(hour, 0, 0, 0);
  const hourEnd = new Date(today);
  hourEnd.setHours(hour, 59, 59, 999);

  let totalMinutesInHour = 0;
  
  schedules.forEach(schedule => {
    const startTime = parseTimeString(schedule.start_hhmm);
    const endTime = parseTimeString(schedule.end_hhmm);
    
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
    }
  });
  
  const fillRatio = Math.min(totalMinutesInHour / 60, 1);
  return {
    isActive: fillRatio > 0,
    fillRatio
  };
}

export function getActiveStationCount(stations: any[], allSchedules: Record<number, any[]>): number {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTimeInMinutes = currentHour * 60 + currentMinute;

  return stations.filter(station => {
    const schedules = allSchedules[station.id] || [];
    return schedules.some(schedule => {
      const startTime = parseTimeString(schedule.start_hhmm);
      const endTime = parseTimeString(schedule.end_hhmm);
      
      const startInMinutes = startTime.hours * 60 + startTime.minutes;
      let endInMinutes = endTime.hours * 60 + endTime.minutes;
      
      // Handle overnight shifts
      if (endInMinutes <= startInMinutes) {
        endInMinutes += 24 * 60;
        if (currentTimeInMinutes < startInMinutes) {
          return currentTimeInMinutes + 24 * 60 >= startInMinutes && currentTimeInMinutes + 24 * 60 <= endInMinutes;
        }
      }
      
      return currentTimeInMinutes >= startInMinutes && currentTimeInMinutes <= endInMinutes;
    });
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
