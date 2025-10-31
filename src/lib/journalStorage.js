/**
 * Journal Storage Manager
 * Direct database access without localStorage caching
 */

/**
 * Get all journal entries from database
 */
export async function getJournalEntries() {
  console.log('📚 [Journal Storage] Getting entries from database...');
  
  try {
    const response = await fetch('/api/journal', {
      credentials: 'include'
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch from database');
    }
    
    const data = await response.json();
    
    if (data.success && data.entries) {
      console.log(`✅ [Journal Storage] Loaded ${data.entries.length} entries`);
      return data.entries;
    }
    
    return [];
  } catch (error) {
    console.error('❌ [Journal Storage] Error:', error);
    return [];
  }
}

/**
 * Save a new journal entry
 */
export async function saveJournalEntry(entryData) {
  console.log('💾 [Journal Storage] Saving entry...');
  
  try {
    const response = await fetch('/api/journal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entryData),
      credentials: 'include'
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to save to database');
    }
    
    if (data.success && data.entry) {
      console.log('✅ [Journal Storage] Entry saved');
      return data.entry;
    }
    
    throw new Error('Invalid response from server');
  } catch (error) {
    console.error('❌ [Journal Storage] Save error:', error);
    throw error;
  }
}

/**
 * Update an existing journal entry
 */
export async function updateJournalEntry(entryId, updates) {
  console.log('📝 [Journal Storage] Updating entry...', entryId);
  
  try {
    const response = await fetch('/api/journal', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entryId, updates }),
      credentials: 'include'
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to update database');
    }
    
    if (data.success && data.entry) {
      console.log('✅ [Journal Storage] Entry updated');
      return data.entry;
    }
    
    throw new Error('Invalid response from server');
  } catch (error) {
    console.error('❌ [Journal Storage] Update error:', error);
    throw error;
  }
}

/**
 * Delete a journal entry
 */
export async function deleteJournalEntry(entryId) {
  console.log('🗑️ [Journal Storage] Deleting entry...', entryId);
  
  try {
    const response = await fetch(`/api/journal?entryId=${entryId}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to delete from database');
    }
    
    console.log('✅ [Journal Storage] Entry deleted');
    return true;
  } catch (error) {
    console.error('❌ [Journal Storage] Delete error:', error);
    throw error;
  }
}

/**
 * Get user's categories
 */
export function getUserCategories(entries) {
  const categories = entries.map(e => ({
    name: e.category.name,
    color: e.category.color,
    id: e.category.id
  }));
  
  // Remove duplicates
  const unique = categories.filter((cat, index, self) => 
    index === self.findIndex(c => c.name === cat.name)
  );
  
  return unique;
}
