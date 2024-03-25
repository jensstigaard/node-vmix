// Run by using command:
// ts-node examples/connection-tcp/auto-reconnect.ts

// Import modules from the package
// Note when using as npm dep: swap in: 'node-vmix' instead of '../index'
import { ConnectionTCP } from '../../dist/index'

// Set up vMix connection
const connection = new ConnectionTCP('localhost', { debug: true, autoReconnect: true })

// Add on connect listener
connection.on('connect', () => {
  console.log('Received connected event clean', connection.connected())
  setTimeout(() => {
    console.log('Received connected event wrapped', connection.connected())
  }, 0)

  // As soon as connected, then send request to receive XML state data
  connection.send('XML')
})

setInterval(() => {
  if(connection.connected()) {
    console.log('Connection state now changed to connected')
    process.exit(0)
  }
}, 100)