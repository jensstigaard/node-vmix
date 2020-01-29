import * as net from 'net'

import querystring from 'querystring'

// Types
import { Command } from '../types/command'
// Exceptions
import ApiUrlError from '../exceptions/api-url-error'

const listenerTypes = [
    'close',
    'connect',
    'drain',
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
export default class vMixConnectionTCP {

    protected host: string
    protected port: number

    protected isConnected: boolean = false
    protected isRetrying: boolean = false
    protected reconnectionInterval: NodeJS.Timeout | null = null
    protected reconnectionIntervalTimeout: number = 3000

    // Buffer to store byte array of current incoming message
    protected buffer: Buffer = Buffer.from([])

    // TCP socket to vMix instance
    protected _socket: net.Socket = new net.Socket()


    protected listeners: any = {}

    /**
     * 
     * @param {string} host
     * @param {number} port
     * @param {Function} onDataCallback 
     */
    constructor(host: string = 'localhost', port: number = DEFAULT_TCP_PORT, onDataCallback: Function | null = null) {

        // Validate host and port
        if (!host || host.length < 3) {
            throw new ApiUrlError('Invalid host provided')
        }
        if (!port || port < 80 || port > 99999) {
            throw new ApiUrlError('Invalid port provided')
        }

        // Set private params
        this.host = host
        this.port = port


        // Initialize listener arrays and callback taps
        this.listeners = {
            data: [],
            xmlData: []
            // ... plus the generic ones from the socket!
        }

        // On base listener types
        listenerTypes.forEach(type => {
            this.listeners[type] = []

            // Add socket listenener to tap all
            // registered callbacks
            this._socket.on(type, (data: any) => {
                // Get all listeners of this type and
                // Invoke callback method with data
                this.listeners[type]
                    .forEach((cb: Function) => {
                        cb(data)
                    })
            })
        })

        // On data listener
        // Put data into buffer and try to process data
        this._socket.on('data', (data: any) => {
            this.buffer = Buffer.concat([this.buffer, data])
            this.processBuffer()
        })

        // Were a onDataCallback passed with constructor?
        // Add this to listeners for data
        if (onDataCallback && typeof onDataCallback === 'function') {
            this.listeners.data.push(onDataCallback)
        }

        this._socket.on('close', () => {
            this.isConnected = false
            // console.log('close');
            if (this.isRetrying) {
                return
            }

            this.isRetrying = true
            console.log('Reconnecting...')

            // Each X try to reestablish connection to vMix instance
            this.reconnectionInterval = setInterval(() => {
                // If already connected - then clear the interval
                // No need to try to connect - already connected
                if (this.isConnected) {
                    if (this.reconnectionInterval) {
                        clearInterval(this.reconnectionInterval)
                        this.reconnectionInterval = null
                    }

                    return
                }

                this.establishConnection()
            }, this.reconnectionIntervalTimeout)
        })

        this.establishConnection()
    }



    // ///////////////////////
    // Private methods below
    // /////////////////////

    /**
     * Establish connection
     */
    protected establishConnection = (): void => {
        // Attempt establishing connection
        console.log('Attempting to establish connection to vMix instance...')
        this._socket.connect(this.port, this.host,
            () => {
                console.log('Connected to vMix instance via TCP socket')
                this.isConnected = true
                this.isRetrying = false
            })
    }

    /**
     * Process received data that is currently in the buffer
     */
    protected processBuffer = () => {

        // Process buffer if it contains data
        if (!this.buffer.byteLength) {
            return
        }

        // Parse buffer to string and trim start and end
        const data = this.buffer.toString()

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
            const sliced = this.buffer.slice(firstMessageLength + NEWLINE_CHAR_LENGTH) // New line character is two bytes
            // console.log('Sliced', sliced.toString())
            this.buffer = sliced

            // Process more data
            this.processBuffer()
            return
        }

        // We now know the message were a XML message

        if (firstMessageParts.length < 2) {
            console.log('First message did not include how long the XML should be..')
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
        if (this.buffer.byteLength < messageCompleteLength) {
            // console.log('Not enough data in buffer...')
            // console.log(`"""${data}"""`)
            return
        }

        // The buffer were "long enough"
        // Exctract the XML data

        const xmlData = this.buffer.slice(firstMessageLength + NEWLINE_CHAR_LENGTH, firstMessageLength + bufferLengthNeeded)
        const xmlDataString = xmlData.toString()

        this.emitXmlMessage(xmlDataString)

        // Pop message from current buffer data and update buffer
        this.buffer = this.buffer.slice(messageCompleteLength)

        this.processBuffer()
    }

    /**
     * Emit generic data message
     */
    protected emitMessage = (message: string) => {
        // Tap callback listeners with message
        this.listeners.data.forEach((cb: Function) => {
            cb(message)
        })
    }

    /**
     * Emit XML message
     */
    protected emitXmlMessage = (message: string) => {

        const listeners = this.listeners.xmlData

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
    protected sendSingleMessage = (message: string) => {
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
     * @param {Object} command
     * @returns {String}
     */
    protected commandObjectToString = (command: Command) => {

        // Resolve function name and
        // remove it from object to be injected as querystring
        const funcName = command.Function
        delete command.Function

        const cmdString = querystring.stringify(command)
        return `FUNCTION ${funcName} ${cmdString}`
    }

    /**
     * Stringify commands if necessary
     * @param {Object|String} command
     * 
     * @returns {String}
     */
    protected stringifyCommand = (command: Command | string) => {
        if (typeof command === 'object') {
            return this.commandObjectToString(command)
        }

        return command
    }

    // //////////////////////
    // Private methods end
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
    send(command: Command[] | Command | string) {
        const commands: any[] = !Array.isArray(command) ? [command] : command

        // Stringify each command (if necessary) and send these as 
        // single messages on TCP socket to vMix instance
        commands
            .map(this.stringifyCommand)
            .forEach(this.sendSingleMessage)
    }

    /**
     * Register listener on a specific type
     * 
     * @param {string} type 
     * @param {Function} callback 
     */
    on(type: string, callback: Function) {
        const availableListenerTypes = listenerTypes.concat(['data', 'xmlData'])

        if (!availableListenerTypes.includes(type)) {
            throw new Error(`Invalid type of listener... ${type}`)
        }

        this.listeners[type].push(callback)
    }

    /**
     * AskShutdown and destroy the TCP socket
     */
    shutdown() {
        // this.socket.destroy(); // kill client after server's response
        this._socket.destroy()
    }

    /**
     * Get raw TCP socket
     * 
     * @returns net.Socket
     */
    socket() {
        return this._socket
    }

    connected() {
        return this.isConnected
    }

    connecting() {
        return this._socket.connecting
    }
}