# node-vmix

NodeJS vMix API utility to enable easy setup to communicate with vMix instance via TCP socket or HTTP alternatively.

It is recommended to use TCP, however, there is currently not implemented feedback/response.
It is possible to implement this yourself if necessary, by analysing the responses, but it is not supported out of the box.

[![package json version](https://img.shields.io/github/package-json/v/jensstigaard/node-vmix.svg)](https://www.github/jensstigaard/node-vmix)
[![npm version](https://badge.fury.io/js/node-vmix.svg)](https://www.npmjs.com/package/node-vmix)

This code previously were found in the vmix-js-utils but are now branched out in its own package to enable usage of the vmix-js-utils to be used in a clean frontend environment (non-NodeJS), and also to give a better experience for the users. Are you looking for vMix utility for your js frontend? Take a look at [vmix-js-utils](https://github.com/jensstigaard/vmix-js-utils) for more info.
Both packages are available with npm.


```javascript
const { Connection } = require('node-vmix')

const connection = new Connection('localhost')

// Listener for xml state data
connection.on('xmlData', xmlData => {
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
 - [Connection](#connection)
 - [ConnectionHttp](#connection-http)

The modules are coded as classes, meaning that they are constructed with specific parameters, e.g. that the instanciation of a connection needs a host and a port. 


# Description of modules
## Connection
The 'Connection' module is the core of the utils, and allows you to establish communication to a vMix instance.
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

Use `.on('xmlData', (xmlData) => {})` to receive XML data of the vMix state. See examples below for how to parse the xml data received into usable data structures.

Use `.on('data', (data) => {})` to receive data from the socket. Will also receive XML responses if no listener for 'xmlData' is registered.

---

# StateFetcher
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
const vMixUtils = require('node-vmix')

const connection1 = new vMixUtils.Connection('localhost')
const connection2 = new vMixUtils.Connection('192.168.1.50')

connection1.send({ Function: 'Cut' })
connection2.send({ Function: 'Merge' })
```


## Standalone project / Fork
The code can be cloned and tested as needed from the source code.

```sh
git clone https://github.com/jensstigaard/node-vmix.git
cd node-vmix

npm install # or 'yarn'
npm test # or 'yarn test'

node ./index.js
```


# Examples and use
Review index.js for some basic example of how to use the utilities
 - [Send single command example](../../blob/master/examples/send-single-command.js)
 - [Multiple commands example](../../blob/master/examples/send-multiple-commands.js)
 - [Multiple commands mixed strings/objects example](../../blob/master/examples/send-multiple-commands-mixed.js)
 - [Read all inputs from vMix state basic example](../../blob/master/examples/read-state-basic.js)


Legacy:
 - [CommandSenderHTTP example](../../blob/master/examples/command-sender-http.js)
 - [StateFetcher Basic example](../../blob/master/examples/state-fetcher-basic.js)


# Authors
Jens Grønhøj Stigaard - <jens@stigaard.info> (http://jens.stigaard.info)


# Contribution
You are more than welcome to contribute to the repository!


# Roadmap
 - TCP command sender: feedback/responses on commands sent
 - More tests
 - Perhaps more functionality
