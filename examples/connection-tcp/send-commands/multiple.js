// Import modules from the package
// Note when using as npm dep: swap in: 'node-vmix' instead of '../index'
const { ConnectionTCP } = require('../../../dist/index')

// Instanciate connection to vMix instance via TCP localhost:8099
const vMixAddress = 'localhost'
const connection = new ConnectionTCP(vMixAddress)

connection.on('error', (error) => {
  console.error('Error on TCP socket to vMix instance')
  console.error(error)
})
connection.on('data', data => {
  console.log('Received data from vMix instance via TCP socket:', data)
})

connection.on('connect', () => {
  console.log('Connected!')
  // Now that we are connected
  // Perform commands directly on connection
  // You can use any vMix Function here
  // List of all functions here: 
  // https://www.vmix.com/help22/ShortcutFunctionReference.html

  // Perform multiple commands at once:
  connection.send([
    // - On title on input with name 'MyTitle' - set text of field "TitleField" to the text "Updated text!"
    { Function: 'SetText', Input: 'MyTitle', SelectedName: 'TitleField', Value: 'Updated text!' },
    // - Transition in Input 3 on Overlay Channel 1
    { Function: 'OverlayInput1In', Input: 3 },
    // - Perform Cut to the input currently in preview
    { Function: 'Cut' }
  ])
})
