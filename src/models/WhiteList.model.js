import { Schema, model } from 'mongoose'

const WhiteListSchema = new Schema({
	refreshToken: {
		type: String,
		required: true,
		unique: true,
		minLength: 6
	},
	accessToken: {
		type: String,
		required: true,
		unique: true,
		minLength: 6
	},
	enabled: {
		type: Boolean,
		default: true
	},
	userId: {
		type: Schema.Types.ObjectId,
		ref: 'User',
		required: true
	}
}, {
	timestamps: true,
	versionKey: false
})

export default model('WhiteList', WhiteListSchema)