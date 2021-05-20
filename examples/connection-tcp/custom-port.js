// Import modules from the package
// Note when using as npm dep: swap in: 'node-vmix' instead of '../index'
import { ConnectionTCP } from '../../dist/index.js'

const PORT_THROUGH_FIREWALL = 10000

const connection = new ConnectionTCP('localhost', { port: PORT_THROUGH_FIREWALL, debug: true })
