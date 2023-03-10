import bcrypt from 'bcrypt'
import path from 'path'
import Jimp from 'jimp'
import fsExtra from 'fs-extra'

import { SchemaRegister } from '../joi/Auth.joi'
import User from '../models/User.model'
import generateToken from '../utils/generateToken'

export const register = async (req, res) => {
	const { fullName, email, password, role } = req.body

	// Validate user
	const { error } = SchemaRegister.validate({
		fullName,
		email,
		password,
		role
	})

	if (error) {
		return res.status(400).json({
			error: true,
			message: error.details[0].message
		})
	}

	try {
		// Validamos si el email existe en caso de serlo retornamos un error
		const isEmailExist = await User.findOne({ email })

		if (isEmailExist) {
			return res.status(400).json({
				error: true,
				message: 'Email ya registrado'
			})
		}

		// Encriptamos la contraseña
		const salt = await bcrypt.genSalt(10)
		const passEncrypt = await bcrypt.hash(password, salt)

		// creamos los roles para el usuario
		const arrayRole = []

		if (role === 'admin') {
			arrayRole.push('user')
			arrayRole.push('admin')
		} else if (role === 'user') {
			arrayRole.push('user')
		}

		// Creamos el usuario
		const newUser = new User({
			fullName,
			email,
			password: passEncrypt,
			role: arrayRole
		})

		// Validamos si nos enviaron una foto de perfil
		if (req.file && req.file.path) {
			// Creamos las variables que necesitamos
			const { path: pathImage, destination, filename } = req.file
			const ext = path.extname(filename)
			const imageName50x50 = `${newUser._id}_50x50${ext}`
			const imageName300x300 = `${newUser._id}_300x300${ext}`
			const pathImage50x50 = path.join(destination, imageName50x50)
			const pathImage300x300 = path.join(destination, imageName300x300)

			// Procesamos la foto de perfil
			const Image = await Jimp.read(pathImage)
			await Image.resize(50, 50).writeAsync(pathImage50x50)
			await Image.resize(300, 300).writeAsync(pathImage300x300)

			// Eliminamos la foto de perfil anterior
			await fsExtra.unlink(pathImage)

			// Guardamos los nombres de las imagenes en la base de datos
			newUser.imageName50x50 = imageName50x50
			newUser.imageName300x300 = imageName300x300
		}

		// Guardamos el usuario
		const savedUser = await newUser.save()

		// Generamos los tokens de authenticacion
		const data = await generateToken(savedUser._id)

		res.json({
			error: false,
			data
		})
	} catch (err) {
		console.error(err)
		res.status(500).json({
			error: true,
			message: 'Ha ocurrido un error'
		})
	}
}