// Import modules from the package
// Note: when using npm swap in: 'node-vmix' instead of '../index'
const { ConnectionTCP } = require('../../dist/index')

const { XmlApi } = require('vmix-js-utils')

// Modules
const connection = new ConnectionTCP('localhost')

// Register callback on state fetcher success
// When data is fetched, what to do with it?
connection.on('data', data => {
    console.log('On data', data)
})
connection.on('xml', data => {
    // console.log('Received XML data')

    // Manipulate the raw data to be used as list
    const xmlContent = XmlApi.DataParser.parse(data)
    const inputs = XmlApi.InputMapping.extractInputsFromXML(xmlContent)
    const inputsMap = XmlApi.InputMapping.mapInputs(inputs)
    const inputsList = Object.values(inputsMap)

    console.log('Parsed XML state - Number of inputs:', inputsList.length)
})
connection.on('tally', tally => {
    console.log('Tally message received', tally)
})

connection.on('error', error => {
    console.error(`Error.. Not able to read API data from the vMix TCP socket.. `)
    console.error(error)
})

// Upon connection
connection.on('connect', () => {
    // Request XML data from vMix API
    connection.send('xml')

    // Request tally
    // Case insensitive command name
    connection.send('TALLY')
    connection.send('tally')
})
