
require('dotenv').config()
const CveId = require('../src/model/cve-id')
const logger = require('../src/middleware/logger')
const getConstants = require('../src/constants').getConstants
const errors = require('../src/controller/cve-id.controller/error')
const error = new errors.CveIdControllerError()
const CONSOLE_OUTPUT = false

// DONE *
async function reserveCveId (req, res) {
  const requester = req.ctx.user
  const cnaShortName = req.ctx.org
  let batchType
  let amount
  let shortName
  let year
  const orgRepo = req.ctx.repositories.getOrgRepository()

  Object.keys(req.ctx.query).forEach(k => {
    const key = k.toLowerCase()

    if (key === 'amount') {
      amount = req.ctx.query.amount
    } else if (key === 'batch_type') {
      batchType = req.ctx.query.batch_type
    } else if (key === 'short_name') {
      shortName = req.ctx.query.short_name
    } else if (key === 'cve_year') {
      year = req.ctx.query.cve_year
    }
  })

  const result = await orgRepo.findOneByShortName(shortName)
  if (!result) {
    return res.status(403).json(error.orgDne(shortName))
  }

  const payload = await getPayload(req, result)
  if (amount > payload.available) {
    return res.status(403).json(error.overIdQuota(payload))
  }

  if (batchType === 'non-sequential' || batchType === 'nonsequential') {
    await nonSequentialReservation(year, amount, shortName, cnaShortName, requester, payload.available, res, req)
  }
}

// DONE *
async function nonSequentialReservation (year, amount, shortName, cnaShortName, requester, availableIds, res, req) {
  const cveIdRepo = req.ctx.repositories.getCveIdRepository()
  const cveIdRangeRepo = req.ctx.repositories.getCveIdRangeRepository()
  const reqUUID = req.ctx.uuid
  const CONSTANTS = getConstants()
  let isFull = false
  let available
  amount = parseInt(amount)
  let availableLimit = Math.max(3 * amount, CONSTANTS.DEFAULT_AVAILABLE_POOL)
  let result = await cveIdRangeRepo.findOne({ cve_year: year })

  if (CONSOLE_OUTPUT) {
    console.log('amount = ' + amount)
    console.log('availableLimit = ' + availableLimit)
  }

  // Cve Id Range for 'year' does not exists
  if (!result) {
    logger.info('CVE IDs for year ' + year + ' cannot be reserved at this time.')
    res.header(CONSTANTS.QUOTA_HEADER, availableIds)
    return res.status(403).json(error.cannotReserveForYear(year))
  }

  if (CONSOLE_OUTPUT) {
    console.log('available count (uncapped) = ' + (await cveIdRepo.find({ cve_year: year, state: 'AVAILABLE' })).length) // get available ids
  }

  available = await cveIdRepo.find({ cve_year: year, state: 'AVAILABLE' }, { limit: availableLimit }) // get available ids

  if (CONSOLE_OUTPUT) {
    console.log('available count (capped) = ' + available.length) // get available ids
  }

  // Case 1: Not enough IDs in the 'AVAILABLE' pool
  if (available.length < availableLimit) {
    result = await incrementNonSequentialPool(availableLimit, result.ranges.general.end, result.ranges.general.top_id, amount, available.length, year, cveIdRangeRepo)
    isFull = result.isFull

    if (isFull) {
      logger.error('The cve id non-sequential block is full for year ' + year + '. No more sequential ids can be reserved at this time.')
      res.header(CONSTANTS.QUOTA_HEADER, availableIds)
      return res.status(403).json(error.yearRangeFull(year))
    }

    await allocateAvailableCveIds(result.ids, year, cveIdRepo) // Pool was incremented. Create 'AVAILABLE' cve ids.

    if (CONSOLE_OUTPUT) {
      console.log('available count (uncapped) = ' + (await cveIdRepo.find({ cve_year: year, state: 'AVAILABLE' })).length) // get available ids
    }

    available = await cveIdRepo.find({ cve_year: year, state: 'AVAILABLE' }, { limit: availableLimit }) // get available ids

    if (CONSOLE_OUTPUT) {
      console.log('available count (capped) = ' + available.length) // get available ids
    }
  }

  // Case 2: Enough IDs in the 'AVAILABLE' pool
  const orgRepo = req.ctx.repositories.getOrgRepository()
  const userRepo = req.ctx.repositories.getUserRepository()
  let index
  let counter = 0
  let dummyCounter = 0
  const cveIdDocuments = []
  const cveIdDocumentsUUID = []
  const owningOrgUUID = await orgRepo.getOrgUUID(shortName)
  const orgUUID = await orgRepo.getOrgUUID(cnaShortName)
  const requesterUUID = (await userRepo.findOneByUserNameAndOrgUUID(requester, orgUUID)).UUID

  if (CONSOLE_OUTPUT) {
    console.log('counter = ' + counter)
    console.log('dummyCounter = ' + dummyCounter)
  }

  while ((counter < amount) && !isFull) {
    index = getRandomInt(0, available.length) // get random index in the available array
    result = await reserveNonSequentialCveId(index, available, year, shortName, cnaShortName, requester, owningOrgUUID, orgUUID, requesterUUID, dummyCounter, cveIdRepo)

    if (CONSOLE_OUTPUT && !result.isReserved) {
      console.log('isReserved: ' + result.isReserved)
    }

    if (result.isReserved) {
      cveIdDocuments.push(result.cveId) // add reserved cve id to the array of reserved cve ids
      cveIdDocumentsUUID.push(result.cveIdUUID) // add reserved cve id UUID to the array of reserved cve ids
      available.splice(index, 1) // remove reserved cve id from the 'AVAILABLE' pool
      counter++

      if (CONSOLE_OUTPUT) {
        console.log('cveIdDocuments: ' + cveIdDocuments.length + ', available: ' + available.length + ', counter = ' + counter)
      }
    } else {
      if (CONSOLE_OUTPUT) {
        console.log('available = ' + available.length)
        console.log('available count (uncapped) = ' + (await cveIdRepo.find({ cve_year: year, state: 'AVAILABLE' })).length) // get available ids
      }

      available = await cveIdRepo.find({ cve_year: year, state: 'AVAILABLE' }, { limit: availableLimit }) // get available ids

      if (CONSOLE_OUTPUT) {
        console.log('available count (capped) = ' + available.length) // get available ids
      }

      availableLimit = Math.max(3 * (amount - counter), CONSTANTS.DEFAULT_AVAILABLE_POOL) // recalculate the available limit since some ids might have been reserved

      if (CONSOLE_OUTPUT) {
        console.log('availableLimit = ' + availableLimit)
      }

      // Case 1: Not enough IDs in the 'AVAILABLE' pool
      if (available.length < availableLimit) {
        result = await cveIdRangeRepo.findOne({ cve_year: year })
        result = await incrementNonSequentialPool(availableLimit, result.ranges.general.end, result.ranges.general.top_id, amount - counter, available.length, year, cveIdRangeRepo)
        isFull = result.isFull

        if (isFull) {
          logger.info({ message: 'Only ' + counter + ' cve ids were reserved because there are not enough ids in the CVE ID non-sequential block. Non-sequential CVE IDs were reserved for \'' + shortName + '\' org on behalf of \'' + cnaShortName + '\' org.', cve_ids: cveIdDocumentsUUID })
          res.header(CONSTANTS.QUOTA_HEADER, availableIds - counter)
          return res.status(206).json(error.reservedPartialAmount(counter, cveIdDocuments))
        }

        await allocateAvailableCveIds(result.ids, year, cveIdRepo) // Pool was incremented. Create 'AVAILABLE' cve ids.

        if (CONSOLE_OUTPUT) {
          console.log('available count (uncapped) = ' + (await cveIdRepo.find({ cve_year: year, state: 'AVAILABLE' })).length) // get available ids
        }

        available = await cveIdRepo.find({ cve_year: year, state: 'AVAILABLE' }, { limit: availableLimit }) // get available ids

        if (CONSOLE_OUTPUT) {
          console.log('available count (capped) = ' + available.length) // get available ids
        }
      }
    }

    dummyCounter++

    if (CONSOLE_OUTPUT) {
      console.log('dummyCounter = ' + dummyCounter)
    }
  }

  if (!isFull) {
    const payload = {
      action: 'nonsequential_reservation',
      change: 'Non-sequential CVE IDs were reserved for \'' + shortName + '\' org on behalf of \'' + cnaShortName + '\' org.',
      req_UUID: reqUUID,
      org_UUID: orgUUID,
      user_UUID: requesterUUID,
      cve_ids: cveIdDocumentsUUID
    }

    logger.info(JSON.stringify(payload))
    res.header(CONSTANTS.QUOTA_HEADER, availableIds - amount)
    return res.status(200).json({ cve_ids: cveIdDocuments })
  }
}

// DONE
async function incrementNonSequentialPool (availableLimit, end, top, amount, available, year, cveIdRR) {
  let increment = availableLimit - available + amount // the amount is the increment amount
  const cveIdRangeRepo = cveIdRR
  const endRange = parseInt(end)
  const topId = parseInt(top)

  if (CONSOLE_OUTPUT) {
    console.log('increment = ' + increment)
    console.log('endRange = ' + endRange)
    console.log('topId = ' + topId)
  }

  // Cap increment to end of general CVE ID block
  if (endRange < (topId + increment)) {
    increment = endRange - topId
  }

  if (CONSOLE_OUTPUT) {
    console.log('increment = ' + increment)
  }

  const result = {
    isFull: false,
    ids: null
  }

  if (increment > 0) {
    let r = await cveIdRangeRepo.findOneAndUpdate({ $and: [{ cve_year: year }, { 'ranges.general.end': { $gte: increment } }] }, { $inc: { 'ranges.general.top_id': increment } }, { new: true })

    if (CONSOLE_OUTPUT) {
      console.log('top_id = ' + r.ranges.general.top_id)
    }

    // Cap increment because it went over end of general block
    if (r.ranges.general.top_id > endRange) {
      if (CONSOLE_OUTPUT) {
        console.log('increment = ' + increment)
      }

      increment = increment - (r.ranges.general.top_id - endRange) // adjusting real increment
      r = await cveIdRangeRepo.findOneAndUpdate({ cve_year: year }, { $set: { 'ranges.general.top_id': endRange } }, { new: true }) // Cap top_id to end of the block

      if (CONSOLE_OUTPUT) {
        console.log('top_id = ' + r.ranges.general.top_id)
      }
    }

    if (CONSOLE_OUTPUT) {
      console.log('increment = ' + increment)
    }

    if (increment > 0) {
      result.ids = generateSequentialIds(year, r.ranges.general.top_id, increment)
    } else if (available < amount) { // You hit the end of the boundary
      result.isFull = true
    }
  } else if (available < amount) { // You hit the end of the boundary
    result.isFull = true
  }

  return result
}

// DONE *
async function allocateAvailableCveIds (ids, year, cveIdR) {
  if (ids) {
    const cveIdRepo = cveIdR
    const cveIdDocuments = []
    let cveId

    ids.forEach(id => {
      cveId = new CveId()
      cveId.cve_id = id
      cveId.cve_year = year
      cveId.state = 'AVAILABLE'
      cveId.owning_cna = 'N/A' // the org who gets assigned the reserved CVE IDs
      cveId.reserved = Date.now()
      cveId.requested_by = {
        cna: 'N/A', // the org who requested the CVE IDs
        user: 'N/A'
      }

      cveIdDocuments.push(cveId)
    })

    if (CONSOLE_OUTPUT) {
      console.log('Allocated ids: [' + cveIdDocuments[0].cve_id + ', ... , ' + cveIdDocuments[cveIdDocuments.length - 1].cve_id + ']')
      console.log('Allocated count = ' + cveIdDocuments.length)
    }

    await cveIdRepo.insertMany(cveIdDocuments) // Save the 'AVAILABLE' cve ids
  }
}

// DONE *
async function reserveNonSequentialCveId (index, available, year, shortName, cnaShortName, requester, owningOrgUUID, orgUUID, requesterUUID, dummyCounter, cveIdR) {
  // Update available Cve Id
  const cveIdUUID = new CveId()
  const cveId = new CveId()
  const cveIdRepo = cveIdR
  cveIdUUID.cve_id = cveId.cve_id = available[index].cve_id
  cveIdUUID.cve_year = cveId.cve_year = year
  cveIdUUID.state = cveId.state = 'RESERVED'
  cveIdUUID.owning_cna = owningOrgUUID
  cveId.owning_cna = shortName // the org who gets assigned the reserved CVE IDs
  cveIdUUID.reserved = cveId.reserved = Date.now()
  cveIdUUID.requested_by = {
    cna: orgUUID, // the org who requested the CVE IDs
    user: requesterUUID
  }
  cveId.requested_by = {
    cna: cnaShortName, // the org who requested the CVE IDs
    user: requester
  }

  const result = {
    cveId: cveId,
    cveIdUUID: cveIdUUID
  }

  if (dummyCounter === 5) {
    result.isReserved = await cveIdRepo.findOneAndUpdate({ cve_id: 'CVE-2888-5465', state: 'AVAILABLE' }, cveIdUUID, { new: true })
  } else {
    result.isReserved = await cveIdRepo.findOneAndUpdate({ cve_id: cveIdUUID.cve_id, state: 'AVAILABLE' }, cveIdUUID, { new: true })
  }

  return result
}

// DONE *
async function getPayload (req, org) {
  const payload = {
    id_quota: org.policies.id_quota
  }
  const cveIdRepo = req.ctx.repositories.getCveIdRepository()

  const result = await cveIdRepo.countDocuments({ owning_cna: org.UUID, state: 'RESERVED' })
  payload.total_reserved = result
  payload.available = (payload.id_quota - payload.total_reserved)

  return payload
}

// DONE
function generateSequentialIds (year, topId, increment) {
  const start = topId - increment + 1 // before the pool 'AVAILABLE' pool increment
  const end = topId // after the 'AVAILABLE' pool increment
  const ids = []

  if (CONSOLE_OUTPUT) {
    console.log('start = ' + start)
    console.log('end = ' + end)
  }

  for (let i = start; i < end + 1; i++) {
    ids.push('CVE-' + year + '-' + String(i).padStart(4, '0'))
  }

  if (CONSOLE_OUTPUT) {
    console.log('Generated ids: [' + ids[0] + ', ... , ' + ids[ids.length - 1] + ']')
  }

  return ids
}

// DONE
function getRandomInt (min, max) {
  min = Math.ceil(min)
  max = Math.floor(max)

  return Math.floor(Math.random() * (max - min) + min) // The maximum is exclusive and the minimum is inclusive
}

module.exports = {
  CVEID_RESERVE: reserveCveId
}
