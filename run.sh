#!/bin/bash

# error handling, see https://mobile.twitter.com/b0rk/status/1314345978963648524
set -euo pipefail

RED='\033[0;31m'
BLUE='\033[0;34m'
GREEN='\033[0;32m'
PURPLE='\033[0;35m'
RESET='\033[0m'
BBLACK='\033[1;30m'

export NODE_PATH=.

# --full-trace --exit
mocha="./node_modules/mocha/bin/mocha
            -r chai/register-expect
            --bail
            --leaks
            --exit
            --ui tdd
            --inspect-brk=9230
"
# --inspect=9230
# --reporter min
# "mochaWatch": "mocha --inspect=9230 --ui tdd --reporter min --watch --inline-diffs -r chai/register-expect employeeApiTest.js",

# --ui tdd
# $mocha employeeApiTest.js || exit 0
# NODE_PATH=.
# test() { $mocha test/integration/$1* ;}


# example: run test i1 WILL RUN mocha test/integration/1_employeeApiTest_saves.js
test() {
    folder1stChar=${1:0:1}
    fileNumber=${1:1}
    folder=$([ $folder1stChar == 'i' ] && echo integration || echo unit)
    files=( src/$folder/$fileNumber* )
    export server=${files[*]}           # ex: server=src/integration/1_employeeApiTest_saves.js USED FORs require(`${process.env.server}`)
    $mocha test/$folder/$fileNumber*
}

# example: run perf test i1
perf() {
    for i in {1..10}; do time $@; done 2>&1 | grep ^real | sed s/,/./ | sed -e s/.*m// | awk '{sum += $1} END {print sum / NR}'
}

# example: run perf test i1
# https://serverfault.com/questions/175376/redirect-output-of-time-command-in-unix-into-a-variable-in-bash
perfFull() {
    TIMEFORMAT=%R                       # `time` outputs only a number, not 3 lines
    export LC_NUMERIC="en_US.UTF-8"     # `time` outputs `0.100` instead of local format, like `0,100`

    times=10

    echo -e -n "\nWARMING UP ${PURPLE}$@${RESET}"
    $@ # execute passed parameters

    echo -e -n "RUNNING ${PURPLE}$times times${RESET}"

    exec 3>&1 4>&2                                   # redirects subshell streams
    durations=()
    for _ in `seq $times`; {
        durations+=(`{ time $@ 1>&3 2>&4; } 2>&1`)   # passes stdout through so only `time` is caputured
    }
    exec 3>&- 4>&-                                   # reset subshell streams

    printf '%s\n' "${durations[@]}"

    total=0
    for duration in "${durations[@]}"; {
        total=$(bc <<< "scale=3;$total + $duration")
    }

    average=($(bc <<< "scale=3;$total/$times"))
    echo -e "${GREEN}$average average${RESET}"
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