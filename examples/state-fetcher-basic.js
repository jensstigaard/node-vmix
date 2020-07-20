// Import modules from the package
// Note: when using npm swap in: 'node-vmix' instead of '../index'
const { ConnectionTCP } = require('../dist/index')

const { ApiDataParser, InputMapper } = require('vmix-js-utils')

// Modules
const connection = new ConnectionTCP('localhost')

// Register callback on state fetcher success
// When data is fetched, what to do with it?
connection.on('xml', data => {
    // Manipulate data
    let xmlContent = ApiDataParser.parse(data)
    let inputs = InputMapper.extractInputsFromXML(xmlContent)
    let inputsMap = InputMapper.mapInputs(inputs)
    let inputsList = Object.values(inputsMap)

    console.log('Successfully read XML data from the vMix API!')
    console.log('Number of inputs:', inputsList.length)
})

connection.on('error', error => {
    console.error(`Error.. Not able to read API data from a vMix web controller.. `)
    console.error(error)
})

// Fetch XML data from vMix API
connection.send('XML')
