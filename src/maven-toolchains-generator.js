'use strict';

async function main() {
    console.log('hi');
}

main().catch(err => {
    console.error(err);
    process.exit(1);
})
