import { WeatherCondition, WEATHER_CONDITIONS } from './db';

// Simulate weather based on month and destination
// This is a simplified simulation - in a real app, you'd use a weather API
export function simulateWeather(date: Date, destination: string): WeatherCondition {
  const month = date.getMonth();
  const destinationLower = destination.toLowerCase();

  // Seed based on date and destination for consistent results
  const seed = date.getDate() + destination.length + month;
  const random = seededRandom(seed);

  // Define weather probabilities based on season
  let weatherProbabilities: Record<WeatherCondition, number>;

  // Northern hemisphere seasons (simplified)
  const isTropical = destinationLower.includes('bali') ||
                     destinationLower.includes('thailand') ||
                     destinationLower.includes('hawaii') ||
                     destinationLower.includes('caribbean');

  const isDesert = destinationLower.includes('dubai') ||
                   destinationLower.includes('egypt') ||
                   destinationLower.includes('morocco');

  if (isTropical) {
    // Tropical: monsoon season June-October
    if (month >= 5 && month <= 9) {
      weatherProbabilities = { sunny: 0.3, cloudy: 0.3, rainy: 0.35, stormy: 0.05 };
    } else {
      weatherProbabilities = { sunny: 0.6, cloudy: 0.25, rainy: 0.12, stormy: 0.03 };
    }
  } else if (isDesert) {
    // Desert: mostly sunny
    weatherProbabilities = { sunny: 0.75, cloudy: 0.2, rainy: 0.04, stormy: 0.01 };
  } else {
    // Temperate climate
    if (month >= 11 || month <= 1) {
      // Winter
      weatherProbabilities = { sunny: 0.25, cloudy: 0.35, rainy: 0.3, stormy: 0.1 };
    } else if (month >= 2 && month <= 4) {
      // Spring
      weatherProbabilities = { sunny: 0.4, cloudy: 0.3, rainy: 0.25, stormy: 0.05 };
    } else if (month >= 5 && month <= 7) {
      // Summer
      weatherProbabilities = { sunny: 0.6, cloudy: 0.25, rainy: 0.1, stormy: 0.05 };
    } else {
      // Autumn
      weatherProbabilities = { sunny: 0.35, cloudy: 0.35, rainy: 0.25, stormy: 0.05 };
    }
  }

  // Select weather based on probabilities
  let cumulative = 0;
  for (const condition of WEATHER_CONDITIONS) {
    cumulative += weatherProbabilities[condition];
    if (random < cumulative) {
      return condition;
    }
  }

  return 'sunny';
}

// Simple seeded random number generator
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9999) * 10000;
  return x - Math.floor(x);
}

// Check if weather has changed (for cron job simulation)
export function hasWeatherChanged(_currentWeather: WeatherCondition): boolean {
  // 20% chance of weather change for simulation
  const random = Math.random();
  return random < 0.2;
}

// Get new weather (different from current)
export function getNewWeather(currentWeather: WeatherCondition, date: Date, destination: string): WeatherCondition {
  const newWeather = simulateWeather(new Date(date.getTime() + Math.random() * 86400000), destination);
  if (newWeather === currentWeather) {
    // If same, shift to next condition
    const currentIndex = WEATHER_CONDITIONS.indexOf(currentWeather);
    return WEATHER_CONDITIONS[(currentIndex + 1) % WEATHER_CONDITIONS.length];
  }
  return newWeather;
}
