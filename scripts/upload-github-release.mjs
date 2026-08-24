// Upload release assets to GitHub Release via REST API

import fs from 'fs';
import path from 'path';

const token = process.argv[2] || process.env.GITHUB_TOKEN;
const tag = process.argv[3] || 'v1.0.2';

if (!token) {
  console.error('Error: Please provide GitHub token');
  process.exit(1);
}

const OWNER = 'jins-coder';
const REPO = 'nodepilot';

const headers = {
  'Authorization': `Bearer ${token}`,
  'Accept': 'application/vnd.github+json',
  'User-Agent': 'NodePilot-Release-Uploader',
  'X-GitHub-Api-Version': '2022-11-28',
};

async function api(url, options = {}) {
  const res = await fetch(`https://api.github.com${url}`, {
    ...options,
    headers: { ...headers, ...options.headers },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`GitHub API error ${res.status}: ${data.message || JSON.stringify(data)}`);
  }
  return data;
}

async function main() {
  console.log(`🔍 Checking release for tag ${tag}...`);

  let release;
  try {
    release = await api(`/repos/${OWNER}/${REPO}/releases/tags/${tag}`);
    console.log(`Found release: ${release.name || release.tag_name} (ID: ${release.id})`);
  } catch (err) {
    console.log(`Release not found for tag ${tag}. Creating release...`);
    release = await api(`/repos/${OWNER}/${REPO}/releases`, {
      method: 'POST',
      body: JSON.stringify({
        tag_name: tag,
        name: `NodePilot ${tag}`,
        body: `### NodePilot ${tag}\n\nSigned Windows installers and packages.`,
        draft: false,
        prerelease: false,
      }),
    });
    console.log(`Release created: ID ${release.id}`);
  }

  const uploadFiles = [
    {
      name: `NodePilot_1.0.2_x64-setup.exe`,
      path: `E:/Envision/nvmgui/src-tauri/target/release/bundle/nsis/NodePilot_1.0.2_x64-setup.exe`,
      contentType: 'application/vnd.microsoft.portable-executable',
    },
    {
      name: `NodePilot_1.0.2_x64_en-US.msi`,
      path: `E:/Envision/nvmgui/src-tauri/target/release/bundle/msi/NodePilot_1.0.2_x64_en-US.msi`,
      contentType: 'application/x-msi',
    },
  ];

  for (const item of uploadFiles) {
    if (!fs.existsSync(item.path)) {
      console.warn(`File not found: ${item.path}`);
      continue;
    }

    console.log(`\n⬆️ Uploading ${item.name}...`);
    const fileBuffer = fs.readFileSync(item.path);

    // Delete existing asset with same name if present
    const existingAsset = release.assets?.find(a => a.name === item.name);
    if (existingAsset) {
      console.log(`Deleting existing asset ${item.name} (ID: ${existingAsset.id})...`);
      await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/releases/assets/${existingAsset.id}`, {
        method: 'DELETE',
        headers,
      });
    }

    const uploadUrl = `https://uploads.github.com/repos/${OWNER}/${REPO}/releases/${release.id}/assets?name=${encodeURIComponent(item.name)}`;
    const uploadRes = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': item.contentType,
        'Content-Length': fileBuffer.length.toString(),
        'User-Agent': 'NodePilot-Release-Uploader',
      },
      body: fileBuffer,
    });

    if (!uploadRes.ok) {
      const errData = await uploadRes.json().catch(() => ({}));
      throw new Error(`Failed to upload ${item.name}: ${uploadRes.status} ${errData.message || ''}`);
    }

    const assetData = await uploadRes.json();
    console.log(`✅ Uploaded successfully: ${assetData.browser_download_url}`);
  }

  console.log(`\n======================================================`);
  console.log(`🎉 All release assets are published and live on GitHub!`);
  console.log(`Release URL: https://github.com/${OWNER}/${REPO}/releases/tag/${tag}`);
  console.log(`======================================================\n`);
}

main().catch(err => {
  console.error('\n❌ Upload Failed:', err.message);
  process.exit(1);
});
