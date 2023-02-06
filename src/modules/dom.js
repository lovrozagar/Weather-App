import weather from './weather'

const dom = (() => {
  function loadContent() {
    renderLocationInfo('Zagreb')
    initLocationSearch()
    // document.querySelector('video').playbackRate = 0.5
  }

  function initLocationSearch() {
    const locationInput = document.getElementById('location-input')
    const form = document.getElementById('location-form')
    form.addEventListener('submit', (e) => {
      e.preventDefault()
      renderLocationInfo(locationInput.value)
    })
  }

  async function renderLocationInfo(location) {
    const locationMain = document.getElementById('location')
    const temperatureMain = document.getElementById('temperature')
    const descriptionMain = document.getElementById('description')
    const temperatureMinMain = document.getElementById('temperature-min')
    const temperatureMaxMain = document.getElementById('temperature-max')

    const { name, temperature, description, temperatureMin, temperatureMax } =
      await weather.getWeather(location)

    locationMain.textContent = name
    temperatureMain.textContent = temperature
    descriptionMain.textContent = description
    temperatureMinMain.textContent = temperatureMin
    temperatureMaxMain.textContent = temperatureMax
  }

  return { loadContent }
})()

export default dom
