// Import modules from the package
// Note: when using npm swap in: 'node-vmix' instead of '../index'
const { ApiDataParser, ConnectionTCP, InputMapper } = require('../dist/index').default

// Set up vMix connection
const connection = new ConnectionTCP('localhost')
connection.on('connect', () => {
  console.log('Connected')
})
connection.on('error', (error) => {
  console.error('Error', error)
})

// Register callback on xml data
// When data is fetched, what to do with it?
connection.on('xmlData', (xmlData) => {
  // Parse xml content
  const xmlContent = ApiDataParser.parse(xmlData)

  // Extract input data and
  // manipulate to desired format
  const inputsRawData = InputMapper.extractInputsFromXML(xmlContent)
  const inputsMap = InputMapper.mapInputs(inputsRawData)
  const inputsList = Object.values(inputsMap)

  // Now you have a list of inputs
  console.log(inputsList)
})

connection.send('XML')
