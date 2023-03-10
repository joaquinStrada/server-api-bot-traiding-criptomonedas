import { connect } from 'mongoose'
import { config } from './config'

export const connection = async () => {
	try {
		// console.log(config.mongodb.uri)
		const db = await connect(config.mongodb.uri)

		console.log('Database connected to:', db.connection.db.databaseName)
	} catch (err) {
		console.error(err)
	}
}