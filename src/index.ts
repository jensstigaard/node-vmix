//
import ConnectionTCP from './modules/connection-tcp'

import ConnectionHTTP from './modules/connection-http'
import CommandSenderHTTP from './modules/command-sender-http'

const Connection = ConnectionTCP

export {
	Connection, // Alias for ConnectionTCP
	ConnectionTCP,

	CommandSenderHTTP,
	ConnectionHTTP
}

export default {
	Connection, // Alias for ConnectionTCP
	ConnectionTCP,

	// Legacy classes: 
	// HTTP connection and command-sender
	CommandSenderHTTP,
	ConnectionHTTP,
}