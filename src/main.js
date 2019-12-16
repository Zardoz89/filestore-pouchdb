import FileStorage from './fileStorage.js'

import { expect, assert, use } from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { mocha, describe, it, before, after } from 'mocha'
import { step } from 'mocha-steps'

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

  await fss.populated.addFile(new FileStorage.File('prueba0.txt', 'texto prueba 0', 'text/plain', window.btoa('hola mundo')))
  await fss.populated.mkDir('dir1')
  await fss.populated.mkDir('dir2')
  await fss.populated.mkDir('dir1/subdir1')
  await fss.populated.mkDir('dir1/subdir2')
  await fss.populated.addFile(new FileStorage.File('dir1/subdir2/prueba1.txt', 'texto prueba 1', 'text/plain', window.btoa('hola mundo2')))
  await fss.populated.addFile(new FileStorage.File('dir1/subdir2/prueba2.txt', 'texto prueba 2', 'text/plain', window.btoa('hola mundo3')))
  await fss.populated.addFile(new FileStorage.File('dir1/subdir1/prueba3.txt', 'texto prueba 3', 'text/plain', window.btoa('hola mundo4')))

  await fss.populated2.addFile(new FileStorage.File('prueba0.txt', 'texto prueba 0', 'text/plain', window.btoa('hola mundo')))
  await fss.populated2.mkDir('dir1')
  await fss.populated2.mkDir('dir2')
  await fss.populated2.mkDir('dir1/subdir1')
  await fss.populated2.mkDir('dir1/subdir2')
  await fss.populated2.addFile(new FileStorage.File('dir1/subdir2/prueba1.txt', 'texto prueba 1', 'text/plain', window.btoa('hola mundo2')))
  await fss.populated2.addFile(new FileStorage.File('dir1/subdir2/prueba2.txt', 'texto prueba 2', 'text/plain', window.btoa('hola mundo3')))
  await fss.populated2.addFile(new FileStorage.File('dir1/subdir1/prueba3.txt', 'texto prueba 3', 'text/plain', window.btoa('hola mundo4')))
  await fss.populated2.addFile(new FileStorage.File('dir1/subdir1/prueba4 con espacios ñ €.txt', 'texto prueba 4', 'text/plain', window.btoa('unicode y eso')))
})

after(async function () {
  const fssPromises = []
  for (const fs in fss) {
    fssPromises.push(fss[fs].unwrap().destroy())
  }
  await Promise.all(fssPromises)
})

describe('FileStorage', function () {
  describe('#initFileSystem()', function () {
    this.slow(1000)

    step('To return a FileStorage instance', async function () {
      const fs = await FileStorage.initFileSystem()
      expect(fs).to.have.property('format').that.is.a('function')
      expect(fs).to.have.property('addFile').that.is.a('function')
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
        fss.empty.addFile(new FileStorage.File('prueba0.txt', 'texto prueba 0', 'text/plain', window.btoa('hola mundo')))
          .then(() => {
            done()
          })
      }).to.not.throw()
    })
    step('When we add a file to a empty file storage, we must can retrive it', async function () {
      const path = await fss.empty.addFile(new FileStorage.File('prueba1.txt', 'texto prueba 1', 'text/plain', window.btoa('hola mundo')))
      const file = await fss.empty.getFile(path)

      expect(file).to.not.be.null
      expect(file).to.have.property('path', 'prueba1.txt')
      expect(file).to.have.property('label', 'texto prueba 1')
      expect(file).to.have.property('blob', window.btoa('hola mundo'))
    })

    step('When we add file with the same path and without overwrite enabled, it must fail', async function () {
      await fss.populated.addFile(new FileStorage.File('dir1/subdir2/prueba1.txt', 'texto prueba 0x0', 'text/plain', window.btoa('adios mundo')))
        .then(() => assert.fail('addFile must fail when try to overwrite the file without the flag.'),
          err => {
            expect(err).to.be.instanceof(FileStorage.FileWithSamePath)
          })
    })

    step('When we add file with overwrite, it must replace the old file with the path', async function () {
      const path = await fss.empty.addFile(new FileStorage.File('prueba0bis.txt', 'texto prueba 0', 'text/plain', window.btoa('adios mundo')),
        { overwrite: true })
      const file = await fss.empty.getFile(path)
      expect(file).to.not.be.null
      expect(file).to.have.property('path', 'prueba0bis.txt')
      expect(file).to.have.property('label', 'texto prueba 0')
    })

    step('When we add file with overwrite, it must replace the old file with the same path', async function () {
      const path = await fss.populated.addFile(new FileStorage.File('dir1/subdir2/prueba1.txt', 'texto prueba 0', 'text/plain', window.btoa('adios mundo')),
        { overwrite: true })
      const file = await fss.populated.getFile(path)
      expect(file).to.not.be.null
      expect(file).to.have.property('path', 'dir1/subdir2/prueba1.txt')
      expect(file).to.have.property('label', 'texto prueba 0')
      expect(file).to.have.property('blob', window.btoa('adios mundo'))
    })

    step('When we add file to a not existent subdirectory, it must fail', async function () {
      await fss.empty.addFile(new FileStorage.File('no_exists_dir/prueba0.txt', 'texto prueba 666', 'text/plain', window.btoa('adios mundo')))
        .then(() => assert.fail('addFile must fail when try to write the file on a not existent directory'),
          err => {
            expect(err).to.be.instanceof(FileStorage.InvalidPathError)
          })
    })

    step('When we add file to a invalid path, it must fail', async function () {
      await fss.empty.addFile(new FileStorage.File('', 'texto prueba 666', 'text/plain', window.btoa('adios mundo')))
        .then(() => assert.fail('addFile must fail when try to write a file with a invalid path.'),
          err => {
            expect(err).to.be.instanceof(FileStorage.InvalidPathError)
          })
    })
  })

  describe('#getFile()', function () {
    step('Searching an existing file by path, must return it', async function () {
      const file1 = await fss.populated2.getFile('prueba0.txt')
      expect(file1).to.not.be.null
      expect(file1).to.have.property('path', 'prueba0.txt')
      expect(file1).to.have.property('label', 'texto prueba 0')

      const file2 = await fss.populated2.getFile('dir1/subdir2/prueba1.txt')
      expect(file2).to.not.be.null
      expect(file2).to.have.property('path', 'dir1/subdir2/prueba1.txt')
      expect(file2).to.have.property('label', 'texto prueba 1')
    })

    step('Searching a not existing file by path, must fail', async function () {
      await fss.populated2.getFile('texto prueba missgno')
        .then(() => assert.fail('getFile must fail when try to get a not existing file.'),
          err => {
            expect(err).to.be.instanceof(FileStorage.FileNotFoundError)
          })
    })
  })

  describe('#delete ()', function () {
    step('Deleting an existing file, must return true', async function () {
      const path = await fss.populated.addFile(new FileStorage.File('deleted1.txt', 'deleted1', 'text/plain', window.btoa('adios mundo')))
      await expect(fss.populated.delete(path))
        .to.eventually.equal(true)
    })

    step('Deleting an non existing file, must return false', async function () {
      await expect(fss.populated.delete('missigno_path'))
        .to.eventually.equal(false)
    })

    step('Deleting a directory, must return false', async function () {
      await expect(fss.populated.delete('dir1'))
        .to.eventually.equal(false)
    })
  })

  describe('#mkDir()', function () {
    after(async function () {
      await fss.empty.format()
    })

    step('Creating a dir, generates a special file without data', async function () {
      const dirHash = await fss.empty.mkDir('dir1')
      const directory = await fss.empty.getFile(dirHash)
      expect(directory).to.not.be.null
      expect(directory).to.have.property('path', 'dir1')
      expect(directory).to.have.property('label', 'dir1')
      expect(directory).to.have.property('blob', null)
    })

    step('Creating a subdir, requieres a father directory', async function () {
      await fss.empty.mkDir('dir2')
      const subDirHash = await fss.empty.mkDir('dir2/subdir')
      const subDir = await fss.empty.getFile(subDirHash)
      expect(subDir).to.not.be.null
      expect(subDir).to.have.property('path', 'dir2/subdir')
      expect(subDir).to.have.property('label', 'subdir')
      expect(subDir).to.have.property('blob', null)

      await fss.empty.mkDir('missigno/subdir2')
        .then(() => assert.fail('addFile must fail when try to write the file on a not existent directory'),
          err => {
            expect(err).to.be.instanceof(FileStorage.InvalidPathError)
          })
    })
  })

  describe('#rmDir()', function () {
    step("Deleting an empty directory doesn't fail", async function () {
      const deleted = await fss.populated.rmDir('dir2')
      expect(deleted).to.be.true
      await fss.populated.getFile('dir2')
        .then(() => assert.fail('getFile must fail when try to get a not existing file.'),
          err => {
            expect(err).to.be.instanceof(FileStorage.FileNotFoundError)
          })
    })

    step('Deleting an not existing directory fails', async function () {
      const deleted = await fss.populated.rmDir('dir_missigno')
      expect(deleted).to.be.false
    })

    step('Deleting an not empty directory fails', async function () {
      const deleted = await fss.populated.rmDir('dir1/subdir1')
      expect(deleted).to.be.false
    })

    step('Deleting a whole directory structure with recursive', async function () {
      const deleted = await fss.populated.rmDir('dir1/subdir1', { recursive: true })
      expect(deleted).to.be.true
      await Promise.all([
        fss.populated.getFile('dir1/subdir1'),
        fss.populated.getFile('dir1/subdir1/prueba3.txt'),
      ])
        .then(() => assert.fail('getFile must fail when try to get a not existing file.'),
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
          expect(files).to.have.lengthOf(9)
          const paths = files.map(file => file.path)
          expect(paths).to.have.ordered.members([
            'dir1',
            'dir1/subdir1',
            'dir1/subdir1/prueba3.txt',
            'dir1/subdir1/prueba4 con espacios ñ €.txt',
            'dir1/subdir2',
            'dir1/subdir2/prueba1.txt',
            'dir1/subdir2/prueba2.txt',
            'dir2',
            'prueba0.txt'
          ])
        })
    })

    it('Must return a list of paths of the files stored, showing the hierarchy', async function () {
      const paths = await fss.populated2.listAllFiles({ onlyPaths: true })
      expect(paths).to.not.be.null
      expect(paths).to.have.lengthOf(9)
      expect(paths).to.have.ordered.members([
        'dir1',
        'dir1/subdir1',
        'dir1/subdir1/prueba3.txt',
        'dir1/subdir1/prueba4 con espacios ñ €.txt',
        'dir1/subdir2',
        'dir1/subdir2/prueba1.txt',
        'dir1/subdir2/prueba2.txt',
        'dir2',
        'prueba0.txt'
      ])
    })
  })

  describe('#listAllFilesOnAPath()', function () {
    this.slow(500)

    it('Must return all childrens of a directory, showing the hierarchy', async function () {
      const filesDir1 = await fss.populated2.listAllFilesOnAPath('dir1')
      expect(filesDir1).to.not.be.null
      expect(filesDir1).to.have.lengthOf(2)
      const paths1 = filesDir1.map(file => file.path)
      expect(paths1).to.have.ordered.members([
        'dir1/subdir1',
        'dir1/subdir2',
      ])

      const filesDir2 = await fss.populated2.listAllFilesOnAPath('dir1/subdir1')
      expect(filesDir2).to.not.be.null
      expect(filesDir2).to.have.lengthOf(2)
      const paths2 = filesDir2.map(file => file.path)
      expect(paths2).to.have.ordered.members([
        'dir1/subdir1/prueba3.txt',
        'dir1/subdir1/prueba4 con espacios ñ €.txt'
      ])
    })

    it('Must return all childrens paths of a directory, showing the hierarchy', async function () {
      const paths1 = await fss.populated2.listAllFilesOnAPath('dir1', { onlyPaths: true })
      expect(paths1).to.not.be.null
      expect(paths1).to.have.lengthOf(2)
      expect(paths1).to.have.ordered.members([
        'dir1/subdir1',
        'dir1/subdir2',
      ])

      const paths2 = await fss.populated2.listAllFilesOnAPath('dir1/subdir1', { onlyPaths: true })
      expect(paths2).to.not.be.null
      expect(paths2).to.have.lengthOf(2)
      expect(paths2).to.have.ordered.members([
        'dir1/subdir1/prueba3.txt',
        'dir1/subdir1/prueba4 con espacios ñ €.txt',
      ])
    })
  })
})
// mocha.checkLeaks()
mocha.run()

// vim: set backupcopy=yes :
