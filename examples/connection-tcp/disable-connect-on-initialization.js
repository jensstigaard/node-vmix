// Import modules from the package
// Note when using as npm dep: swap in: 'node-vmix' instead of '../index'
const { ConnectionTCP } = require('../../dist/index')

const connection = new ConnectionTCP('localhost', { debug: true, connectOnInitialization: false })

console.log(connection.connected() ? 'Connected!' : 'Not connected')
