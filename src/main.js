import FileStorage from './fileStorage.js'

import { assert, expect } from 'chai'
import { mocha, describe, it } from 'mocha'
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

describe('FileStorage.initFileSystem()', function () {
  it('Must not throw an exception', function () {
    expect(() => { FileStorage.initFileSystem() }).to.not.throw()
    // .and.to.not.be.null()
  })

  it('Return a class instance of FileStorage', function () {
    const fs = FileStorage.initFileSystem()
    console.log(fs)
    expect(fs).to.not.be.null
      .and.to.have.property('format').that.is.a('function')
  })

  it('fail', function () {
    assert.fail('custom error message')
  })
})

// mocha.checkLeaks()
mocha.run()

// vim: set backupcopy=yes :
