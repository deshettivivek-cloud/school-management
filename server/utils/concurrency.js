const supabase = require('../config/supabase');

/**
 * Safely updates a record using optimistic concurrency control.
 * 
 * @param {string} table - The Supabase table name
 * @param {string} id - The primary key (id) of the record
 * @param {Object} updates - The data to update
 * @param {string} lastUpdatedAt - The ISO timestamp string of when the client last read the record
 * @returns {Promise<Object>} The updated record data
 */
exports.safeUpdate = async (table, id, updates, lastUpdatedAt) => {
  if (!lastUpdatedAt) {
    const err = new Error('lastUpdatedAt is required to prevent concurrent modifications');
    err.status = 400;
    throw err;
  }

  // Attempt the update only if the updated_at matches exactly what the client has
  const { data, error } = await supabase
    .from(table)
    .update(updates)
    .eq('id', id)
    .eq('updated_at', lastUpdatedAt)
    .select();

  if (error) throw error;

  if (!data || data.length === 0) {
    // Determine if it failed due to concurrency (409) or missing record (404)
    const { data: existing } = await supabase.from(table).select('id').eq('id', id).maybeSingle();
    if (existing) {
      const err = new Error('This record was modified by another user. Please refresh your data and try again.');
      err.status = 409;
      throw err;
    } else {
      const err = new Error('Record not found');
      err.status = 404;
      throw err;
    }
  }

  return { data: data[0] };
};

/**
 * Safely deletes a record using optimistic concurrency control.
 */
exports.safeDelete = async (table, id, lastUpdatedAt) => {
  if (!lastUpdatedAt) {
    const err = new Error('lastUpdatedAt is required to prevent concurrent modifications');
    err.status = 400;
    throw err;
  }

  // To simulate optimistic delete, we delete where updated_at matches
  const { data, error } = await supabase
    .from(table)
    .delete()
    .eq('id', id)
    .eq('updated_at', lastUpdatedAt)
    .select();

  if (error) throw error;

  if (!data || data.length === 0) {
    const { data: existing } = await supabase.from(table).select('id').eq('id', id).maybeSingle();
    if (existing) {
      const err = new Error('This record was modified by another user. Please refresh your data and try again.');
      err.status = 409;
      throw err;
    } else {
      const err = new Error('Record not found');
      err.status = 404;
      throw err;
    }
  }

  return { data: data[0] };
};
