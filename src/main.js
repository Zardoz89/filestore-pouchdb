import FileStorage from './fileStorage.js'

import { expect, assert, use } from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { mocha, describe, it, before, after, afterEach } from 'mocha'
import { step, xstep } from 'mocha-steps'

use(chaiAsPromised)

mocha.setup('bdd')

let fss = {
  populated: null,
  populated2: null,
  empty: null
}

before(async function () {
  this.timeout(5000)
  const fssPromises = []
  for (const fs in fss) {
    fssPromises.push(FileStorage.initFileSystem(`filesystem_${fs}`))
  }
  await Promise.all(fssPromises)
    .then((fssArray => {
      const fssObject = {}
      for (let i = 0; i < fssArray.length; i++) {
        const key = Object.keys(fss)[i]
        fssObject[key] = fssArray[i]
      }
      fss = fssObject
      return fss
    }))

  await fss.populated.addFile(new FileStorage.File('prueba0.txt', 'texto prueba 0', '', 'hola mundo'))
  await fss.populated.mkDir('dir1')
  await fss.populated.mkDir('dir2')
  await fss.populated.mkDir('dir1/subdir1')
  await fss.populated.mkDir('dir1/subdir2')
  await fss.populated.addFile(new FileStorage.File('dir1/subdir2/prueba1.txt', 'texto prueba 1', '', 'hola mundo2'))
  await fss.populated.addFile(new FileStorage.File('dir1/subdir2/prueba2.txt', 'texto prueba 2', '', 'hola mundo3'))
  await fss.populated.addFile(new FileStorage.File('dir1/subdir1/prueba3.txt', 'texto prueba 3', '', 'hola mundo4'))

  await fss.populated2.addFile(new FileStorage.File('prueba0.txt', 'texto prueba 0', '', 'hola mundo'))
  await fss.populated2.mkDir('dir1')
  await fss.populated2.mkDir('dir2')
  await fss.populated2.mkDir('dir1/subdir1')
  await fss.populated2.mkDir('dir1/subdir2')
  await fss.populated2.addFile(new FileStorage.File('dir1/subdir2/prueba1.txt', 'texto prueba 1', '', 'hola mundo2'))
  await fss.populated2.addFile(new FileStorage.File('dir1/subdir2/prueba2.txt', 'texto prueba 2', '', 'hola mundo3'))
  await fss.populated2.addFile(new FileStorage.File('dir1/subdir1/prueba3.txt', 'texto prueba 3', '', 'hola mundo4'))
})

after(async function () {
  const fssPromises = []
  for (const fs in fss) {
    fssPromises.push(fss[fs].unwrap().destroy())
  }
  await Promise.all(fssPromises)
})

describe('FileStorage', function () {
  this.slow(200)

  describe('#initFileSystem()', function () {
    this.slow(1000)

    step('To return a FileStorage instance', async function () {
      const fs = await FileStorage.initFileSystem()
      expect(fs).to.have.property('format').that.is.a('function')
      expect(fs).to.have.property('unwrap').that.is.a('function')

      await fs.unwrap().destroy()
    })
  })

  describe('#addFile()', function () {
    after(async function () {
      await fss.empty.format()
    })

    step('When we add a file to a empty file storage, it should add the file object witchout throwing an exception', (done) => {
      expect(() => {
        fss.empty.addFile(new FileStorage.File('prueba0.txt', 'texto prueba 0', '', 'hola mundo'))
          .then(result => {
            done()
          })
      }).to.not.throw()
    })

    step('When we add a file to a empty file storage, we must can retrive it', async function () {
      const hash = await fss.empty.addFile(new FileStorage.File('prueba1.txt', 'texto prueba 1', '', 'hola mundo'))
      const file = await fss.empty.getFileFromHash(hash)

      expect(file).to.not.be.null
      expect(file).to.have.property('path', 'prueba1.txt')
      expect(file).to.have.property('logicalName', 'texto prueba 1')
    })

    step('When we add file with the same hash and without overwrite enabled, it must fail', async function () {
      await fss.empty.addFile(new FileStorage.File('prueba0.txt', 'texto prueba 0', '', 'adios mundo'))
        .then(result => assert.fail('addFile must fail when try to overwrite the file without the flag.'),
          err => {
            expect(err).to.be.instanceof(FileStorage.FileWithSameHashExists)
          })
    })

    step('When we add file with the same path and without overwrite enabled, it must fail', async function () {
      await fss.populated.addFile(new FileStorage.File('dir1/subdir2/prueba1.txt', 'texto prueba 0x0', '', 'adios mundo'))
        .then(result => assert.fail('addFile must fail when try to overwrite the file without the flag.'),
          err => {
            expect(err).to.be.instanceof(FileStorage.FileWithSamePath)
          })
    })

    step('When we add file with overwrite, it must replace the old file with the hash', async function () {
      const hash = await fss.empty.addFile(new FileStorage.File('prueba0bis.txt', 'texto prueba 0', '', 'adios mundo'),
        { overwrite: true })
      const file = await fss.empty.getFileFromHash(hash)
      expect(file).to.not.be.null
      expect(file).to.have.property('path', 'prueba0bis.txt')
      expect(file).to.have.property('logicalName', 'texto prueba 0')
    })

    step('When we add file with overwrite, it must replace the old file with the same path', async function () {
      const hash = await fss.populated.addFile(new FileStorage.File('dir1/subdir2/prueba1.txt', 'texto prueba 0', '', 'adios mundo'),
        { overwrite: true })
      const file = await fss.populated.getFileFromHash(hash)
      expect(file).to.not.be.null
      expect(file).to.have.property('path', 'dir1/subdir2/prueba1.txt')
      expect(file).to.have.property('logicalName', 'texto prueba 0')
      expect(file).to.have.property('blob', 'adios mundo')
    })
  })

  describe('#delete()', function () {
    xstep('Deleting an existing file, must return true', async function () {
      await expect(fss.populated.delete('dir1/subdir2/prueba1.txt'))
        .to.eventually.equal(true)

      await expect(fss.property.getFile('dir1/subdir2/prueba1.txt'))
        .to.be.rejectedWith(FileStorage.FileNotFoundError)
    })

    xstep('Deleting an non existing file, must return false', async function () {
      await expect(fss.populated.delete('missigno/subdir2/prueba1.txt'))
        .to.eventually.equal(false)
    })
  })

  describe('#mkDir()', function () {
    after(async function () {
      await fss.empty.format()
    })

    step('Creating a dir, generates a special file without data', () => {
      return fss.empty.mkDir('dir1')
        .then(result => {
          return fss.empty.getFile('dir1')
        })
        .then(file => {
          expect(file).to.not.be.null
          expect(file).to.have.property('path', 'dir1')
          expect(file).to.have.property('logicalName', 'dir1')
          expect(file).to.have.property('blob', null)
        })
    })

    xstep('Creating a subdir, requieres a father directory', () => {
      return fss.empty.mkDir('dir2')
        .then(result => {
          return fss.empty.mkDir('dir2/subdir')
        })
        .then(result => {
          return fss.empty.getFile('dir2/subdir')
        })
        .then(file => {
          expect(file).to.not.be.null
          expect(file).to.have.property('path', 'dir2/subdir')
          expect(file).to.have.property('logicalName', 'subdir')
          expect(file).to.have.property('blob', null)

          return fss.empty.mkDir('missigno/subdir2')
        })
        .then(result => assert.fail('mkDir must fail when try to create a subdirectory.'),
          err => {
            // TODO Return a proper error and not PouchDb error object
            console.trace(err)
            expect(err).to.have.property('name', 'conflict')
          })
    })
  })

  describe('#rmDir()', function () {
    xstep("Deleting an empty directory doesn't fail", function () {
      return fss.empty.rmDir('dir2')
    })

    xstep('Deleting an not existing directory fails', function () {
      return fss.empty.rmDir('dir2')
        .then(result => assert.fail('rmDir must fail when try to delete a not existing directory.'),
          err => {
            // TODO Return a proper error and not PouchDb error object
            console.trace(err)
            expect(err).to.have.property('name', 'conflict')
          })
    })

    xstep('Deleting an not empty directory fails', function () {
      return fss.empty.rmDir('dir1')
        .then(result => assert.fail('rmDir must fail when try to delete a not empty directory.'),
          err => {
            // TODO Return a proper error and not PouchDb error object
            console.trace(err)
            expect(err).to.have.property('name', 'conflict')
          })
    })

    xstep('Deleting a whole directory structure with recursive', function () {
      return fss.empty.rmDir('dir1', { recursive: true })
    })
  })

  describe('#getFileFromHash()', function () {
    step('Searching an existing file by hash, must return it', async function () {
      const file1 = await fss.populated2.getFileFromHash('texto prueba 0')
      expect(file1).to.not.be.null
      expect(file1).to.have.property('path', 'prueba0.txt')
      expect(file1).to.have.property('logicalName', 'texto prueba 0')

      const file2 = await fss.populated2.getFileFromHash('texto prueba 1')
      expect(file2).to.not.be.null
      expect(file2).to.have.property('path', 'dir1/subdir2/prueba1.txt')
      expect(file2).to.have.property('logicalName', 'texto prueba 1')
    })

    step('Searching a not existing file by hash, must fail', async function () {
      await fss.populated2.getFileFromHash('texto prueba missgno')
        .then(result => assert.fail('getFileFromHash must fail when try to get a not existing file.'),
          err => {
            expect(err).to.be.instanceof(FileStorage.FileNotFoundError)
          })
    })
  })

  describe('#getFile()', function () {
    step('Searching an existing file by path, must return it', async function () {
      const file1 = await fss.populated2.getFile('prueba0.txt')
      expect(file1).to.not.be.null
      expect(file1).to.have.property('path', 'prueba0.txt')
      expect(file1).to.have.property('logicalName', 'texto prueba 0')

      const file2 = await fss.populated2.getFile('dir1/subdir2/prueba1.txt')
      expect(file2).to.not.be.null
      expect(file2).to.have.property('path', 'dir1/subdir2/prueba1.txt')
      expect(file2).to.have.property('logicalName', 'texto prueba 1')
    })

    step('Searching a not existing file by path, must fail', async function () {
      await fss.populated2.getFile('missgno.txt')
        .then(result => assert.fail('getFile must fail when try to get a not existing file.'),
          err => {
            expect(err).to.be.instanceof(FileStorage.FileNotFoundError)
          })
    })
  })

  describe('#listAllFiles()', function () {
    this.slow(500)

    it('Must return all files stored, showing the hierarchy', function () {
      return fss.populated2.listAllFiles()
        .then(files => {
          expect(files).to.not.be.null
          expect(files).to.have.lengthOf(8)
          const paths = files.map(file => file.path)
          console.log('paths', paths)
          expect(paths).to.have.ordered.members([
            'dir1',
            'dir1/subdir1',
            'dir1/subdir1/prueba3.txt',
            'dir1/subdir2',
            'dir1/subdir2/prueba1.txt',
            'dir1/subdir2/prueba2.txt',
            'dir2',
            'prueba0.txt'
          ])
        })
    })
  })
})

// mocha.checkLeaks()
mocha.run()

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

// vim: set backupcopy=yes :
