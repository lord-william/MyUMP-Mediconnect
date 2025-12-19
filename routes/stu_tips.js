const express = require("express");
const { createClient } = require('@supabase/supabase-js');
const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

router.get('/tips', async(req, res) => {
    try{
        const {data, error} = await supabase
        .from('healthy_tips')
        .select('*')
        .order('date', {ascending: false});
        if(error){
            return res.status(400).json({error: 'Error fetching health tips'});
        }
        res.json({
            tips: data
        });
    }catch(error){
        return res.status(500).json({error: 'server error'});
    }
});

module.exports = router;