const Jimp = require('jimp');
const inquirer = require('inquirer');
const { existsSync } = require('fs');

const errorMessage = 'Something went wrong... Try again!';

const addTextWatermarkToImage = async function(inputFile, outputFile, text) {
  try {
    const image = await Jimp.read(inputFile);
    const font = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK);
    const textData = {
      text: text,
      alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
      alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE,
    };
    image.print(font, 0, 0, textData, image.getWidth(), image.getHeight());
    await image.quality(100).writeAsync(outputFile);
  }
  catch(error) {
    console.log(errorMessage)
  }
};

const addImageWatermarkToImage = async function(inputFile, outputFile, watermarkFile) {
  try {
    const image = await Jimp.read(inputFile);
    const watermark = await Jimp.read(watermarkFile);
    const x = image.getWidth() / 2 - watermark.getWidth() / 2
    const y = image.getHeight() / 2 - watermark.getHeight() / 2
  
    image.composite(watermark, x, y, {
      mode: Jimp.BLEND_SOURCE_OVER,
      opacitySource: 0.5,
    });
    await image.quality(100).writeAsync(outputFile);
  }
  catch(error) {
    console.log(errorMessage)
  }
};

const makeImageBrighter = async function(inputFile, brightnessLevel, outputFile) {
  try {
    if(brighnessLevel >= -1 && brighnessLevel <= 1 ){
      const image = await Jimp.read(inputFile);
      image.brightness(brightnessLevel); 
      await image.quality(100).writeAsync(outputFile);
    } else (
      console.log('Chosen wrong brightness level!')
    )
  }
  catch(error){
    console.log(errorMessage)
  }
};

const prepareOutputFilename = fileName => fileName.split('.').map((item, index) => index === 0 ? item + '-with-watermark' : item).join('.');

const startApp = async () => {
  const answer = await inquirer.prompt([{
      name: 'start',
      message: 'Hi! Welcome to "Watermark manager". Copy your image files to `/img` folder. Then you\'ll be able to use them in the app. Are you ready?',
      type: 'confirm'
    }]);

  if(!answer.start) process.exit();

  const inputOptions = await inquirer.prompt([
    {
      name: 'inputImage',
      type: 'input',
      message: 'What file do you want to mark?',
      default: 'test.jpg',
    },
    {
      name: 'additionalChange',
      type: 'confirm',
      message: 'Do you want to modify image before adding watermark?',
    },
  ]);

  if(inputOptions.additionalChange){
    const additionalOptions = await inquirer.prompt([
      {
        name: 'imageModification',
        type: 'list',
        choices: ['Make image brighter.'],
      },
    ]);

    if(additionalOptions.imageModification === 'Make image brighter.') {
      const brightnessLevel = await inquirer.prompt([{
        name: 'value',
        type: 'input',
        message: 'Insert brighness value from -1 to +1:',
      }]);

      inputOptions.brightnessLevel = brightnessLevel.value;
      
      if (existsSync('./img/' + inputOptions.inputImage)){
        makeImageBrighter('./img/' + inputOptions.inputImage, parseFloat(inputOptions.brightnessLevel), './img/' + prepareOutputFilename(inputOptions.inputImage));
      } else {
        console.log('Something went wrong... Try again');
      }
    }

    inputOptions.inputImage = prepareOutputFilename(inputOptions.inputImage);
    
  };
  const options = await inquirer.prompt([
    {
      name: 'watermarkType',
      type: 'list',
      choices: ['Text watermark', 'Image watermark'],
    },

  ]);

  if(options.watermarkType === 'Text watermark') {
    const text = await inquirer.prompt([{
      name: 'value',
      type: 'input',
      message: 'Type your watermark text:',
    }]);
    options.watermarkText = text.value;
    if (existsSync('./img/' + inputOptions.inputImage)){
      addTextWatermarkToImage(
        './img/' + inputOptions.inputImage,
        inputOptions.additionalChange ? './img/' + inputOptions.inputImage : './img/' + prepareOutputFilename(inputOptions.inputImage), 
        options.watermarkText);
    } else {
      console.log('Something went wrong... Try again');
    }
  }
  else {
    const image = await inquirer.prompt([{
      name: 'filename',
      type: 'input',
      message: 'Type your watermark name:',
      default: 'logo.png',
    }]);
    options.watermarkImage = image.filename;
    if (existsSync('./img/' + inputOptions.inputImage) &&
      existsSync('./img/' + options.watermarkImage)
    ){
      addImageWatermarkToImage(
        './img/' + inputOptions.inputImage,
        inputOptions.additionalChange ? './img/' + inputOptions.inputImage : './img/' + prepareOutputFilename(inputOptions.inputImage),
        './img/' + options.watermarkImage);
    } else {
      console.log('Something went wrong... Try again');
    }
  }
}

startApp();