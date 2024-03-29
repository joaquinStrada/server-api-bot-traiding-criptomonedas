import jwt from 'jsonwebtoken'

import { config } from '../config'
import WhiteList from '../models/WhiteList.model'

const generateTokens = async userId => {
	const expiresInRefreshToken = 30 * 24 * 60 * 60 * 1000
	const expiresInAccessToken = 2 * 60 * 1000

	const refreshToken = jwt.sign({
		userId
	}, config.jwt.refreshTokenSecret, {
		expiresIn: `${expiresInRefreshToken}ms`
	})

	const accessToken = jwt.sign({
		userId
	}, config.jwt.accessTokenSecret, {
		expiresIn: `${expiresInAccessToken}ms`
	})

	await new WhiteList({
		refreshToken,
		accessToken,
		userId
	}).save()

	return {
		refreshToken,
		accessToken,
		expiresInAccessToken,
		expiresInRefreshToken
	}
}

export default generateTokens