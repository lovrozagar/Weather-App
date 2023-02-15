import storage from './storage'

/* eslint-disable no-param-reassign */
const utils = (() => {
  // FORM VALIDATION
  function formatInput(value) {
    const regex = /[^A-Za-z, -]/g
    let formattedValue = value.replace(regex, '')
    if (formattedValue.includes(',')) {
      formattedValue = formattedValue.substring(0, formattedValue.indexOf(','))
    }
    return formattedValue
  }

  // DESCRIPTION MESSAGES

  function getMessage(name, value) {
    if (isDescriptive(name)) {
      let message
      switch (name) {
        case 'UV index':
          message = utils.UVIndexMessage(value)
          break
        case 'wind':
          message = utils.windMessage(value)
          break
        case 'pressure':
          message = utils.pressureMessage(value)
          break
        default:
          message = false
      }

      return message
    }
    return false
  }

  function isDescriptive(name) {
    if (
      name === 'UV index' ||
      name === 'wind' ||
      name === 'pressure' ||
      name === 'visibility'
    )
      return true
    return false
  }

  function UVIndexMessage(index) {
    if (index <= 0.99) return 'Very low, damage possibility is negligible'
    if (index <= 4) return 'Mild, sun protection may or may not be needed.'
    if (index <= 7) return 'High, sun protection is recommended'
    if (index > 7) return 'Very high, sun protection is highly recommended'
    return 'Very low'
  }

  function windMessage(wind) {
    let windNumber = wind.substring(0, wind.indexOf(' '))
    // IF NOT MPH TRANSFORM TO MPH, CHART USES MPH
    const unit = wind.split(' ').pop()
    if (unit === 'km/h') windNumber = +windNumber / 1.6
    console.log(unit)
    console.log(windNumber)

    if (windNumber < 1) return 'Calm, Smoke rises vertically.'
    if (windNumber < 4)
      return 'Light air, smoke drifts with air, weather vanes inactive.'
    if (windNumber < 8)
      return 'Light breeze, weather vanes active, wind felt on face, leaves rustle.'
    if (windNumber < 13)
      return 'Gentle breeze, leaves & small twigs move, light flags extend.'
    if (windNumber < 19)
      return 'Moderate breeze, dust & loose paper blows about.'
    if (windNumber < 25)
      return 'Fresh breeze, small trees sway, waves break on inland waters.'
    if (windNumber < 32)
      return 'Strong breeze, large branches sway, umbrellas difficult to use.'
    if (windNumber < 39)
      return 'Moderate gale, whole trees sway, difficult to walk against wind.'
    if (windNumber < 47)
      return 'Fresh gale, twigs broken off trees, walking against wind very difficult.'
    if (windNumber < 55)
      return 'Strong gale, slight damage to buildings, shingles blown off roof.'
    if (windNumber < 64)
      return 'Whole gale, trees uprooted, considerable damage to buildings.'
    if (windNumber < 73)
      return 'Storm, widespread damage, very rare occurrence.'
    return 'Hurricane, violent destruction.'
  }

  function pressureMessage(pressure) {
    const pressureValue = pressure.substring(0, pressure.indexOf(' '))
    if (+pressureValue > 1022) {
      return `Atmospheric pressure is high.`
    }
    if (+pressureValue > 1009 && +pressure <= 1022) {
      return `Atmospheric pressure is normal.`
    }
    return `Atmospheric pressure is low.`
  }

  // TIME CALCULATIONS
  function getNext24Hours(weatherData) {
    return weatherData.hourly.slice(0, 24)
  }
  function secondsToHour(seconds) {
    let date = new Date(null)
    date.setSeconds(seconds)
    date = date.toString().slice(16, 18)
    return date
  }
  function secondsToHourAndMinutes(seconds) {
    const date = new Date(null)
    date.setSeconds(seconds)

    const hour = date.toString().slice(16, 18)
    const doubleColon = date.toString().slice(18, 19)
    const minutes = date.toString().slice(19, 21)

    if (storage.getUnit() === 'imperial') {
      return fullTimeToAmPm(`${hour}${doubleColon}${minutes}`)
    }

    return `${hour}${doubleColon}${minutes} h`
  }

  // UNITS

  // IMPERIAL
  function windToImperial(windEl) {
    const windText = windEl.textContent
    const windValue = windText.substring(0, windText.indexOf(' '))
    let windImperial = Math.round((+windValue / 1.6) * 10) / 10
    windImperial = `${windImperial} mph`
    return windImperial
  }

  function allTimeToAmPm() {
    const sunrise = document.getElementById('sunrise-value')
    const sunset = document.getElementById('sunset-value')
    const hourlyHours = document.querySelectorAll('[data-hourly-hour]')

    sunrise.textContent = fullTimeToAmPm(sunrise.textContent)
    sunset.textContent = fullTimeToAmPm(sunset.textContent)
    hourlyHours.forEach((hour) => {
      hour.textContent = hourToAmPm(hour.textContent)
    })
  }

  function fullTimeToAmPm(time) {
    const fullTime = removeAlpha(time)
    const [hours, minutes] = fullTime.split(':')

    const hoursInt = parseInt(hours, 10)

    if (hoursInt === 12) return `${hoursInt}:${minutes} pm`
    if (hoursInt - 12 > 0) return `${hoursInt - 12}:${minutes} pm`
    return `${hoursInt}:${minutes} am`
  }

  function hourToAmPm(time) {
    const hour = removeAlpha(time)
    const hoursInt = parseInt(hour, 10)

    if (hoursInt === 12) return `${hoursInt} pm`
    if (hoursInt - 12 > 0) return `${hoursInt - 12} pm`
    return `${hoursInt} am`
  }

  function allTempToFahrenheit() {
    const main = document.getElementById('temperature')
    const hourlyHoursTemps = document.querySelectorAll('[data-hour-temp]')
    const dailyMinTemps = document.querySelectorAll('[data-day-min-temp]')
    const dailyMaxTemps = document.querySelectorAll('[data-day-max-temp]')

    main.textContent = tempToFahrenheit(main.textContent)
    hourlyHoursTemps.forEach((hour) => {
      hour.textContent = tempToFahrenheit(hour.textContent)
    })
    dailyMinTemps.forEach((day) => {
      day.textContent = tempToFahrenheit(day.textContent)
    })
    dailyMaxTemps.forEach((day) => {
      day.textContent = tempToFahrenheit(day.textContent)
    })
  }

  function tempToFahrenheit(value) {
    return Math.round(+value * 1.8 + 32)
  }

  // METRIC
  function windToMetric(windEl) {
    const windText = windEl.textContent
    const windValue = windText.substring(0, windText.indexOf(' '))
    let windMetric = Math.round(+windValue * 1.6 * 10) / 10
    windMetric = `${windMetric} km/h`
    return windMetric
  }

  function allTimeToMilitary() {
    const sunrise = document.getElementById('sunrise-value')
    const sunset = document.getElementById('sunset-value')
    const hourlyHours = document.querySelectorAll('[data-hourly-hour]')

    sunrise.textContent = fullTimeToMilitary(sunrise.textContent)
    sunset.textContent = fullTimeToMilitary(sunset.textContent)
    hourlyHours.forEach((hour) => {
      hour.textContent = hourToMilitary(hour.textContent)
    })
  }

  function fullTimeToMilitary(time) {
    const [hours, minutesAmPm] = time.split(':')
    const minutes = minutesAmPm.slice(0, 2)
    const amPm = minutesAmPm.slice(-2)

    let hoursInt = parseInt(hours, 10)

    if (amPm === 'pm' && hoursInt !== 12) {
      hoursInt += 12
    }
    if (amPm === 'am' && hoursInt === 12) {
      hoursInt = 0
    }

    return `${hoursInt}:${minutes} h`
  }

  function hourToMilitary(time) {
    const [hours, amPm] = time.split(' ')

    let hoursInt = parseInt(hours, 10)

    if (amPm === 'pm' && hoursInt !== 12) {
      hoursInt += 12
    }
    if (amPm === 'am' && hoursInt === 12) {
      hoursInt = 0
    }

    return `${hoursInt} h`
  }

  function allTempToMetric() {
    const main = document.getElementById('temperature')
    const hourlyHoursTemps = document.querySelectorAll('[data-hour-temp]')
    const dailyMinTemps = document.querySelectorAll('[data-day-min-temp]')
    const dailyMaxTemps = document.querySelectorAll('[data-day-max-temp]')

    main.textContent = tempToMetric(main.textContent)
    hourlyHoursTemps.forEach((hour) => {
      hour.textContent = tempToMetric(hour.textContent)
    })
    dailyMinTemps.forEach((day) => {
      day.textContent = tempToMetric(day.textContent)
    })
    dailyMaxTemps.forEach((day) => {
      day.textContent = tempToMetric(day.textContent)
    })
  }

  function tempToMetric(temp) {
    const tempInt = parseInt(temp, 10)
    return Math.round(((tempInt - 32) * 0.5556 * 10) / 10).toString()
  }

  function removeAlpha(string) {
    const regex = /[^0-9:]/g
    return string.replace(regex, '')
  }

  return {
    formatInput,
    windToImperial,
    allTimeToAmPm,
    allTempToFahrenheit,
    windToMetric,
    allTimeToMilitary,
    allTempToMetric,
    getMessage,
    UVIndexMessage,
    windMessage,
    pressureMessage,
    getNext24Hours,
    secondsToHour,
    secondsToHourAndMinutes,
  }
})()

export default utils
