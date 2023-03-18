import bcrypt from 'bcrypt'
import path from 'path'
import Jimp from 'jimp'
import fsExtra from 'fs-extra'

import { SchemaRegister, SchemaLogin, SchemaUpdate } from '../joi/Auth.joi'
import User from '../models/User.model'
import WhiteList from '../models/WhiteList.model'
import generateTokens from '../utils/generateTokens'

export const register = async (req, res) => {
	const { fullName, email, password, role } = req.body

	// Validamos los campos enviados
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
		const data = await generateTokens(savedUser._id)

		res.header('Authorization', `Bearer ${data.accessToken}`).json({
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

export const login = async (req, res) => {
	const { email, password } = req.body

	// Validamos los campos enviados
	const { error } = SchemaLogin.validate({
		email,
		password
	})

	if (error) {
		return res.status(400).json({
			error: true,
			message: error.details[0].message
		})
	}

	try {
		// Validamos que el usuario exista
		const user = await User.findOne({ email })

		if (!user) {
			return res.status(400).json({
				error: true,
				message: 'Usuario y/o contraseña incorrectos'
			})
		}

		// validamos la contraseña
		const validPassword = await bcrypt.compare(password, user.password)

		if (!validPassword) {
			return res.status(400).json({
				error: true,
				message: 'Usuario y/o contraseña incorrectos'
			})
		}

		// Generamos los tokens de authenticacion
		const data = await generateTokens(user._id)

		res.header('Authorization', `Bearer ${data.accessToken}`).json({
			error: true,
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

export const getProfile = (req, res) => {
	res.json({
		error: false,
		data: req.user
	})
}

export const refreshToken = async (req, res) => {
	const { idValidToken, user } = req

	try {
		// Borrar los antiguos tokens de authenticacion
		await WhiteList.findByIdAndDelete(idValidToken)

		// Generamos los tokens de authenticacion
		const data = await generateTokens(user.id)

		res.header('Authorization', `Bearer ${data.accessToken}`).json({
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

export const updateProfile = async (req, res) => {
	const { fullName, email, password } = req.body

	// Validamos los campos enviados
	const { error } = SchemaUpdate.validate({
		fullName,
		email,
		password
	})

	if (error) {
		return res.status(400).json({
			error: true,
			message: error.details[0].message
		})
	}

	try {
		// Validamos si el email pertenece a otro uasuario en caso de serlo retornamos un error
		const isEmailExist = await User.findOne({ email })

		if (isEmailExist && isEmailExist._id.toString() !== req.user.id.toString()) {
			/* console.log({
				idDB: isEmailExist._id.toString(),
				idUser: req.user.id.toString()
			}) */
			return res.status(400).json({
				error: true,
				message: 'Email ya registrado',
			})
		}

		// Obtenemos el usuario
		const updateUser = await User.findById(req.user.id)

		// Actualizamos los otros sdatos
		updateUser.fullName = fullName
		updateUser.email = email

		// Encriptamos la contraseña en caso de que la actualicen
		if (password) {
			const salt = await bcrypt.genSalt(10)
			updateUser.password = await bcrypt.hash(password, salt)
		}

		// Validamos si nos enviaron una foto de perfil
		if (req.file && req.file.path) {
			const { path: pathImage, destination, filename } = req.file
			// Eliminamos las fotos anteriores
			if (updateUser.imageName50x50 !== '' && updateUser.imageName300x300 !== '') {
				await fsExtra.unlink(path.join(destination, updateUser.imageName50x50))
				await fsExtra.unlink(path.join(destination, updateUser.imageName300x300))
			}

			// Creamos las variables que necesitamos
			const ext = path.extname(filename)
			const imageName50x50 = `${req.user.id}_50x50${ext}`
			const imageName300x300 = `${req.user.id}_300x300${ext}`
			const pathImage50x50 = path.join(destination, imageName50x50)
			const pathImage300x300 = path.join(destination, imageName300x300)

			// Procesamos la foto de perfil
			const Image = await Jimp.read(pathImage)
			await Image.resize(50, 50).writeAsync(pathImage50x50)
			await Image.resize(300, 300).writeAsync(pathImage300x300)

			// Eliminamos la foto de perfil anterior
			await fsExtra.unlink(pathImage)

			// Actualizamos las imagenes
			updateUser.imageName50x50 = imageName50x50
			updateUser.imageName300x300 = imageName300x300
		}
		
		const savedUser = await updateUser.save()

		res.json({
			error: true,
			data: {
				id: savedUser._id,
				fullName: savedUser.fullName,
				email: savedUser.email,
				imageName50x50: savedUser.imageName50x50,
				imageName300x300: savedUser.imageName300x300,
				role: savedUser.role,
				createdAt: savedUser.createdAt,
				updatedAt: savedUser.updatedAt
			}
		})
	} catch (err) {
		console.error(err)
		res.status(500).json({
			error: true,
			message: 'Ha ocurrido un error'
		})
	}
}

export const getUsers = async (req, res) => {
	try {
		const users = await User.find()

		const data = users.map(({ _id, fullName, email, imageName50x50, imageName300x300, role, createdAt, updatedAt }) => ({
			id: _id,
			fullName,
			email,
			imageName50x50,
			imageName300x300,
			role,
			createdAt,
			updatedAt
		}))

		res.json({
			error: true,
			length: data.length,
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

export const getUser = async (req, res) => {
	const { id } = req.params

	try {
		const { _id, fullName, email, imageName50x50, imageName300x300, role, createdAt, updatedAt } = await User.findById(id)

		res.json({
			error: false,
			data: {
				id: _id,
				fullName,
				email,
				imageName50x50,
				imageName300x300,
				role,
				createdAt,
				updatedAt,
			}
		})
	} catch (err) {
		if (err.message === 'Cast to ObjectId failed for value "6414a6b18b3330ffdac9" (type string) at path "_id" for model "User"') {
			res.status(400).json({
				error: true,
				message: 'Usuario no encontrado'
			})
		} else {
			console.error(err)
			res.status(500).json({
				error: true,
				message: 'Ha ocurrido un error'
			})
		}
	}
}

export const updateUser = async (req, res) => {
	
}