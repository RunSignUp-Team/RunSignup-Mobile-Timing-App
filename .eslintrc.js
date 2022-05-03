module.exports = {
    "env": {
        "es2021": true,
        "node": true
    },
    "extends": [
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended"
    ],
    "parserOptions": {
        "ecmaFeatures": {
            "jsx": true,
            "modules": true,
        },
        "ecmaVersion": 12,
        "sourceType": "module",
        "tsconfigRootDir": __dirname,
        "project": "./tsconfig.json",
    },
    "plugins": [
        "react",
        "react-hooks",
        "unused-imports",
        "@typescript-eslint",
    ],
    "rules": {
        "react-hooks/rules-of-hooks": "error", // Checks rules of Hooks
        "react-hooks/exhaustive-deps": "warn", // Checks effect dependencies
        "prefer-const": [
            "warn",
            {
                "destructuring": "any",
                "ignoreReadBeforeAssign": false
            }
        ],
        "@typescript-eslint/indent": [
            "warn",
        ],
        "linebreak-style": [
            "off",
            "unix"
        ],
        "quotes": [
            "warn",
            "double"
        ],
        "semi": [
            "warn",
            "always"
        ],
        "react/prop-types": [
            "off",
        ],
        "@typescript-eslint/no-explicit-any" :[
            "warn"
        ],
        "@typescript-eslint/array-type": [
			"error",
			{
				default: "generic"
			}
		],
        "@typescript-eslint/indent": [
			"warn",
			"tab"
		],
		"no-mixed-spaces-and-tabs": [
			"warn"
		],
        "@typescript-eslint/explicit-function-return-type": [
            "warn"
        ],
    },
    "ignorePatterns": [
        ".eslintrc.js",
        "babel.config.js",
        "App.tsx"
    ],
    "root": true
};
