// baseRepository for Mongoose
const mongoose = require('mongoose')

class BaseRepository {
  constructor (model) {
    this.mongoose = mongoose
    if (typeof model === 'string') {
      this.collection = mongoose.model(model)
    } else {
      this.collection = model
    }
  }

  async aggregate (aggregation) {
    return this.collection.aggregate(aggregation)
  }

  async aggregatePaginate (aggregation, options) {
    const arg = this.collection.aggregate(aggregation)
    return this.collection.aggregatePaginate(arg, options)
  }

  async find (query = {}, { multiple = true, count, lean, limit } = {}) {
    const results = multiple ? this.collection.find(query) : this.collection.findOne(query)

    if (count) {
      return results.countDocuments().exec()
    } else if (lean) {
      return results.lean().exec()
    } else if (limit) {
      return results.limit(limit).exec()
    } else {
      return results.exec()
    }
  }

  async findOne (query = {}) {
    const results = this.collection.findOne(query)
    return results.exec()
  }

  async findOneAndUpdate (query = {}, set = {}, options = {}) {
    return this.collection.findOneAndUpdate(query, set, options)
  }

  async findOneAndReplace (query = {}, replacement = {}) {
    return this.collection.findOneAndReplace(query, replacement)
  }

  async findOneAndRemove (query = {}) {
    return this.collection.findOneAndRemove(query)
  }

  async insertMany (documents) {
    return this.collection.insertMany(documents)
  }

  async countDocuments (query = {}) {
    return this.collection.countDocuments(query)
  }

  async estimatedDocumentCount (query = {}) {
    return this.collection.estimatedDocumentCount(query)
  }

  async deleteMany (query = {}) {
    return this.collection.deleteMany(query)
  }
}

module.exports = BaseRepository
