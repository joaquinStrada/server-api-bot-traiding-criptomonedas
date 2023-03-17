import '@babel/polyfill'
import app from './app'
import { connection } from './database'
import initializeUser from './utils/initilizeUser'

const main = async () => {
	try {
		await connection()
		await initializeUser()

	
		await app.listen(app.get('port'))
		console.log('Server on port', app.get('port'))
	} catch (err) {
		console.error(err)
	}
}

if (require.main === module) {
	main()
}