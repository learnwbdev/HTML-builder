const { createReadStream } = require('node:fs');
const fs = require('node:fs/promises');
const path = require('node:path');

const createFolder = async (folderPath) => {
  await fs.mkdir(folderPath, { recursive: true });
};

const emptyFolder = async (folderPath) => {
  const filesInFolder = await fs.readdir(folderPath, {
    withFileTypes: true,
  });
  for (const file of filesInFolder) {
    const fullPath = path.join(folderPath, file.name);
    if (file.isFile()) {
      await fs.unlink(fullPath);
    } else if (file.isDirectory()) {
      await emptyFolder(fullPath);
      await fs.rmdir(fullPath);
    }
  }
};

const copyFilesToFolder = async (srcFolderPath, destFolderPath) => {
  const filesInSrcFolder = await fs.readdir(srcFolderPath, {
    withFileTypes: true,
  });
  for (const fileToCopy of filesInSrcFolder) {
    const srcFullPath = path.join(srcFolderPath, fileToCopy.name);
    const destFullPath = path.join(destFolderPath, fileToCopy.name);
    if (fileToCopy.isFile()) {
      await fs.copyFile(srcFullPath, destFullPath);
    } else if (fileToCopy.isDirectory()) {
      await createFolder(destFullPath);
      await copyFilesToFolder(srcFullPath, destFullPath);
    }
  }
};

const copyFolderWithFiles = async (srcFolderPath, destFolderPath) => {
  await createFolder(destFolderPath);
  await emptyFolder(destFolderPath);
  await copyFilesToFolder(srcFolderPath, destFolderPath);
};

const isStyleFile = (fileName, styleExtension) => {
  return path.extname(fileName) === styleExtension;
};

const createEmptyBundleStyleFile = async (fullFilePath) => {
  await fs.writeFile(fullFilePath, '');
};

const getStyleFileNamesListSorted = async (stylesFolder, styleExtension) => {
  const filesInStylesFolder = await fs.readdir(stylesFolder, {
    withFileTypes: true,
  });
  const styleFileList = filesInStylesFolder.filter((file) => {
    return file.isFile() && isStyleFile(file.name, styleExtension);
  });
  const styleFileNamesList = styleFileList.map((file) => file.name);
  const styleFileNamesListSorted = styleFileNamesList.sort();

  return styleFileNamesListSorted;
};

const writeOneStyleFile = async (styleFullFilePath, bundleFullFilePath) => {
  const readStreamStyleFile = createReadStream(styleFullFilePath, {
    encoding: 'utf8',
  });
  readStreamStyleFile.on('data', async (dataChunk) => {
    await fs.appendFile(bundleFullFilePath, dataChunk);
  });
};

const createBundle = async (
  styleFolderPath,
  bundleFilePath,
  { styleExtension = '.css' } = {},
) => {
  await createEmptyBundleStyleFile(bundleFilePath);
  const styleFileNamesList = await getStyleFileNamesListSorted(
    styleFolderPath,
    styleExtension,
  );
  for (const styleFileName of styleFileNamesList) {
    const styleFilePath = path.join(styleFolderPath, styleFileName);
    await writeOneStyleFile(styleFilePath, bundleFilePath);
  }
};

const createEmptyHtmlFile = async (fullFilePath) => {
  await fs.writeFile(fullFilePath, '');
};

const readTemplateHtml = async (templateFilePath) => {
  try {
    const templateData = await fs.readFile(templateFilePath, {
      encoding: 'utf8',
    });
    return templateData;
  } catch (err) {
    console.log(err);
  }
};

const findTemplateTags = (templateData) => {
  const openTag = '{{';
  const closeTag = '}}';
  const templateDataArray = [];
  let nextTemplatePart = templateData;
  let indexOpenTag = nextTemplatePart.indexOf(openTag);
  while (indexOpenTag !== -1) {
    let currTemplatePart = nextTemplatePart.substring(0, indexOpenTag);
    templateDataArray.push({ data: currTemplatePart, isTag: false });
    nextTemplatePart = nextTemplatePart.substring(
      indexOpenTag + openTag.length,
    );
    let indexCloseTag = nextTemplatePart.indexOf(closeTag);
    let currTagName = nextTemplatePart.substring(0, indexCloseTag);
    templateDataArray.push({ data: currTagName, isTag: true });
    nextTemplatePart = nextTemplatePart.substring(
      indexCloseTag + closeTag.length,
    );
    indexOpenTag = nextTemplatePart.indexOf(openTag);
  }
  templateDataArray.push({ data: nextTemplatePart, isTag: false });
  return templateDataArray;
};

const getHtmlComponentData = async (
  tagName,
  componentFolderPath,
  componentExtension,
) => {
  const componentFileName = `${tagName}${componentExtension}`;
  const componentFilePath = path.join(componentFolderPath, componentFileName);
  const fileData = await fs.readFile(componentFilePath, {
    encoding: 'utf8',
  });
  return fileData;
};

const replaceTemplateTags = async (
  templateDataArray,
  htmlFilePath,
  componentFolderPath,
  componentExtension,
) => {
  for (const dataPart of templateDataArray) {
    if (dataPart.isTag) {
      const tagName = dataPart.data;
      const componentData = await getHtmlComponentData(
        tagName,
        componentFolderPath,
        componentExtension,
      );
      await fs.appendFile(htmlFilePath, componentData);
    } else {
      await fs.appendFile(htmlFilePath, dataPart.data);
    }
  }
};

const buildPage = async (
  srcFolder,
  distFolder,
  {
    styleExtension = '.css',
    srcAssetFolderName = 'assets',
    distAssetFolderName = 'assets',
    srcStyleFolderName = 'styles',
    distStyleFileName = 'style.css',
    templateHtmlFileName = 'template.html',
    distHtmlFileName = 'index.html',
    componentExtension = '.html',
    componentFolderName = 'components',
  } = {},
) => {
  const srcAssetFolderPath = path.join(srcFolder, srcAssetFolderName);
  const distAssetFolderPath = path.join(distFolder, distAssetFolderName);
  const srcStyleFolderPath = path.join(srcFolder, srcStyleFolderName);
  const distStyleFilePath = path.join(distFolder, distStyleFileName);
  const templateHtmlFilePath = path.join(srcFolder, templateHtmlFileName);
  const distHtmlFilePath = path.join(distFolder, distHtmlFileName);
  const componentFolderPath = path.join(srcFolder, componentFolderName);
  await createFolder(distFolder);
  await copyFolderWithFiles(srcAssetFolderPath, distAssetFolderPath);
  await createBundle(srcStyleFolderPath, distStyleFilePath, { styleExtension });

  await createEmptyHtmlFile(distHtmlFilePath);
  const templateData = await readTemplateHtml(templateHtmlFilePath);
  const templateDataArray = findTemplateTags(templateData);
  await replaceTemplateTags(
    templateDataArray,
    distHtmlFilePath,
    componentFolderPath,
    componentExtension,
  );
};

const srcFolderPath = __dirname;
const distFolderName = 'project-dist';
const distFolderPath = path.join(__dirname, distFolderName);

buildPage(srcFolderPath, distFolderPath, {
  styleExtension: '.css',
});
