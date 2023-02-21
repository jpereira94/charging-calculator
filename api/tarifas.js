import Redis from 'ioredis'

export default async function (req, res) {
  try {
    const redis = new Redis(process.env.REDIS_URL)
    let tarifas = await redis.get('tarifas')

    if (tarifas === null) {
      tarifas = JSON.stringify([])
    } else {
      // the items are on redis, reset the cache
      await redis.expire('tarifas', 5 * 60)
    }
    redis.quit()
    res.setHeader('Content-Type', 'application/json')
    res.write(tarifas)
    res.end()
  } catch (error) {
    console.warn(error)
    res.writeHead(400, 'Error')
    res.end()
  }
}
