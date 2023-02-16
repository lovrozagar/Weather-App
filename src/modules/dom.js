/* eslint-disable no-param-reassign */
import { debounce } from 'lodash'
import storage from './storage'
import utils from './utils'
import weather from './weather'

// TODO: google location
// TODO: clean code

const dom = (() => {
  function loadContent() {
    showLoadingScreen()
    storage.setDefaultUnitMetric()
    displayWeatherContentSubmit('Zagreb')
    initLocationSearch()
    initLocationAutocomplete()
    initNav()
  }

  function initNav() {
    const units = document.getElementById('units')
    units.addEventListener('click', toggleUnitMenu)
    initUnitOptions()
  }

  function initUnitOptions() {
    const imperial = document.getElementById('imperial')
    const metric = document.getElementById('metric')

    imperial.addEventListener('click', displayImperialUnits)
    metric.addEventListener('click', displayMetricUnits)
  }

  function toggleUnitMenu() {
    const unitMenu = document.getElementById('units-menu')
    unitMenu.classList.toggle('active')
  }

  function hideUnitMenu() {
    const unitMenu = document.getElementById('units-menu')
    unitMenu.classList.remove('active')
  }

  // DEBOUNCE FUNCTIONs FOR AUTOCOMPLETE, IF LOCATION IS LOADED, THIS/AUTOCOMPLETE GETS CANCELED
  const onFinishTyping = debounce(displayAutocomplete, 750)

  // LOCATION SEARCH
  function initLocationSearch() {
    const form = document.getElementById('location-form')
    const searchButton = document.getElementById('search-button')

    form.addEventListener('submit', handleSearchSubmit)
    searchButton.addEventListener('click', handleSearchSubmit)
  }

  function handleSearchSubmit(e) {
    e.preventDefault()

    onFinishTyping.cancel()
    showLoadingScreen()

    const locationInput = document.getElementById('location-input')
    const searchedLocation = locationInput.value
    displayWeatherContentSubmit(searchedLocation)
  }

  // LOCATION SEARCH AUTOCOMPLETE
  function initLocationAutocomplete() {
    const locationInput = document.getElementById('location-input')
    locationInput.addEventListener('input', handleAutocomplete)
  }

  function handleAutocomplete(e) {
    if (e.target.value === '') {
      hideSuggestions()
      hideSearchErrorMessage()
      return
    }
    const formattedSearch = utils.formatInput(e.target.value)
    console.log(formattedSearch)
    showAutocompleteLoader()
    onFinishTyping(formattedSearch)
  }

  async function displayAutocomplete(query) {
    hideSearchErrorMessage()

    const suggestions = await weather.getAutocompleteData(query)
    console.log(suggestions)
    hideAutocompleteLoader()

    if (!suggestions.length) {
      showSearchErrorMessage('invalid')
      hideSuggestions()
      return
    }
    loadSuggestions(suggestions)
    initSuggestions(suggestions)
  }

  function loadSuggestions(suggestions) {
    const suggestionItems = document.querySelectorAll('[data-suggestion]')

    for (let i = 0; i < 5; i += 1) {
      // IF SUGGESTION OF i IS AVAILABLE, FILL ITS TEXT CONTENT AND DISPLAY IT'S ELEMENT
      if (suggestions[i]) {
        suggestionItems[i].textContent = getSuggestionText(
          suggestions[i].properties
        )
        showSuggestion(suggestionItems[i])
      }
      // IF SUGGESTION OF i IS NOT AVAILABLE HIDE IT'S ELEMENT
      else {
        hideSuggestion(suggestionItems[i])
      }
    }

    if (!suggestions.length) {
      showSearchErrorMessage()
    }
  }

  function getSuggestionText(suggestionObj) {
    // SUGGESTION TEXT
    const { name, country, region } = suggestionObj
    if (name === country) return name
    return `${name}, ${region}, ${country}`
  }

  function showSuggestion(el) {
    // SHOW SUGGESTION ELEMENT
    el.classList.add('active')
  }

  function hideSuggestion(el) {
    el.classList.remove('active')
  }

  function initSuggestions(suggestions) {
    const suggestionItems = document.querySelectorAll('[data-suggestion]')
    suggestionItems.forEach((item) => {
      item.suggestions = suggestions
      item.removeEventListener('click', handleSuggestionClick)
      item.addEventListener('click', handleSuggestionClick)
    })
  }

  function handleSuggestionClick(e) {
    // GET COORDINATES FROM SUGGESTION LOCATION
    const { suggestions } = e.currentTarget
    const index = [...this.parentNode.children].indexOf(this)
    const [lon, lat] = suggestions[index].geometry.coordinates
    // GET ONLY MAIN LOCATION NAME
    const { name } = suggestions[index].properties
    // DISPLAY CONTENT
    showLoadingScreen()
    displayInInput(this.textContent)
    displayWeatherContentSuggestion({ lat, lon }, name)
  }

  function hideSuggestions() {
    const suggestionItems = document.querySelectorAll('[data-suggestion]')
    onFinishTyping.cancel()
    hideAutocompleteLoader()
    suggestionItems.forEach((item) => {
      item.classList.remove('active')
    })
  }

  function displayInInput(location) {
    const locationInput = document.getElementById('location-input')
    locationInput.value = location
  }

  // SEARCH ERROR
  function hideSearchErrorMessage() {
    const errorMessage = document.getElementById('error-message')
    errorMessage.classList.remove('active')
  }

  function showSearchErrorMessage(errorString) {
    const errorMessage = document.getElementById('error-message')
    if (errorString === 'invalid') {
      errorMessage.textContent = 'Please enter a valid city or country.'
    }
    if (errorString === 'missing') {
      errorMessage.textContent = 'Please enter a city or country.'
    }
    errorMessage.classList.add('active')
  }

  // DISPLAY ALL WEATHER CONTENT
  async function displayWeatherContentSubmit(location) {
    hideSuggestions()
    await new Promise((resolve) => setTimeout(resolve, 950))
    const closestLocation = await weather.getAutocompleteData(location)
    console.log(closestLocation)

    if (!closestLocation.length || closestLocation === 'error') {
      if (!closestLocation.length && location === '')
        showSearchErrorMessage('missing')
      else showSearchErrorMessage('invalid')

      hideLoadingScreen()
    } else {
      hideSearchErrorMessage()
    }

    const [lon, lat] = closestLocation[0].geometry.coordinates
    const coords = { lat, lon }
    const weatherData = await weather.getForecastData(coords)
    const { name, country_code: countryCode } = closestLocation[0].properties
    weatherData.name = `${name}, ${countryCode}`
    // MAKE COUNTRY OPTIONAL FOR NON RECOGNIZED STATES SUCH AS KOSOVO

    console.log(weatherData)

    if (weatherData === 'error') {
      const error = true
      showSearchErrorMessage(null, error)
      hideLoadingScreen()
      return
    }
    displayBackgroundVideo(weatherData)
    displayMainContent(weatherData)
    displayHourlyContent(weatherData)
    displayDailyContent(weatherData)
    displayTechnicalContent(weatherData)
  }

  async function displayWeatherContentSuggestion(coords, cityName) {
    hideSuggestions()
    const weatherData = await weather.getForecastData(coords)
    weatherData.name = cityName
    console.log(weatherData)
    displayBackgroundVideo(weatherData)
    displayMainContent(weatherData)
    displayHourlyContent(weatherData)
    displayDailyContent(weatherData)
    displayTechnicalContent(weatherData)
  }

  // MAIN WEATHER CONTENT
  function displayMainContent(weatherData) {
    const locationMain = document.getElementById('location')
    const temperatureMain = document.getElementById('temperature')
    const descriptionMain = document.getElementById('description')
    const feelsLikeMain = document.getElementById('main-feels-like')

    locationMain.textContent = getLocationNameMain(weatherData)
    temperatureMain.textContent = getTemperatureMain(weatherData)
    temperatureMain.classList.add('loaded') // USE SO THAT DEGREE UNICODE DOES NOT LOAD BEFORE
    descriptionMain.textContent = getDescriptionMain(weatherData)
    feelsLikeMain.textContent = getFeelsLikeMain(weatherData)
    feelsLikeMain.classList.add('loaded') // USE SO THAT DEGREE UNICODE DOES NOT LOAD BEFORE
  }

  function getLocationNameMain(weatherData) {
    return weatherData.name
  }
  function getTemperatureMain(weatherData) {
    return Math.round(weatherData.current.temp)
  }
  function getFeelsLikeMain(weatherData) {
    return `feels like: ${Math.round(weatherData.current.feels_like)}`
  }
  function getDescriptionMain(weatherData) {
    return weatherData.current.weather[0].description
  }
  function getWeatherState(weatherData) {
    return weatherData.current.weather[0].main
  }

  // HOURLY FORECAST CONTENT
  function displayHourlyContent(weatherData) {
    const hoursContainer = document.getElementById('hours-container')
    const detailedInfoSection = document.getElementById('detailed-info')
    clearContent(hoursContainer)

    // ADD TITLE AND ICON
    const title = document.createElement('p')
    title.textContent = 'hourly forecast'
    const icon = document.createElement('img')

    icon.classList.add('icon', 'forecast-hours')
    icon.src = 'forecast.svg'

    const titleAndIcon = document.createElement('div')
    titleAndIcon.classList.add('title-and-icon', 'hours')

    titleAndIcon.appendChild(title)
    titleAndIcon.appendChild(icon)
    detailedInfoSection.appendChild(titleAndIcon)

    // ADD HOUR ITEMS
    const hours = utils.getNext24Hours(weatherData)
    const timezoneOffset = weatherData.timezone_offset

    hours.forEach((hour) => {
      displayHourItem(hour, timezoneOffset, weatherData)
    })
  }
  function displayHourItem(hour, timezoneOffset, weatherData) {
    const seconds = hour.dt + timezoneOffset
    const itemHour = utils.secondsToHour(seconds)
    // GET WEATHER LOGO SRC
    let mainDesc = `${hour.weather[0].main.toLowerCase()}.svg`
    const sunriseNoOffset = hour.dt + 3600
    const sunriseSeconds = weatherData.daily[1].sunrise
    const sunsetSeconds = weatherData.current.sunset
    // IF SUN NOT VISIBLE GET NIGHT LOGO SRC
    if (
      sunriseNoOffset > sunsetSeconds &&
      sunriseNoOffset <= sunriseSeconds &&
      (mainDesc === 'clear.svg' || mainDesc === 'clouds.svg')
    )
      mainDesc = `night_${mainDesc}`
    // GET HOURS ITEM TEMP
    const itemTemp = Math.round(hour.temp)
    loadHourItem(itemHour, mainDesc, itemTemp)
  }
  function loadHourItem(hour, mainDesc, temp) {
    const hourEl = document.createElement('p')
    hourEl.textContent = `${+hour} h`
    hourEl.dataset.hourlyHour = ''
    hourEl.classList.add('hour-hour')

    const logoEl = document.createElement('img')
    logoEl.src = mainDesc
    logoEl.classList.add('hour-logo')

    const tempEl = document.createElement('p')
    tempEl.textContent = temp
    tempEl.dataset.hourTemp = ''
    tempEl.classList.add('hour-temp')

    const hourItemEl = document.createElement('div')
    hourItemEl.classList.add('hour-item')
    hourItemEl.appendChild(hourEl)
    hourItemEl.appendChild(logoEl)
    hourItemEl.appendChild(tempEl)

    const cardContainer = document.getElementById('hours-container')
    cardContainer.appendChild(hourItemEl)
  }
  function clearContent(el) {
    el.replaceChildren('')
  }

  // DAILY FORECAST CONTENT
  function displayDailyContent(weatherData) {
    const daysContainer = document.getElementById('days-container')
    clearContent(daysContainer)

    // ADD TITLE AND ICON
    const title = document.createElement('p')
    title.textContent = 'weekly forecast'
    const icon = document.createElement('img')
    icon.classList.add('icon', 'forecast-days')
    icon.src = 'forecast.svg'
    const titleAndIcon = document.createElement('div')
    titleAndIcon.classList.add('title-and-icon')
    titleAndIcon.appendChild(title)
    titleAndIcon.appendChild(icon)
    daysContainer.appendChild(titleAndIcon)

    // ADD DAY ITEMS
    const timezoneOffset = weatherData.timezone_offset
    const days = weatherData.daily
    let dayIndex = 0
    days.forEach((day) => {
      const seconds = day.dt + timezoneOffset
      loadDayItem(day, seconds, dayIndex)
      dayIndex += 1
    })
  }

  function loadDayItem(day, seconds, dayIndex) {
    const weekDayEl = document.createElement('p')
    weekDayEl.textContent = secondsToWeekDay(seconds, dayIndex)
    weekDayEl.classList.add('week-day')

    const logoEl = document.createElement('img')
    logoEl.src = `${day.weather[0].main.toLowerCase()}.svg`
    logoEl.classList.add('day-item-logo')

    const tempMinEl = document.createElement('p')
    tempMinEl.textContent = Math.round(day.temp.min)
    tempMinEl.dataset.dayMinTemp = ''
    tempMinEl.classList.add('day-temp-min')

    const tempMaxEl = document.createElement('p')
    tempMaxEl.textContent = Math.round(day.temp.max)
    tempMaxEl.dataset.dayMaxTemp = ''
    tempMaxEl.classList.add('day-temp-max')

    const meterEl = document.createElement('div')
    meterEl.classList.add('meter')
    styleMeter(meterEl, +tempMinEl.textContent, +tempMaxEl.textContent)

    const dayItem = document.createElement('div')
    dayItem.classList.add('day-item')
    dayItem.appendChild(weekDayEl)
    dayItem.appendChild(logoEl)
    dayItem.appendChild(tempMinEl)
    dayItem.appendChild(meterEl)
    dayItem.appendChild(tempMaxEl)

    const daysContainer = document.getElementById('days-container')
    daysContainer.appendChild(dayItem)
  }

  function secondsToWeekDay(seconds, dayIndex) {
    if (dayIndex === 0) return 'Today'
    let weekDay = new Date(null)
    weekDay.setSeconds(seconds)
    weekDay = weekDay.toString().slice(0, 3)
    return weekDay
  }

  function styleMeter(meter, tempMin, tempMax) {
    // <= 16 VERY COLD, -15 <= -1 COLD, 0 <= 14 WARM, 15 <= 29 VERY WARM, HOT >= 30
    // VERY COLD
    const isVeryColdToWarm =
      tempMin < tempMax &&
      tempMin <= -16 &&
      (tempMin <= tempMax - 15 || tempMax >= 0)
    const isVeryColdToCold =
      tempMin < tempMax &&
      tempMin <= -16 &&
      (tempMin <= tempMax - 5 || tempMax >= -15)
    const isVeryCold = tempMin <= -16
    // COLD
    const isColdToVeryWarm =
      tempMin < tempMax &&
      tempMin <= -1 &&
      (tempMin <= tempMax - 15 || tempMax >= 15)
    const isColdToWarm =
      tempMin < tempMax &&
      tempMin <= -1 &&
      (tempMin <= tempMax - 5 || tempMax >= 0)
    const isCold = tempMin <= -1
    // WARM
    const isWarmToHot =
      tempMin < tempMax &&
      tempMin <= 14 &&
      (tempMin <= tempMax - 15 || tempMax >= 30)
    const isWarmToVeryWarm =
      tempMin < tempMax &&
      tempMin <= 14 &&
      (tempMin <= tempMax - 5 || tempMax >= 15)
    const isWarm = tempMin <= 14
    // VERY WARM
    const isVeryWarmToHot =
      tempMin < tempMax &&
      tempMin <= 29 &&
      (tempMin <= tempMax - 5 || tempMax >= 30)
    const isVeryWarm = tempMin <= 29

    switch (true) {
      // VERY COLD
      case isVeryColdToWarm:
        meter.classList.add('very-cold-to-warm')
        break
      case isVeryColdToCold:
        meter.classList.add('very-cold-to-cold')
        break
      case isVeryCold:
        meter.classList.add('very-cold')
        break
      // COLD
      case isColdToVeryWarm:
        meter.classList.add('cold-to-very-warm')
        break
      case isColdToWarm:
        meter.classList.add('cold-to-warm')
        break
      case isCold:
        meter.classList.add('cold')
        break
      // WARM
      case isWarmToHot:
        meter.classList.add('warm-to-hot')
        break
      case isWarmToVeryWarm:
        meter.classList.add('warm-to-very-warm')
        break
      case isWarm:
        meter.classList.add('warm')
        break
      // VERY WARM
      case isVeryWarmToHot:
        meter.classList.add('very-warm-to-hot')
        break
      case isVeryWarm:
        meter.classList.add('very-warm')
        break
      default:
        meter.classList.add('hot')
    }
  }

  // TECHNICAL CONTENT
  function displayTechnicalContent(weatherData) {
    const container = document.getElementById('technical-container')
    clearContent(container)
    // UVI
    const UVIndex = weatherData.current.uvi
    displayTechnicalCard('UV index', UVIndex, container)
    // WIND
    // CONVERT FROM METERS PER SECOND TO KILOMETERS PER SECOND
    const windSpeed = Math.round(weatherData.current.wind_speed * 3.6 * 10) / 10
    const wind = `${windSpeed} km/h`
    displayTechnicalCard('wind', wind, container)
    // HUMIDITY
    const humidity = `${weatherData.current.humidity}%`
    displayTechnicalCard('humidity', humidity, container)
    // CHANCE OF RAIN
    const chanceOfRain = `${Math.round(weatherData.daily[0].pop * 100)}%`
    displayTechnicalCard('chance of rain', chanceOfRain, container)
    // SUNRISE
    const sunriseSeconds =
      weatherData.current.sunrise + weatherData.timezone_offset - 3600
    const sunrise = utils.secondsToHourAndMinutes(sunriseSeconds)
    displayTechnicalCard('sunrise', sunrise, container)
    // SUNSET
    const sunsetSeconds =
      weatherData.current.sunset + weatherData.timezone_offset - 3600
    const sunset = utils.secondsToHourAndMinutes(sunsetSeconds)
    displayTechnicalCard('sunset', sunset, container)
    // PRESSURE
    const pressure = `${weatherData.current.pressure} hPa`
    displayTechnicalCard('pressure', pressure, container)
    // VISIBILITY
    const visibility = `${(weatherData.current.visibility / 1000).toFixed(
      1
    )} km`
    displayTechnicalCard('visibility', visibility, container)
    // DISPLAY IMPERIAL IF SET IN LOCAL STORAGE / METRIC IS MAIN
    displayImperialIfSaved()
  }

  function displayTechnicalCard(name, value, container) {
    const title = document.createElement('p')
    const icon = document.createElement('img')
    title.textContent = name
    icon.classList.add('icon')
    icon.src = `${name}.svg`

    const titleAndIcon = document.createElement('div')
    titleAndIcon.classList.add('title-and-icon')
    titleAndIcon.appendChild(title)
    titleAndIcon.appendChild(icon)

    const indexEl = document.createElement('p')
    indexEl.textContent = value
    indexEl.id = `${name}-value`
    indexEl.classList.add('card-value')

    const card = document.createElement('div')
    card.classList.add('technical-card')
    card.appendChild(titleAndIcon)
    card.appendChild(indexEl)

    const message = utils.getMessage(name, value)
    if (message) {
      const messageEl = document.createElement('p')
      messageEl.textContent = message
      messageEl.classList.add('card-text')
      card.appendChild(messageEl)
    }

    container.appendChild(card)
  }

  // BACKGROUND VIDEO
  function displayBackgroundVideo(weatherData) {
    const video = document.getElementById('background-video')
    const source = video.src.split('/').pop()
    console.log(source)

    let state = getWeatherState(weatherData).toLowerCase()
    // HAZE, MIST AND FOG PLAY THE SAME VIDEO = FOG
    if (state === 'haze' || state === 'mist') state = 'fog'
    // IF WEATHER IS CLEAR OR CLOUDS AND ITS NIGHT, PLAY SPACE VIDEO
    const now = weatherData.current.dt
    const { sunrise, sunset } = weatherData.current
    if (
      (state === 'clear' || state === 'clouds') &&
      (now >= sunset || now < sunrise)
    ) {
      state = 'space'
    }
    // IF SAME VIDEO SHOULD BE LOADED RETURN
    if (source === state) {
      return
    }

    // LOAD VIDEO
    video.src = `${state}.mp4`

    // HIDE LOADING SCREEN WHEN VIDEO CAN PLAY
    video.addEventListener('canplay', hideLoadingScreen)
  }

  function playVideo() {
    const video = document.getElementById('background-video')
    video.play()
  }

  // LOADING SCREEN
  function hideLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen')
    loadingScreen.removeEventListener('canplay', hideLoadingScreen)
    loadingScreen.classList.remove('active')
    playVideo()
  }

  function showLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen')
    loadingScreen.classList.add('active')
  }

  // AUTOCOMPLETE LOADER
  function showAutocompleteLoader() {
    const loader = document.getElementById('autocomplete-loader')
    loader.classList.add('active')
  }

  function hideAutocompleteLoader() {
    const loader = document.getElementById('autocomplete-loader')
    loader.classList.remove('active')
  }

  // UNITS

  function displayImperialUnits() {
    hideUnitMenu()
    // IF SAVED AND SELECTED IN MENU AGAIN, RETURN
    if (storage.getUnit() === 'imperial' && this !== undefined) return

    const wind = document.getElementById('wind-value')
    wind.textContent = utils.windToImperial(wind)

    utils.allTimeToAmPm()
    utils.allTempToFahrenheit()

    const visibility = document.getElementById('visibility-value')
    visibility.textContent = utils.visibilityToMi(visibility)

    storage.setUnit('imperial')
  }

  function displayMetricUnits() {
    hideUnitMenu()
    // IF SAVED AND SELECTED IN MENU AGAIN, RETURN
    if (storage.getUnit() === 'metric' && this !== undefined) return

    const wind = document.getElementById('wind-value')
    wind.textContent = utils.windToMetric(wind)

    utils.allTimeToMilitary()
    utils.allTempToMetric()

    const visibility = document.getElementById('visibility-value')
    visibility.textContent = utils.visibilityToKm(visibility)

    storage.setUnit('metric')
  }

  function displayImperialIfSaved() {
    if (storage.getUnit() === 'imperial') {
      displayImperialUnits()
    }
  }

  return { loadContent }
})()

export default dom
