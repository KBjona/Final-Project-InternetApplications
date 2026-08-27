function mapWeatherCode(code, tempC) {
  if (code === 0 || code === 1) return tempC > 25 ? 'Hot' : 'Sunny';
  if (code >= 51 && code <= 67 || code >= 80 && code <= 82) return 'Rainy';
  if (code >= 71 && code <= 77 || code >= 85 && code <= 86) return 'Snowy';
  if (tempC < 10) return 'Cold';
  return 'Cloudy';
}

async function getLocalWeather(lat, lon) {
  try {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`
    );
    if (!response.ok) return null;

    const data = await response.json();
    const weather = data.current_weather;
    
    return {
      temperature: weather.temperature,
      weatherCode: weather.weathercode,
      conditionTag: mapWeatherCode(weather.weathercode, weather.temperature)
    };
  } catch (err) {
    console.error('Failed to fetch weather from Open-Meteo:', err);
    return null;
  }
}

module.exports = { getLocalWeather };