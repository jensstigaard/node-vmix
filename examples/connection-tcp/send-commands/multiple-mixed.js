// Import modules from the package
// Note when using as npm dep: swap in: 'node-vmix' instead of '../index'
import { ConnectionTCP } from '../../../dist/index.js'

// Instanciate connection to vMix instance via TCP socket
const connection = new ConnectionTCP('localhost')

connection.on('data', console.log)

connection.on('connect', () => {
  console.log('Connected')

  // Perform commands directly on connection as soon as connected
  // You can use any vMix Function here
  // List of all functions here: 
  // https://www.vmix.com/help24/ShortcutFunctionReference.html

  // Perform multiple commands at once:
  connection.send([
    'tally', // Request tally information
    'subscribe TALLY', // Request tally information
    // - On title on input with name 'MyTitle' - set text of field "TitleField" to the text "Updated text!"
    { Function: 'SetText', Input: 'MyTitle', SelectedName: 'TitleField', Value: 'Updated text!' },
    { Function: 'SetText', Input: 'Scoreboard 2- Lineup.gtzip', SelectedName: 'Team Lineups.Text', Value: 'My header!' },
    { Function: 'SetText', Input: 'Scoreboard 2- Lineup.gtzip', SelectedName: 'Home Team.Text', Value: 'Home Team' },
    { Function: 'SetText', Input: 'Scoreboard 2- Lineup.gtzip', SelectedName: 'Away Team.Text', Value: 'Away Team' },
    { Function: 'SetText', Input: 'Scoreboard 2- Lineup.gtzip', SelectedName: 'Home-Player 1.Text', Value: 'H Player 1' },
    { Function: 'SetText', Input: 'Scoreboard 2- Lineup.gtzip', SelectedName: 'Home-Player 2.Text', Value: 'H Player 2' },
    
    // - Put input 1 on air on overlay channel 1
    { Function: 'OverlayInput1On', Input: 'MyTitle' },
    // - Perform Cut to the input currently in preview
    { Function: 'Cut' }
  ])
})
