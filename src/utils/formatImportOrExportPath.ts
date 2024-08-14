export const formatImportOrExportPath = (newImportPath: string): string => {
  if (!newImportPath.startsWith('.')) {
    newImportPath = `./${newImportPath}`;
  }

  if (newImportPath.endsWith('.ts')) {
    newImportPath = newImportPath.slice(0, -3);
  }

  if (newImportPath.endsWith('/index')) {
    newImportPath = newImportPath.slice(0, -6);
  }

  return newImportPath;
};
