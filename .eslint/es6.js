module.exports = {
	// Specify Parser Options
	"parserOptions": {
		"ecmaVersion": 6,
		"ecmaFeatures": {
			"impliedStrict": true,                    // enable global strict mode (if ecmaVersion is 5 or greater)
		}
	},

	// Specify Environments
	"env": {
		"es6": true                                   // enable all ECMAScript 6 features except for modules (this automatically sets the ecmaVersion parser option to 6).
	},

	// Rules
	"rules": {
		// ES6 Specific rules
	}
};
