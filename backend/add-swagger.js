const fs = require('fs');
const path = require('path');

const routesDir = path.join(__dirname, 'src', 'routes');
const files = fs.readdirSync(routesDir).filter(f => f.endsWith('.js') && f !== 'index.js');

files.forEach(file => {
  const filePath = path.join(routesDir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Skip if already documented
  if (content.includes('@swagger')) {
    console.log(`Skipped ${file} (already documented)`);
    return;
  }
  
  const baseTag = file.replace('.js', '').charAt(0).toUpperCase() + file.replace('.js', '').slice(1);
  const basePath = `/api/${file.replace('.js', '')}`;
  
  let newContent = content;
  
  // Basic Regex to find router methods like router.get('/path' ...)
  const routeRegex = /router\.(get|post|put|delete|patch)\((['"`])(.*?)\2,/g;
  
  let match;
  let offset = 0;
  
  while ((match = routeRegex.exec(content)) !== null) {
    const method = match[1];
    let routePath = match[3];
    const startIndex = match.index;
    
    // Convert express route /:id to swagger route /{id} and prepare params
    const pathParams = [];
    routePath = routePath.replace(/:([a-zA-Z0-9_]+)/g, (fullMatch, p1) => {
      pathParams.push(p1);
      return `{${p1}}`;
    });
    
    // Combine base path with route path
    const fullPath = (routePath === '/' || routePath === '') ? basePath : `${basePath}${routePath.startsWith('/') ? routePath : ('/' + routePath)}`;
    
    let swaggerComment = `\n/**\n * @swagger\n * ${fullPath}:\n *   ${method}:\n *     tags: [${baseTag}]\n *     summary: ${method.toUpperCase()} ${fullPath}\n *     security:\n *       - bearerAuth: []\n`;
    
    if (pathParams.length > 0 || method === 'get') {
      swaggerComment += ` *     parameters:\n`;
      pathParams.forEach(param => {
        swaggerComment += ` *       - in: path\n *         name: ${param}\n *         required: true\n *         schema:\n *           type: string\n`;
      });
    }

    if (['post', 'put', 'patch'].includes(method)) {
      swaggerComment += ` *     requestBody:\n *       required: true\n *       content:\n *         application/json:\n *           schema:\n *             type: object\n`;
    }
    
    swaggerComment += ` *     responses:\n *       200:\n *         description: Success\n *       400:\n *         description: Bad Request\n *       401:\n *         description: Unauthorized\n *       500:\n *         description: Server Error\n */\n`;
    
    newContent = newContent.slice(0, startIndex + offset) + swaggerComment + newContent.slice(startIndex + offset);
    offset += swaggerComment.length;
  }
  
  // Prepend Tag Definition at the top of the file
  const tagComment = `/**\n * @swagger\n * tags:\n *   name: ${baseTag}\n *   description: API operations for ${baseTag}\n */\n`;
  newContent = tagComment + newContent;
  
  // In `auth.js`, change the base path manually later if necessary.
  fs.writeFileSync(filePath, newContent, 'utf8');
  console.log(`Documented ${file}`);
});
