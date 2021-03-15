// Import modules from the package
// Note when using as npm dep: swap in: 'node-vmix' instead of '../index'
const { ConnectionTCP } = require('../dist/index')
const { XmlApiDataParser, XmlInputMapper } = require('vmix-js-utils')

// Set up vMix connection
const connection = new ConnectionTCP('localhost')

connection.on('error', (error) => {
  console.error('Error', error)
})

// Register callback on xml data
// When data is fetched, what to do with it?
connection.on('xml', (xmlData) => {
  // Parse xml content
  const xmlContent = XmlApiDataParser.parse(xmlData)

  // Extract input data and
  // manipulate to desired format
  const inputsRawData = XmlInputMapper.extractInputsFromXML(xmlContent)
  const inputsMap = XmlInputMapper.mapInputs(inputsRawData)
  const inputsList = Object.values(inputsMap)

  // Now you have a list of inputs
  console.log(inputsList)
})

// Add on connect listener
connection.on('connect', () => {
  console.log('Connected')
  
  // As soon as connected, then send 'request' for XML data
  connection.send('XML')
})
