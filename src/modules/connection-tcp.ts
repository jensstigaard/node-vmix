
import { Socket } from 'net'

import querystring from 'querystring'

// Types
import { Command } from '../types/command'

// Exceptions
import ApiUrlError from '../exceptions/api-url-error'

const LISTENER_TYPES = [
    'close',
    'connect',
    'drain',
    'disconnect',
    'end',
    'error',
    'lookup',
    'ready',
    'timeout'
]

const DEFAULT_TCP_PORT = 8099

const NEWLINE_CHAR_LENGTH = 2 // Length in bytes of CRLF (New Line character on Microsoft Windows) "\r\n"

/**
 * vMix Connection via TCP
 * 
 * vMix TCP API docs
 * https://www.vmix.com/help22/TCPAPI.html
 * 
 * Node.js TCP client / server
 * https://gist.github.com/sid24rane/2b10b8f4b2f814bd0851d861d3515a10
 */
export class ConnectionTCP {

    protected _host: string
    protected _port: number

    // Buffer to store byte array of current incoming message
    protected _buffer: Buffer = Buffer.from([])

    // TCP socket to vMix instance
    protected _socket: Socket = new Socket()


    protected _listeners: { [key: string]: Function[] } = {}

    // Auto reconnect? Enabled by default
    protected _autoReconnect: boolean = true

    protected _isConnected: boolean = false
    protected _isRetrying: boolean = false
    protected _reconnectionIntervalTimeout: number = 3000
    protected _reconnectionInterval: NodeJS.Timeout | null = null

    // Print debug messages? Disabled by default
    protected _debug: boolean = false
    protected _debugBuffers: boolean = false

    /**
     * 
     * @param {string} host
     * @param {object} options 
     */
    constructor(
        host: string = 'localhost',
        options: {
            autoReconnect?: boolean,
            connectOnStartup?: boolean,
            debug?: boolean,
            debugBuffers?: boolean,
            onDataCallback?: Function,
            port?: number, // Is always 8099 since it currently cannot be changed in vMix
        } = {}
    ) {
        // Set debug flag if parsed in options - disabled as default
        if ('debug' in options && typeof options.debug === 'boolean' && options.debug) {
            this._debug = true
        }
        // Set debug flag if parsed in options - disabled as default
        if ('debugBuffers' in options && typeof options.debugBuffers === 'boolean' && options.debugBuffers) {
            this._debugBuffers = true
        }

        // Validate host and port
        if (!host || host.length < 3) {
            throw new ApiUrlError('Invalid host provided')
        }

        const port: number = 'port' in options && options.port ? options.port : DEFAULT_TCP_PORT

        if (!port || port < 80 || port > 99999) {
            throw new ApiUrlError('Invalid port provided')
        }

        // Set private params
        this._host = host
        this._port = port


        // Initialize listener arrays and callback taps
        this._listeners = {
            data: [],
            xmlData: []
            // ... plus the generic ones from the socket!
        }

        // On base listener types
        LISTENER_TYPES.forEach(type => {
            this._listeners[type] = []

            // Add socket listenener to tap all
            // registered callbacks
            this._socket.on(type, (data: any) => {
                // Get all listeners of this type and
                // Invoke callback method with data
                this._listeners[type]
                    .forEach((cb: Function) => {
                        cb(data)
                    })
            })
        })

        // Set autoReconnect option if in options - enabled as default
        if ('autoReconnect' in options && typeof options.autoReconnect === 'boolean') {
            this._autoReconnect = options.autoReconnect
        }

        // On data listener
        // Put data into buffer and try to process data
        this._socket.on('data', (data: Buffer) => {
            this._debugBuffers && console.log('Received data on socket')
            this._debugBuffers && console.log(data)

            this._buffer = Buffer.concat([this._buffer, data])
            this.processBuffer()
        })

        // Is onDataCallback passed in options in constructor?
        // Add this to listeners for data
        if ('onDataCallback' in options && typeof options.onDataCallback === 'function') {
            this._listeners.data.push(options.onDataCallback)
        }

        // Internal listener for on connection established events
        this._socket.on('connect', () => {
            this._debug && console.log('Connected to vMix instance via TCP socket')

            this._isConnected = true
            this._isRetrying = false

            // Clear reconnection interval if it is set
            if (this._reconnectionInterval) {
                clearInterval(this._reconnectionInterval)
                this._reconnectionInterval = null
            }
        })

        // Internal listener for on connection closed events
        this._socket.on('close', () => {
            this._isConnected = false

            this._debug && console.log('Connection closed')

            // Check if auto reconnect is enabled
            // Otherwise also if already retrying, do not init further reconnect attempt
            if (!this._autoReconnect || this._isRetrying) {
                return
            }

            this._isRetrying = true
            this._debug && console.log('Initialising reconnecting procedure...')

            // Each X try to reestablish connection to vMix instance
            this._reconnectionInterval = setInterval(() => {
                this.attemptEstablishConnection()
            }, this._reconnectionIntervalTimeout)
        })

        // Connect on start up?
        // Enabled by default if not explicitly passed in options as a false value,
        // it is attempting to establish connectionÂ upon startup
        if (!('connectOnStartup' in options) || (typeof options.connectOnStartup === 'boolean' && options.connectOnStartup)) {
            this.attemptEstablishConnection()
        }
    }



    // ///////////////////////
    // Private methods below
    // /////////////////////

    /**
     * Establish connection
     */
    protected attemptEstablishConnection = (): void => {
        // Attempt establishing connection
        this._debug && console.log('Attempting to establish connection to vMix instance...')

        this._socket.connect(this._port, this._host)
    }

    /**
     * Process received data that is currently in the buffer
     */
    protected processBuffer = (): void => {
        // Process buffer if it contains data
        if (!this._buffer.byteLength) {
            return
        }

        // Parse buffer to string and trim start and end
        const data = this._buffer.toString()

        // Split on each new line
        const receivedLines = data.split('\r\n')
        // .map(line => line.trim())
        // .filter(line => line)

        // If less than two lines were found
        // do not process buffer yet - keep whole buffer
        if (receivedLines.length === 0) {
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
        for (let i = 0; i < receivedLines.length; i++) {
            const line = receivedLines[i]
            if (line.length) {
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

        const firstMessageLength = Buffer.from(firstMessage).byteLength

        // console.log('First message length', `"${firstMessage}"`, firstMessageLength, firstMessage.length)

        const messageMethod = firstMessageParts[0]

        // If not an XML message then
        // just emit the message without further manipulation
        if (messageMethod !== 'XML') {
            // console.log('Not an XML message - instead a message of type', messageMethod)
            this.emitMessage(firstMessage)


            // Pop first message from buffer
            const sliced = this._buffer.slice(firstMessageLength + NEWLINE_CHAR_LENGTH) // New line character is two bytes
            // console.log('Sliced', sliced.toString())
            this._buffer = sliced

            // Process more data
            this.processBuffer()
            return
        }

        // We now know the message were a XML message

        if (firstMessageParts.length < 2) {
            this._debug && console.error('First message did not include how long the XML should be..', firstMessage)
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

        const messageCompleteLength = firstMessageLength + NEWLINE_CHAR_LENGTH + bufferLengthNeeded
        if (this._buffer.byteLength < messageCompleteLength) {
            // console.log('Not enough data in buffer...')
            // console.log(`"""${data}"""`)
            return
        }

        // The buffer were "long enough"
        // Exctract the XML data

        const xmlData = this._buffer.slice(firstMessageLength + NEWLINE_CHAR_LENGTH, firstMessageLength + bufferLengthNeeded)
        const xmlDataString = xmlData.toString()

        this.emitXmlMessage(xmlDataString)

        // Pop message from current buffer data and update buffer
        this._buffer = this._buffer.slice(messageCompleteLength)

        this.processBuffer()
    }

    /**
     * Emit generic data message
     */
    protected emitMessage = (message: string): void => {
        // Tap callback listeners with message
        this._listeners.data.forEach((cb: Function) => {
            cb(message)
        })
    }

    /**
     * Emit XML message
     */
    protected emitXmlMessage = (message: string): void => {

        const listeners = this._listeners.xmlData

        // If no xmlData listeners were registered then
        // fallback to emit the xml message as generic message
        if (!listeners || !listeners.length) {
            return this.emitMessage(message)
        }

        // Tap callback listeners with message
        listeners.forEach((cb: Function) => {
            cb(message)
        })
    }



    /**
     * Send message to connection
     * 
     * This must be a string of the complete command to execute
     * 
     * The available commands are listed under:
     * https://www.vmix.com/help22/TCPAPI.html 
     * See "Commands section"
     * 
     * @param {String} message 
     */
    protected sendSingleMessage = (message: string): void => {
        // End message with a new line character
        // to make sure the message is interpreted by the receiver
        if (!message.endsWith('\r\n')) {
            message += '\r\n'
        }

        this._socket.write(message)
    }


    /**
     * Convert a command object to the string to execute
     * 
     * @param {Command} command
     * @returns {string}
     */
    protected commandObjectToString = (command: Command): string => {

        // Resolve function name and
        // remove it from object to be injected as querystring
        const funcName = command.Function
        delete command.Function

        const cmdString = querystring.stringify(command)
        return `FUNCTION ${funcName} ${cmdString}`
    }

    /**
     * Stringify commands if necessary
     * @param {Command|string} command
     * 
     * @returns {string}
     */
    protected stringifyCommand = (command: Command | string): string => {
        if (typeof command === 'object') {
            return this.commandObjectToString(command)
        }

        return command
    }

    // //////////////////////
    // Private methods end
    // ////////////////////



    // //////////////////////
    // Public methods start
    // ////////////////////



    /**
     * Send command(s) to connection
     * 
     * This must be a string or object,
     * or a array of strings or objects (or a mix of object or strings) 
     * 
     * The available commands are listed under:
     * https://www.vmix.com/help22/TCPAPI.html 
     * See "Commands section"
     * 
     * @param {Command[]|Command|string} commands 
     */
    send(command: Command[] | Command | string): void {
        const commands: any[] = !Array.isArray(command) ? [command] : command

        // Stringify each command (if necessary) and send these as 
        // single messages on TCP socket to vMix instance
        commands
            .map(this.stringifyCommand)
            .forEach(this.sendSingleMessage)
    }

    /**
     * Register listener on a specific event type
     * 
     * @param {string} type 
     * @param {Function} callback 
     */
    on(type: string, callback: Function): void {
        const availableListenerTypes = LISTENER_TYPES.concat(['data', 'xmlData'])

        if (!availableListenerTypes.includes(type)) {
            throw new Error(`Invalid type of listener... ${type}`)
        }

        this._listeners[type].push(callback)
    }

    /**
     * Ask to Shutdown and destroy the TCP socket
     */
    shutdown(): void {
        // this.socket.destroy(); // kill client after server's response
        this._socket.destroy()
    }

    /**
     * Get raw TCP socket
     * 
     * @returns Socket
     */
    socket(): Socket {
        return this._socket
    }

    /**
     * Is currently connected?
     */
    connected(): boolean {
        return this._isConnected
    }

    /**
     * Is currently connecting?
     */
    connecting(): boolean {
        return this._socket.connecting
    }

    // //////////////////////
    // Public methods end
    // ////////////////////
}

export default ConnectionTCP
