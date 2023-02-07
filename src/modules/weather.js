const weather = (() => {
  const appid = '&APPID=adf651a35951c9ecad77235fa8d0065d' // FREE KEY
  const metric = '&units=metric'

  async function getWeather(location) {
    try {
      let place
      if (location)
        place = `https://api.openweathermap.org/data/2.5/weather?q=${location}${appid}${metric}`
      else
        place = `https://api.openweathermap.org/data/2.5/weather?q=Zagreb${appid}${metric}`

      const response = await fetch(place, { mode: 'cors' })
      const responseJson = await response.json()
      console.log(responseJson)
      const { name, dt: currentTime } = responseJson
      const { sunrise: sunriseTime, sunset: sunsetTime } = responseJson.sys
      const {
        temp: temperature,
        temp_min: temperatureMin,
        temp_max: temperatureMax,
      } = responseJson.main
      const { main: description } = responseJson.weather[0]
      const { lat, lon } = responseJson.coord
      console.log(name)
      return {
        name,
        temperature,
        description,
        temperatureMin,
        temperatureMax,
        currentTime,
        sunriseTime,
        sunsetTime,
        lat,
        lon,
      }
    } catch (err) {
      alert(err)
      return false
    }
  }

  async function getWeatherEvery3H(lat, lon) {
    try {
      let place
      if (lat && lon)
        place = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}${appid}${metric}`
      else
        place = `https://api.openweathermap.org/data/2.5/weather?q=Zagreb${appid}${metric}`

      const response = await fetch(place, { mode: 'cors' })
      const responseJson = await response.json()
      return responseJson
    } catch (err) {
      alert(err)
      return false
    }
  }

  return { getWeather, getWeatherEvery3H }
})()

export default weather
