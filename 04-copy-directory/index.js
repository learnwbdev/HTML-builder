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
  for (const file of oldFilesInCopyFolder) {
    const fullPath = path.join(pathFolder, file.name);
    if (file.isFile()) {
      await fs.unlink(fullPath);
    } else if (file.isDirectory()) {
      await emptyFolder(fullPath);
      await fs.rmdir(fullPath);
    }
  }
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

const copyFilesToFolder = async (pathFolderSrc, pathFolderDest) => {
  const filesInSrcFolder = await fs.readdir(pathFolderSrc, {
    withFileTypes: true,
  });
  for (const fileToCopy of filesInSrcFolder) {
    if (fileToCopy.isFile()) {
      await copyFileToAnotherFolder(
        pathFolderSrc,
        pathFolderDest,
        fileToCopy.name,
      );
    } else if (fileToCopy.isDirectory()) {
      const pathSubfolderSrc = path.join(pathFolderSrc, fileToCopy.name);
      const pathSubfolderDest = path.join(pathFolderDest, fileToCopy.name);
      await copyFolderWithFiles(pathSubfolderSrc, pathSubfolderDest);
    }
  }
};

const copyFolderWithFiles = async (pathFolderSrc, pathFolderDest) => {
  await createFolder(pathFolderDest);
  await emptyFolder(pathFolderDest);
  await copyFilesToFolder(pathFolderSrc, pathFolderDest);
};

const copyDir = async (pathFolder) => {
  const pathCopyFolder = `${pathFolder}-copy`;
  await copyFolderWithFiles(pathFolder, pathCopyFolder);
};

copyDir(folderToCopyPath);
