import * as core from '@actions/core';
import fetch from "node-fetch";

async function run() {
    try {
        // Your GitHub Actions logic here
        const myInput = await fetch("https://api.github.com/users/AmanKumarVmes")
        const res = await myInput.json()
        console.log(`Value of myInput: `, res);
    } catch (error) {
        core.setFailed(error.message);
    }
}

// Run the script
run();