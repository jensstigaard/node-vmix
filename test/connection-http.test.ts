// Import the modules
import { ConnectionHTTP } from '../dist/index'

describe('connection', function () {
    describe('instanciate', function () {
        it('should pass and resolve basic host and port', function () {
            let connection = new ConnectionHTTP('localhost', 8088)

            expect(connection.apiUrl()).toBe('http://localhost:8088/api')
        })

        it('should throw an exception if host is less than three characters', function () {
            expect(() => { new ConnectionHTTP('ab') }).toThrow()
        })

        it('should throw an exception if port is equal to zero', function () {
            expect(() => { new ConnectionHTTP('localhost', 0) }).toThrow()
        })

        it('should throw an exception if port is less than zero', function () {
            expect(() => { new ConnectionHTTP('localhost', -5) }).toThrow()
        })
    })
})