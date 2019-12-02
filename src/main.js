import FileStorage from './fileStorage.js'

import { assert, expect } from 'chai'
import { mocha, describe, beforeEach, afterEach } from 'mocha'
import { step } from 'mocha-steps'
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
}, 1000)
*/
mocha.setup('bdd')

describe('FileStorage.initFileSystem()', () => {
  let fs = null

  afterEach(() => {
    if (fs !== null) {
      return fs.unwrap().destroy()
    }
    // .then(result => assert(1 === 1))
    // .catch(err => assert.fail(`Error destroying database : ${err}`))
  })

  step('Must not throw an exception', () => {
    expect(() => { fs = FileStorage.initFileSystem() }).to.not.throw()
  })

  step('Return a class instance of FileStorage', () => {
    fs = FileStorage.initFileSystem()
    console.log(fs)
    expect(fs).to.not.be.null
    expect(fs).to.have.property('format').that.is.a('function')
    expect(fs).to.have.property('unwrap').that.is.a('function')
  })
})

describe('FileStorage.addFile()', function () {
  let fs = null

  beforeEach(function () {
    fs = FileStorage.initFileSystem()
  })

  afterEach(() => {
    if (fs !== null) {
      return fs.unwrap().destroy()
    }
  })

  step('Return a succesfull promise on a empty FileStorage', (done) => {
    fs.addFile(new FileStorage.File('prueba0.txt', 'texto prueba 0', '', 'hola mundo'))
      .then(result => {
        return fs.getFile('prueba0.txt')
      })
      .then(file => {
        expect(file).to.not.be.null
        expect(file).to.have.property('path', 'prueba0.txt')

        done()
      })
  })
})

// mocha.checkLeaks()
mocha.run()

// vim: set backupcopy=yes :
