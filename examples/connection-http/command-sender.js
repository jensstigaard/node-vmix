// Import modules from the package
// Note: when using npm swap in: 'node-vmix' instead of '../index'
import { ConnectionHTTP, CommandSenderHTTP } from '../../dist/index.js'

// Instanciate objects
const connection = new ConnectionHTTP('localhost', 8088)
const commandSender = new CommandSenderHTTP(connection)

// Perform commands
// You can use any vMix Function here
// List of all functions here: 
// https://www.vmix.com/help24/ShortcutFunctionReference.html

function onSuccess(response) {
    console.log('Performed command successfully')
    console.log('Got response data:', response.data)
}
function onError(error) {
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