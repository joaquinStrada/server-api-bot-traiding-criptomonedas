import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import { v4 as uuid } from 'uuid'

import { register, login } from '../controllers/Auth.controller'
import { config } from '../config'

const router = Router()

// Middelwares
const storage = multer.diskStorage({
	destination: path.join(__dirname, '../public/images'),
	filename: (req, file, cb) => {
		cb(null, uuid() + path.extname(file.originalname).toLowerCase())
	}
})

router.use(multer({
	storage,
	limits: {
		fileSize: parseInt(config.multer.limitSize)
	},
	fileFilter: (req, file, cb) => {
		const extname = path.extname(file.originalname).replace('.', '')
        
		if (config.multer.filesTypes.includes(extname)) {
			return cb(null, true)
		}

		cb('El archivo debe ser una imagen', false)
	}
}).single('image'))

// routes
router.post('/register', register)

router.post('/login', login)

export default router