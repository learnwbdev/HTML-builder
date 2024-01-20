const path = require('node:path');
const { readdir, stat } = require('node:fs/promises');

const nameFolderToCheck = 'secret-folder';
const folderToCheckPath = path.join(__dirname, nameFolderToCheck);

const getFileNameAndExtension = (fileNameWithExt) => {
  const fileExtensionWithDot = path.extname(fileNameWithExt);
  const lengthExtensWithDot = fileExtensionWithDot.length;
  const fileName = fileNameWithExt.slice(0, -lengthExtensWithDot);
  const fileExtension = fileExtensionWithDot.slice(1);
  return { fileName, fileExtension };
};

const getFileSizeInBytes = async (pathToFile) => {
  const fileStats = await stat(pathToFile);
  const fileSizeInBytes = fileStats.size;
  return fileSizeInBytes;
};

const getFileInfo = async (pathToFolder, fileNameWithExt) => {
  const { fileName, fileExtension } = getFileNameAndExtension(fileNameWithExt);
  const pathToFile = path.join(pathToFolder, fileNameWithExt);
  const fileSizeInBytes = await getFileSizeInBytes(pathToFile);
  const fileInfoStr = `${fileName} - ${fileExtension} - ${fileSizeInBytes}b`;
  return fileInfoStr;
};

const getFilesInfoInFolder = async (pathToFolder) => {
  try {
    const files = await readdir(pathToFolder, { withFileTypes: true });
    for (const file of files) {
      if (file.isFile()) {
        const fileNameWithExt = file.name;
        const fileInfoStr = await getFileInfo(pathToFolder, fileNameWithExt);
        console.log(fileInfoStr);
      }
    }
  } catch (err) {
    console.log(err.message);
  }
};

getFilesInfoInFolder(folderToCheckPath);
