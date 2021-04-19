// Import modules from the package
// Note when using as npm dep: swap in: 'node-vmix' instead of '../index'
const { ConnectionTCP } = require('../../../dist/index')

// Instanciate connection to vMix instance via TCP localhost:8099
const vMixHostAddress = 'localhost'
const connection = new ConnectionTCP(vMixHostAddress, { debug: true })

connection.on('connect', () => {
  console.log('Connected to vMix instance via TCP socket')
  // Now that we are connected
  // Perform commands directly on connection
  // You can use any vMix Function here
  // List of all functions here:
  // https://www.vmix.com/help24/ShortcutFunctionReference.html

  // Perform a single command - a simple cut
  connection.send({ Function: 'Cut' })
})
