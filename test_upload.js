
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://laowyqplcthwqckyigiy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxhb3d5cXBsY3Rod3Fja3lpZ2l5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzMwMTQyNiwiZXhwIjoyMDcyODc3NDI2fQ.B2z_5vPpMJi8FAwlrsYd-KLLfKD-gt0Qv_9qvpMmQkk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testUpload() {
    const bucket = 'ai-images';
    const filename = 'test_upload_' + Date.now() + '.txt';
    const content = 'Hello, this is a test upload.';

    console.log(`Attempting to upload ${filename} to ${bucket}...`);

    const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filename, content, {
            contentType: 'text/plain',
            upsert: false
        });

    if (error) {
        console.error('Upload failed:', error);
    } else {
        console.log('Upload successful:', data);

        // Verify it exists
        const { data: listData } = await supabase.storage.from(bucket).list();
        const exists = listData.some(f => f.name === filename);
        console.log('File exists in list:', exists);

        // Clean up
        await supabase.storage.from(bucket).remove([filename]);
        console.log('Test file cleaned up.');
    }
}

testUpload();
