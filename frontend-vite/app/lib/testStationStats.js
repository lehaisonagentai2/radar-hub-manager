// Browser Console Test Script
// Copy and paste this into your browser console to test the station statistics

// Test script for station statistics
async function testStationStats() {
  console.log('🧪 Testing Station Statistics Functions...\n');
  
  try {
    // First, let's test the API endpoints directly
    console.log('1️⃣ Testing API endpoints...');
    
    // Import the API functions (adjust path as needed)
    const { stationsAPI, schedulesAPI } = await import('./app/lib/api.js');
    
    // Get all stations
    console.log('📡 Fetching stations...');
    const stationsResponse = await stationsAPI.getAll();
    const stations = stationsResponse.data;
    console.log(`✅ Found ${stations.length} stations:`, stations);
    
    // Get schedules for each station
    console.log('\n📅 Fetching schedules...');
    const allSchedules = {};
    
    for (let i = 0; i < stations.length; i++) {
      const station = stations[i];
      try {
        console.log(`   Fetching schedules for station ${station.name} (ID: ${station.id})...`);
        const scheduleResponse = await schedulesAPI.getByStation(station.id);
        allSchedules[station.id] = scheduleResponse.data;
        console.log(`   ✅ Found ${scheduleResponse.data.length} schedules for ${station.name}`);
        
        // Show schedule details
        scheduleResponse.data.forEach(schedule => {
          console.log(`      - ${schedule.start_hhmm} to ${schedule.end_hhmm} (Commander: ${schedule.commander || 'N/A'})`);
        });
      } catch (error) {
        console.warn(`   ⚠️ Failed to get schedules for ${station.name}:`, error.message);
        allSchedules[station.id] = [];
      }
    }
    
    console.log('\n2️⃣ Calculating current active stations...');
    
    // Calculate active stations manually
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeInMinutes = currentHour * 60 + currentMinute;
    
    console.log(`⏰ Current time: ${currentHour}:${currentMinute.toString().padStart(2, '0')} (${currentTimeInMinutes} minutes from midnight)`);
    
    let activeCount = 0;
    const activeStations = [];
    const inactiveStations = [];
    
    stations.forEach(station => {
      const schedules = allSchedules[station.id] || [];
      console.log(`\n🏢 Checking station: ${station.name}`);
      
      let isActive = false;
      
      schedules.forEach(schedule => {
        // Parse start and end times (assuming HHMM format)
        const startHour = Math.floor(parseInt(schedule.start_hhmm) / 100);
        const startMinute = parseInt(schedule.start_hhmm) % 100;
        const endHour = Math.floor(parseInt(schedule.end_hhmm) / 100);
        const endMinute = parseInt(schedule.end_hhmm) % 100;
        
        const startInMinutes = startHour * 60 + startMinute;
        let endInMinutes = endHour * 60 + endMinute;
        
        console.log(`   📋 Schedule: ${schedule.start_hhmm} (${startInMinutes}min) to ${schedule.end_hhmm} (${endInMinutes}min)`);
        
        // Handle overnight shifts
        if (endInMinutes <= startInMinutes) {
          endInMinutes += 24 * 60;
          console.log(`   🌙 Overnight shift detected, adjusted end: ${endInMinutes} minutes`);
          
          if (currentTimeInMinutes < startInMinutes) {
            const adjustedCurrentTime = currentTimeInMinutes + 24 * 60;
            if (adjustedCurrentTime >= startInMinutes && adjustedCurrentTime <= endInMinutes) {
              isActive = true;
              console.log(`   ✅ ACTIVE (overnight, early morning check)`);
            }
          } else {
            if (currentTimeInMinutes >= startInMinutes) {
              isActive = true;
              console.log(`   ✅ ACTIVE (overnight, late night check)`);
            }
          }
        } else {
          // Regular shift
          if (currentTimeInMinutes >= startInMinutes && currentTimeInMinutes <= endInMinutes) {
            isActive = true;
            console.log(`   ✅ ACTIVE (regular shift)`);
          } else {
            console.log(`   ❌ Not active (${currentTimeInMinutes} not between ${startInMinutes} and ${endInMinutes})`);
          }
        }
      });
      
      if (isActive) {
        activeCount++;
        activeStations.push(station.name);
        console.log(`   🟢 Station ${station.name} is ACTIVE`);
      } else {
        inactiveStations.push(station.name);
        console.log(`   🔴 Station ${station.name} is INACTIVE`);
      }
    });
    
    console.log('\n📊 FINAL RESULTS:');
    console.log(`📈 Tổng số trạm: ${stations.length}`);
    console.log(`🟢 Trạm đang hoạt động: ${activeCount}`);
    console.log(`🔴 Trạm không hoạt động: ${stations.length - activeCount}`);
    console.log(`\n🟢 Active stations: ${activeStations.join(', ') || 'None'}`);
    console.log(`🔴 Inactive stations: ${inactiveStations.join(', ') || 'None'}`);
    
    return {
      totalStations: stations.length,
      activeStations: activeCount,
      inactiveStations: stations.length - activeCount,
      activeStationNames: activeStations,
      inactiveStationNames: inactiveStations,
      rawData: { stations, allSchedules }
    };
    
  } catch (error) {
    console.error('❌ Error during test:', error);
    return null;
  }
}

// Run the test
console.log('🚀 Starting station statistics test...');
console.log('📝 Copy and paste this line to run the test:');
console.log('testStationStats().then(result => console.log("Test completed:", result));');

// Auto-run if you want
// testStationStats().then(result => console.log("Test completed:", result));