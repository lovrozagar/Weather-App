const weather = (() => {
  const appid = '20f7632ffc2c022654e4093c6947b4f4' // KEY

  function getCityCoordinatesUrl(cityName) {
    return `https://api.openweathermap.org/data/2.5/weather?q=${cityName}&APPID=${appid}`
  }

  function getLocationForecastUrl(coordinates, unit) {
    return `https://api.openweathermap.org/data/2.5/onecall?lat=${coordinates.lat}&lon=${coordinates.lon}&exclude=minutely,alerts&units=${unit}&appid=${appid}`
  }

  async function getCoordinates(cityName) {
    // GET LOCATION COORDINATES TO FETCH FORECAST LATER
    const coordinatesUrl = getCityCoordinatesUrl(cityName)
    const coordinatesResponse = await fetch(coordinatesUrl, { mode: 'cors' })
    const weatherData = await coordinatesResponse.json()
    const { coord } = weatherData
    // GET LOCATION NAME AS IT IS NOT IN THE FORECAST
    coord.name = weatherData.name
    return coord
  }

  async function getForecastData(coordinates, unit) {
    // GET LOCATION FORECAST
    const forecastUrl = getLocationForecastUrl(coordinates, unit)
    const weatherResponse = await fetch(forecastUrl, { mode: 'cors' })
    const weatherData = await weatherResponse.json()
    // ADD LOCATION NAME TO WEATHER DATA
    weatherData.name = coordinates.name
    return weatherData
  }

  async function getWeatherData(cityName, unit = 'metric') {
    // CALLS EVERYTHING NECESSARY TO GET WEATHER DATA, DOM MODULE SHOULD CALL THIS FUNCTION
    const coords = await getCoordinates(cityName)
    const forecastData = await getForecastData(coords, unit)
    return forecastData
  }

  return { getWeatherData }
})()

export default weather
