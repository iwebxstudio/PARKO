import fs from 'fs';

const logPath = 'C:/Users/acer14/.gemini/antigravity/brain/fefad84e-1fbb-4401-a837-cc7b0b115649/.system_generated/logs/overview.txt';
const lines = fs.readFileSync(logPath, 'utf-8').split('\n').filter(Boolean);

let actions = [];

for (const line of lines) {
  try {
    const data = JSON.parse(line);
    if (data.type === 'PLANNER_RESPONSE' && data.tool_calls) {
      for (const call of data.tool_calls) {
        if (call.name === 'replace_file_content') {
          const args = call.args;
          let file = typeof args.TargetFile === 'string' ? args.TargetFile : '';
          file = file.replace(/^"|"$/g, '').replace(/\\\\/g, '\\');
          let target = typeof args.TargetContent === 'string' ? args.TargetContent : '';
          target = target.replace(/^"|"$/g, '').replace(/\\n/g, '\n').replace(/\\"/g, '"');
          let repl = typeof args.ReplacementContent === 'string' ? args.ReplacementContent : '';
          repl = repl.replace(/^"|"$/g, '').replace(/\\n/g, '\n').replace(/\\"/g, '"');
          
          actions.push({
            file: file,
            target: target,
            replacement: repl,
            type: 'single'
          });
        } else if (call.name === 'multi_replace_file_content') {
          const args = call.args;
          let file = typeof args.TargetFile === 'string' ? args.TargetFile : '';
          file = file.replace(/^"|"$/g, '').replace(/\\\\/g, '\\');
          
          let chunksStr = args.ReplacementChunks;
          if (typeof chunksStr === 'string' && chunksStr.startsWith('"')) {
            chunksStr = chunksStr.replace(/^"|"$/g, '').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
          }
          const chunks = JSON.parse(chunksStr);
          for (const chunk of chunks) {
            let target = chunk.TargetContent;
            let repl = chunk.ReplacementContent;
            actions.push({
              file: file,
              target: target,
              replacement: repl,
              type: 'multi'
            });
          }
        }
      }
    }
  } catch(e) {
    // ignore parse errors
  }
}

actions.reverse();
const fileEdits = {};

for (const action of actions) {
  const filePath = action.file;
  if (!filePath.toLowerCase().includes('parko') || filePath.includes('.gemini') || filePath.includes('tsconfig')) continue;
  
  if (!fileEdits[filePath]) {
    try {
      fileEdits[filePath] = fs.readFileSync(filePath, 'utf-8');
    } catch(e) {
      continue;
    }
  }
  
  let content = fileEdits[filePath];
  // Revert: replace `replacement` with `target`
  const newContent = content.split(action.replacement).join(action.target);
  if (newContent !== content) {
    console.log(`Reversed an edit in ${filePath}`);
    fileEdits[filePath] = newContent;
  } else {
    // If exact match fails, it might be due to line ending differences or partial edits
    console.log(`Failed to reverse edit in ${filePath} (target not found)`);
  }
}

for (const [filePath, content] of Object.entries(fileEdits)) {
  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`Saved restored file: ${filePath}`);
}
