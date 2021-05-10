// Import modules from the package
// Note when using as npm dep: swap in: 'node-vmix' instead of '../index'
const { ConnectionTCP } = require('../../dist/index')
const { XmlApi } = require('vmix-js-utils')

// Set up vMix connection
const connection = new ConnectionTCP('localhost')

// Register callback on 'xml'-events
// When data is fetched, what to do with it?
// Parse it into easy usable array of objects with input
connection.on('xml', (xmlData) => {
  // Parse xml content
  const xmlContent = XmlApi.DataParser.parse(xmlData)

  // Extract input data and
  // manipulate to desired format
  const inputsRawData = XmlApi.Inputs.extractInputsFromXML(xmlContent)
  const inputs = XmlApi.Inputs.map(inputsRawData)

  // Now you have a list of inputs
  console.log(inputs)
})

// Add on connect listener
connection.on('connect', () => {
  console.log('Connected')

  // As soon as connected, then send request to receive XML state data
  connection.send('XML')
})

