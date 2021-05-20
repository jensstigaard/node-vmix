//
import ConnectionTCP from './modules/connection-tcp.js'

import ConnectionHTTP from './modules/connection-http.js'
import CommandSenderHTTP from './modules/command-sender-http.js'

// Alias
const Connection = ConnectionTCP

export default {
	Connection, // Alias for ConnectionTCP
	ConnectionTCP,

	// Legacy classes: 
	// HTTP connection and command-sender
	CommandSenderHTTP,
	ConnectionHTTP,
}

// Also expose modules as separate modules to be imported
export {
	ConnectionTCP,
	ConnectionTCP as Connection
} from './modules/connection-tcp'
export { ConnectionHTTP } from './modules/connection-http'
export { CommandSenderHTTP } from './modules/command-sender-http'

