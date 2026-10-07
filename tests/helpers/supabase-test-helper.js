// tests/helpers/supabase-test-helper.js
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.test' });

const SUPABASE_URL = process.env.SUPABASE_URL || "https://ajapvxdpxifdhvvszuhp.supabase.co";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqYXB2eGRweGlmZGh2dnN6dWhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3ODk5NTMsImV4cCI6MjA4MTM2NTk1M30.iC9U-MQC6VYZNXd_RugA6_hxZwrhYRsapffOYDCikio";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const TEST_PREFIX = 'PW_TEST_';

function generateTestName(base) {
  return `${TEST_PREFIX}${base}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
}

async function cleanupTestData() {
  try {
    // Delete any test customers and their cascading orders/stages
    const { data: testCusts } = await supabase
      .from('customers')
      .select('id')
      .like('name', `${TEST_PREFIX}%`);

    if (testCusts && testCusts.length > 0) {
      const custIds = testCusts.map(c => c.id);
      
      const { data: testOrders } = await supabase
        .from('orders')
        .select('id')
        .in('customer_id', custIds);

      if (testOrders && testOrders.length > 0) {
        const orderIds = testOrders.map(o => o.id);
        await supabase.from('order_stages').delete().in('order_id', orderIds);
        await supabase.from('order_history').delete().in('order_id', orderIds);
        await supabase.from('notifications').delete().in('order_id', orderIds);
        await supabase.from('orders').delete().in('id', orderIds);
      }

      await supabase.from('customers').delete().in('id', custIds);
    }

    // Delete test employees
    await supabase
      .from('employees')
      .delete()
      .like('name', `${TEST_PREFIX}%`);

    // Delete test garment types in app_settings
    const { data: garmentSetting } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'garment_types')
      .single();

    if (garmentSetting && Array.isArray(garmentSetting.value)) {
      const cleanedGarments = garmentSetting.value.filter(g => !g.startsWith(TEST_PREFIX));
      if (cleanedGarments.length !== garmentSetting.value.length) {
        await supabase
          .from('app_settings')
          .update({ value: cleanedGarments, updated_at: new Date().toISOString() })
          .eq('key', 'garment_types');
      }
    }
  } catch (err) {
    console.warn('Cleanup warning:', err.message);
  }
}

module.exports = {
  supabase,
  TEST_PREFIX,
  generateTestName,
  cleanupTestData
};
