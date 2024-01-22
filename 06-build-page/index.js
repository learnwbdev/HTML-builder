const { createReadStream } = require('node:fs');
const fs = require('node:fs/promises');
const path = require('node:path');
const { EOL } = require('node:os');

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

const readTemplateHtmlByLines = async (templateFilePath) => {
  try {
    const htmlTemplateLinesArray = [];
    const templateFile = await fs.open(templateFilePath);
    for await (const fileLine of templateFile.readLines({ encoding: 'utf8' })) {
      htmlTemplateLinesArray.push(fileLine);
    }
    return htmlTemplateLinesArray;
  } catch (err) {
    console.log(err.message);
  }
};

const getHtmlComponentByLines = async (
  tagName,
  componentFolderPath,
  componentExtension,
) => {
  const componentFileName = `${tagName}${componentExtension}`;
  const componentFilePath = path.join(componentFolderPath, componentFileName);
  const htmlCompLinesArray = [];
  try {
    const componentFile = await fs.open(componentFilePath);
    for await (const fileLine of componentFile.readLines({
      encoding: 'utf8',
    })) {
      htmlCompLinesArray.push(fileLine);
    }
    return htmlCompLinesArray;
  } catch (err) {
    console.log(err.message);
  }
};

const hasTagInLine = (line, tag) => {
  return line.includes(tag);
};

const getTagPosition = (line, tag) => {
  return line.indexOf(tag);
};

const parseHtmlTemplateLine = (
  line,
  openCompTag,
  closeCompTag,
  indentNumSpaces,
) => {
  const hasOpenTag = hasTagInLine(line, openCompTag);
  const hasCloseTag = hasTagInLine(line, closeCompTag);
  const dataToAppend = {
    dataBefore: '',
    tag: '',
    dataAfter: '',
    tagPos: 0,
    isTagClosed: false,
    isAddEOL: false,
  };
  if (hasOpenTag && hasCloseTag) {
    const openTagPos = getTagPosition(line, openCompTag);
    const closeTagPos = getTagPosition(line, closeCompTag);
    const beforeTagPart = line.substring(0, openTagPos);
    const tagPart = line.substring(
      openTagPos + openCompTag.length,
      closeTagPos,
    );
    const afterTagPart = line.substring(closeTagPos + closeCompTag.length);
    dataToAppend.tag = tagPart;
    dataToAppend.dataAfter = afterTagPart;
    dataToAppend.tagPos = line.length - line.trimStart().length;
    dataToAppend.isAddEOL = openTagPos === dataToAppend.tagPos ? false : true;
    dataToAppend.tagPos =
      openTagPos === dataToAppend.tagPos
        ? openTagPos
        : dataToAppend.tagPos + indentNumSpaces;
    dataToAppend.dataBefore = dataToAppend.isAddEOL ? beforeTagPart : '';
    dataToAppend.isTagClosed = true;
  } else if (hasOpenTag) {
    const openTagPos = getTagPosition(line, openCompTag);
    const beforeTagPart = line.substring(0, openTagPos);
    const tagPart = line.substring(openTagPos + openCompTag.length);
    dataToAppend.tag = tagPart;
    dataToAppend.tagPos = line.length - line.trimStart().length;
    dataToAppend.isAddEOL = openTagPos === dataToAppend.tagPos ? false : true;
    dataToAppend.tagPos =
      openTagPos === dataToAppend.tagPos
        ? openTagPos
        : dataToAppend.tagPos + indentNumSpaces;
    dataToAppend.dataBefore = dataToAppend.isAddEOL ? beforeTagPart : '';
  } else if (hasCloseTag) {
    const closeTagPos = getTagPosition(line, closeCompTag);
    const tagPart = line.substring(0, closeTagPos);
    const afterTagPart = line.sunbstring(closeTagPos + closeCompTag.length);
    dataToAppend.tag = tagPart;
    dataToAppend.dataAfter = afterTagPart;
    dataToAppend.isTagClosed = true;
  } else {
    dataToAppend.dataBefore = line;
  }
  return dataToAppend;
};

const addSpaceIndent = (numberOfSpaces) => {
  const whiteSpace = ' ';
  return whiteSpace.repeat(numberOfSpaces);
};

const replaceTagsByContent = async (
  templateFilePath,
  componentFolderPath,
  componentExtension,
  openCompTag,
  closeCompTag,
  indentNumSpaces,
) => {
  const htmlTemplateLines = await readTemplateHtmlByLines(templateFilePath);
  let htmlFileData = '';
  for (const templLine of htmlTemplateLines) {
    let isNextLine = false;
    let currText = templLine;
    let currTagName = '';
    let currTagPos = 0;
    let isCurrTagClosed = true;
    while (!isNextLine) {
      let dataToAppend = parseHtmlTemplateLine(
        currText,
        openCompTag,
        closeCompTag,
        indentNumSpaces,
      );
      if (dataToAppend.tag === '') {
        if (isCurrTagClosed) {
          currTagPos =
            currTagPos === 0 ? currTagPos : currTagPos - indentNumSpaces;
          htmlFileData +=
            addSpaceIndent(currTagPos) + dataToAppend.dataBefore + EOL;
          currTagPos = 0;
        } else {
          currTagName += dataToAppend.dataBefore;
        }
        isNextLine = true;
      } else if (!dataToAppend.isTagClosed) {
        htmlFileData += dataToAppend.dataBefore;
        currTagName += dataToAppend.tag;
        currTagPos = dataToAppend.tagPos;
        isNextLine = true;
      } else {
        htmlFileData += dataToAppend.dataBefore;
        currTagName += dataToAppend.tag;
        currTagPos = currTagPos === 0 ? dataToAppend.tagPos : currTagPos;
        currTagName = currTagName.trim();
        const componentLines = await getHtmlComponentByLines(
          currTagName,
          componentFolderPath,
          componentExtension,
        );
        if (dataToAppend.isAddEOL) {
          htmlFileData += EOL;
        }
        if (typeof componentLines !== 'undefined') {
          for (const compnLine of componentLines) {
            htmlFileData += addSpaceIndent(currTagPos) + compnLine + EOL;
          }
        }
        currTagName = '';
        currText = dataToAppend.dataAfter;
        // to remove EOL for tags, that were on a separate line
        if (currText === '') {
          htmlFileData = htmlFileData.trimEnd();
        }
        isNextLine = false;
      }
    }
  }
  return htmlFileData;
};

const writeDataToHtmlFile = async (
  templateFilePath,
  distHtmlFilePath,
  componentFolderPath,
  componentExtension,
  openCompTag,
  closeCompTag,
  indentNumSpaces,
) => {
  try {
    const htmlFileData = await replaceTagsByContent(
      templateFilePath,
      componentFolderPath,
      componentExtension,
      openCompTag,
      closeCompTag,
      indentNumSpaces,
    );
    await fs.appendFile(distHtmlFilePath, htmlFileData);
  } catch (err) {
    console.log(err.message);
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
    openCompTag = '{{',
    closeCompTag = '}}',
    indentNumSpaces = 2,
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
  await writeDataToHtmlFile(
    templateHtmlFilePath,
    distHtmlFilePath,
    componentFolderPath,
    componentExtension,
    openCompTag,
    closeCompTag,
    indentNumSpaces,
  );
};

const srcFolderPath = __dirname;
const distFolderName = 'project-dist';
const distFolderPath = path.join(__dirname, distFolderName);

buildPage(srcFolderPath, distFolderPath, {
  styleExtension: '.css',
});
