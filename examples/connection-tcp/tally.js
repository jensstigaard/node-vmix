// Import modules from the package
// Note: when using npm swap in: 'node-vmix' instead of '../index'
import { ConnectionTCP } from '../../dist/index.js'

// Setup connection to vMix instance via TCP socket
const connection = new ConnectionTCP('localhost')

// Register callback on tally
connection.on('tally', tally => {
    console.log('Received tally state from vMix instance via TCP socket', tally)
})

// Upon connection
connection.on('connect', () => {
    // Request tally info
    // Case insensitive command name
    connection.send('TALLY')
    connection.send('tally')

    // Subscribe to tally
    // meaning that each time the program input changes
    // the registered 'tally'-listeners will be notified 
    connection.send('SUBSCRIBE TALLY')
})
