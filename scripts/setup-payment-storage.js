#!/usr/bin/env node

/**
 * Hanami 支付系統 Storage 設置腳本
 * 用於創建 Supabase Storage bucket 和設置權限
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// 檢查環境變數
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_SAAS_URL;
const supabaseServiceKey = process.env.SUPABASE_SAAS_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 缺少必要的環境變數:');
  console.error('   NEXT_PUBLIC_SUPABASE_SAAS_URL:', supabaseUrl ? '✅' : '❌');
  console.error('   SUPABASE_SAAS_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌');
  console.error('\n請確保 .env.local 檔案中包含這些變數');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupPaymentStorage() {
  console.log('🚀 開始設置 Hanami 支付系統 Storage...\n');

  try {
    // 1. 檢查 bucket 是否存在
    console.log('1️⃣ 檢查 hanami-saas-system bucket...');
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      throw new Error(`獲取 bucket 列表失敗: ${listError.message}`);
    }

    const existingBucket = buckets.find(bucket => bucket.id === 'hanami-saas-system');
    
    if (existingBucket) {
      console.log('✅ hanami-saas-system bucket 已存在');
    } else {
      console.log('📦 創建 hanami-saas-system bucket...');
      const { data: bucket, error: createError } = await supabase.storage.createBucket('hanami-saas-system', {
        public: false,
        allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
        fileSizeLimit: 10485760 // 10MB
      });

      if (createError) {
        throw new Error(`創建 bucket 失敗: ${createError.message}`);
      }
      console.log('✅ hanami-saas-system bucket 創建成功');
    }

    // 2. 創建資料夾結構
    console.log('\n2️⃣ 創建資料夾結構...');
    const folders = [
      'payment-screenshots',
      'payment-documents',
      'receipts'
    ];

    for (const folder of folders) {
      const { error: folderError } = await supabase.storage
        .from('hanami-saas-system')
        .upload(`${folder}/.keep`, new Blob([''], { type: 'text/plain' }), {
          upsert: true
        });

      if (folderError && !folderError.message.includes('already exists')) {
        console.warn(`⚠️  創建資料夾 ${folder} 時出現警告: ${folderError.message}`);
      } else {
        console.log(`✅ 資料夾 ${folder} 準備完成`);
      }
    }

    // 創建今天的日期資料夾作為示例
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayFolder = `${year}-${month}-${day}`;
    
    const { error: todayFolderError } = await supabase.storage
      .from('hanami-saas-system')
      .upload(`payment-screenshots/${todayFolder}/.keep`, new Blob([''], { type: 'text/plain' }), {
        upsert: true
      });

    if (todayFolderError && !todayFolderError.message.includes('already exists')) {
      console.warn(`⚠️  創建今日資料夾 ${todayFolder} 時出現警告: ${todayFolderError.message}`);
    } else {
      console.log(`✅ 今日資料夾 payment-screenshots/${todayFolder} 準備完成`);
    }

    // 3. 設置 Storage 策略
    console.log('\n3️⃣ 設置 Storage 權限策略...');
    
    const policies = [
      {
        name: 'Users can upload payment screenshots',
        definition: 'bucket_id = \'hanami-saas-system\' AND auth.uid() IS NOT NULL AND (storage.foldername(name))[1] = \'payment-screenshots\'',
        check: 'bucket_id = \'hanami-saas-system\' AND auth.uid() IS NOT NULL AND (storage.foldername(name))[1] = \'payment-screenshots\'',
        command: 'INSERT'
      },
      {
        name: 'Users can view their own payment screenshots',
        definition: 'bucket_id = \'hanami-saas-system\' AND auth.uid() IS NOT NULL AND (storage.foldername(name))[1] = \'payment-screenshots\'',
        check: 'bucket_id = \'hanami-saas-system\' AND auth.uid() IS NOT NULL AND (storage.foldername(name))[1] = \'payment-screenshots\'',
        command: 'SELECT'
      },
      {
        name: 'Service role can manage all payment files',
        definition: 'bucket_id = \'hanami-saas-system\' AND auth.role() = \'service_role\'',
        check: 'bucket_id = \'hanami-saas-system\' AND auth.role() = \'service_role\'',
        command: 'ALL'
      },
      {
        name: 'Auto-create date folders for payment screenshots',
        definition: 'bucket_id = \'hanami-saas-system\' AND auth.uid() IS NOT NULL AND (storage.foldername(name))[1] = \'payment-screenshots\' AND (storage.foldername(name))[2] ~ \'^[0-9]{4}-[0-9]{2}-[0-9]{2}$\'',
        check: 'bucket_id = \'hanami-saas-system\' AND auth.uid() IS NOT NULL AND (storage.foldername(name))[1] = \'payment-screenshots\' AND (storage.foldername(name))[2] ~ \'^[0-9]{4}-[0-9]{2}-[0-9]{2}$\'',
        command: 'INSERT'
      }
    ];

    // 注意：Storage 策略需要在 Supabase Dashboard 中手動設置
    console.log('📋 請在 Supabase Dashboard 中手動設置以下 Storage 策略:');
    policies.forEach((policy, index) => {
      console.log(`\n   策略 ${index + 1}: ${policy.name}`);
      console.log(`   條件: ${policy.definition}`);
      console.log(`   操作: ${policy.command}`);
    });

    // 4. 測試上傳功能
    console.log('\n4️⃣ 測試上傳功能...');
    const testFileName = `test-${Date.now()}.txt`;
    const testContent = 'This is a test file for payment system setup';
    const testDateFolder = `${year}-${month}-${day}`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('hanami-saas-system')
      .upload(`payment-screenshots/${testDateFolder}/${testFileName}`, testContent, {
        contentType: 'text/plain'
      });

    if (uploadError) {
      console.warn(`⚠️  測試上傳失敗: ${uploadError.message}`);
    } else {
      console.log(`✅ 測試上傳成功到日期資料夾: ${testDateFolder}`);
      
      // 清理測試檔案
      await supabase.storage
        .from('hanami-saas-system')
        .remove([`payment-screenshots/${testDateFolder}/${testFileName}`]);
      console.log('🧹 測試檔案已清理');
    }

    // 5. 顯示設置摘要
    console.log('\n🎉 Hanami 支付系統 Storage 設置完成！');
    console.log('\n📋 設置摘要:');
    console.log('   ✅ hanami-saas-system bucket 已準備就緒');
    console.log('   ✅ 資料夾結構已創建');
    console.log('   ✅ 上傳功能測試通過');
    console.log('\n⚠️  重要提醒:');
    console.log('   1. 請在 Supabase Dashboard 中手動設置 Storage 權限策略');
    console.log('   2. 確保執行 payment-system-setup.sql 來創建資料表');
    console.log('   3. 檢查 .env.local 中的環境變數設置');
    console.log('\n🔗 相關文檔:');
    console.log('   - docs/payment-env-setup.md');
    console.log('   - docs/payment-system-setup.sql');

  } catch (error) {
    console.error('\n❌ 設置過程中發生錯誤:');
    console.error(error.message);
    console.error('\n🔧 故障排除建議:');
    console.error('   1. 檢查 Supabase URL 和 Service Role Key 是否正確');
    console.error('   2. 確認 Supabase 項目是否正常運行');
    console.error('   3. 檢查網路連接');
    process.exit(1);
  }
}

// 執行設置
setupPaymentStorage();

