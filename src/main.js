import FileStorage from './fileStorage.js'

import { expect, assert } from 'chai'
import { mocha, describe, beforeEach, afterEach } from 'mocha'
import { step, xstep } from 'mocha-steps'
/*
console.log('Hola')

const fileStorage = FileStorage.initFileSystem()

console.log(fileStorage)

fileStorage.addFile(new FileStorage.File('prueba0.txt', 'texto prueba 0', '', 'hola mundo'))
  .catch(console.error.bind(console))
fileStorage.mkDir('/dir')
  .catch(console.error.bind(console))
fileStorage.addFile(new FileStorage.File('/dir/prueba1.txt', 'texto prueba 1', '', 'hola mundo'))
  .catch(console.error.bind(console))
fileStorage.mkDir('/dir2')
  .catch(console.error.bind(console))
fileStorage.addFile(new FileStorage.File('/dir2/prueba2.txt', 'texto prueba 2', '', 'hola mundo'))
  .catch(console.error.bind(console))
fileStorage.mkDir('/dir/subdir')
  .catch(console.error.bind(console))
fileStorage.addFile(new FileStorage.File('/dir/subdir/prueba2.txt', 'texto prueba 3', '', 'hola mundo'))
  .catch(console.error.bind(console))

fileStorage.listAllFiles()
  .then(files => {
    console.log(files)
  })
  .catch(console.error.bind(console))

fileStorage.getFileFromHash('texto prueba 0')
  .then(file => console.log(file))
  .catch(console.error.bind(console))

fileStorage.getFileFromHash('texto prueba 3')
  .then(file => console.log(file))
  .catch(console.error.bind(console))

fileStorage.getFileFromHash('texto prueba 99')
  .then(file => console.log(file))
  .catch(console.error.bind(console))

fileStorage.getFile('prueba0.txt')
  .then(file => console.log(file))
  .catch(console.error.bind(console))

fileStorage.getFile('dir/prueba1.txt')
  .then(file => console.log(file))
  .catch(console.error.bind(console))

fileStorage.getFile('dir/prueba99.txt')
  .then(file => console.log(file))
  .catch(console.error.bind(console))

// Se hace esto con un timeout para que no lance el error de mutación
setTimeout(function () {
  fileStorage.format()
    .catch(console.error.bind(console))
}, 250)
*/
mocha.setup('bdd')

describe('FileStorage.initFileSystem()', function () {
  let fs = null

  afterEach(function () {
    if (fs !== null) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(fs.unwrap().destroy())
        }, 250)
      })
    }
    // if (fs !== null) {
    //  return fs.unwrap().destroy()
    // }
    // .then(result => assert(1 === 1))
    // .catch(err => assert.fail(`Error destroying database : ${err}`))
  })

  step('Must not throw an exception', () => {
    expect(() => { fs = FileStorage.initFileSystem() }).to.not.throw()
  })

  step('Return a class instance of FileStorage', () => {
    fs = FileStorage.initFileSystem()
    console.trace(fs)
    expect(fs).to.not.be.null
    expect(fs).to.have.property('format').that.is.a('function')
    expect(fs).to.have.property('unwrap').that.is.a('function')
  })
})

describe('FileStorage.addFile()', function () {
  this.slow(200)
  let fs = null

  beforeEach(function () {
    fs = FileStorage.initFileSystem()
  })

  afterEach(function () {
    if (fs !== null) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(fs.unwrap().destroy())
        }, 250)
      })
    }
  })

  step('When we add a file to a empty file storage, it should add the file object witchout throwing an exception', (done) => {
    expect(() => {
      fs.addFile(new FileStorage.File('prueba0.txt', 'texto prueba 0', '', 'hola mundo'))
        .then(result => {
          done()
        })
    }).to.not.throw()
  })

  step('When we add a file to a empty file storage, we should can retrive it', (done) => {
    fs.addFile(new FileStorage.File('prueba0.txt', 'texto prueba 0', '', 'hola mundo'))
      .then(result => {
        return fs.getFile('prueba0.txt')
      })
      .then(file => {
        expect(file).to.not.be.null
        expect(file).to.have.property('path', 'prueba0.txt')
        expect(file).to.have.property('logicalName', 'texto prueba 0')

        done()
      })
  })

  step('When we add file with the same hash and without overwrite enabled, it must fail', (done) => {
    fs.addFile(new FileStorage.File('prueba0.txt', 'texto prueba 0', '', 'hola mundo'))
      .then(result => {
        return fs.getFile('prueba0.txt')
      })
      .then(file => {
        expect(file).to.not.be.null
        fs.addFile(new FileStorage.File('prueba0.txt', 'texto prueba 0', '', 'adios mundo'))
          .then(result => assert.fail('addFile must fail when try to overwrite the file without the flag.'))
          .catch(err => {
            // TODO Return a proper error and not PouchDb error object
            expect(err).to.have.property('name', 'conflict')
            console.trace(err)
          })

        done()
      })
  })

  xstep('When we add file with the same path and without overwrite enabled, it must fail', (done) => {
    fs.addFile(new FileStorage.File('prueba0.txt', 'texto prueba 0', '', 'hola mundo'))
      .then(result => {
        return fs.getFile('prueba0.txt')
      })
      .then(file => {
        expect(file).to.not.be.null
        fs.addFile(new FileStorage.File('/dir1/prueba0.txt', 'texto prueba 0', '', 'adios mundo'))
          .then(result => assert.fail('addFile must fail when try to overwrite the file without the flag.'))
          .catch(err => {
            // TODO Return a proper error and not PouchDb error object
            expect(err).to.have.property('name', 'conflict')
            console.trace(err)
          })

        done()
      })
  })

  xstep('When we add file with overwrite, it must replace the old file with the same path', (done) => {
    fs.addFile(new FileStorage.File('prueba0.txt', 'texto prueba 0', '', 'hola mundo'))
      .then(result => {
        return fs.getFile('prueba0.txt')
      })
      .then(file => {
        expect(file).to.not.be.null
        return fs.addFile(new FileStorage.File('prueba0.txt', 'texto prueba 0 bis', '', 'adios mundo'),
          { overwrite: true })
      })
      .then(result => {
        return fs.getFile('prueba0.txt')
      })
      .then(file => {
        expect(file).to.not.be.null
        expect(file).to.have.property('path', 'prueba0.txt')
        expect(file).to.have.property('logicalName', 'texto prueba 0 bis')

        done()
      })
  })
})

describe('FileStorage.mkDir()', function () {
  this.slow(200)
  let fs = null

  beforeEach(function () {
    fs = FileStorage.initFileSystem()
  })

  afterEach(function () {
    if (fs !== null) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(fs.unwrap().destroy())
        }, 250)
      })
    }
  })

  step('Creating a dir, generates a special file without data', (done) => {
    fs.mkDir('dir1')
      .then(result => {
        return fs.getFile('dir1')
      })
      .then(file => {
        expect(file).to.not.be.null
        expect(file).to.have.property('path', 'dir1')
        expect(file).to.have.property('logicalName', 'dir1')
        expect(file).to.have.property('blob', null)

        done()
      })
  })

  // TODO
  xstep('Creating a subdir, requieres a father directory', (done) => {
    fs.mkDir('dir1')
      .then(result => {
        return fs.getFile('dir1')
      })
      .then(file => {
        expect(file).to.not.be.null
        expect(file).to.have.property('path', 'dir1')
        expect(file).to.have.property('logicalName', 'dir1')
        expect(file).to.have.property('blob', null)

        done()
      })
  })
})

// mocha.checkLeaks()
mocha.run()

// vim: set backupcopy=yes :
