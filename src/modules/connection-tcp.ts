// Core libraries
import { Socket } from 'net'

// Libraries
import querystring from 'querystring'

// Types
import { vMixApiFunctionCommand } from '../types/api-command'

// Custom Exceptions
import ApiUrlError from '../exceptions/api-url-error'

/**
 * Base socket listener types
 */
const SOCKET_BASE_LISTENER_TYPES = [
    'close',
    'connect',
    'drain',
    'end',
    'error',
    'lookup',
    'ready',
    'timeout'
]

// "Custom" types of messages from vMix
const CUSTOM_MESSAGES_TYPES = [
    'tally', // TALLY
    'activators', // Activators 'ACTS'
    'version', // vMix version info
    'xml', // XML data
]

// All lower-case listener types
const CUSTOM_LISTENER_TYPES = [
    'connecting',
    'data',
    // 'disconnect',
    ...CUSTOM_MESSAGES_TYPES
]

/**
 * Default hostname of vMix instance
 * When nothing passed to connection class-instance
 */
const DEFAULT_HOST = 'localhost'

/**
 * Default port used by vMix to serve TCP connections is 8099
 * But it can be other port if the connection is through a firewall
 */
const DEFAULT_TCP_PORT = 8099

/**
 * CRLF (New Line character on Microsoft Windows) that delimits messages
 */
const NEWLINE_CHAR = '\r\n'

/**
 * Length in bytes of CRLF
 */
const NEWLINE_CHAR_BYTE_LENGTH = 2


/**
 * vMix Connection via TCP
 * 
 */
// vMix TCP API docs
// https://www.vmix.com/help24/TCPAPI.html
//
// Internally using NodeJS Net Socket
// https://nodejs.org/api/net.html#net_new_net_socket_options
//
// With inspiration from: Github Gist: Node.js TCP client / server
// https://gist.github.com/sid24rane/2b10b8f4b2f814bd0851d861d3515a10
export class ConnectionTCP {

    protected _host: string = DEFAULT_HOST
    protected _port: number = DEFAULT_TCP_PORT

    // Array to store incoming message lines that were fully received
    private _unprocessedLines: string[] = []
    // Currently incoming message that has not arrived in full
	private _lineFragment = ''
    /**
     * Node TCP socket client to vMix instance
     */
    protected _socket: Socket = new Socket()

    /**
     * All listeners
     */
    protected _listeners: { [key: string]: Function[] } = {}

    // Auto reconnect? Enabled by default
    protected _autoReconnect: boolean = true

    protected _isRetrying: boolean = false
    protected _reconnectionIntervalTimeout: number = 10000
    protected _reconnectionInterval: NodeJS.Timeout | null = null

    // // Timeout for establishing the connection. Should be smaller than the reconnect invterval!
    // protected _connectTimeoutDuration: number = 5000
    // protected _connectTimeout: NodeJS.Timeout | null = null

    /**
     * Connection state
     */
    protected _isConnected: boolean = false

    /**
     * Emit vMix messages to listeners registered for data
     * as a fallback solution if no listener is registered 
     * in the specific custom-listener-type
     * 
     * Enabled by default
     */
    protected _useDataListenersAsFallback = true

    /*
     * Print debug messages
     *
     * Disabled by default
     */
    protected _debug: boolean = false

    /**
     * Print debug messages regarding buffer
     * 
     * Disabled by default
     */
    protected _debugBuffer: boolean = false

    /**
     * Constructor of ConnectionTCP
     * 
     * The socket automatically attempts to connect by default
     * unless the option 'disableAutoConnectOnInit' is set to true
     * 
     * @param {string} host
     * @param {object} optionss
     */
    constructor(
        host: string = DEFAULT_HOST,
        options: {
            autoReconnect?: boolean,
            debug?: boolean,
            debugBuffers?: boolean,
            disableAutoConnectOnInit?: boolean,
            onDataCallback?: Function,
            port?: number,
            useDataListenersAsFallback?: boolean,
        } = {}
    ) {
        // // Set socket encoding to utf8
        // this._socket.setEncoding('utf8')

        // Guard passed options of wrong type
        // if (!options || typeof options !== 'object') {
        //     options = {}
        // }

        // Set debug flag if parsed in options - disabled as default
        if ('debug' in options && typeof options.debug === 'boolean' && options.debug) {
            this._debug = true
        }
        // Set debug flag if parsed in options - disabled as default
        if ('debugBuffers' in options && typeof options.debugBuffers === 'boolean' && options.debugBuffers) {
            this._debugBuffer = true
        }

        this._debug && console.log('[node-vmix]', 'Instanciating TCP socket to vMix instance', host)
        this._debug && console.log('[node-vmix]', 'Received host', host)
        this._debug && console.log('[node-vmix]', 'Received options', options)
        // this._debug && console.log('[node-vmix]', '-----')

        // Set encoding so that the 'data' event delivers data chunks as strings
        this._socket.setEncoding('utf-8')

        // Set core attributes
        this._setHost(host)
        this._setPort('port' in options && options.port ? options.port : DEFAULT_TCP_PORT)

        // Initialize listener arrays and callback taps
        // ... plus the generic ones from the socket!
        CUSTOM_LISTENER_TYPES.forEach((type: string) => {
            this._listeners[type] = []
        })

        SOCKET_BASE_LISTENER_TYPES.forEach((type: string) => {
            this._listeners[type] = []
        })

        // Setup socket base-listeners to tap all
        // registered callbacks
        SOCKET_BASE_LISTENER_TYPES.forEach((type: string) => {
            this._socket.on(type, (...data: unknown[]) => {
                // Notify all listeners of this type by
                // invoking callback-method (including data if present)
                this._listeners[type].forEach((cb: Function) => {
                    cb(...data)
                })
            })
        })

        // Set autoReconnect option if in options - enabled as default
        if ('autoReconnect' in options && typeof options.autoReconnect === 'boolean') {
            this._autoReconnect = options.autoReconnect
        }

        // Is onDataCallback passed in options in constructor?
        // Add this to listeners for data
        if ('onDataCallback' in options && typeof options.onDataCallback === 'function') {
            this._listeners.data.push(options.onDataCallback)
        }

        // Register custom listener for 'on connect'-event for handling internal variables
        this._socket.on('connect', () => {
            this._debug && console.log('[node-vmix]', 'Connected to vMix instance via TCP socket', this._host, this._port)

            this._isConnected = true

            this._isRetrying = false

            // if (this._connectTimeout) {
            //     clearTimeout(this._connectTimeout)
            //     this._connectTimeout = null
            // }

            // Clear reconnection interval if it is set
            if (this._reconnectionInterval) {
                clearInterval(this._reconnectionInterval)
                this._reconnectionInterval = null
            }
        })

        // Register custom listener for 'on close'-event for handling internal variables
        this._socket.on('close', () => {
            this._debug && console.log('[node-vmix]', 'Socket connection closed')

            this._isConnected = false

            // if (this._connectTimeout) {
            //     clearTimeout(this._connectTimeout)
            //     this._connectTimeout = null
            // }

            // Check if auto reconnect is enabled
            // Otherwise also if already retrying, do not init further reconnect attempt
            if (!this._autoReconnect || this._isRetrying) {
                return
            }

            this._isRetrying = true
            this._debug && console.log('[node-vmix]', 'Initialising reconnecting procedure...')

            // Each X try to reestablish connection to vMix instance
            this._reconnectionInterval = setInterval(() => {
                this.connect()
            }, this._reconnectionIntervalTimeout)
        })

        // Register custom listener for 'on error'-event for handling internal variables
        this._socket.on('error', () => {
            this._isConnected = false
        })

        // On data listener
        // Put data into buffer and try to process data
        this._socket.on('data', (data: string) => {
            this._debugBuffer && console.log('[node-vmix]', 'Received data from vMix instance via socket connection')
            this._debugBuffer && console.log(data)
            this._debugBuffer && console.log('----------------')

            this._processChunk(data)
        })

        // Setup timeout for maximum time to connect
        // this._connectTimeout = setTimeout(() => {
        //     this._debug && console.log('[node-vmix]', 'Connect timeout reached')

        //     if (this._socket) {
        //         this._socket.destroy()
        //         this._socket = null
        //     }
        // }, this._connectTimeoutDuration)

        // Disable auto connect on initialization?
        if (
            !('disableAutoConnectOnInit' in options)
            || options.disableAutoConnectOnInit !== true
        ) {
            // Set a zero delay timeout to ensure that the caller can register
            // event handlers before we try to call them
            setTimeout(() => this.connect(), 0)
        }
    }



    // /////////////////////////////////
    // Private/protected methods below
    // ///////////////////////////////

    /**
     * Set host
     * 
     * @param {string} host
     */
    protected _setHost = (host: string): void => {
        // Validate host and port
        if (!host || host.length < 3) {
            throw new ApiUrlError(`[node-vmix] Invalid host provided '${host}'`)
        }

        this._host = host
    }

    /**
     * Set port
     * 
     * @param {number} port
     */
    protected _setPort = (port: number): void => {
        // Guard port number
        if (!port || port < 80 || port > 99999) {
            throw new ApiUrlError(`[node-vmix] Invalid port provided '${port}'`)
        }

        this._port = port
    }

    protected _processChunk = (data: string): void => {
		const bufferToSplit = this._lineFragment + data

        if (bufferToSplit.length) {
            // Split on each new line
            const receivedLines = bufferToSplit.split(NEWLINE_CHAR)

            const lastChunk = receivedLines.pop()

            if (lastChunk != null && lastChunk !== '') {
                // Incomplete line found at the end - keep it
                this._lineFragment = lastChunk
            } else {
                this._lineFragment = ''
            }
            this._unprocessedLines.push(...receivedLines)
        }

        this._processLines()
    }

    /**
     * Process the lines of received data that are complete
     */
    protected _processLines = (): void => {


        // If less than two lines were found
        // do not process buffer yet - keep whole buffer
        if (this._unprocessedLines.length === 0) {
            return
        }

        // console.log('Total bytes length:', this.buffer.byteLength)
        // console.log('Got lines:', receivedLines.length)
        // console.log(receivedLines[0])
        // console.log(data.byteLength)
        // console.log('-----')
        // return

        // We know now that the buffer got at least one complete message!
        // We now ingest and analyse this first message
        let firstMsg = ''

        for (let i = 0; i < this._unprocessedLines.length; i++) {
            const line = this._unprocessedLines.shift()
            if (line?.length) {
                firstMsg = line
                break
            }
        }

        const firstMessage = firstMsg

        if (firstMessage.length === 0) {
            return
        }

        // Trim and then split the first message on spaces
        const firstMessageParts = firstMessage.split(' ')
            .map(p => p.trim())
            .filter(p => p)

        if (firstMessageParts.length < 2) {
            return
        }

        this._debugBuffer && console.log('[node-vmix]', 'Reading buffer message:', firstMessage)
        // this._debugBuffers && console.log(
        //     'Length of first message in buffer',
        //     `"${firstMessage}"`,
        //     firstMessageLength,
        //     firstMessage.length
        // )

        const [messageType, messageStatus] = firstMessageParts

        // If an XML message then
        // just emit the message without further manipulation
        if (messageType === 'XML') {
            return this._processXMLmessage(firstMessage, firstMessageParts)
            // Otherwise treat customly based on type of message
        }

        return this._processNonXMLmessage(messageType, messageStatus, firstMessage)
    }

    protected _processNonXMLmessage(
        messageType: string,
        messageStatus: string,
        firstMessage: string,
    ): void {
        this._debugBuffer && console.log('[node-vmix]', 'Processing non-XML message:', firstMessage)

        // If message status is Error then emit as regular message
        if (messageStatus === 'ER') {
            this._debugBuffer && console.log('[node-vmix]', 'Emitting error message:', firstMessage)
            this._emitMessage(firstMessage)
        } else {


            const messageTypeLower = messageType.toLowerCase()

            this._debugBuffer && console.log('[node-vmix]', 'Handling custom message:', messageType)

            switch (messageTypeLower) {
                // Activators messages
                case 'acts':
                case 'activators':
                    this.emitActivatorsMessage(firstMessage)
                    break
                case 'tally':
                    // console.log('Not an XML message - instead a message of type', messageType)
                    this._emitTallyMessage(firstMessage)
                    break
                case 'version':
                    // console.log('Not an XML message - instead a message of type', messageType)
                    this._emitVersionMessage(firstMessage)
                    break
                default:
                    this._emitMessage(firstMessage)
                    break
            }
        }

        this._processLines()
    }

    /**
     * Process buffer XML message
     * 
     * @param firstMessage
     * @param firstMessageLength
     * @param firstMessageParts
     */
    protected _processXMLmessage(
        firstMessage: string,
        firstMessageParts: string[]
    ): void {
        // We now know the message were a XML message

        if (firstMessageParts.length < 2) {
            this._debug && console.error('[node-vmix]', 'First message did not include how long the XML should be..', firstMessage)
            return
        }

        // What should the number of bytes the XML data should be?
        // The first message includes the length as the second argument
        // (e.g. "XML 2534")
        // The data could potentially be split up in multiple messages
        // Therefore, we need to check that we have received the complete
        // message, otherwise we do not emit the message yet!
        const bufferLengthNeeded = parseInt(firstMessageParts[1])
        // console.log('Buffer Length needed', bufferLengthNeeded)

        // const dataMessages = data.slice(1) // Strip out the first message
        // const messages = dataMessages.join('\r\n') // Concat all received messages

        // Is the total length of the data "long enough"?
        // console.log('Buffer length: ', this.buffer.byteLength)
        // console.log('First message length: ', firstMessageLength)
        // console.log('Needed from message: ', bufferLengthNeeded)

        let messageCompleteLength = 0
        let messagesToTake = 0
        for (let i = 0; i < this._unprocessedLines.length; i++) {
            messageCompleteLength += Buffer.byteLength(this._unprocessedLines[i], 'utf-8') + NEWLINE_CHAR_BYTE_LENGTH
            if (messageCompleteLength >= bufferLengthNeeded) {
                messagesToTake = i + 1
                break
            }
        }

        if (messagesToTake === 0) {
            // we didn't receive enough lines
            this._unprocessedLines.unshift(firstMessage)
            return
        }

        // The buffer were "long enough"
        // Exctract the XML data

        const xmlData = this._unprocessedLines.splice(0, messagesToTake).join(NEWLINE_CHAR)


        this.emitXmlMessage(xmlData)

        this._processLines()
    }


    /**
     * Emit generic data message
     */
    protected _emitMessage = (message: string): void => {
        // Tap callback listeners with message
        this._listeners.data.forEach((cb: Function) => {
            cb(message)
        })
    }

    /**
     * Emit Activators message
     */
    protected emitActivatorsMessage = (message: string): void => {
        const listeners = this._listeners.activators

        if (listeners.length) {
            // Tap callback listeners with tally summary
            listeners.forEach((cb: Function) => {
                cb(message)
            })
            return
        }

        // If no activators-listeners were registered then
        // fallback to emit the message as generic message if enabled
        if (this._useDataListenersAsFallback) {
            return this._emitMessage(message)
        }
    }

    /**
     * Emit Tally message
     */
    protected _emitTallyMessage = (message: string): void => {
        const listeners = this._listeners.tally

        if (listeners.length) {
            this._debug && console.log('[node-vmix]', 'Tally string:', message)

            const tallyString = message
                .replace('TALLY OK ', '')

            // Tap callback listeners with tally string
            listeners.forEach((cb: Function) => {
                cb(tallyString)
            })

            return
        }

        // If no tally-listeners were registered then
        // fallback to emit the message as generic message if enabled
        if (this._useDataListenersAsFallback) {
            return this._emitMessage(message)
        }
    }


    /**
     * Emit Version message
     */
    protected _emitVersionMessage = (message: string): void => {
        const listeners = this._listeners.version

        // If no version-listeners were registered then
        // fallback to emit the xml message as generic message
        if (listeners.length) {
            this._debug && console.log('[node-vmix]', 'Version message raw string:', message)

            const versionString = message
                .replace('VERSION OK ', '')

            // Tap callback listeners with tally summary
            listeners.forEach((cb: Function) => {
                cb(versionString)
            })
        }

        // If no version-listeners were registered then
        // fallback to emit the message as generic message if enabled
        if (this._useDataListenersAsFallback) {
            return this._emitMessage(message)
        }
    }

    /**
     * Emit XML message
     */
    protected emitXmlMessage = (message: string): void => {
        const listeners = this._listeners.xml

        // If no xmlData listeners were registered then
        // fallback to emit the xml message as generic message
        if (listeners.length) {
            // Tap callback listeners with message
            listeners.forEach((cb: Function) => {
                cb(message)
            })
        }

        // If no tally-listeners were registered then
        // fallback to emit the message as generic message if enabled
        if (this._useDataListenersAsFallback) {
            return this._emitMessage(message)
        }
    }


    /**
     * Convert a function command object to the string to execute
     * 
     * @param {vMixApiFunctionCommand} command
     * @returns {string}
     */
    protected functionCommandObjectToString = (command: vMixApiFunctionCommand): string => {
        const cmdFunc = command.Function
        // Clone command and remove function name from command object
        // The command is injected as querystring
        const cmd: { [key: string]: any } = command
        delete cmd.Function

        // Prepare output string builder
        const outputSB = ['FUNCTION', cmdFunc]

        // Turn other command parameters into querystring
        if (Object.values(command).length) {
            const cmdString = querystring.stringify(command)
            outputSB.push(cmdString)
        }

        const output = outputSB.join(' ')

        return output
    }

    /**
     * Stringify commands
     * (if necessary)
     * 
     * @param {vMixApiFunctionCommand|string} command
     * @returns {string}
     */
    protected stringifyCommand = (command: vMixApiFunctionCommand | string): string => {
        // If an object then it is a function command which
        // needs to be turned it into a valid string
        if (typeof command === 'object') {
            return this.functionCommandObjectToString(command)
        }

        // First word must be uppercase always
        // Get index of first space and upper case all characters until this index
        const indexFirstSpace = command.indexOf(' ')

        // If no spaces at all, just return upper cased word
        if (indexFirstSpace === -1) {
            return command.toUpperCase()
        }

        command = [
            // First word upper cased
            command.slice(0, indexFirstSpace + 1).toUpperCase(),
            // Rest of message
            command.slice(indexFirstSpace + 1),
        ].join('')

        // console.log('COMMAND', command)

        return command
    }

    protected ensureMessageEnding = (message: string): string => {
        // End message with a new line character
        // to make sure the message is interpreted by the receiver
        if (!message.endsWith(NEWLINE_CHAR)) {
            message += NEWLINE_CHAR
        }

        return message
    }


    /**
     * Send message to connection
     * 
     * This must be a string of the complete command to execute
     * 
     * The available commands are listed under:
     * https://www.vmix.com/help23/TCPAPI.html 
     * See "Commands section"
     * 
     * @param {String} message 
     * @returns {Promise}
     */
    protected _sendMessageToSocket = async (message: string) => {
        this._debug && console.log('[node-vmix]', 'Sending message to vMix instance via socket', message)

        // Guard connected
        // if (!this.connected()) {
        // this._debug && console.warn('[node-vmix]', 'Warning! Attempted to send message but socket is not connected', this._socket)
        // throw new Error('[node-vmix] Not able to send message - not connected to socket yet!')
        // console.error('[node-vmix] Not able to send message - not connected to socket yet!')
        // }

        // Write message to socket
        // The message will be buffered in user memory by socket instance
        // in the case the socket is not yet connected, or the traffic is congested
        this._socket.write(message, (err) => {
            if (err) throw err

            // Resolve the promise when the message has been sent to socket destination
            Promise.resolve()
        })
    }

    // ///////////////////////////////
    // Protected/private methods end
    // /////////////////////////////


    // //////////////////////
    // Public methods start
    // ////////////////////

    /**
     * Connect
     * 
     * Attempt to establish connection to socket of vMix instance
     */
    connect(host?: string, port?: number): void {
        this._debug && console.log('[node-vmix]', 'Attempting to establish TCP socket connection to vMix instance', `${this._host}:${this._port}`)

        // Guard already connected
        if (this.connected()) {
            this._debug && console.log('[node-vmix]', 'TCP socket connection to vMix instance was already established...', `${this._host}:${this._port}`)
            return
        }

        if (host) {
            this._setHost(host)
        }
        if (port) {
            this._setPort(port)
        }

        // Emit 'connecting'-event
        this._listeners.connecting.forEach(cb => cb())

        // Attempt establishing connection
        this._socket.connect(this._port, this._host)
        // this._socket.connect(this._port, this._host, () => {
        //     // Resolve promise upon establishment of socket connection 
        //     Promise.resolve()
        // })
    }

    /**
     * Send one or more messages to socket connection
     * 
     * Messages are requests or command(s) to perform functions to the API
     * 
     * This must be a string or object,
     * or a array of strings or objects (or a mix of object or strings) 
     * 
     * The available commands are listed under:
     * https://www.vmix.com/help24/TCPAPI.html 
     * See "Commands section"
     * 
     * @param {string|string[]|vMixApiFunctionCommand|vMixApiFunctionCommand[]} commands
     * 
     */
    async send(command: string | string[] | vMixApiFunctionCommand | vMixApiFunctionCommand[]) {
        // Guard socket connected
        // if (!this.connected()) {
        // throw new Error('[node-vmix] Tried to send commands without open socket...')
        // console.error('[node-vmix] Tried to send commands without open socket...')
        // }

        const commands: (vMixApiFunctionCommand | string)[] = !Array.isArray(command) ? [command] : command

        // Stringify each command (if necessary) and send these as 
        // A concatenated message on TCP socket to vMix instance
        return this._sendMessageToSocket(
            commands
                .map(this.stringifyCommand)
                .map(this.ensureMessageEnding)
                .join('')
        )
    }

    /**
     * Register listener on a specific event type
     * 
     * @param {string} type 
     * @param {Function} callback 
     */
    on(type: string, callback: Function): void {
        let desiredListenerType = type.toLocaleLowerCase()

        // Alias for 'activators'-listener: 'acts'
        if (desiredListenerType === 'acts') {
            desiredListenerType = 'activators'
        }

        // All available listener types
        const availableListenerTypes = SOCKET_BASE_LISTENER_TYPES.concat(CUSTOM_LISTENER_TYPES)

        if (!availableListenerTypes.includes(desiredListenerType)) {
            throw new Error(`Invalid type of listener... '${type}'`)
        }

        this._listeners[desiredListenerType].push(callback)
    }

    /**
     * Unregister listeners of specific event-type and with a specific callback function-signature
     *
     * @param {string?} listenerType
     * @param {Function?} callbackSignature
     */
    off(listenerType: string, callbackSignature: Function): void {
        const desiredListenerType = listenerType.toLowerCase()

        // All available listener types
        const availableListenerTypes = SOCKET_BASE_LISTENER_TYPES.concat(CUSTOM_LISTENER_TYPES)

        if (!availableListenerTypes.includes(desiredListenerType)) {
            throw new Error(`Invalid type of listener... '${listenerType}'`)
        }

        // Remove listeners of specific callback method signature
        this._listeners[desiredListenerType] = this._listeners[desiredListenerType].filter((listener) => listener !== callbackSignature)
    }


    /**
     * Unregister all listeners
     */
    clearAllListeners = (): void => {
        // All available listener types
        const availableListenerTypes = SOCKET_BASE_LISTENER_TYPES.concat(CUSTOM_LISTENER_TYPES)

        // Iterate through all available listener type
        availableListenerTypes.forEach(listenerType => {
            // Unregister all listener by resetting array for each type of listener
            this._listeners[listenerType] = []
        })
    }

    /**
     * Ask to Shutdown and destroy the TCP socket
     */
    shutdown(): void {
        // // Stop trying to reconnect after being instructed to shutdown.
        this._autoReconnect = false
        if (this._reconnectionInterval) {
            clearInterval(this._reconnectionInterval)
            this._reconnectionInterval = null
        }

        if (this.connected()) {
            // Gently close socket by sending QUIT message
            this.send('QUIT')
                .then(() => {
                    this._socket.destroy()
                })
            return
        }

        // Is not connected, so just destroy socket
        this._socket.destroy()
    }

    /**
     * Get "raw" TCP socket
     * 
     * @returns Socket | null
     */
    socket(): Socket {
        return this._socket
    }

    /**
     * Is currently connected?
     */
    connected(): boolean {
        // @ts-ignore - Why is readyState not in ts doctype???
        // return this._socket.readyState === 'open'

        return this._isConnected
    }

    /**
     * Is currently connecting?
     */
    connecting(): boolean {
        // @ts-ignore - Why is readyState not in ts doctype???
        // return this._socket.readyState === 'opening'

        return this._socket.connecting
    }

    // //////////////////////
    // Public methods end
    // ////////////////////
}

export default ConnectionTCP