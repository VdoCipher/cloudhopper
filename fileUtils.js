let fs = require('fs');
let path = require('path');

let wildcard = require('wildcard');
let bluebird = require('bluebird');
bluebird.promisifyAll(fs);

/**
 * Fileutils provides utilities for doing file/folder listing
 * adding all files in directory excluding ignored files and parsing
 * inside the directories by following package.json dependencies
 * The package dependencies can either be in the top level of node_modules
 * folder or it can be in a nested node_modules. The reason is that
 * if directly installed version is different from the one required, then
 * it choses to install the required version right inside the
 * current module.
 */
class FileUtils {


  /**
   * Configure the ignored list
   * @param {string} ignoreListFile A gitignore file to ignore
   */
  setIgnoreFile(ignoreListFile) {
    let ignored = fs.readFileSync('.gitignore').toString().split('\n');
    // ignore comments from the ignore list
    ignored = ignored.filter(
      (l) => (l !== '' && l.trim().substr(0, 1) !== '#')
    );
    this.ignored = ignored;
  }


  /**
   * set the value of modules which will be ignored from package deployment
   * @param {Array<string>} tobeIgnoredModules Array of string of names of
   * modules which will not be in zip file
   */
  setIgnoredModules(tobeIgnoredModules) {
    this.tobeIgnoredModules = tobeIgnoredModules;
  }


  /**
   * get array of all files in a directory excluding ignore list
   * and ignoring the dot files:
   * @param {string} baseDir The base directory for which all files
   *    are required
   * @param {boolean} Ignore should you exclude ignore list here
   * @return {Promise<Array<string>>} promise to return an array of file paths
   */
  getAllFiles(baseDir, Ignore) {
    return fs.readdirAsync(baseDir)
      .then((files) => Promise.all(files

        // ignore the dot file
        .filter((f) => f.substr(0, 1) !== '.')

        // ignore the dot file
        .filter((f) => f !== 'node_modules')

        // ignore file in ignore list if 2nd arg is true
        .filter(
          (f) => this.ignored.reduce(
            (a, b) => !Ignore || (a && !wildcard(b, f)),
            true
          )
        )
        // add relative pathname
        .map((f) => path.join(baseDir, f))

        // add files to list and exclude directory
        .map((f) => fs.statAsync(f)
          .then((stat) => {
            if(stat.isDirectory())
              return this.getAllFiles(f);
            else if (stat.isFile())
              return f;
          })
        )
      ))
      .then((files) => [].concat(...files));
  }

  /**
   * Include all dependencies of a p
   * @param {string} baseDir The base directory for which all files
   *    are required
   * @param {boolean} ignore should you exclude ignore list here
   * @return {Promise<Array<string>>} promise to return an array of file paths
   */
  includeDependenciesFiles(baseDir, ignore) {
    let currDirFiles;
    return this.getAllFiles(baseDir, ignore)
      .then((files) => {
        currDirFiles = files;
        let b = require(path.join(baseDir, 'package.json')).dependencies;
        return Object.keys(b || {});
      })
      .then((modules) =>
        modules.filter((m) => this.tobeIgnoredModules.indexOf(m) === -1)
      )
      .then((modules) => {
        let moduleFilesPromise = Promise.all(
          modules.map(
            (module) => {
              let nextPath = path.join(baseDir, 'node_modules', module);
              if (!fs.existsSync(nextPath)) {
                nextPath = path.join(process.cwd(), 'node_modules', module);
              }
              return this.includeDependenciesFiles(nextPath, false);
            }
          )
        );
        let nextReturn = currDirFiles.concat(
          moduleFilesPromise
        );
        return Promise.all(nextReturn);
      })
      .then((files) => {
        let combined = [].concat(...files);
        return combined.reduce((a, b) => {
          return a.concat(b);
        }, []);
      });
  }
}

module.exports = FileUtils;


/**
 * Documentation for using this:
 * =============================


    let fu = new FileUtils();
    fu.setIgnoreFile('.gitignore');

    let zip = new JSZip();
    fu.includeDependenciesFiles(process.cwd(), true)
      .then((currDirFiles)=> {
        console.log(currDirFiles);
        currDirFiles.forEach((f) => {
          zip.file(f.replace(process.cwd(), ''), fs.readFileSync(f));
        });
        console.log('writing to file ');
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
            console.log('Zip created');
          });
      });
	*/
