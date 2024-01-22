const { createReadStream } = require('node:fs');
const fs = require('node:fs/promises');
const path = require('node:path');

const outputFileName = 'bundle.css';
const folderDistName = 'project-dist';
const folderDistPath = path.join(__dirname, folderDistName);
const outputFilePath = path.join(folderDistPath, outputFileName);
const styleFolderName = 'styles';
const styleFolderPath = path.join(__dirname, styleFolderName);
const styleFileExtension = '.css';

const isStyleFile = (fileName) => {
  return path.extname(fileName) === styleFileExtension;
};

const getStyleFileNamesListSorted = async (stylesFolder) => {
  const filesInStylesFolder = await fs.readdir(stylesFolder, {
    withFileTypes: true,
  });
  const styleFileList = filesInStylesFolder.filter((file) => {
    return file.isFile() && isStyleFile(file.name);
  });
  const styleFileNamesList = styleFileList.map((file) => file.name);
  const styleFileNamesListSorted = styleFileNamesList.sort();

  return styleFileNamesListSorted;
};

const createEmptyBundleStyleFile = async (fullFilePath) => {
  await fs.writeFile(fullFilePath, '');
};

const writeOneStyleFile = async (styleFullFilePath, bundleFullFilePath) => {
  const readStreamStyleFile = createReadStream(styleFullFilePath, {
    encoding: 'utf8',
  });
  readStreamStyleFile.on('data', async (dataChunk) => {
    await fs.appendFile(bundleFullFilePath, dataChunk);
  });
};

const createBundle = async (styleFolderPath, bundleFilePath) => {
  await createEmptyBundleStyleFile(bundleFilePath);
  const styleFileNamesList = await getStyleFileNamesListSorted(styleFolderPath);
  for (const styleFileName of styleFileNamesList) {
    const styleFilePath = path.join(styleFolderPath, styleFileName);
    await writeOneStyleFile(styleFilePath, bundleFilePath);
  }
};

createBundle(styleFolderPath, outputFilePath);
