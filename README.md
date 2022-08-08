# nodejs-exponential-backoff-algorithm

## Overview

This implementation fires a number of actions and then retries the ones that fail, observing the maximum number of retries provided or the total success as conditions to stop

More info [here](https://en.wikipedia.org/wiki/Exponential_backoff)

## How to use

Install dependencies:

```bash
npm install
```

Running:

```bash
npm run dev -- --count=300 --max_retries=10 --success_ratio=0.1
```

Debugging with vscode is easy, just start the debug command and attach from vscode:

```bash
npm run dev:debug
```
