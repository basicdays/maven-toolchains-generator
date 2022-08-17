import child_process from "child_process";
import _fs from "fs";
import os from "os";
import path from "path";
import util from "util";

import * as xml2js from "xml2js";

const fs = _fs.promises;
const exec = util.promisify(child_process.exec);

interface VersionConfig {
	version: string;
	vendor: string;
	jdkHome: string;
}

export async function getJEnvConfigs() {
	const { stdout: jEnvVersions } = await exec("jenv versions --bare");
	const versions = jEnvVersions.trim().split("\n");

	const versionConfigs: VersionConfig[] = [];
	for (const version of versions) {
		const jdkHome = await fs.readlink(
			path.resolve(`${os.homedir()}/.jenv/versions/${version}`)
		);
		const javaBin = path.resolve(`${jdkHome}/bin/java`);
		const { stderr: versionString } = await exec(`${javaBin} -version`);
		const vendor = versionString
			.substring(0, versionString.indexOf(" "))
			.toLocaleLowerCase();
		versionConfigs.push({ version, vendor, jdkHome });
	}
	return versionConfigs;
}

export default async function buildConfig() {
	const configs = await getJEnvConfigs();

	const rootObj = {
		toolchains: {
			$: {
				xmlns: "http://maven.apache.org/TOOLCHAINS/1.1.0",
				"xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
				"xsi:schemaLocation":
					"http://maven.apache.org/TOOLCHAINS/1.1.0 http://maven.apache.org/xsd/toolchains-1.1.0.xsd",
			},
			toolchain: configs.map(({ version, vendor, jdkHome }) => {
				return {
					type: "jdk",
					provides: {
						version,
						vendor,
					},
					configuration: { jdkHome },
				};
			}),
		},
	};

	const builder = new xml2js.Builder({
		xmldec: {
			version: "1.0",
			encoding: "UTF-8",
		},
	});
	return builder.buildObject(rootObj);
}
