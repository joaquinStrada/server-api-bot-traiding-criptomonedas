import { Schema, model } from 'mongoose'

const userSchema = new Schema({
	fullName: {
		type: String,
		required: true,
		min: 6,
		max: 255
	},
	email: {
		type: String,
		required: true,
		unique: true,
		min: 6,
		max: 400
	},
	password: {
		type: String,
		required: true,
		minLength: 6
	},
	imageName50x50: {
		type: String,
		default: ''
	},
	imageName300x300: {
		type: String,
		default: ''
	},
	role: [                 
		{
			type: String,
			required: true,
			min: 4,
			max: 10
		}
	]
}, {
	timestamps: true,
	versionKey: false
})

export default model('User', userSchema)