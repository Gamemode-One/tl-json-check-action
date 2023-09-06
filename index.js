const fs = require("fs");
const core = require("@actions/core");
const path = require("path");
const json5 = require("json5");

const dirsToCheck = core
    .getInput("dirs-to-check", {
        trimWhitespace: false,
    })
    .split("\n")
    .filter((dir) => dir != "");

console.log({ dirsToCheck });

async function getAllFilePaths(dirPath, existingFiles = []) {
    const files = fs.readdirSync(dirPath);
    for (const file of files) {
        const filePath = `${dirPath}/${file}`;
        const fileStat = fs.statSync(filePath);
        if (fileStat.isDirectory()) {
            await getAllFilePaths(filePath, existingFiles);
        } else {
            existingFiles.push(filePath);
        }
    }

    return existingFiles;
}

async function main() {
    const filePathsToCheck = [];
    if (dirsToCheck.length == 0) {
        const currentDir = path.resolve(".");
        const filePaths = await getAllFilePaths(currentDir);
        filePathsToCheck.push(...filePaths);
    } else {
        for (const dir of dirsToCheck) {
            const filePaths = await getAllFilePaths(dir);
            filePathsToCheck.push(...filePaths);
        }
    }

    const jsonFiles = filePathsToCheck.filter((filePath) => filePath.endsWith(".json"));
    core.info(`Checking ${jsonFiles.length} JSON files`);

    const errors = [];
    for (const jsonFile of jsonFiles) {
        try {
            json5.parse(fs.readFileSync(jsonFile));
        } catch (error) {
            errors.push(`Error parsing ${jsonFile}: ${error.message}`);
        }
    }

    if (errors.length > 0) {
        core.setFailed(errors.join("\n"));
    } else {
        core.info("All JSON files are valid");
    }
}

main().catch((error) => core.setFailed(error.message));
