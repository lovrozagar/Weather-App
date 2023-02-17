const weather = (() => {
  const appid = '20f7632ffc2c022654e4093c6947b4f4' // KEY

  function getLocationForecastUrl(main, unit) {
    return `https://api.openweathermap.org/data/2.5/onecall?lat=${main.lat}&lon=${main.lon}&exclude=minutely,alerts&units=${unit}&appid=${appid}`
  }

  async function getForecastData(main, unit = 'metric') {
    // GET LOCATION FORECAST
    const forecastUrl = getLocationForecastUrl(main, unit)
    const weatherResponse = await fetch(forecastUrl, { mode: 'cors' })
    const weatherData = await weatherResponse.json()
    // ADD LOCATION NAME TO WEATHER DATA
    weatherData.name = main.name
    // ADD UNIT TYPE TO WEATHER DATA
    weatherData.unit = unit

    return weatherData
  }

  function getAutocompleteDataUrl(query) {
    return `https://api.jawg.io/places/v1/autocomplete?lang=en?&access-token=wRzoCQ4SHP0kxAtvyM119DxZ0tHsBTB5Y3SC4Tt71eI262JZv0PznWGw5EndVkzA&layers=country,locality,neighbourhood&text=${query}`
  }

  async function getAutocompleteData(query) {
    const response = await fetch(getAutocompleteDataUrl(query), {
      mode: 'cors',
    })
    const data = await response.json()
    return data.features
  }

  async function getSuggestions(query) {
    const response = await fetch(
      `https://api.openweathermap.org/geo/1.0/direct?q={${query}}&limit=5&appid=20f7632ffc2c022654e4093c6947b4f4`,
      { mode: 'cors' }
    )
    const suggestions = await response.json()
    console.log(suggestions)
  }

  return { getForecastData, getAutocompleteData, getSuggestions }
})()

export default weather
