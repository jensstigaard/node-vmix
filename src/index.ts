import ConnectionHTTP from './modules/connection-http'
import CommandSenderHTTP from './modules/command-sender-http'
import CommandTCP from './modules/connection-tcp'

export default {
	CommandTCP,

	// Legacy classes: 
	// HTTP connection and command-sender
	CommandSenderHTTP,
	ConnectionHTTP,
}