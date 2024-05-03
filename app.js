const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')
const dbpath = path.join(__dirname, 'covid19India.db')
const app = express()
app.use(express.json())

let db = null

const initilizeDbtoResponse = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server running on http://localhost:3000')
    })
  } catch (e) {
    console.log(`DB Error ${e.message}`)
    process.exit(1)
  }
}

initilizeDbtoResponse()

const convertDBToResponseObject = dbObject => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  }
}

// get Returns a list of all states in the state table

app.get('/states/', async (request, response) => {
  const getStaesQuery = `
    SELECT * FROM state;`
  const states = await db.all(getStaesQuery)
  response.send(states.map(eachState => convertDBToResponseObject(eachState)))
})

// get Returns a state based on the state ID
app.get('/states/:stateId/', async (request, response) => {
  const {stateId} = request.params
  const getStaesQuery = `
    SELECT * FROM state WHERE state_id = ${stateId};`
  const states = await db.get(getStaesQuery)
  response.send(convertDBToResponseObject(states))
})

// POST Create a district in the district table, district_id is auto-incremented

app.post('/districts/', async (request, response) => {
  const {districtName, stateId, cases, cured, active, deaths} = request.body
  const postDistrict = `
  INSERT INTO district (district_name,state_id,cases,cured,active,deaths) VALUES ("${districtName}",${stateId},${cases},${cured},${active},${deaths});`
  const names = await db.run(postDistrict)
  response.send('District Successfully Added')
})

// GET API 4 Returns a district based on the district ID

app.get('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const getStaesQuery = `
    SELECT * FROM district WHERE district_id = ${districtId};`
  const states = await db.get(getStaesQuery)
  response.send(convertDBToResponseObject(states))
})

// DELETE Deletes a district from the district table based on the district ID
app.delete('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const getStaesQuery = `
    DELETE FROM district WHERE district_id = ${districtId};`
  const states = await db.all(getStaesQuery)
  response.send('District Removed')
})

// UPDATE Updates the details of a specific district based on the district ID

app.put('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const {districtName, stateId, cases, cured, active, deaths} = request.body
  const updateQuary = `
  UPDATE district SET district_name = "${districtName}", state_id = ${stateId}, cases = ${cases}, cured = ${cured}, active = ${active}, deaths = ${deaths} WHERE district_id = ${districtId};`
  const updated = await db.run(updateQuary)
  response.send('District Details Updated')
})

// API 7 GET Returns the statistics of total cases, cured, active, deaths of a specific state based on state ID

app.get('/states/:stateId/stats/', async (request, response) => {
  const {stateId} = request.params
  const getStateStatsQuery = `SELECT 
  SUM(cases),
  SUM(cured),
  SUM(active),
  SUM(deaths)
  FROM 
  district 
  WHERE 
  state_id = ${stateId};`
  const stats = await db.get(getStateStatsQuery)
  console.log(stats)
  response.send({
    totalCases: stats['SUM(cases)'],
    totalCured: stats['SUM(cured)'],
    totalActive: stats['SUM(active)'],
    totalDeaths: stats['SUM(deaths)'],
  })
})

// API 8 Returns an object containing the state name of a district based on the district ID

app.get('/districts/:districtId/details/', async (request, response) => {
  const {districtId} = request.params
  const getDistrictQuery = `select state_id from district where district_id = ${districtId}`
  const districtResponse = await db.get(getDistrictQuery)

  const getStateNameQuery = `select state_name as stateName from state where state_id = ${districtResponse.state_id};`
  const getStateResponse = await db.get(getStateNameQuery)
  response.send(getStateResponse)
})

module.exports = app
