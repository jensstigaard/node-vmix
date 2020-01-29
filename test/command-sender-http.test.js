const assert = require('assert')
const moxios = require('moxios')

// Import the modules
const { CommandSenderHTTP, ConnectionHTTP } = require('../index')

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
        assert.throws(() => { new CommandSenderHTTP() }, "Somehow a connection were passed..?")
    })

    it('should instanciate if connection were passed', async function () {
        new CommandSenderHTTP(new ConnectionHTTP)
        assert.ok(true)
    })


    describe('send a command', function () {

        before(function () {
            this.connection = new ConnectionHTTP()
            this.commandSender = new CommandSenderHTTP(this.connection)
        });

        it('should send a basic command', async function () {
            // Response stub
            moxios.stubRequest(`${this.connection.apiUrl()}?Function=Cut`, {
                status: 200,
                response: 'Function completed successfully.'
            })

            let command = { Function: 'Cut' }

            let response = await this.commandSender.send(command)

            assert.equal(response.status, 200)
            assert.equal(response.data, 'Function completed successfully.')
        })


        it('should be allowed to send multiple commands in the same request', async function () {
            // Response stub
            moxios.stubRequest(`${this.connection.apiUrl()}`, {
                status: 200,
                response: 'Function completed successfully.'
            })

            // Commands to invoke
            let command = [
                { Function: 'Cut' },
                { Function: 'Merge' },
                { Function: 'Cut' }
            ]

            let response = await this.commandSender.send(command)

            assert.equal(response.status, 200)
            assert.equal(response.data, 'Function completed successfully.')
        })

        it('should fail when a invalid command is sent', async function () {

            let command = { Function: 'IAmAnInvalidFunction' }

            // Response stub
            moxios.stubRequest(`${this.connection.apiUrl()}?Function=IAmAnInvalidFunction`, {
                status: 500,
                response: 'No suitable Function could be found.'
            })

            try {
                await this.commandSender.send(command)
                assert.fail("Request did not fail")
            } catch (error) {
                assert.equal(error.response.status, 500)
                assert.equal(error.response.data, 'No suitable Function could be found.')
            }
        })
    })
})