import Socket from 'net'

const client = Socket.createConnection(
	{ host: 'localhost', port: 8099 },
	() => { console.log('Msg upon initiazation') }
)

client.on('connect', (err: any) => {
	if (err) {
		console.error(err)
		return
	}

	console.log('Connected!')
})

client.on('data', (data: Buffer) => {
	const str = data.toString('utf8')
	console.log('Received data!', str)
})
