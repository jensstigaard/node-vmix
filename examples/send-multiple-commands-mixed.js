// Import modules from the package
// Note when using as npm dep: swap in: 'vmix-js-utils' instead of '../index'
const { Connection } = require('../index')

// Instanciate connection to vMix instance via TCP localhost:8099
let connection = new Connection('localhost')

// Perform commands directly on connection
// You can use any vMix Function here
// List of all functions here: 
// https://www.vmix.com/help22/ShortcutFunctionReference.html

// Perform multiple commands at once:
connection.send([
  'TALLY', // Get tally information
  // - On title on input with name 'MyTitle' - set text of field "TitleField" to the text "Updated text!"
  { Function: 'SetText', Input: 'MyTitle', SelectedName: 'TitleField', Value: 'Updated text!' },
  // - Put input 1 on air on overlay channel 1
  { Function: 'OverlayInput1On', Input: 'MyTitle' },
  // - Perform Cut to the input currently in preview
  { Function: 'Cut' }
])
