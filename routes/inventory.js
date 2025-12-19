const express = require("express");
const { createClient } = require('@supabase/supabase-js');
const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Get all inventory
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('inventory')
      .select('*');
    if (error) return res.status(400).json({ error: error.message });

    res.json({ inventory: data });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete inventory item
router.delete('/del', async (req, res) => {
  const { id } = req.body;
  try {
    const { error } = await supabase
      .from('inventory')
      .delete()
      .eq('id', id);
    if (error) return res.status(400).json({ error: error.message });

    res.json({ message: 'Item deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get low stock items
router.get('/low', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('inventory')
      .select('id, item_name, quantity, stock_limit');
    if (error) return res.status(400).json({ error: error.message });

    const lowStock = data.filter(item => Number(item.quantity) < Number(item.stock_limit));
    res.json({ lowStock });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update inventory item
router.put('/update', async (req, res) => {
  const { newName, newQuantity, newExpiry, newCategory, newLimit, itemId } = req.body;
  try {
    const { error } = await supabase
      .from('inventory')
      .update({
        item_name: newName,
        quantity: newQuantity,
        expiry_date: newExpiry,
        category: newCategory,
        stock_limit: newLimit
      })
      .eq('id', itemId);
    if (error) return res.status(400).json({ error: error.message });

    res.json({ message: 'Item updated' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update item usage
router.post('/usage', async (req, res) => {
  const { id, newQuantity } = req.body;
  try {
    const { error } = await supabase
      .from('inventory')
      .update({ quantity: newQuantity })
      .eq('id', id);
    if (error) return res.status(400).json({ error: error.message });

    res.json({ message: 'Usage updated' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
