const mapIds = (data) => {
  if (!data) return data;
  if (Array.isArray(data)) return data.map(mapIds);
  if (typeof data === 'object') {
    // Avoid mapping BSON ObjectIds directly themselves
    if (data._bsontype === 'ObjectID' || data.toHexString) return data;
    
    // Convert Mongoose doc to plain object if it isn't already (though we use lean mostly)
    const obj = data.toObject ? data.toObject() : data;
    const mapped = { ...obj };
    
    if (mapped._id && !mapped.id) {
      mapped.id = mapped._id.toString();
    }
    
    // Recursively handle nested arrays/objects
    for (const key in mapped) {
      if (mapped[key] !== null && typeof mapped[key] === 'object' && !(mapped[key] instanceof Date)) {
        mapped[key] = mapIds(mapped[key]);
      }
    }
    return mapped;
  }
  return data;
};

const successResponse = (res, data, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data: mapIds(data)
  });
};

const errorResponse = (res, message = 'Error', statusCode = 500, errors = null) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors
  });
};

const paginatedResponse = (res, data, page, limit, total) => {
  return res.status(200).json({
    success: true,
    data: mapIds(data),
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: parseInt(total),
      pages: Math.ceil(total / limit)
    }
  });
};

module.exports = { successResponse, errorResponse, paginatedResponse };
