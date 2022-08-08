import { defer, firstValueFrom, delay, from, forkJoin } from 'rxjs'
import minimist from 'minimist'

const args = minimist(process.argv.slice(2))

type ActionInfo = { success: boolean; name: string }

const NUMBER_OF_ACTIONS = Number(args.count) || 200
const MAX_RETRIES = Number(args.max_retries) || 6
const SUCCESS_CHANCE = Number(args.success_ratio) || 0.25

/**
 * https://www.cuemath.com/algebra/what-are-geometric-progressions/
 */
const getNthElementInGeometricProgression = (a: number, n: number, r: number) =>
  a * Math.pow(r, n - 1)

function getRandomNumberInRage(min: number, max: number, whole = true) {
  const random = Math.random() * (max - min) + min

  return whole ? Math.floor(random) : random
}

const getRandomResponseTime = () => getRandomNumberInRage(50, 200)

const getRandomString = () => (Math.random() + 1).toString(36).substring(7)

const createAction = (name: string, delay: number) =>
  new Promise<ActionInfo>(resolve =>
    setTimeout(
      () => resolve({ success: Math.random() < SUCCESS_CHANCE, name }),
      delay
    )
  )

function getWaitTime(retry: number) {
  const randomBaseTimeout = getRandomNumberInRage(50, 75)
  const randomRatio = getRandomNumberInRage(1.5, 2.0, false)
  const backoffTimeout = getNthElementInGeometricProgression(
    randomBaseTimeout,
    retry,
    randomRatio
  )

  return Math.ceil(backoffTimeout)
}

async function processActions(actions: string[]) {
  let tries = 1
  let actionsToTry = actions.map(name =>
    from(createAction(name, getRandomResponseTime())).pipe(
      delay(getWaitTime(tries))
    )
  )

  while (actionsToTry.length > 0) {
    console.log('-------')
    console.log(`#${tries} try:`)

    if (tries > MAX_RETRIES) {
      throw new Error('Max number of retries reached!')
    }

    console.time('Duration')

    const results = await firstValueFrom(forkJoin(actionsToTry))

    console.timeEnd('Duration')

    const failedActions = results.filter(actionInfo => !actionInfo.success)
    const successfulActionsCount = actionsToTry.length - failedActions.length

    console.log(
      `Success: ${successfulActionsCount}; Failed: ${failedActions.length}`
    )

    tries++

    actionsToTry = failedActions.map(({ name }) =>
      defer(() =>
        from(createAction(name, getRandomResponseTime())).pipe(
          delay(getWaitTime(tries))
        )
      )
    )
  }
}

const randomActionNames = [...new Array(NUMBER_OF_ACTIONS)].map(_ =>
  getRandomString()
)

processActions(randomActionNames)
  .then(() => console.log('Success!'))
  .catch(err => console.log('Failed: ', err))
