const express = require("express");
const { createClient } = require('@supabase/supabase-js');
const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

router.post('/add', async(req, res) => {
    const {itemName, quantity,expiryDate, stockLimit, category} = req.body;
    if(!itemName || !quantity || !stockLimit || !expiryDate || !category){
        return res.status(400).json({error: 'All field are required'});
    }
    try{
        const {data, error} = await supabase
        .from('inventory')
        .insert([
            {
            item_name: itemName,
            quantity: quantity,
            expiry_date: expiryDate,
            stock_limit: stockLimit,
            category: category,
            created_at: new Date().toISOString(),
        },
    ]).select();

    if (error){
        return res.status(500).json({error: 'Error inserting data'});
    }
    return res.status(200).json({success: true, inserted: data[0]});
    
    }
    catch(error){
        console.error('failed to add new stock', error);
        return res.status(500).json({message: 'server error'});
    }
});

// Fetch all stock from inventory
router.get('/load', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading inventory:', error);
      return res.status(500).json({ message: 'server error' });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('Failed to load stock from inventory:', error);
    return res.status(500).json({ message: 'server error' });
  }
});


// delete item in inventory
router.delete('/del', async (req, res) => {
    const { itemId } = req.body;

    if (!itemId) {
        return res.status(400).json({ error: 'Item selected does not have an id' });
    }

    try {
        const { error } = await supabase
            .from('inventory')
            .delete()
            .eq('id', itemId);

        if (error) {
            console.error('Error deleting item:', error);
            return res.status(500).json({ message: 'Server error while deleting item' });
        }

        return res.status(200).json({ success: true, message: 'Item deleted successfully' });

    } catch (error) {
        console.error('Unexpected error deleting item:', error);
        return res.status(500).json({ message: 'Server error' });
    }
});


module.exports = router;