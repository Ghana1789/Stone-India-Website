import mongoose from 'mongoose';

/**
 * Robust Mocking System for Demo Mode
 * Patches Mongoose globally to prevent 500 errors when no DB is connected.
 */
const patchMongoose = () => {
  console.log('🧪 DEMO MODE: Initializing Global Mongoose Mock...');

  // Adds toObject() / toJSON() to plain objects returned by mock queries
  const addDocMethods = (doc) => {
    if (!doc || typeof doc !== 'object') return doc;
    if (Array.isArray(doc)) return doc.map(addDocMethods);
    const obj = { ...doc };
    if (!obj.toObject) Object.defineProperty(obj, 'toObject', { value: () => ({ ...obj }), writable: true, configurable: true });
    if (!obj.toJSON)   Object.defineProperty(obj, 'toJSON',   { value: () => ({ ...obj }), writable: true, configurable: true });
    return obj;
  };

  const mockQuery = (data = []) => {
    const safeData = Array.isArray(data) ? data.map(addDocMethods) : addDocMethods(data);
    const query = Promise.resolve(safeData);
    query.populate = () => query;
    query.select   = () => query;
    query.sort     = () => query;
    query.limit    = () => query;
    query.skip     = () => query;
    query.lean     = () => query;
    query.exec     = () => query;
    return query;
  };

  // ── Static query methods ──────────────────────────────────────────────────
  mongoose.Model.find             = ()      => mockQuery([]);
  mongoose.Model.findOne          = ()      => mockQuery(null);
  mongoose.Model.findById         = ()      => mockQuery(null);
  mongoose.Model.findByIdAndDelete = ()     => Promise.resolve(null);
  mongoose.Model.findByIdAndUpdate = ()     => mockQuery(null);
  mongoose.Model.findOneAndUpdate  = ()     => mockQuery(null);
  mongoose.Model.deleteOne        = ()      => Promise.resolve({ deletedCount: 0 });
  mongoose.Model.deleteMany       = ()      => Promise.resolve({ deletedCount: 0 });
  mongoose.Model.countDocuments   = ()      => Promise.resolve(0);
  mongoose.Model.count            = ()      => Promise.resolve(0);
  mongoose.Model.aggregate        = ()      => Promise.resolve([]);
  mongoose.Model.exists           = ()      => Promise.resolve(null);
  mongoose.Model.distinct         = ()      => Promise.resolve([]);
  mongoose.Model.updateOne        = ()      => Promise.resolve({ modifiedCount: 0 });
  mongoose.Model.updateMany       = ()      => Promise.resolve({ modifiedCount: 0 });
  mongoose.Model.insertMany       = (docs)  => Promise.resolve(addDocMethods(Array.isArray(docs) ? docs : [docs]));

  // ── Instance methods ──────────────────────────────────────────────────────
  mongoose.Model.prototype.save = function () {
    return Promise.resolve(addDocMethods(this));
  };

  // ── Static create ─────────────────────────────────────────────────────────
  mongoose.Model.create = function (docs) {
    if (Array.isArray(docs)) {
      return Promise.resolve(addDocMethods(docs.map(d => ({ ...d, _id: d._id || 'mock_id' }))));
    }
    return Promise.resolve(addDocMethods({ ...docs, _id: docs._id || 'mock_id' }));
  };
};

export default patchMongoose;
