const fs = require('fs');
const files = ['app/login/page.tsx', 'app/register/page.tsx', 'app/forgot-password/page.tsx'];
for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf8');
  if (!content.includes("import Image from 'next/image'")) {
    // insert after imports
    content = content.replace(/import [^\n]+;\n/, match => match + "import Image from 'next/image';\n");
  }
  content = content.replace(/<img src="\/leaf-([^"]+)" alt="" className=\{([^}]+)\} aria-hidden="true" \/>/g, 
    '<Image src="/leaf-$1" alt="" width={150} height={150} className={$2} aria-hidden="true" />');
  content = content.replace(/<img src="([^"]+)" alt="([^"]*)" className=\{([^}]+)\} \/>/g, 
    '<Image src="$1" alt="$2" width={150} height={150} className={$3} />');
  fs.writeFileSync(file, content);
}

const otherFiles = [
  'app/_components/landing/GaleriaSection.tsx',
  'app/_components/landing/PilaresSection.tsx',
  'app/dashboard/admin/pymes/[id]/page.tsx',
  'app/dashboard/admin/volunteers/VolunteersListClient.tsx',
  'app/dashboard/admin/volunteers/[id]/page.tsx',
  'app/dashboard/pyme/page.tsx',
  'app/dashboard/volunteer/projects/page.tsx'
];
for (const file of otherFiles) {
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf8');
  if (!content.includes("import Image from 'next/image'")) {
    content = content.replace(/import [^\n]+;\n/, match => match + "import Image from 'next/image';\n");
  }
  // This is a naive replacement for specific files where we know we can just add width and height
  content = content.replace(/<img src=\{([^}]+)\} alt=\{([^}]+)\} className="([^"]+)" \/>/g, 
    '<Image src={$1} alt={$2} width={400} height={300} className="$3" />');
  content = content.replace(/<img src=\{([^}]+)\} alt="([^"]+)" className="([^"]+)" \/>/g, 
    '<Image src={$1} alt="$2" width={400} height={300} className="$3" />');
  fs.writeFileSync(file, content);
}
console.log("Images replaced");
