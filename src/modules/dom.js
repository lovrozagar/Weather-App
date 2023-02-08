import weather from './weather'

// TODO: render weather every 3H
// TODO: celsius to farrenheit
// TODO: handle 3h on wrong input
// TODO: handle haze weather state
// TODO: use first fetch for lat and lon only
const dom = (() => {
  async function loadContent() {
    const weatherData = await weather.getWeatherData('karlovac')
    console.log(weatherData)
  }

  return { loadContent }
})()

export default dom
