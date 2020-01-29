const assert = require('assert')

// Import the modules
const { ConnectionHTTP } = require('../index')

describe('connection', function () {
    describe('instanciate', function () {
        it('should pass and resolve basic host and port', function () {
            let connection = new ConnectionHTTP('localhost', 8088)

            assert.equal(connection.apiUrl(), 'http://localhost:8088/api')
        })

        it('should throw an exception if host is less than three characters', function () {
            assert.throws(() => { new ConnectionHTTP('ab') })
        })

        it('should throw an exception if port is equal to zero', function () {
            assert.throws(() => { new ConnectionHTTP('localhost', 0) })
        })

        it('should throw an exception if port is less than zero', function () {
            assert.throws(() => { new ConnectionHTTP('localhost', -5) })
        })
    })
})