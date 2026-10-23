const git = require('isomorphic-git');
const http = require('isomorphic-git/http/node');
const fs = require('fs');
const path = require('path');

const token = process.argv[2];
if (!token) {
  console.error('Token is required');
  process.exit(1);
}

const dir = path.resolve('.');

async function run() {
  try {
    const status = await git.statusMatrix({ fs, dir });
    for (const [filepath, head, workdir, stage] of status) {
      if (workdir === 0) {
        await git.remove({ fs, dir, filepath });
      } else if (workdir !== stage || head !== workdir) {
        await git.add({ fs, dir, filepath });
      }
    }

    const sha = await git.commit({
      fs,
      dir,
      message: 'feat(i18n): 100% complete multi-language system parity across 7 regional languages and instant UI reactivity',
      author: {
        name: 'Sanjana Yadav',
        email: 'sanjana@medremind.app',
      },
    });
    console.log('Committed SHA:', sha);

    console.log('Pushing commit to GitHub...');
    const pushResult = await git.push({
      fs,
      http,
      dir,
      remote: 'origin',
      ref: 'main',
      onAuth: () => ({ username: token, password: '' }),
    });

    console.log('Push Result:', JSON.stringify(pushResult, null, 2));
    console.log('Successfully pushed to GitHub!');
  } catch (err) {
    console.error('Error during commit & push:', err);
    process.exit(1);
  }
}

run();
