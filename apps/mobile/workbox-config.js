module.exports = {
	globDirectory: 'public/',
	globPatterns: [
		'**/*.{png,ico,html,json,webmanifest,js}'
	],
	swDest: 'public/sw.js',
	ignoreURLParametersMatching: [
		/^utm_/,
		/^fbclid$/
	]
};