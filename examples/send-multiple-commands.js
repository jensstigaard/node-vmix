// Import modules from the package
// Note when using as npm dep: swap in: 'vmix-js-utils' instead of '../index'
const { Connection } = require('../index')

// Instanciate connection to vMix instance via TCP localhost:8099
const vMixAddress = 'localhost'
const connection = new Connection(vMixAddress)

connection.on('connect', () => {
  console.log('Connected')
})
connection.on('error', (error) => {
  console.error('Error', error)
})

// Perform commands directly on connection
// You can use any vMix Function here
// List of all functions here: 
// https://www.vmix.com/help22/ShortcutFunctionReference.html

// Perform multiple commands at once:
connection.send([
  // - On title on input with name 'MyTitle' - set text of field "TitleField" to the text "Updated text!"
  { Function: 'SetText', Input: 'MyTitle', SelectedName: 'TitleField', Value: 'Updated text!' },
  // - Put input 1 on air on overlay channel 1
  { Function: 'OverlayInput1On', Input: 'MyTitle' },
  // - Perform Cut to the input currently in preview
  { Function: 'Cut' }
])
