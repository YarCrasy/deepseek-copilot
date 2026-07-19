import typescriptEslint from "typescript-eslint";

export default [{
    files: ["**/*.{ts,tsx}"],
}, {
    plugins: {
        "@typescript-eslint": typescriptEslint.plugin,
    },

    languageOptions: {
        parser: typescriptEslint.parser,
        ecmaVersion: 2022,
        sourceType: "module",
    },

    rules: {
        "@typescript-eslint/naming-convention": ["warn", {
            selector: "import",
            format: ["camelCase", "PascalCase"],
        }],

        curly: "warn",
        eqeqeq: "warn",
        "no-throw-literal": "warn",
        semi: "warn",
    },
}, {
    files: ["src/ui/i18n/locales/{en,es,zh}/*.ts"],
    rules: {
        "quote-props": ["warn", "always"],
    },
}];
