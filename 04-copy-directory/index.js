const fs = require('node:fs/promises');
const path = require('node:path');

const folderToCopyName = 'files';
const folderToCopyPath = path.join(__dirname, folderToCopyName);

const createFolder = async (pathFolder) => {
  await fs.mkdir(pathFolder, { recursive: true });
};

const emptyFolder = async (pathFolder) => {
  const oldFilesInCopyFolder = await fs.readdir(pathFolder, {
    withFileTypes: true,
  });
  oldFilesInCopyFolder.forEach(async (file) => {
    const fullPath = path.join(pathFolder, file.name);
    if (file.isFile()) {
      await fs.unlink(fullPath);
    } else if (file.isDirectory()) {
      await fs.rmdir(fullPath);
    }
  });
};

const copyFileToAnotherFolder = async (
  pathFolderOriginal,
  pathFolderCopy,
  fileName,
) => {
  const fullPathOriginal = path.join(pathFolderOriginal, fileName);
  const fullPathCopy = path.join(pathFolderCopy, fileName);
  await fs.copyFile(fullPathOriginal, fullPathCopy);
};

const copyDir = async (pathFolder) => {
  const pathCopyFolder = `${pathFolder}-copy`;
  await createFolder(pathCopyFolder);
  await emptyFolder(pathCopyFolder);

  const filesInOriginalFolder = await fs.readdir(pathFolder, {
    withFileTypes: true,
  });
  filesInOriginalFolder.forEach(async (fileToCopy) => {
    if (fileToCopy.isFile()) {
      await copyFileToAnotherFolder(
        pathFolder,
        pathCopyFolder,
        fileToCopy.name,
      );
    }
  });
};

copyDir(folderToCopyPath);
