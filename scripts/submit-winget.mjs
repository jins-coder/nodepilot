// Automated Winget PR submission script via GitHub REST API

import fs from 'fs';
import path from 'path';

const token = process.argv[2] || process.env.GITHUB_TOKEN;

if (!token) {
  console.error('Error: Please provide your GitHub Personal Access Token.');
  console.error('Usage: node scripts/submit-winget.mjs <GITHUB_PAT>');
  process.exit(1);
}

const OWNER = 'microsoft';
const REPO = 'winget-pkgs';
const BRANCH_NAME = `jins-coder-nodepilot-1.0.2`;
const MANIFEST_DIR = 'winget/manifests/j/jins-coder/NodePilot/1.0.2';
const TARGET_PATH = 'manifests/j/jins-coder/NodePilot/1.0.2';

const headers = {
  'Authorization': `Bearer ${token}`,
  'Accept': 'application/vnd.github+json',
  'User-Agent': 'NodePilot-Winget-Submitter',
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
  console.log('🚀 Authenticating user...');
  const user = await api('/user');
  console.log(`Authenticated as: ${user.login}`);

  console.log('🍴 Forking microsoft/winget-pkgs (or using existing fork)...');
  const fork = await api(`/repos/${OWNER}/${REPO}/forks`, {
    method: 'POST',
  });
  console.log(`Fork ready: ${fork.full_name}`);

  // Wait a few seconds for fork to be ready if newly created
  console.log('⏳ Ensuring fork is initialized...');
  await new Promise(r => setTimeout(r, 4000));

  console.log('🔍 Fetching base branch SHA...');
  const baseBranch = await api(`/repos/${OWNER}/${REPO}/git/ref/heads/master`);
  const baseSha = baseBranch.object.sha;

  console.log(`🌿 Creating branch '${BRANCH_NAME}' on fork...`);
  try {
    await api(`/repos/${user.login}/${REPO}/git/refs`, {
      method: 'POST',
      body: JSON.stringify({
        ref: `refs/heads/${BRANCH_NAME}`,
        sha: baseSha,
      }),
    });
  } catch (err) {
    if (err.message.includes('already exists') || err.message.includes('Reference already exists')) {
      console.log(`Branch '${BRANCH_NAME}' already exists on fork, continuing...`);
    } else {
      throw err;
    }
  }

  // Read files from local manifest folder
  const files = [
    'jins-coder.NodePilot.yaml',
    'jins-coder.NodePilot.installer.yaml',
    'jins-coder.NodePilot.locale.en-US.yaml',
  ];

  for (const file of files) {
    const localFilePath = path.join(MANIFEST_DIR, file);
    const content = fs.readFileSync(localFilePath, 'utf8');
    const remotePath = `${TARGET_PATH}/${file}`;

    console.log(`📝 Uploading ${file}...`);

    let existingSha;
    try {
      const existingFile = await api(`/repos/${user.login}/${REPO}/contents/${remotePath}?ref=${BRANCH_NAME}`);
      existingSha = existingFile.sha;
    } catch {
      // File doesn't exist yet
    }

    await api(`/repos/${user.login}/${REPO}/contents/${remotePath}`, {
      method: 'PUT',
      body: JSON.stringify({
        message: `Add ${file} for NodePilot version 1.0.2`,
        content: Buffer.from(content).toString('base64'),
        branch: BRANCH_NAME,
        sha: existingSha,
      }),
    });
  }

  console.log('🎉 Opening Pull Request on microsoft/winget-pkgs...');
  try {
    const pr = await api(`/repos/${OWNER}/${REPO}/pulls`, {
      method: 'POST',
      body: JSON.stringify({
        title: 'New Package: jins-coder.NodePilot version 1.0.2',
        body: 'This pull request adds **NodePilot** (Modern Node.js Version Manager) v1.0.2 to Windows Package Manager.',
        head: `${user.login}:${BRANCH_NAME}`,
        base: 'master',
      }),
    });

    console.log(`\n======================================================`);
    console.log(`✅ Pull Request Created Successfully!`);
    console.log(`PR URL: ${pr.html_url}`);
    console.log(`======================================================\n`);
  } catch (err) {
    if (err.message.includes('A pull request already exists')) {
      console.log(`\nℹ️ A Pull Request from ${user.login}:${BRANCH_NAME} already exists on microsoft/winget-pkgs!`);
    } else {
      throw err;
    }
  }
}

main().catch(err => {
  console.error('\n❌ Submission Failed:', err.message);
  process.exit(1);
});
