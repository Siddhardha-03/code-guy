const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

// Configure these before running
const API_URL = process.env.API_URL || 'http://localhost:5000/api';
const TOKEN = process.env.ADMIN_TOKEN || '';
const FILE_PATH = path.join(__dirname, '..', 'client', 'public', 'questions_bulk_template.csv');

(async () => {
  try {
    if (!TOKEN) {
      console.error('Missing ADMIN_TOKEN env var. Set a valid admin JWT.');
      process.exit(1);
    }
    if (!fs.existsSync(FILE_PATH)) {
      console.error('CSV file not found at', FILE_PATH);
      process.exit(1);
    }

    const form = new FormData();
    form.append('file', fs.createReadStream(FILE_PATH));

    const resp = await axios.post(`${API_URL}/admin/questions/bulk-upload`, form, {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        ...form.getHeaders()
      },
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
      validateStatus: () => true
    });

    console.log('Status:', resp.status);
    console.log('Response:', JSON.stringify(resp.data, null, 2));
  } catch (err) {
    console.error('Upload failed:', err.response?.data || err.message);
    process.exit(1);
  }
})();
