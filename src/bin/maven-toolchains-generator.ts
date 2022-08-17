#!/usr/bin/env node
import build from "../build-config";

async function main() {
	const xml = await build();
	console.log(xml);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
