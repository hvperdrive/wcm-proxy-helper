// ESLint configuration.

module.exports = {
	"extends": [
		"@district01/eslint-config",
		"@district01/eslint-config/lib/es5.js"
	],

	// Override rules if needed.
	// This is NOT recommended. Please report issues you encounter with the @district01/eslint-config
	// package in the issue queue: https://bitbucket.org/district01/eslint-config/issues.
	"plugins": [
		"chai-friendly"
	],
	"rules": {
		// Disable no-unused-expressions
		"no-unused-expressions": 0,
		// Enable no-unused-expressions but skip items for chai
		"chai-friendly/no-unused-expressions": 2
	},
};
