import Redis from 'ioredis'
import axios from 'axios'

export default async function (req, res) {
  try {
    const redis = new Redis(process.env.REDIS_URL)
    let locations = await redis.get('locations')

    if (locations === null) {
      locations = []
      const { data } = await axios.get(
        'https://ocpi.mobinteli.com/2.2/locations'
      )

      for (let i = 0; i < data.length; i++) {
        const posto = data[i]
        for (let j = 0; j < posto.evses.length; j++) {
          const evse = posto.evses[j]
          locations.push({
            id: posto.id,
            uid: evse.uid,
            country_code: posto.country_code,
            party_id: posto.party_id,
            address: posto.address,
            city: posto.city,
            country: posto.country,
            postal_code: posto.postal_code,
            coordinates_latitude: posto.coordinates.latitude,
            coordinates_longitude: posto.coordinates.longitude,
            parking_type: posto.parking_type,
            standard: evse.connectors[0].standard,
            format: evse.connectors[0].format,
            power_type: evse.connectors[0].power_type,
            max_voltage: evse.connectors[0].max_voltage,
            max_amperage: evse.connectors[0].max_amperage,
            max_electric_power: evse.connectors[0].max_electric_power,
            mobie_voltage_level: posto.mobie_voltage_level,
          })
        }
      }
      locations = locations.filter(
        (x, i, self) =>
          i ===
          self.findIndex((y) => x.id === y.id && x.standard === y.standard)
      )
      locations = JSON.stringify(locations)
      await redis.set('locations', locations, 'EX', 5 * 60)
    } else {
      // the items are on redis, reset the cache
      await redis.expire('locations', 5 * 60)
    }
    redis.quit()

    res.setHeader('Content-Type', 'application/json')
    res.write(locations)
    res.end()
  } catch (error) {
    console.warn(error)
    res.writeHead(400, 'Error')
    res.end()
  }
}
