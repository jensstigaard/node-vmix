// Import modules from the package
// Note: when using npm swap in: 'vmix-js-utils' instead of '../index'
const { Connection, CommandSender } = require('../index')

// Instanciate objects
let connection = new Connection('localhost', 8088)
let commandSender = new CommandSender(connection)

// Perform commands
// You can use any vMix Function here
// List of all functions here: 
// https://www.vmix.com/help22/ShortcutFunctionReference.html

let onSuccess = function (response) {
    console.log('Performed command', response)
}
let onError = function (error) {
    console.log('Could not perform command', error)
}

// Perform a simple cut
commandSender.send({ Function: 'Cut' }, onSuccess, onError)

// Perform multiple commands at once:
// - Set text of field "TitleField"  in title number 1 to the text "Updated text!"
// - Put on input 1 in overlay channel 1
// - Cut
commandSender.send([
    { Function: 'SetText', Input: 1, SelectedName: 'TitleField', Value: 'Updated text!' },
    { Function: 'OverlayInput1On', Input: 1 },
    { Function: 'Cut' }
])