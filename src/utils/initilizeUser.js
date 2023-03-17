import bcrypt from 'bcrypt'

import User from '../models/User.model'
import { config } from '../config'

const initializeUser = async () => {
	try {
		const role = ['user', 'admin']
        
		// si existe un usuario con role admin no hacemos nada
		const isAdminExist = await User.findOne({ role })

		if (isAdminExist) return

		const salt = await bcrypt.genSalt(10)
		const password = await bcrypt.hash(config.userDefault.password, salt)

		// creamos el usuario
		await new User({
			fullName: config.userDefault.fullName,
			email: config.userDefault.email,
			password,
			role
		}).save()
	} catch (err) {
		console.error(err)
	}
}

export default initializeUser