import { ConnectionTCP } from "../dist/index"

interface Handlers {
    connect: () => void
    data: (chunk: string) => void
}

let handlers = {} as Handlers

const mockOn = jest.fn((x, y) => {
    ;(handlers as any)[x] = y
})

const mockSetEncoding = jest.fn()

jest.mock("net", () => {
    return {
        Socket: jest.fn(() => ({
            connect: jest.fn(),
            write: jest.fn(),
            on: mockOn,
            setEncoding: mockSetEncoding,
            destroy: jest.fn()
        }))
    }
})

function setupTestee() {
    const testee = new ConnectionTCP()

    const mockOnXml = jest.fn()
    const mockOnTally = jest.fn()
    const mockOnData = jest.fn()

    testee.on("xml", mockOnXml)
    testee.on("tally", mockOnTally)
    testee.on("data", mockOnData)

    testee.connect("localhost")
    handlers.connect()

    return { testee, mockOnXml, mockOnTally, mockOnData }
}

describe("connection TCP", function () {
    describe("xml", function () {
        beforeEach(() => {
            handlers = {} as Handlers
        })

        it("should set encoding to utf-8", async () => {
            const { testee } = setupTestee()
            expect(mockSetEncoding).toHaveBeenCalledTimes(1)
            expect(mockSetEncoding).toHaveBeenNthCalledWith(1, "utf-8")
            testee.shutdown()
        })

        it("should handle fragmented one-line message", async () => {
            const { testee, mockOnTally, mockOnXml } = setupTestee()

            const xmlString1 =
                "<vmix><version>27.0.0.49</version><inputs></inputs></vmix>"
            const xmlMessage1 = makeXmlMessage(xmlString1)

            const tallyFragment1 = "TALLY OK 200000100000"
            const tallyFragment2 = "0000000000000000000020\r\n"

            const xmlString2 =
                "<vmix><version>27.0.0.49</version><inputs><input>Color</input></inputs></vmix>"
            const xmlMessage2 = makeXmlMessage(xmlString2)

            handlers.data(xmlMessage1)
            handlers.data(tallyFragment1)
            handlers.data(tallyFragment2)
            handlers.data(xmlMessage2)

            expect(mockOnXml).toHaveBeenCalledTimes(2)
            expect(mockOnXml).toHaveBeenNthCalledWith(1, xmlString1)
            expect(mockOnXml).toHaveBeenNthCalledWith(2, xmlString2)
            expect(mockOnTally).toHaveBeenCalledTimes(1)
            expect(mockOnTally).toHaveBeenNthCalledWith(
                1,
                "2000001000000000000000000000000020"
            )
            testee.shutdown()
        })

        it("should handle combined messages", async () => {
            const { testee, mockOnTally, mockOnXml } = setupTestee()

            const xmlString1 =
                "<vmix><version>27.0.0.49</version><inputs></inputs></vmix>"
            const xmlString2 =
                "<vmix><version>27.0.0.49</version><inputs><input>Color</input></inputs></vmix>"
            const xmlMessage1 = makeXmlMessage(xmlString1)
            const xmlMessage2 = makeXmlMessage(xmlString2)

            const tallyMessage1 =
                "TALLY OK 2000001000000000000000000000000020\r\n"
            const tallyMessage2 =
                "TALLY OK 1200002000000000000000000000000010\r\n"

            handlers.data(
                    xmlMessage1 + tallyMessage1 + tallyMessage2 + xmlMessage2
            )

            expect(mockOnXml).toHaveBeenCalledTimes(2)
            expect(mockOnXml).toHaveBeenNthCalledWith(1, xmlString1)
            expect(mockOnXml).toHaveBeenNthCalledWith(2, xmlString2)
            expect(mockOnTally).toHaveBeenCalledTimes(2)
            expect(mockOnTally).toHaveBeenNthCalledWith(
                1,
                "2000001000000000000000000000000020"
            )
            expect(mockOnTally).toHaveBeenNthCalledWith(
                2,
                "1200002000000000000000000000000010"
            )
            testee.shutdown()
        })

        it("should handle fragmented XML messages", async () => {
            const { testee, mockOnXml } = setupTestee()

            const xmlString1 =
                "<vmix><version>27.0.0.49</version><inputs></inputs></vmix>"
            const xmlString2 =
                "<vmix><version>27.0.0.49</version><inputs><input>Color</input></inputs></vmix>"
            const xmlMessage1 = makeXmlMessage(xmlString1)
            const xmlMessage2 = makeXmlMessage(xmlString2)

            handlers.data(xmlMessage1.slice(0, 23))
            handlers.data(xmlMessage1.slice(23))
            handlers.data(xmlMessage2.slice(0, 2)) // XM
            handlers.data(xmlMessage2.slice(2)) // L...

            expect(mockOnXml).toHaveBeenCalledTimes(2)
            expect(mockOnXml).toHaveBeenNthCalledWith(1, xmlString1)
            expect(mockOnXml).toHaveBeenNthCalledWith(2, xmlString2)
            testee.shutdown()
        })

        it("should handle multi-line XML messages", async () => {
            // (if such messages are possible)
            const { testee, mockOnXml } = setupTestee()

            const xmlString =
                "<vmix>\r\n  <inputs>\r\n    <input>Color</input>  \r\n</inputs>\r\n</vmix>"
            const xmlMessage = makeXmlMessage(xmlString)

            handlers.data(xmlMessage)

            expect(mockOnXml).toHaveBeenCalledTimes(1)
            expect(mockOnXml).toHaveBeenNthCalledWith(1, xmlString)
            testee.shutdown()
        })

        it("should handle fragmented multi-line XML messages", async () => {
            // (if such messages are possible)
            const { testee, mockOnXml } = setupTestee()

            const xmlString =
                "<vmix>\r\n  <inputs>\r\n    <input>Color</input>  \r\n</inputs>\r\n</vmix>"
            const xmlMessage = makeXmlMessage(xmlString)
            xmlMessage.split("\r\n").forEach((fragment) => {
                if (fragment === "") return
                handlers.data(fragment + "\r\n")
            })

            expect(mockOnXml).toHaveBeenCalledTimes(1)
            expect(mockOnXml).toHaveBeenNthCalledWith(1, xmlString)
            testee.shutdown()
        })
    })
})

// A helper making a valid XML message from data string
function makeXmlMessage(xmlString: string): string {
    return `XML ${Buffer.byteLength(xmlString) + 2}\r\n${xmlString}\r\n`
}
