# node-vmix

NodeJS vMix API utility to enable easy setup to communicate with vMix instance via TCP socket or HTTP alternatively.

It is recommended to use TCP, however, there is currently not implemented feedback/response.
It is possible to implement this yourself if necessary, by analysing the responses, but it is not supported out of the box.

[![package json version](https://img.shields.io/github/package-json/v/jensstigaard/node-vmix.svg)](https://www.github/jensstigaard/node-vmix)
[![npm version](https://badge.fury.io/js/node-vmix.svg)](https://www.npmjs.com/package/node-vmix)
[![npm downloads](https://img.shields.io/npm/dm/node-vmix)](https://www.npmjs.com/package/node-vmix)

This code previously were found in the vmix-js-utils but are now branched out in its own package to enable usage of the vmix-js-utils to be used in a clean frontend environment (non-NodeJS), and also to give a better experience for the users. Are you looking for vMix utility for your js frontend? Take a look at [vmix-js-utils](https://github.com/jensstigaard/vmix-js-utils) for more info.
Both packages are available with npm - see [my npm profile](https://www.npmjs.com/~jensstigaard).

```javascript
const { ConnectionTCP } = require('node-vmix')

const connection = new ConnectionTCP('localhost')

// Listener for xml state data
connection.on('xml', xmlData => {
 // Your logic here!
 // See example to parse the XML correctly
})
// Listener for data such as tally
connection.on('data', data => {
 // Your logic here!
})

// Ask to get vMix state in XML
connection.send('XML')

// Ask to get tally info
connection.send('TALLY')
```


# Purpose
The utilities consists of several modules. Each can be used on its own, but usually it makes more sense to make it interplay with some of the other modules.
The modules is as following:
 - [ConnectionTCP](#connectiontcp) (recommended)
 - [ConnectionHTTP](#connection-http)

The modules are coded as classes, meaning that they are constructed with specific parameters, e.g. that the instanciation of a connection needs a host and a port. 


# Description of modules
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



## Installation and use
### As a dependency using npm
The utilities are published at npmjs as a package for NodeJS, meaning that you can easily add the utilities as a dependency in your NodeJS project.
Found here: https://www.npmjs.com/package/node-vmix
```sh
npm install node-vmix --save # or 'yarn add node-vmix'
```

In your code the simplest way to import the modules is the following:

```javascript
const { Connection } = require('node-vmix')
// or   import { Connection } from 'node-vmix'

const connection1 = new Connection('localhost')
const connection2 = new Connection('192.168.1.50')

connection1.send({ Function: 'Cut' })
connection2.send({ Function: 'Merge' })
```

You are also able to import all of the modules as a gathered variable, less elegant way:

```javascript
const vMix = require('node-vmix')

const connection1 = new vMix.Connection('localhost')
const connection2 = new vMix.Connection('192.168.1.50')

connection1.send({ Function: 'Cut' })
connection2.send({ Function: 'Merge' })
```


# Examples and use
## Electron example 
Looking for a full blown example project? See the repositories:
 - [simple-vmix-switcher-electron](https://github.com/jensstigaard/simple-vmix-switcher-electron)
 - [audio-matrix-vmix-electron](https://github.com/jensstigaard/audio-matrix-vmix-electron)
 
Both these apps are using this library. They are built with ElectronJS and can be compiled for both Windows, Mac or Linux platforms.

## Code snippet examples
Review index.js for some basic example of how to use the utilities
 - [Send single command example](../../blob/master/examples/send-single-command.js)
 - [Send multiple commands example](../../blob/master/examples/send-multiple-commands.js)
 - [Send multiple commands mixed strings/objects example](../../blob/master/examples/send-multiple-commands-mixed.js)
 - [Read all inputs from vMix state basic example](../../blob/master/examples/read-state-basic.js)


Legacy:
 - [CommandSenderHTTP example](../../blob/master/examples/command-sender-http.js)
 - [StateFetcher Basic example](../../blob/master/examples/state-fetcher-basic.js)



## Standalone project / Fork
The code can be cloned and tested as needed from the source code.

Clone repository and go into directory
```sh
git clone https://github.com/jensstigaard/node-vmix.git
cd node-vmix
```
Install dependencies
```sh
npm install # or 'yarn'
```
Compile TypeScript source code to JavaScript
```sh
npm install # or 'yarn'
```
Run tests
```sh
npm test # or 'yarn test'

```

# Contribution
You are more than welcome to contribute to the repository.
Fork the repo and make a pull request with the changes.

As you can see in the list on the right side, others have done it already!


# Roadmap
 - TCP command sender: feedback/responses on commands sent
 - More tests
 - Perhaps more functionality
