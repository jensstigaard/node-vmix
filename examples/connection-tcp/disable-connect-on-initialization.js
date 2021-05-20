// Import modules from the package
// Note when using as npm dep: swap in: 'node-vmix' instead of '../index'
import { ConnectionTCP } from '../../dist/index.js'

const connection = new ConnectionTCP('localhost', { debug: true, connectOnInitialization: false })

// Check connection each 2000 ms
setInterval(() => {
	console.log(connection.connected() ? 'Connected!' : 'Not connected')
}, 2000)

// Manuel connect after 5000 ms
setTimeout(() => {
	connection.connect()
}, 5000)
