#!/bin/bash

# error handling, see https://mobile.twitter.com/b0rk/status/1314345978963648524
set -euo pipefail

export NODE_PATH=.
# --full-trace --exit
mocha="./node_modules/mocha/bin/mocha
            -r chai/register-expect
            --inline-diffs
            --bail
            --leaks
            --ui tdd
"

# --inspect=9230

# --reporter min
# "mochaWatch": "mocha --inspect=9230 --ui tdd --reporter min --watch --inline-diffs -r chai/register-expect employeeApiTest.js",

# --ui tdd
# $mocha employeeApiTest.js || exit 0
# NODE_PATH=.
# test() { $mocha test/integration/$1* ;}


# example: ./run.sh test i1 => mocha src/integration/1_employeeApiTest_saves.js
test() {
    folder1stChar=${1:0:1}
    fileNumber=${1:1}
    folder=$([ $folder1stChar == 'i' ] && echo integration || echo unit)
    files=( src/$folder/$fileNumber* )
    export server=${files[*]}
    $mocha test/$folder/$fileNumber*
}

# test

# mocha="./node_modules/mocha/bin/mocha -r chai/register-expect --inline-diffs --bail --leaks --reporter min build/employeeApiTest.js --watch --ui tdd --inspect=9230"
# mochaParallel="./node_modules/mocha-parallel-tests/dist/bin/cli.js -r chai/register-expect --inline-diffs --reporter min test/employeeMochaTest.js"
# jest="./node_modules/jest/bin/jest.js --runInBand employeeJestTest.js"
# ava="./node_modules/ava/cli.js --serial --fail-fast test/employeeAvaTest.js"
# lab="./node_modules/@hapi/lab/bin/lab --silence test/employeeLabTest.js"
# tape="./node_modules/tape/bin/tape test/employeeTapeTest.js"
# tapePromise="node ./test/employeeTapePromiseTest.js"
# tap="./node_modules/tap/bin/run.js --no-coverage --reporter silent ./test/employeeTapTest.js"
# tapeReport="$tape | $tapDifflet"
# zora="echo 'process.exit(0);' | node -r ./test/employeeZoraTest.js"
# pta="./node_modules/pta/src/cli.js -r tap ./test/employeePtaTest.js"
# zoraReport="$zora | $tapDifflet"
# zoraSingle="node ./test/employeeZoraTest.js"

# ## NATIVE WATCHERS
# mochaWatch="$mocha --watch"
# jestWatch="$jest --watch --runInBand --bail 1"
# avaWatch="$ava --watch"

# ## TEST DIFFERENT ASSERT LIBS WITH MOCHA
# mochaAssert="./node_modules/mocha/bin/mocha  --inline-diffs --reporter min test/employeeMochaAssertTest.js"
# ## PERF TEST
# perf() { time for i in {1..10}; do eval ${!1}; done;}

# mkdir -p build
# cp test/integration/$1_* build/employeeApiTest.js
# cp src/integration/$1_* build/server.js
# cp src/db.js build/db.js
# # NODE_PATH=NODE_PATH:/home/ddv/dev/projects/tdd-rest-api-from-scratch/src
# eval $mocha


"$@"