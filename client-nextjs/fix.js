const fs = require('fs');
const path = require('path');
function findFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(findFiles(file));
    } else if (file.endsWith('.tsx')) {
      results.push(file);
    }
  });
  return results;
}
const files = findFiles('C:\\Users\\biile\\Desktop\\Employme\\client-nextjs\\app');
files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  if (content.includes('serverFetch') && !content.includes('force-dynamic') && !content.includes('"use client"')) {
    fs.appendFileSync(file, '\nexport const dynamic = "force-dynamic";\n');
    console.log('Fixed ' + file);
  }
});
