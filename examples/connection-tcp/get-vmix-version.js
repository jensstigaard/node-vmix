// Import modules from the package
// Note when using as npm dep: swap in: 'node-vmix' instead of '../index'
const { ConnectionTCP } = require('../../dist/index')

// Instanciate connection to vMix instance via TCP localhost:8099
const vMixHostAddress = 'localhost'
const connection = new ConnectionTCP(vMixHostAddress, { debug: true })

connection.on('version', version => {
  console.log('Received version from socket:', version)
})

connection.on('connect', () => {
  console.log('Connected to vMix instance')
})
