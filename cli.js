#!/usr/bin/env node

let fs = require('fs');
let path = require('path');
let aws = require('aws-sdk');
let argv = require('minimist')(process.argv.slice(2));
let JSZip = require('jszip');

let FileUtils = require('./fileUtils');

let log = (str) => {
  process.stdout.write(str);
};


/**
 * Provides CLI commands
 */
class CLI {
  /**
   * checks the right conv
   */
  constructor() {
    // parse the configuration object from local config
    let env = (process.env.NODE_ENV==='production')?'production':'development';
    this.config =
      require(process.cwd() + '/local.cloudhopper.config.json')[env];
    let configArr = this.config.lambdaArn.split(':');
    if (configArr.length > 9) {
      console.log('That lambdaArn is longer than usual.');
      process.exit(1);
    }
    this.config.region = configArr[3];
    this.config.lambdaName = configArr[6];
    if(configArr.length === 8)
      this.config.lambdaName = configArr[6] + ':' + configArr[7];
  }

  /**
   * run as a local express application
   */
  runLocal() {
    process.env.NODE_ENV = 'local';
    this.config =
      require(process.cwd() + '/local.cloudhopper.config.json')['local'];
    for (let i in this.config.stageVariables) {
      if (this.config.stageVariables.hasOwnProperty(i)) {
        process.env[i] = this.config.stageVariables[i];
      }
    }
    let appHandler = require(path.join(process.cwd(), 'index.js'));
    let express = require('express');
    let app = express();
    let bodyParser = require('body-parser');
    app.use(bodyParser.text({type: '*/*'}));
    app.use(function(req, res) {
      appHandler.handler(req, {}, function(err, data) {
        res
          .status(data.statusCode)
          .set(data.headers)
          .send(data.body);
      });
    });
    app.listen(3000, function() {
      console.log('Example app listening on port 3000!');
    })
    ;
  }


  /**
   * Run as a command locally
   * @param {Array<string>} args The name of function to execute
   */
  execLocal(args) {
    global.isCommand = true;
    process.env.NODE_ENV = process.env.NODE_ENV || 'production';
    console.log('ENV SET TO: ', process.env.NODE_ENV);
    require(process.cwd() + '/index.js').handler(args);
  }

  /**
   * upload the deployment package
   */
  deploy() {
    let fu = new FileUtils();
    fu.setIgnoreFile('.gitignore');
    fu.setIgnoredModules(['aws-sdk']);
    let afterZip = () => {
      let lambda= new aws.Lambda({
        region: this.config.region,
      });
      let s3= new aws.S3({
        region: this.config.region,
      });
      let fileStream = fs.createReadStream(this.config.tempFile);
      fileStream.on('open', function(self) {
        return function() {
          s3.putObject({
            Bucket: 'vdocipher',
            Key: 'clipstat.temp.zip',
            ACL: 'public-read',
            Body: fileStream,
          }).promise()
          .then((data) => {
            console.log(data);
            let params = {
              FunctionName: self.config.lambdaName,
              // ZipFile: fs.readFileSync(self.config.tempFile),
              S3Bucket: 'vdocipher',
              S3Key: 'clipstat.temp.zip',
            };
            return lambda.updateFunctionCode(params).promise();
          })
          .then((data) => {
            console.log(data);
            return lambda.updateFunctionConfiguration({
              FunctionName: self.config.lambdaName,
              Environment: {
                Variables: self.config.stageVariables,
              },
            }).promise();
          })
          .then((data) => {
            console.log(data);
          })
          .catch(console.log);
        };
      }(this));
    };
    fu.includeDependenciesFiles(process.cwd(), true)
      .then((files) => {
        console.log('obtained list of files ', files.length);
        let zip = new JSZip();
        for (let i = 0; i < files.length; i ++) {
          zip.file(
            files[i].replace(process.cwd(), ''),
            fs.readFileSync(files[i])
          );
        }
        console.log('done..');
        zip
          .generateNodeStream({
            type: 'nodebuffer',
            streamFiles: true,
            compression: 'DEFLATE',
            compressionOptions: {
              level: 9,
            },
          })
          .pipe(fs.createWriteStream(this.config.tempFile))
          .on('finish', () => {
            console.log('zip file created');
            afterZip();
          });
      });
  }


  /**
   * Returns a swagger file
   * @return {string} a json string for swagger file
   */
  getSwag() {
    let swag = require('sampleyaml/proxy.json');
    return swag;
  }

  /**
   * Create a new API Gateway in the region
   * 1. upload the swag file to API_G
   * 2. create a new deployment to specified stage
   * 3. check if lambda policy has permission for it
   * 4. set up the policy permission on lambda
   */
  setUpApi() {
    log('API creating...\t\t');
    let apigateway = new aws.APIGateway({
      region: this.config.region,
    });
    apigateway.putRestApi({
      restApiId: this.config.restApiId,
      body: new Buffer(JSON.stringify(this.getSwag())),
      mode: 'overwrite',
    }).promise().then((data) => {
      log('done\n');
      return;
    }).then(() => {
      log('API deployment...\t\t');
      return apigateway.createDeployment({
        restApiId: this.config.restApiId,
        stageName: this.config.stageName,
        cacheClusterEnabled: false,
        variables: this.config.stageVariables,
      }).promise();
    }).then((data) => {
      log('done\n');
      log(`URL: https://${this.config.restApiId}.execute-api.us-east-1.amazonaws.com/${this.config.stageName}\n`);
      log('setting up permissions on lambda....');
      // TODO: set up correct permissions on lambda function
      let lambda= new aws.Lambda({
        region: this.config.region,
      });
      let params = {
        FunctionName: this.config.lambdaName,
      };
      return lambda.getPolicy(params).promise();
    }).then((policy) => {
      console.log(policy);
      if (policy === null) {
        console.log('but policy was null');
      }
      // TODO let existingPolicy = JSON.parse(policy.Policy);
    }).catch(console.log);
  }


  /**
   * Print a help block
   */
  help() {
    let helpText = `
    Usage: 
      npm run cloudhopper -- COMMAND

    COMMAND can be one of:
    1. setUpApi: overwrites the API Gateway to route all
        data to lambda running cloudhopper
    2. deploy: Creates a lambda deployment package and uploads it to lambda
    3. runLocal: Prepares an express server and servers the API locally
    4. help: displays this help text
    `;
    console.log(helpText);
  }
}


let c = new CLI();
let f = c[argv._[0]];

f || c.help();
f && f.bind(c)(argv);
