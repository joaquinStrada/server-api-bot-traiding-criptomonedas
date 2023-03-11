import jwt from 'jsonwebtoken'

import { config } from '../config'
import WhiteList from '../models/WhiteList.model'
import User from '../models/User.model'

const validateToken = async (role, req, res, next) => {
	const header = req.header('Authorization')

	if (!header || !header.startsWith('Bearer ')) {
		return res.status(401).json({
			error: true,
			message: 'Acceso denegado'
		})
	}

	try {
		const token = header.substring(7)

		// Validamos el token
		const validToken = await WhiteList.findOne({ accessToken: token })

		if (!validToken || !validToken.enabled) {
			return res.status(401).json({
				error: true,
				message: 'Acceso denegado'
			})
		}

		// Verificamos el token
		const { userId } = jwt.verify(token, config.jwt.accessTokenSecret)

		// verificamos los permisos
		const user = await User.findById(userId)

		if (role !== undefined && !user.role.includes(role)) {
			return res.status(401).json({
				error: true,
				message: 'Acceso denegado'
			})
		}

		// Authorizamos al usuario
		req.user = {
			id: user._id,
			fullName: user.fullName,
			email: user.email,
			imageName50x50: user.imageName50x50,
			imageName300x300: user.imageName300x300,
			role: user.role
		}
		next()
	} catch (err) {
		console.error(err)
		res.status(401).json({
			error: true,
			message: 'Acceso denegado'
		})
	}
}

export default validateToken