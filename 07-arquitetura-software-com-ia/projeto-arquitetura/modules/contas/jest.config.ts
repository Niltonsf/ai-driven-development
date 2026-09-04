import type { Config } from "jest";

const config: Config = {
	verbose: true,
	preset: "ts-jest",
	testMatch: ["**/test/**/*.test.ts"],
	coveragePathIgnorePatterns: ["/node_modules/", "/test/"],
};

export default config;
