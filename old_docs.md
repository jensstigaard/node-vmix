## ConnectionTCP
The 'ConnectionTCP' module is the core of the utils, and allows you to establish communication to a vMix instance.
It let you define which vMix TCP endpoint you want to receive from and send commands to, by passing the IP address to the constructor. You are also able to pass a custom port if it is not using the default port 8099. 

---
`.send(commands)`

Parameters:
 - **commands**: `{Array|Object|String}` - Array, Object or String of the command(s) to be send. Commands parsed as objects are treated as commands that is executing as FUNCTION. These fust include the Function parameter, e.g. 'Cut'. The object may also include other parameters such as Input, Value, or any necessary parameters for the command.

`.on(type, callback)`

Parameters:
 - **type**: `{String}` - Which event to listen for? Available types: xmlData, data, connect, error
 - **callback**: `{Function}` - What should happen on the event? 

It allows you to listen for incoming messages received on the socket.

Use `.on('activators', (message: string) => { ... })` to receive messages regarding activators of vMix instance. See examples below for how to parse the xml data received into usable data structures.

Use `.on('tally', (tallyString: string) => { ... })` to receive messages regarding tally updates for vMix instance. See examples below for how to parse the xml data received into usable data structures.

Use `.on('xml', (xmlData: string) => { ... })` to receive XML data of the vMix state. See examples below for how to parse the xml data received into usable data structures.

Use `.on('data', (message: string) => { ... })` to receive all data from the socket. Will also receive Tally, Activators and XML responses if no listener for these events is registered.

--- 

## ConnectionHTTP
The 'ConnectionHTTP' module is a utility to communicate with a vMix instance using HTTP. This is however not recommended.

---

## StateFetcher
Being deprecated.
Fetches the current state of the vMix instance.

---