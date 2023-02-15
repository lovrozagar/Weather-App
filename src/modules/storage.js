const storage = (() => {
  function setUnit(unit) {
    localStorage.setItem('unit', JSON.stringify(unit))
  }

  function getUnit() {
    return JSON.parse(localStorage.getItem('unit'))
  }

  function setDefaultUnitMetric() {
    if (localStorage.getItem('unit') === null) setUnit('metric')
  }

  return { getUnit, setUnit, setDefaultUnitMetric }
})()

export default storage
