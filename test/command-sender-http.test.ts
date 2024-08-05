import moxios from 'moxios'

// Import the modules
import { CommandSenderHTTP, ConnectionHTTP } from '../dist/index'

describe('command-sender-http', function () {

    beforeEach(function () {
        // import and pass your custom axios instance to this method
        moxios.install()
    })

    afterEach(function () {
        // import and pass your custom axios instance to this method
        moxios.uninstall()
    })

    it('should fail if no connection were passed', async function () {
        // @ts-ignore
        expect(() => { new CommandSenderHTTP() }).toThrow()
    })

    it('should instanciate if connection were passed', async function () {
        expect(() => new CommandSenderHTTP(new ConnectionHTTP(), () => {}, () => {})).not.toThrow()
    })


    describe('send a command', function () {
        let connection: ConnectionHTTP
        let commandSender: CommandSenderHTTP

        beforeEach(function () {
            connection = new ConnectionHTTP()
            commandSender = new CommandSenderHTTP(connection, () => {}, () => {})
        });

        it('should send a basic command', async function () {
            // Response stub
            moxios.stubRequest(`${connection.apiUrl()}?Function=Cut`, {
                status: 200,
                response: 'Function completed successfully.'
            })

            let command = { Function: 'Cut' }

            // @ts-ignore
            let response = await commandSender.send(command, () => {}, () => {})

            expect(response.status).toBe(200)
            expect(response.data).toBe('Function completed successfully.')
        })


        it('should be allowed to send multiple commands in the same request', async function () {
            // Response stub
            moxios.stubRequest(`${connection.apiUrl()}`, {
                status: 200,
                response: 'Function completed successfully.'
            })

            // Commands to invoke
            let command = [
                { Function: 'Cut' },
                { Function: 'Merge' },
                { Function: 'Cut' }
            ]

            let response = await commandSender.send(command, () => {}, () => {})

            expect(response.status).toBe(200)
            expect(response.data).toBe('Function completed successfully.')
        })

        it('should fail when a invalid command is sent', async function () {

            let command = { Function: 'IAmAnInvalidFunction' }

            // Response stub
            moxios.stubRequest(`${connection.apiUrl()}?Function=IAmAnInvalidFunction`, {
                status: 500,
                response: 'No suitable Function could be found.'
            })

            // @ts-ignore
            const promise = commandSender.send(command, () => {}, () => {})
            await expect(promise).rejects.toMatchObject({ response: { status: 500, data: 'No suitable Function could be found.' }})
        })
    })
})