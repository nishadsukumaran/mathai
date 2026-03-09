// Patch path.join to trace undefined arguments
const originalJoin = require('path').join;
require('path').join = function(...args) {
  if (args.some(a => a === undefined || a === null)) {
    console.error('path.join called with undefined/null!', args);
    console.error(new Error('Trace:').stack);
  }
  return originalJoin(...args);
};

// Also patch fs.promises.copyFile
const fs = require('fs');
const originalCopyFile = fs.promises.copyFile;
fs.promises.copyFile = function(src, dest, ...rest) {
  if (src === undefined || dest === undefined) {
    console.error('fs.promises.copyFile called with undefined!', {src, dest});
    console.error(new Error('Trace:').stack);
  }
  return originalCopyFile.call(fs.promises, src, dest, ...rest);
};

// Now run prisma generate
process.argv = ['node', 'prisma', 'generate', '--schema=database/schema/schema.prisma'];
require('./node_modules/prisma/build/index.js');
