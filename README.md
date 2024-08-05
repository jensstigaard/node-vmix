# node-vmix

Node.js vMix API utility to enable easy setup to communicate with vMix instance via TCP socket or HTTP alternatively.

It is recommended to use TCP, however, there is currently not implemented feedback/response.
It is possible to implement this yourself if necessary, by analysing the responses, but it is not supported out of the box.

[![package json version](https://img.shields.io/github/package-json/v/jensstigaard/node-vmix.svg)](https://github.com/jensstigaard/node-vmix)
[![npm version](https://badge.fury.io/js/node-vmix.svg)](https://www.npmjs.com/package/node-vmix)
[![npm downloads](https://img.shields.io/npm/dm/node-vmix)](https://www.npmjs.com/package/node-vmix)

[![NPM Badge](https://nodei.co/npm/node-vmix.png)](https://npmjs.com/package/node-vmix)

This code previously were found in the vmix-js-utils but are now branched out in its own package to enable usage of the vmix-js-utils to be used in a clean frontend environment (non-Node.js), and also to give a better experience for the users. Are you looking for vMix utility for your js frontend? Take a look at [vmix-js-utils](https://github.com/jensstigaard/vmix-js-utils) for more info.
Both packages are available with npm - see [my npm profile](https://www.npmjs.com/~jensstigaard).

# Purpose
node-vmix consists of two modules - one for TCP connection, one for HTTP.
Each can be used on its own, but usually it makes more sense to make it interplay with some of the other modules.
The modules are coded as classes, meaning that they are constructed with specific parameters, e.g. that the instanciation of a connection needs a host and a port.


# Quick start
```javascript
const { ConnectionTCP } = require('node-vmix')

const connection = new ConnectionTCP('localhost')

// Listener for xml state data
connection.on('xml', xmlData => {
 // Your logic here!
 // See example to parse the XML correctly
})

// Listener for tally
connection.on('tally', tally => {
 // Your logic here!
})

// Listener for data such as tally
connection.on('data', data => {
 // Your logic here!
})

connection.on('connect', () => {
  // Request vMix API XML state by sending message 'XML'
  connection.send('XML')

  // Request vMix tally info by sending message 'TALLY'
  connection.send('TALLY')
})
```
Note: One should check whether the connection is actually established before attempting sending message to the socket.



# Documentation

Please visit the documentation here: https://jensstigaard.github.io/node-vmix/.

The documentation includes definition and description of classes and type.


## Installation and use
### [NPM](https://www.npmjs.com/package/node-vmix)
The utilities are published at npmjs as a package for  [Node.js](https://nodejs.org/en/), meaning that you can easily add the utilities as a dependency in your project using npm.
```sh
npm install node-vmix --save
# or 'yarn add node-vmix'
```

In your code the simplest way to import the modules is the following:

```javascript
const { Connection } = require('node-vmix')
// or ES6 import syntax:  import { Connection } from 'node-vmix'

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
 * [audio-matrix-vmix-electron](https://github.com/jensstigaard/audio-matrix-vmix-electron)
 * [simple-vmix-switcher-electron](https://github.com/jensstigaard/simple-vmix-switcher-electron)
 * [vinproma](https://github.com/jensstigaard/vinproma) (vMix Input Progress Monitor App)
 
These apps are using this library for vMix connection. They are built with ElectronJS and can be compiled for both Windows, Mac or Linux platforms.

## Code snippet examples
Here are some basic example of how to use the library
### Connection TCP
 * Send API commands (functions)
   * [Send single command example](../../blob/master/examples/connection-tcp/send-commands/single.js)
   * [Send multiple commands example](../../blob/master/examples/connection-tcp/send-commands/multiple.js)
   * [Send multiple commands mixed strings/objects example](../../blob/master/examples/connection-tcp/send-commands/multiple-mixed.js)
 * Read XML API
   * [Retrieve all inputs from vMix XML state - Basic example](../../blob/master/examples/connection-tcp/retrieve-state-basic.js)
 * Misc
   * [Read or subscribe to tally](../../blob/master/examples/connection/tcp/tally.js)
   * [vMix version](../../blob/master/examples/connection/tcp/get-vmix-version.js)


Legacy:
 * [CommandSenderHTTP example](../../blob/master/examples/command-sender-http.js)
 * [StateFetcher Basic example](../../blob/master/examples/state-fetcher-basic.js)



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
