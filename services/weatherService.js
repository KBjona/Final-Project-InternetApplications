async function getCurrentSeason(lat, lon) {
  try {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = String(today.getMonth() + 1).padStart(2, '0');
    const currentDay = String(today.getDate()).padStart(2, '0');
    const todayMonthDay = `${currentMonth}-${currentDay}`;
    const isNorthern = Number(lat) >= 0;

    const startDate = `${currentYear - 3}-01-01`;
    const endDate = `${currentYear - 1}-12-31`;
    const archiveUrl = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${startDate}&end_date=${endDate}&daily=temperature_2m_mean&timezone=auto`;

    const archiveRes = await fetch(archiveUrl).then(res => res.json());
    const times = archiveRes.daily?.time || [];
    const temps = archiveRes.daily?.temperature_2m_mean || [];

    const historicalTemps = temps.filter(temp => temp !== null);

    let historicalAvg = null;

    if (historicalTemps.length > 0) {
      historicalAvg =
      historicalTemps.reduce((sum, temp) => sum + temp, 0) /
      historicalTemps.length;
    }

    const forecastUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_mean&forecast_days=7&timezone=auto`;
    const forecastRes = await fetch(forecastUrl).then(res => res.json());
    const dailyTemps = forecastRes.daily?.temperature_2m_mean || [];

    if (dailyTemps.length === 0) {
      console.error("No temperature data");
      return null;
    }

    const currentTemp = dailyTemps.reduce((sum, temp) => sum + temp, 0) / dailyTemps.length;

    if (currentTemp === undefined || currentTemp === null) {
      console.error("No temp");
      return null;
    }

    const tempDifference = historicalAvg !== null ? (currentTemp - historicalAvg) : 0;
    
    const evaluatedTemp = currentTemp;
    if (tempDifference > 5 && evaluatedTemp > 20) {
      return 'Hot';
    }
    if (tempDifference < -5 && evaluatedTemp < 20){
      return 'Cold';
    }
    if (tempDifference > 2 && evaluatedTemp > 15){
      return 'Warm';
    }
    if (tempDifference < -2 && evaluatedTemp < 15){
      return 'Cool';
    }
    // Standard transitional season fallback based on calendar month

    const month = today.getMonth() + 1;
    if (month >= 3 && month <= 5) return isNorthern ? 'Warm' : 'Cool';
    if (month >= 6 && month <= 8) return isNorthern ? 'Hot' : 'Cold';
    if (month >= 9 && month <= 11) return isNorthern ? 'Cool' : 'Warm';
    return isNorthern ? 'Cold' : 'Hot';

  } catch (error) {
    console.error('Error calculating historical weather season:', error);
    return null;
  }
}

module.exports = { getCurrentSeason };