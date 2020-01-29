//
import ConnectionTCP from './modules/connection-tcp'

import ConnectionHTTP from './modules/connection-http'
import CommandSenderHTTP from './modules/command-sender-http'

export default {
	ConnectionTCP,

	// Legacy classes: 
	// HTTP connection and command-sender
	CommandSenderHTTP,
	ConnectionHTTP,
}