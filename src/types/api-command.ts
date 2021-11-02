/**
 * vMix API function command type
 * 
 * Applicable to 
 * https://www.vmix.com/help24/index.htm?ShortcutFunctionReference.html
 */
export type vMixApiFunctionCommand = {
	// Must always contain Function parameter
	Function: string

	// Arbitary other parameters
	[key: string]: any
}
