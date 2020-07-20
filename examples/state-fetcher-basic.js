// Import modules from the package
// Note: when using npm swap in: 'node-vmix' instead of '../index'
const { ConnectionTCP } = require('../dist/index')

const { XmlApiDataParser, XmlInputMapper } = require('vmix-js-utils')

// Modules
const connection = new ConnectionTCP('localhost')

// Register callback on state fetcher success
// When data is fetched, what to do with it?
connection.on('data', data => {
    console.log('On data', data)
})
connection.on('xml', data => {
    // Manipulate data
    let xmlContent = XmlApiDataParser.parse(data)
    let inputs = XmlInputMapper.extractInputsFromXML(xmlContent)
    let inputsMap = XmlInputMapper.mapInputs(inputs)
    let inputsList = Object.values(inputsMap)

    console.log('On XML - Number of inputs:', inputsList.length)
})
connection.on('tally', tally => {
    console.log('On Tally', tally)
})

connection.on('error', error => {
    console.error(`Error.. Not able to read API data from the vMix TCP socket.. `)
    console.error(error)
})

// Fetch XML data from vMix API
connection.send('TALLY')
connection.send('tally')
