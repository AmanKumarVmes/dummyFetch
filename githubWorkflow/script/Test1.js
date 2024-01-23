import * as core from '@actions/core';
import fetch from "node-fetch";

async function run() {
    try {
        // Your GitHub Actions logic here
        const myInput = await fetch("https://api.github.com/users/AmanKumarVmes")
        console.log(`Value of myInput: `, myInput);
    } catch (error) {
        core.setFailed(error.message);
    }
}

// Run the script
run();