import * as core from '@actions/core';


async function run() {
    try {
        // Your GitHub Actions logic here
        const myInput = core.getInput('myInput');
        console.log(`Value of myInput: ${myInput}`);
    } catch (error) {
        core.setFailed(error.message);
    }
}

// Run the script
run();