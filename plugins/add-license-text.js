const fs = require('fs');
const path = require('path');

class AddLicenseTextPlugin {
  apply(compiler) {
    compiler.hooks.emit.tap('AddLicenseTextPlugin', (compilation) => {
      for (let name in compilation.assets) {
        if (name.endsWith('LICENSE.txt')) {
          delete compilation.assets[name];
        }
      }
      const ext = process.env.NODE_ENV === 'production' ? '.min.js' : '.js';
      const filePath = `../packed/dist/dynamic-redux-modules${ext}`;
      fs.readFile(path.join(__dirname, '../LICENSE'), 'utf8', (err, license) => {
        fs.readFile(path.join(__dirname, filePath), 'utf8', (err, bundle) => {
            fs.writeFile(path.join(__dirname, filePath), `/** \n${license}\n**/ \n ${bundle.replace('/*! For license information please see dynamic-redux-modules.js.LICENSE.txt */', '')}`, (err, data) => {});
        })
      });
    });
  }
}

module.exports = AddLicenseTextPlugin;
