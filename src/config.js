import { config as dotenv } from 'dotenv'
dotenv()

export const config = {
	express: {
		port: process.env.PORT || 3000
	},
	mongodb: {
		uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/botTraidingApi?directConnection=true'
	},
	multer: {
		limitSize: process.env.MULTER_LIMIT_SIZE || 300 * 1000000,
		filesTypes: process.env.MULTER_FILES_TYPES || ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'ico']
	},
	jwt: {
		accessTokenSecret: process.env.ACCESS_TOKEN_SECRET || '',
		refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET || ''
	},

	userDefault: {
		fullName: process.env.FULL_NAME || 'Bot Traiding',
		email: process.env.USER_EMAIL || 'admin@bottraiding.com',
		password: process.env.PASSWORD_DEFAULT || 'admin1234'
	}
}