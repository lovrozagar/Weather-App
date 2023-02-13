const weather = (() => {
  const appid = '20f7632ffc2c022654e4093c6947b4f4' // KEY

  function getCityCoordinatesUrl(cityName) {
    return `https://api.openweathermap.org/data/2.5/weather?q=${cityName}&APPID=${appid}&units=metric`
  }

  function getLocationForecastUrl(main, unit) {
    return `https://api.openweathermap.org/data/2.5/onecall?lat=${main.lat}&lon=${main.lon}&exclude=minutely,alerts&units=${unit}&appid=${appid}`
  }

  async function getCoordinates(cityName) {
    try {
      // GET LOCATION COORDINATES TO FETCH FORECAST LATER
      const coordinatesUrl = getCityCoordinatesUrl(cityName)
      const coordinatesResponse = await fetch(coordinatesUrl, { mode: 'cors' })

      // IF NOT OK THROW ERROR
      if (!coordinatesResponse.ok) {
        throw new Error('Bad response')
      }

      const weatherData = await coordinatesResponse.json()
      const { coord: main } = weatherData

      // GET LOCATION NAME AS IT IS NOT IN THE FORECAST
      main.name = weatherData.name
      main.minTemp = weatherData.main.temp_min
      main.maxTemp = weatherData.main.temp_max
      return main
    } catch (err) {
      return 'error'
    }
  }

  async function getForecastData(main, unit = 'metric') {
    // GET LOCATION FORECAST
    const forecastUrl = getLocationForecastUrl(main, unit)
    const weatherResponse = await fetch(forecastUrl, { mode: 'cors' })
    const weatherData = await weatherResponse.json()
    // ADD LOCATION NAME TO WEATHER DATA
    weatherData.name = main.name
    weatherData.minTemp = main.minTemp
    weatherData.maxTemp = main.maxTemp
    return weatherData
  }

  async function getWeatherData(cityName, unit = 'metric') {
    // CALLS EVERYTHING NECESSARY TO GET WEATHER DATA, DOM MODULE SHOULD CALL THIS FUNCTION
    const coords = await getCoordinates(cityName)
    if (coords === 'error') return 'error'
    const forecastData = await getForecastData(coords, unit)
    return forecastData
  }

  return { getWeatherData, getForecastData }
})()

export default weather
