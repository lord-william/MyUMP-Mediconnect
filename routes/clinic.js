const express = require("express");
const { createClient } = require('@supabase/supabase-js');
const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

router.get('/low', async(req, res) => {
    try{
        const {data, error} = await supabase
        .from('inventory')
        .select('quantity, stock_limit');
        if(error){
            return res.status(400).json({error: 'error fetching inventory'});
        }
        res.json({
            low: data
        });
    }catch(error){
        return res.status(500).json({'server error': error});
    }
});

module.exports = router;